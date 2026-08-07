"""
Destiny 2 Boss Drops API.

Serves curated raid/dungeon loot tables. Item display data (name, icon, rarity,
element, type) is REAL data resolved from the public Bungie manifest and baked
into backend/data/resolved_loot.json by scripts/ingest.py (no API key needed).
"""
import json
import logging
import os
import subprocess
import sys
import threading
import time
import requests
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Query, Header, Depends, Request, Response
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta

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

# ----------------------------------------------------------------------------
# Live manifest refresh (re-runs the ingestion script in a background thread)
# ----------------------------------------------------------------------------
INGEST_SCRIPT = ROOT_DIR.parent / "scripts" / "ingest.py"
REFRESH = {"state": "idle", "message": "", "updated_at": None}


def _refresh_worker():
    try:
        REFRESH.update(state="running", message="Fetching latest Bungie manifest\u2026")
        proc = subprocess.run(
            [sys.executable, str(INGEST_SCRIPT)],
            capture_output=True, text=True, timeout=1800,
        )
        if proc.returncode != 0:
            REFRESH.update(state="error", message=(proc.stderr or "Ingestion failed")[-400:])
            logger.error("Refresh ingest failed: %s", proc.stderr[-1000:])
            return
        load_dataset()
        REFRESH.update(state="done",
                       message=f"Up to date \u00b7 {len(ITEMS)} items across {len(ACTIVITIES)} activities",
                       updated_at=time.time())
        logger.info("Refresh complete: manifest %s", DATA.get("manifest_version"))
    except Exception as e:  # noqa
        REFRESH.update(state="error", message=str(e))
        logger.exception("Refresh worker crashed")



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
        "activity_types": sorted({a["type"] for a in ACTIVITIES}),
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


@api_router.post("/refresh")
async def refresh():
    if REFRESH["state"] == "running":
        return {"state": "running", "message": REFRESH["message"]}
    REFRESH.update(state="running", message="Starting\u2026")
    threading.Thread(target=_refresh_worker, daemon=True).start()
    return {"state": "running", "message": "Refresh started"}


@api_router.get("/refresh/status")
async def refresh_status():
    return {
        **REFRESH,
        "manifest_version": DATA.get("manifest_version"),
        "items": len(ITEMS),
        "activities": len(ACTIVITIES),
    }


# ----------------------------------------------------------------------------
# Auth + per-user sync (email/password + JWT)
# ----------------------------------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class SyncBody(BaseModel):
    obtained: list = []
    fav_items: list = []
    fav_activities: list = []


def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def _verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False


def _make_token(uid: str) -> str:
    payload = {"sub": uid, "iat": datetime.now(timezone.utc), "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def current_user(request: Request, authorization: Optional[str] = Header(None)):
    """Accept either an Emergent session_token (cookie or Bearer) or a legacy JWT (Bearer)."""
    header_token = None
    if authorization and authorization.startswith("Bearer "):
        header_token = authorization.split(" ", 1)[1]
    cookie_token = request.cookies.get("session_token")

    # 1) Session-token auth (Google / Emergent) — cookie first, then header
    for t in (cookie_token, header_token):
        if not t:
            continue
        sess = await db.user_sessions.find_one({"session_token": t}, {"_id": 0})
        if not sess:
            continue
        exp = sess.get("expires_at")
        if isinstance(exp, str):
            exp = datetime.fromisoformat(exp)
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp and exp < datetime.now(timezone.utc):
            continue
        u = await db.users.find_one({"id": sess["user_id"]}, {"_id": 0})
        if u:
            return u

    # 2) Legacy JWT auth (email/password)
    if header_token:
        try:
            payload = jwt.decode(header_token, JWT_SECRET, algorithms=["HS256"])
            u = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
            if u:
                return u
        except Exception:
            pass

    raise HTTPException(401, "Not authenticated")


async def _get_or_create_data(uid: str):
    doc = await db.user_data.find_one({"user_id": uid})
    if not doc:
        doc = {"user_id": uid, "obtained": [], "fav_items": [], "fav_activities": []}
        await db.user_data.insert_one(dict(doc))
    return {"obtained": doc.get("obtained", []), "fav_items": doc.get("fav_items", []),
            "fav_activities": doc.get("fav_activities", [])}


@api_router.post("/auth/register")
async def register(body: RegisterBody):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "An account with this email already exists")
    uid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": uid, "email": email, "password": _hash_pw(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await _get_or_create_data(uid)
    return {"token": _make_token(uid), "user": {"id": uid, "email": email}}


@api_router.post("/auth/login")
async def login(body: LoginBody):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not _verify_pw(body.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    return {"token": _make_token(user["id"]), "user": {"id": user["id"], "email": user["email"]}}


@api_router.get("/auth/me")
async def me(user=Depends(current_user)):
    return {"id": user["id"], "email": user["email"],
            "name": user.get("name"), "picture": user.get("picture")}


# ---- Emergent managed Google sign-in --------------------------------------
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


class SessionBody(BaseModel):
    session_id: str


@api_router.post("/auth/session")
async def auth_session(body: SessionBody, response: Response):
    """Exchange an Emergent session_id for user data + a persistent session cookie."""
    try:
        r = requests.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id}, timeout=15)
    except Exception:
        raise HTTPException(502, "Auth provider unreachable")
    if r.status_code != 200:
        raise HTTPException(401, "Invalid or expired Google session")
    data = r.json()
    email = (data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(400, "No email returned from provider")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        uid = existing["id"]
        await db.users.update_one({"id": uid}, {"$set": {
            "name": data.get("name") or existing.get("name"),
            "picture": data.get("picture") or existing.get("picture"),
        }})
    else:
        uid = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "id": uid, "email": email, "name": data.get("name"), "picture": data.get("picture"),
            "auth_provider": "google", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await _get_or_create_data(uid)

    session_token = data["session_token"]
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {"session_token": session_token, "user_id": uid,
                  "expires_at": expires.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    response.set_cookie("session_token", session_token, httponly=True, secure=True,
                        samesite="none", path="/", max_age=7 * 24 * 3600)
    return {"user": {"id": uid, "email": email, "name": data.get("name"), "picture": data.get("picture")}}


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    t = request.cookies.get("session_token")
    if t:
        await db.user_sessions.delete_one({"session_token": t})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api_router.get("/user/data")
async def get_user_data(user=Depends(current_user)):
    return await _get_or_create_data(user["id"])


@api_router.put("/user/data")
async def put_user_data(body: SyncBody, user=Depends(current_user)):
    await db.user_data.update_one(
        {"user_id": user["id"]},
        {"$set": {"obtained": list(set(body.obtained)), "fav_items": list(set(body.fav_items)),
                  "fav_activities": list(set(body.fav_activities))}},
        upsert=True,
    )
    return await _get_or_create_data(user["id"])


@api_router.post("/user/sync")
async def sync_user_data(body: SyncBody, user=Depends(current_user)):
    """Union-merge local state into the account (used on login)."""
    cur = await _get_or_create_data(user["id"])
    merged = {
        "obtained": list(set(cur["obtained"]) | set(body.obtained)),
        "fav_items": list(set(cur["fav_items"]) | set(body.fav_items)),
        "fav_activities": list(set(cur["fav_activities"]) | set(body.fav_activities)),
    }
    await db.user_data.update_one({"user_id": user["id"]}, {"$set": merged}, upsert=True)
    return merged


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
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.user_data.create_index("user_id", unique=True)
        await db.user_sessions.create_index("session_token", unique=True)
    except Exception as e:
        logger.warning("index creation: %s", e)
    await seed_mongo()


@app.on_event("shutdown")
async def _shutdown():
    client.close()
