# plan.md — Destiny 2 Boss Drops (Loot Tables) App

## 1) Objectives
- Provide a **comprehensive boss/encounter loot table** browser for Destiny 2 (raids, dungeons, nightfalls/world/other activities).
- Show **real item icons + details** (name, type, slot, rarity, element) resolved from **live Bungie Manifest** (public, no key).
- Enable **search & filters** across all loot.
- Provide a **farming/checklist** to track obtained items (works logged-out via localStorage; optional login to sync).
- Keep payloads small: store/cache projected manifest fields; never ship full manifest to frontend.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): Manifest → Resolve curated loot table → Output
**Goal:** prove the hardest workflow: curated boss→item names can be resolved reliably to real Destiny item defs + icons.

**User stories (POC)**
1. As a developer, I can download the current Bungie manifest and detect its version.
2. As a developer, I can build a fast lookup index from item **name → candidate hashes**.
3. As a developer, I can resolve a curated encounter’s item-name list into a final list of real items with icons.
4. As a developer, I can detect/print **unresolved or ambiguous names** for dataset cleanup.
5. As a developer, I can persist projected item data so subsequent runs don’t re-download 200MB.

**Steps**
1. **Web research (best practice)**: confirm recommended manifest ingestion/caching patterns and known pitfalls (duplicate names, non-equippable defs).
2. Write `scripts/poc_manifest_resolve.py`:
   - Fetch `GET https://www.bungie.net/Platform/Destiny2/Manifest/`.
   - If manifest `version` differs from cached version, download component JSON(s):
     - `DestinyInventoryItemDefinition` (required)
     - `DestinyDamageTypeDefinition` (for element display)
   - Project and persist to Mongo (or local sqlite/json for POC) fields:
     - `hash, name, description, icon_path, itemType, itemSubType, tierType/tierName, damageTypeHashes/damageTypes, screenshot/flavorText if available`
   - Build name index with normalization (lowercase, strip punctuation).
3. Create `data/loot_tables.sample.json` with **2 activities** (1 raid + 1 dungeon), multiple encounters, loot item **names**.
4. Implement resolution rules:
   - Prefer equippable weapons/armor with icons, non-redacted names, correct tier.
   - If multiple matches, choose best by heuristics; otherwise flag as ambiguous.
5. Output `out/poc_resolved.json` containing activities→encounters→resolved items with `name, hash, icon_url, type, rarity, element`.
6. Iterate until sample dataset resolves ~100% (fix names, add disambiguation hints where needed).

**Exit criteria**
- Script runs end-to-end, produces resolved JSON with valid icon URLs for most items.
- Unresolved/ambiguous list is small and actionable with clear logs.

---

### Phase 2 — V1 App Development (No auth): Browse + activity detail + search/filter + local checklist
**User stories (V1)**
1. As a user, I can browse activities by category (Raid/Dungeon/Nightfall/World/Other).
2. As a user, I can open an activity and see encounters/bosses with a loot grid of real item cards.
3. As a user, I can search for a weapon/armor and filter by type, element, rarity, and activity.
4. As a user, I can mark items as “obtained” and see completion progress per activity.
5. As a user, I can use the app fully without logging in (checklist stored locally).

**Backend (FastAPI /api, MongoDB)**
1. Data model + collections:
   - `manifest_meta` (version, locale, updated_at)
   - `items` (projected item defs; indexed by `hash`, and normalized `name_key`)
   - `activities_curated` (activity metadata + encounters + loot references)
2. Ingestion service:
   - On startup (or admin script), check manifest version; refresh cache if changed.
   - Load curated dataset `data/loot_tables.json`, resolve item names → item hashes, persist resolved mapping.
3. APIs:
   - `GET /api/activities?type=raid|dungeon|nightfall|world|other`
   - `GET /api/activities/{activity_id}` (encounters + resolved loot)
   - `GET /api/items/search?q=&type=&element=&rarity=&activity_id=` (paginated)
   - `GET /api/items/{hash}` (detail)
   - `POST/GET /api/checklist` (optional for V1: keep client-only; backend endpoint stub OK)

**Frontend (React + shadcn/ui, Destiny-like dark theme)**
1. App shell + routing:
   - Home (category entry)
   - Activities list (tabs by type)
   - Activity detail (encounters accordion + loot grid)
   - Global search page
   - Checklist page (localStorage)
2. Components:
   - ItemCard (rarity border, element badge, icon)
   - Filters bar (type/element/rarity/activity)
   - Encounter section with progress indicator
3. State management:
   - Checklist stored in localStorage keyed by item hash; computed completion by activity.
4. Performance:
   - Paginate search results; lazy-load activity detail sections.

**Testing (end of Phase 2)**
- Run 1 full E2E pass: browse → activity detail → mark obtained → search/filter → verify persistence across refresh.

---

### Phase 3 — Expanded dataset + favorites + polish + testing
**User stories (Expansion)**
1. As a user, I can browse a much broader set of raids/dungeons/nightfalls/world bosses.
2. As a user, I can favorite activities and items for quick access.
3. As a user, I can see “top farming targets” (missing items) per activity.
4. As a user, I can share a link to an activity/encounter page.
5. As a user, I get a premium Destiny-style UI (smooth loading states, consistent icons, empty states).

**Steps**
1. Expand `data/loot_tables.json` coverage; add validation tool `scripts/validate_loot_tables.py`.
2. Add favorites (logged-out localStorage first):
   - `favorites.items`, `favorites.activities`.
3. Improve search relevance (tokenized name search; optional text index in Mongo).
4. Add robust loading/empty/error states and skeleton UI.
5. Testing: full regression pass on browse/search/checklist/favorites.

---

### Phase 4 — Optional Auth + Sync (email/password + JWT)
**Note:** add only after V1 is solid; auth can hinder automated testing.

**User stories (Auth)**
1. As a user, I can create an account and log in.
2. As a user, I can sync my checklist/favorites across devices.
3. As a user, I can merge local progress into my account on first login.
4. As a user, I can log out and still browse everything.
5. As a user, my account data is private and isolated.

**Steps**
1. Backend auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
2. Store user data: `users`, `user_checklist`, `user_favorites`.
3. Sync flow: on login, prompt merge (local → server) with conflict rules.
4. Update frontend to support authenticated + anonymous mode seamlessly.
5. Final E2E tests for anonymous and logged-in flows.

---

## 3) Next Actions
1. Implement **Phase 1 POC script** + sample dataset and run until resolution is stable.
2. Create the initial curated dataset structure (`activities`, `encounters`, `loot_names`) and validation output.
3. Scaffold FastAPI + Mongo collections + ingestion hooks based on the proven POC.
4. Build React V1 pages (browse/activity/search/checklist) using the Destiny-themed design.

---

## 4) Success Criteria
- POC: curated encounter loot resolves to real Destiny items with working icons and minimal ambiguity.
- V1: user can browse activities → view encounter loot → search/filter → track obtained items with persistence.
- Performance: no manifest-sized payloads to client; search is paginated and responsive.
- Quality: consistent Destiny-like UI, clear loading/empty states, no broken routes.
- Stability: regression testing passes after each phase; manifest refresh works when version changes.
