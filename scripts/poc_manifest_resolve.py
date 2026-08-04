"""
POC: Prove the core workflow for the Destiny 2 Boss Drops app.

Goal: Given a curated loot table (activity -> encounter -> list of item NAMES),
resolve each item name to a REAL Destiny 2 item definition (hash, icon, type,
rarity, element) using the PUBLIC Bungie manifest (no API key required).

Key pitfall handled: item names are duplicated in the manifest. Many are
"Dummy" placeholder entries (itemType == 20). We must prefer real equippable
Weapons (itemType 3) / Armor (itemType 2) with valid icons.
"""
import json
import os
import re
import sys
import urllib.request

BUNGIE = "https://www.bungie.net"
MANIFEST_URL = f"{BUNGIE}/Platform/Destiny2/Manifest/"
ITEMS_CACHE = "/tmp/items.json"
DAMAGE_CACHE = "/tmp/damagetypes.json"

# DestinyItemType enum
WEAPON, ARMOR, DUMMY = 3, 2, 20

# --- Curated SAMPLE loot tables (names only). Real dataset expands this. ---
SAMPLE = {
    "vault_of_glass": {
        "name": "Vault of Glass",
        "type": "raid",
        "encounters": {
            "Confluxes": ["Vision of Confluence", "Fatebringer", "Corrective Measure"],
            "The Templar": ["Fatebringer", "Vision of Confluence", "Hezen Vengeance", "Praedyth's Revenge"],
            "Gatekeepers": ["Found Verdict", "Corrective Measure", "Time-Worn Spire"],
            "Atheon, Time's Conflux": ["Vex Mythoclast", "Praedyth's Revenge", "Found Verdict", "Hezen Vengeance"],
        },
    },
    "ghosts_of_the_deep": {
        "name": "Ghosts of the Deep",
        "type": "dungeon",
        "encounters": {
            "Ecthar, the Shield of Savathun": ["New Pacific Epitaph", "Greasy Luck", "Tinasha's Mastery"],
            "Simmumah ur-Nokru": ["Cold Comfort", "The Navigator", "Tinasha's Mastery"],
        },
    },
}


def fetch_json(url, dest):
    if os.path.exists(dest):
        with open(dest) as f:
            return json.load(f)
    print(f"Downloading {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "poc/1.0"})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read().decode())
    with open(dest, "w") as f:
        json.dump(data, f)
    return data


def load_manifest_components():
    meta = fetch_json(MANIFEST_URL, "/tmp/manifest_meta.json")["Response"]
    paths = meta["jsonWorldComponentContentPaths"]["en"]
    print("Manifest version:", meta["version"])
    items = fetch_json(BUNGIE + paths["DestinyInventoryItemDefinition"], ITEMS_CACHE)
    damage = fetch_json(BUNGIE + paths["DestinyDamageTypeDefinition"], DAMAGE_CACHE)
    return items, damage


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def build_index(items):
    """name_key -> list of candidate item defs"""
    idx = {}
    for h, v in items.items():
        dp = v.get("displayProperties", {})
        name = dp.get("name")
        if not name:
            continue
        v["_hash"] = h
        idx.setdefault(norm(name), []).append(v)
    return idx


def score(v):
    """Higher is better candidate for a real, equippable loot item."""
    s = 0
    it = v.get("itemType")
    if it in (WEAPON, ARMOR):
        s += 100
    if it == DUMMY:
        s -= 100
    dp = v.get("displayProperties", {})
    if dp.get("hasIcon"):
        s += 10
    if v.get("equippingBlock"):
        s += 20
    if v.get("collectibleHash"):
        s += 15
    tier = v.get("inventory", {}).get("tierType", 0)  # 5=Legendary,6=Exotic
    s += tier
    if v.get("redacted"):
        s -= 50
    return s


def resolve(name, idx, damage_defs):
    cands = idx.get(norm(name))
    if not cands:
        return None, "not_found"
    best = max(cands, key=score)
    if best.get("itemType") not in (WEAPON, ARMOR):
        return None, f"no_equippable_match(best_itemType={best.get('itemType')})"
    dp = best["displayProperties"]
    inv = best.get("inventory", {})
    dmg_hashes = best.get("damageTypeHashes") or []
    element = None
    if dmg_hashes:
        d = damage_defs.get(str(dmg_hashes[0]), {})
        element = d.get("displayProperties", {}).get("name")
    return {
        "name": dp.get("name"),
        "hash": best["_hash"],
        "icon_url": BUNGIE + dp.get("icon", "") if dp.get("icon") else None,
        "item_type": "Weapon" if best["itemType"] == WEAPON else "Armor",
        "sub_type": best.get("itemTypeDisplayName"),
        "rarity": inv.get("tierTypeName"),
        "element": element,
        "candidates": len(cands),
    }, "ok"


def main():
    items, damage = load_manifest_components()
    print(f"Loaded {len(items)} item defs, {len(damage)} damage types")
    idx = build_index(items)

    total = ok = 0
    unresolved = []
    out = {}
    for aid, act in SAMPLE.items():
        out[aid] = {"name": act["name"], "type": act["type"], "encounters": {}}
        for enc, names in act["encounters"].items():
            resolved = []
            for nm in names:
                total += 1
                r, status = resolve(nm, idx, damage)
                if r:
                    ok += 1
                    resolved.append(r)
                else:
                    unresolved.append((act["name"], enc, nm, status))
            out[aid]["encounters"][enc] = resolved

    os.makedirs("/tmp/out", exist_ok=True)
    with open("/tmp/out/poc_resolved.json", "w") as f:
        json.dump(out, f, indent=2)

    print("\n=== SAMPLE RESOLVED (icons + details) ===")
    for aid, act in out.items():
        print(f"\n## {act['name']} ({act['type']})")
        for enc, res in act["encounters"].items():
            print(f"  - {enc}:")
            for r in res:
                print(f"      * {r['name']}  [{r['rarity']} {r['sub_type']}"
                      f" | {r['element']}]  hash={r['hash']}  icon_ok={'yes' if r['icon_url'] else 'no'}")

    print(f"\n=== COVERAGE: {ok}/{total} resolved ({100*ok//max(total,1)}%) ===")
    if unresolved:
        print("UNRESOLVED / AMBIGUOUS:")
        for u in unresolved:
            print("  ", u)
    else:
        print("All curated names resolved successfully! Core workflow proven.")
    return 0 if not unresolved else 1


if __name__ == "__main__":
    sys.exit(main())
