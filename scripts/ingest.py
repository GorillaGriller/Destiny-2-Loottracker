"""
Ingestion: build /app/backend/data/resolved_loot.json from:
  - Bungie manifest DestinyInventoryItemDefinition  (item display data)
  - DestinyCollectibleDefinition                    (item -> activity source map)
  - DestinyDamageTypeDefinition                     (element names/icons)
  - DestinyActivityDefinition                       (real activity artwork)
  - curated_activities.ACTIVITIES                   (structure + encounters)

No API key required - the manifest is public.
Run:  python3 /app/scripts/ingest.py
"""
import json
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from curated_activities import ACTIVITIES

BUNGIE = "https://www.bungie.net"
MANIFEST_URL = f"{BUNGIE}/Platform/Destiny2/Manifest/"
OUT = "/app/backend/data/resolved_loot.json"
CACHE_DIR = "/tmp/d2cache"

WEAPON, ARMOR = 3, 2
AMMO = {1: "Primary", 2: "Special", 3: "Heavy"}
CLASS = {0: "Titan", 1: "Hunter", 2: "Warlock", 3: "Any"}


def fetch_json(url, dest):
    if os.path.exists(dest):
        with open(dest) as f:
            return json.load(f)
    print(f"  downloading {url.split('/')[-1]} ...", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "d2ingest/1.0"})
    with urllib.request.urlopen(req, timeout=600) as r:
        data = json.loads(r.read().decode())
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w") as f:
        json.dump(data, f)
    return data


def load_all():
    # Always fetch manifest metadata fresh so we can detect version changes.
    import urllib.request as _u
    req = _u.Request(MANIFEST_URL, headers={"User-Agent": "d2ingest/1.0"})
    with _u.urlopen(req, timeout=120) as r:
        meta = json.loads(r.read().decode())["Response"]
    paths = meta["jsonWorldComponentContentPaths"]["en"]
    version = meta["version"]
    print("Manifest version:", version)

    # Invalidate cached component files when the manifest version changes.
    os.makedirs(CACHE_DIR, exist_ok=True)
    vfile = os.path.join(CACHE_DIR, "VERSION")
    cached_version = None
    if os.path.exists(vfile):
        cached_version = open(vfile).read().strip()
    if cached_version != version:
        for f in os.listdir(CACHE_DIR):
            if f.endswith(".json"):
                try:
                    os.remove(os.path.join(CACHE_DIR, f))
                except OSError:
                    pass

    def comp(name):
        return fetch_json(BUNGIE + paths[name], f"{CACHE_DIR}/{name}.json")

    items = comp("DestinyInventoryItemDefinition")
    colls = comp("DestinyCollectibleDefinition")
    dmg = comp("DestinyDamageTypeDefinition")
    acts = comp("DestinyActivityDefinition")
    with open(vfile, "w") as f:
        f.write(version)
    return version, items, colls, dmg, acts


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def project_item(h, v, dmg_defs):
    dp = v.get("displayProperties", {})
    inv = v.get("inventory", {})
    it = v.get("itemType")
    kind = "weapon" if it == WEAPON else "armor" if it == ARMOR else "other"
    dmg_hashes = v.get("damageTypeHashes") or []
    element = None
    if dmg_hashes:
        d = dmg_defs.get(str(dmg_hashes[0]), {})
        element = d.get("displayProperties", {}).get("name")
    if element in (None, "", "None"):
        element = "Kinetic" if kind == "weapon" else None
    eb = v.get("equippingBlock") or {}
    ammo = AMMO.get(eb.get("ammoType"))
    return {
        "hash": str(h),
        "name": dp.get("name"),
        "flavor": v.get("flavorText") or dp.get("description") or "",
        "icon": BUNGIE + dp["icon"] if dp.get("icon") else None,
        "watermark": BUNGIE + v["iconWatermark"] if v.get("iconWatermark") else None,
        "screenshot": BUNGIE + v["screenshot"] if v.get("screenshot") else None,
        "kind": kind,
        "type_name": v.get("itemTypeDisplayName") or "",
        "rarity": inv.get("tierTypeName") or "Legendary",
        "tier": inv.get("tierType", 5),
        "element": element,
        "ammo": ammo,
        "class_type": CLASS.get(v.get("classType")) if kind == "armor" else None,
    }


def find_activity_art(act_defs, activity_match):
    """Return best pgcrImage for the activity name."""
    m = norm(activity_match)
    if not m:
        return None
    best = None
    for h, v in act_defs.items():
        name = norm(v.get("displayProperties", {}).get("name"))
        if not name or m not in name:
            continue
        img = v.get("pgcrImage")
        if img:
            # prefer the shortest name match (base activity, not "Master: ...")
            cand = (len(v["displayProperties"]["name"]), BUNGIE + img)
            if best is None or cand[0] < best[0]:
                best = cand
    return best[1] if best else None


def main():
    print("Loading manifest components (first run downloads ~250MB, cached after)...")
    version, items, colls, dmg, acts = load_all()
    print(f"items={len(items)} collectibles={len(colls)} damage={len(dmg)} activities={len(acts)}")

    # collectible source string -> list of item hashes
    source_items = []  # (source_string_lower, item_hash)
    for h, c in colls.items():
        src = c.get("sourceString")
        ih = c.get("itemHash")
        if src and ih is not None:
            source_items.append((src.lower(), str(ih)))

    out = {"manifest_version": version, "activities": [], "items": {}}
    all_items_index = {}

    for act in ACTIVITIES:
        matches = [m.lower() for m in act["source_match"]]
        hashes = []
        seen = set()
        for src, ih in source_items:
            if any(m in src for m in matches) and ih not in seen:
                seen.add(ih)
                hashes.append(ih)

        resolved = []
        for ih in hashes:
            v = items.get(ih)
            if not v:
                continue
            dp = v.get("displayProperties", {})
            if not dp.get("name") or not dp.get("hasIcon"):
                continue
            if v.get("itemType") not in (WEAPON, ARMOR):
                continue
            pi = project_item(ih, v, dmg)
            resolved.append(pi)
            all_items_index[pi["hash"]] = pi

        # name -> hash for assigning encounter weapons
        by_name = {norm(p["name"]): p for p in resolved}
        assigned_hashes = set()

        # Some curated weapons (e.g. exotics) may not be in the collectible pool
        # under this source. Resolve them directly from the item manifest by name.
        def resolve_by_name(nm):
            p = by_name.get(norm(nm))
            if p:
                return p
            # fallback: search whole manifest for a real weapon/armor with this name
            best = None
            for h, v in items.items():
                d = v.get("displayProperties", {})
                if norm(d.get("name")) == norm(nm) and v.get("itemType") in (WEAPON, ARMOR) and d.get("hasIcon"):
                    tier = v.get("inventory", {}).get("tierType", 0)
                    if best is None or tier > best[0]:
                        best = (tier, h, v)
            if best:
                pi = project_item(best[1], best[2], dmg)
                all_items_index[pi["hash"]] = pi
                by_name[norm(nm)] = pi
                return pi
            return None

        encounters = []
        for i, enc in enumerate(act["encounters"], start=1):
            enc_items = []
            for wname in enc.get("weapons", []):
                p = resolve_by_name(wname)
                if p:
                    enc_items.append(p["hash"])
                    assigned_hashes.add(p["hash"])
                else:
                    print(f"  [WARN] {act['id']}: unresolved weapon '{wname}'")
            encounters.append({
                "order": i,
                "name": enc["name"],
                "boss": enc["boss"],
                "item_hashes": enc_items,
            })

        weapons = [p for p in resolved if p["kind"] == "weapon"]
        armor = [p for p in resolved if p["kind"] == "armor"]
        shared_weapons = [p["hash"] for p in weapons if p["hash"] not in assigned_hashes]

        art = find_activity_art(acts, act["activity_match"])

        out["activities"].append({
            "id": act["id"],
            "name": act["name"],
            "type": act["type"],
            "location": act["location"],
            "release": act["release"],
            "description": act["description"],
            "banner": art,
            "encounters": encounters,
            "shared_weapon_hashes": shared_weapons,
            "armor_hashes": [p["hash"] for p in armor],
            "all_item_hashes": [p["hash"] for p in resolved],
            "counts": {
                "total": len(resolved),
                "weapons": len(weapons),
                "armor": len(armor),
            },
        })
        print(f"  {act['name']:24} weapons={len(weapons):2} armor={len(armor):2} banner={'ok' if art else 'NONE'}")

    out["items"] = all_items_index
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f)
    total_items = len(all_items_index)
    print(f"\nWrote {OUT}")
    print(f"Activities: {len(out['activities'])}  Unique items: {total_items}")


if __name__ == "__main__":
    main()
