"""
Destiny 2 Boss Drops API.

Serves curated raid/dungeon loot tables. Item display data (name, icon, rarity,
element, type) is REAL data resolved from the public Bungie manifest and baked
into backend/data/resolved_loot.json by scripts/ingest.py (no API key needed).
"""
import json
import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("d2")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Destiny 2 Boss Drops API")
api_router = APIRouter(prefix="/api")

# ----------------------------------------------------------------------------
# Load the resolved loot dataset into memory (small, ~300KB) for fast serving.
# ----------------------------------------------------------------------------
DATA_PATH = ROOT_DIR / "data" / "resolved_loot.json"

DATA = {"manifest_version": None, "activities": [], "items": {}}
ITEMS: dict = {}
ACTIVITIES: list = []
ACTIVITY_BY_ID: dict = {}
ITEM_TO_ACTIVITIES: dict = {}  # item_hash -> [{activity_id, activity_name, type, encounters:[names]}]

RARITY_ORDER = {"Exotic": 0, "Legendary": 1, "Rare": 2, "Uncommon": 3, "Common": 4, "Basic": 5}


def _build_indexes():
    global ITEMS, ACTIVITIES, ACTIVITY_BY_ID, ITEM_TO_ACTIVITIES
    ITEMS = DATA.get("items", {})
    ACTIVITIES = DATA.get("activities", [])
    ACTIVITY_BY_ID = {a["id"]: a for a in ACTIVITIES}
    ITEM_TO_ACTIVITIES = {}
    for a in ACTIVITIES:
        enc_for_item: dict = {}
        for enc in a.get("encounters", []):
            for h in enc.get("item_hashes", []):
                enc_for_item.setdefault(h, []).append(enc["name"])
        # union of pool items + encounter-assigned items
        item_hashes = set(a.get("all_item_hashes", [])) | set(enc_for_item.keys())
        for h in item_hashes:
            ITEM_TO_ACTIVITIES.setdefault(h, []).append({
                "activity_id": a["id"],
                "activity_name": a["name"],
                "type": a["type"],
                "encounters": enc_for_item.get(h, []),
            })


def load_dataset():
    global DATA
    if not DATA_PATH.exists():
        logger.error("resolved_loot.json not found at %s", DATA_PATH)
        return
    with open(DATA_PATH) as f:
        DATA = json.load(f)
    _build_indexes()
    logger.info("Loaded %d activities, %d items (manifest %s)",
                len(ACTIVITIES), len(ITEMS), DATA.get("manifest_version"))


load_dataset()


async def seed_mongo():
    """Persist dataset to Mongo for inspection/durability (idempotent)."""
    try:
        meta = await db.d2_meta.find_one({"_id": "dataset"})
        if meta and meta.get("version") == DATA.get("manifest_version") and meta.get("count") == len(ITEMS):
            return
        await db.d2_items.delete_many({})
        await db.d2_activities.delete_many({})
        if ITEMS:
            await db.d2_items.insert_many([{**v, "_id": k} for k, v in ITEMS.items()])
        if ACTIVITIES:
            await db.d2_activities.insert_many([{**a, "_id": a["id"]} for a in ACTIVITIES])
        await db.d2_meta.update_one(
            {"_id": "dataset"},
            {"$set": {"version": DATA.get("manifest_version"), "count": len(ITEMS)}},
            upsert=True,
        )
        logger.info("Seeded Mongo with %d items / %d activities", len(ITEMS), len(ACTIVITIES))
    except Exception as e:  # non-fatal; API serves from memory
        logger.warning("Mongo seed skipped: %s", e)


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def item_obj(h):
    return ITEMS.get(h)


def activity_summary(a):
    return {
        "id": a["id"],
        "name": a["name"],
        "type": a["type"],
        "location": a["location"],
        "release": a["release"],
        "description": a["description"],
        "banner": a.get("banner"),
        "counts": a.get("counts", {}),
        "encounter_count": len(a.get("encounters", [])),
        "item_hashes": a.get("all_item_hashes", []),
    }


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@api_router.get("/health")
async def health():
    return {"status": "ok", "manifest_version": DATA.get("manifest_version"),
            "activities": len(ACTIVITIES), "items": len(ITEMS)}


@api_router.get("/stats")
async def stats():
    by_type: dict = {}
    for a in ACTIVITIES:
        by_type[a["type"]] = by_type.get(a["type"], 0) + 1
    weapons = sum(1 for i in ITEMS.values() if i["kind"] == "weapon")
    armor = sum(1 for i in ITEMS.values() if i["kind"] == "armor")
    exotics = sum(1 for i in ITEMS.values() if i.get("rarity") == "Exotic")
    return {
        "activities": len(ACTIVITIES),
        "by_type": by_type,
        "items": len(ITEMS),
        "weapons": weapons,
        "armor": armor,
        "exotics": exotics,
    }


@api_router.get("/filters")
async def filters():
    elements, rarities, weapon_types, armor_types, classes = set(), set(), set(), set(), set()
    for i in ITEMS.values():
        if i.get("rarity"):
            rarities.add(i["rarity"])
        if i["kind"] == "weapon":
            if i.get("element"):
                elements.add(i["element"])
            if i.get("type_name"):
                weapon_types.add(i["type_name"])
        elif i["kind"] == "armor":
            if i.get("type_name"):
                armor_types.add(i["type_name"])
            if i.get("class_type"):
                classes.add(i["class_type"])
    order = ["Kinetic", "Arc", "Solar", "Void", "Stasis", "Strand"]
    elems = sorted(elements, key=lambda x: order.index(x) if x in order else 99)
    rars = sorted(rarities, key=lambda x: RARITY_ORDER.get(x, 99))
    return {
        "elements": elems,
        "rarities": rars,
        "weapon_types": sorted(weapon_types),
        "armor_types": sorted(armor_types),
        "classes": sorted(classes),
        "activity_types": ["raid", "dungeon"],
    }


@api_router.get("/activities")
async def list_activities(type: Optional[str] = None):
    out = [activity_summary(a) for a in ACTIVITIES if (not type or a["type"] == type)]
    return {"activities": out, "total": len(out)}


@api_router.get("/activities/{activity_id}")
async def get_activity(activity_id: str):
    a = ACTIVITY_BY_ID.get(activity_id)
    if not a:
        raise HTTPException(404, "Activity not found")

    def items_of(hashes):
        return [item_obj(h) for h in hashes if item_obj(h)]

    encounters = []
    for enc in a.get("encounters", []):
        encounters.append({
            "order": enc["order"],
            "name": enc["name"],
            "boss": enc["boss"],
            "items": items_of(enc.get("item_hashes", [])),
        })
    shared = items_of(a.get("shared_weapon_hashes", []))
    armor = items_of(a.get("armor_hashes", []))
    armor.sort(key=lambda x: (x.get("class_type") or "z", x.get("type_name") or ""))
    return {
        "id": a["id"],
        "name": a["name"],
        "type": a["type"],
        "location": a["location"],
        "release": a["release"],
        "description": a["description"],
        "banner": a.get("banner"),
        "counts": a.get("counts", {}),
        "encounters": encounters,
        "shared_weapons": shared,
        "armor": armor,
        "all_item_hashes": a.get("all_item_hashes", []),
    }


@api_router.get("/items")
async def search_items(
    q: Optional[str] = None,
    kind: Optional[str] = None,          # weapon | armor
    element: Optional[str] = None,
    rarity: Optional[str] = None,
    weapon_type: Optional[str] = None,   # matches type_name
    class_type: Optional[str] = None,
    activity_id: Optional[str] = None,
    activity_type: Optional[str] = None,  # raid | dungeon
    sort: str = "rarity",
    limit: int = Query(60, le=500),
    offset: int = 0,
):
    ql = q.lower().strip() if q else None
    results = []
    for h, i in ITEMS.items():
        if kind and i["kind"] != kind:
            continue
        if element and i.get("element") != element:
            continue
        if rarity and i.get("rarity") != rarity:
            continue
        if weapon_type and i.get("type_name") != weapon_type:
            continue
        if class_type and i.get("class_type") != class_type:
            continue
        if ql and ql not in (i.get("name") or "").lower():
            continue
        srcs = ITEM_TO_ACTIVITIES.get(h, [])
        if activity_id and not any(s["activity_id"] == activity_id for s in srcs):
            continue
        if activity_type and not any(s["type"] == activity_type for s in srcs):
            continue
        results.append({**i, "sources": srcs})

    if sort == "name":
        results.sort(key=lambda x: x.get("name") or "")
    elif sort == "type":
        results.sort(key=lambda x: (x.get("type_name") or "", x.get("name") or ""))
    else:  # rarity (exotic first) then name
        results.sort(key=lambda x: (RARITY_ORDER.get(x.get("rarity"), 99), x.get("name") or ""))

    total = len(results)
    page = results[offset:offset + limit]
    return {"items": page, "total": total, "limit": limit, "offset": offset}


@api_router.get("/items/{item_hash}")
async def get_item(item_hash: str):
    i = item_obj(item_hash)
    if not i:
        raise HTTPException(404, "Item not found")
    return {**i, "sources": ITEM_TO_ACTIVITIES.get(item_hash, [])}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    await seed_mongo()


@app.on_event("shutdown")
async def _shutdown():
    client.close()
