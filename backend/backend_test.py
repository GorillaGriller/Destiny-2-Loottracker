"""
Backend API tests for Destiny 2 Boss Drops application (Phase 3+4+5).
Tests all endpoints including new World/Nightfall activities, Live Refresh, Auth/Sync, and Emergent Google Auth.
"""
import requests
import sys
import time
import uuid
import subprocess
from pathlib import Path
from datetime import datetime

# Read the public URL from frontend/.env
env_path = Path(__file__).parent.parent / "frontend" / ".env"
BASE_URL = None
with open(env_path) as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip()
            break

if not BASE_URL:
    print("❌ REACT_APP_BACKEND_URL not found in frontend/.env")
    sys.exit(1)

print(f"🔗 Testing backend at: {BASE_URL}")

class D2APITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = []
        self.token = None
        self.test_user_email = None

    def test(self, name, method, endpoint, expected_status=200, params=None, data=None, validate=None, headers=None, use_auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        self.tests_run += 1
        
        try:
            req_headers = headers if headers is not None else {}
            if self.token and use_auth and headers is None:
                req_headers["Authorization"] = f"Bearer {self.token}"
            
            if method == "GET":
                response = requests.get(url, params=params, headers=req_headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            else:
                print(f"❌ {name} - Unsupported method {method}")
                self.tests_failed.append(name)
                return False, None
            
            if response.status_code != expected_status:
                print(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")
                self.tests_failed.append(name)
                return False, None
            
            data = response.json() if response.text else {}
            
            # Run custom validation if provided
            if validate:
                try:
                    validate(data)
                except AssertionError as e:
                    print(f"❌ {name} - Validation failed: {e}")
                    self.tests_failed.append(name)
                    return False, data
            
            self.tests_passed += 1
            print(f"✅ {name}")
            return True, data
            
        except requests.exceptions.RequestException as e:
            print(f"❌ {name} - Request error: {e}")
            self.tests_failed.append(name)
            return False, None
        except Exception as e:
            print(f"❌ {name} - Error: {e}")
            self.tests_failed.append(name)
            return False, None

    def run_all_tests(self):
        print("\n" + "="*70)
        print("BACKEND API TESTS - PHASE 6 (Crucible + Rotation + Profile + Merge)")
        print("="*70 + "\n")

        # ========== PHASE 3: World & Nightfall Activities ==========
        print("📋 Testing Phase 3: World & Nightfall Activities...")
        
        # Test 1: Stats should show 24 activities (9 raids, 10 dungeons, 1 nightfall, 2 world, 2 crucible)
        success, stats_data = self.test(
            "GET /api/stats (24 activities: 9 raids, 10 dungeons, 1 nightfall, 2 world, 2 crucible)",
            "GET",
            "stats",
            validate=lambda d: (
                assert_eq(d.get("activities"), 24, "should have 24 activities"),
                assert_in("by_type", d, "should have by_type"),
                assert_eq(d.get("by_type", {}).get("raid"), 9, "should have 9 raids"),
                assert_eq(d.get("by_type", {}).get("dungeon"), 10, "should have 10 dungeons"),
                assert_eq(d.get("by_type", {}).get("nightfall"), 1, "should have 1 nightfall"),
                assert_eq(d.get("by_type", {}).get("world"), 2, "should have 2 world activities"),
                assert_eq(d.get("by_type", {}).get("crucible"), 2, "should have 2 crucible activities"),
                assert_eq(d.get("items"), 1020, "should have 1020 items"),
            )
        )
        if success and stats_data:
            print(f"   ✓ Activities: {stats_data.get('activities')}, Items: {stats_data.get('items')}")
            print(f"   ✓ By type: {stats_data.get('by_type')}")

        # Test 2: List nightfall activities
        success, nightfall_list = self.test(
            "GET /api/activities?type=nightfall",
            "GET",
            "activities",
            params={"type": "nightfall"},
            validate=lambda d: (
                assert_eq(d.get("total"), 1, "should have 1 nightfall"),
                assert_eq(len(d.get("activities", [])), 1, "should return 1 nightfall"),
            )
        )
        if success and nightfall_list:
            nf = nightfall_list["activities"][0]
            print(f"   ✓ Nightfall: {nf.get('name')}")

        # Test 3: List world activities
        success, world_list = self.test(
            "GET /api/activities?type=world",
            "GET",
            "activities",
            params={"type": "world"},
            validate=lambda d: (
                assert_eq(d.get("total"), 2, "should have 2 world activities"),
                assert_eq(len(d.get("activities", [])), 2, "should return 2 world activities"),
            )
        )
        if success and world_list:
            for w in world_list["activities"]:
                print(f"   ✓ World activity: {w.get('name')}")

        # Test 4: The Wellspring detail (4 encounters, each with 1 weapon)
        success, wellspring = self.test(
            "GET /api/activities/the_wellspring",
            "GET",
            "activities/the_wellspring",
            validate=lambda d: (
                assert_eq(d.get("id"), "the_wellspring", "should have correct id"),
                assert_eq(d.get("name"), "The Wellspring", "should have correct name"),
                assert_eq(d.get("type"), "world", "should be type world"),
                assert_eq(len(d.get("encounters", [])), 4, "should have 4 encounters"),
            )
        )
        if success and wellspring:
            print(f"   ✓ The Wellspring: {len(wellspring.get('encounters', []))} encounters")
            # Check each encounter has a boss and weapon
            expected_weapons = ["Father's Sins", "Come to Pass", "Fel Taradiddle", "Tarnation"]
            found_weapons = []
            for enc in wellspring.get("encounters", []):
                if enc.get("items"):
                    for item in enc["items"]:
                        found_weapons.append(item.get("name"))
            print(f"   ✓ Weapons found: {found_weapons}")
            for exp_weapon in expected_weapons:
                if exp_weapon not in found_weapons:
                    print(f"   ⚠️  Expected weapon '{exp_weapon}' not found")

        # Test 5: Exotic Missions detail (exotic rewards)
        success, exotic_missions = self.test(
            "GET /api/activities/exotic_missions",
            "GET",
            "activities/exotic_missions",
            validate=lambda d: (
                assert_eq(d.get("id"), "exotic_missions", "should have correct id"),
                assert_eq(d.get("name"), "Exotic Missions", "should have correct name"),
                assert_eq(d.get("type"), "world", "should be type world"),
                assert_gt(len(d.get("encounters", [])), 0, "should have encounters"),
            )
        )
        if success and exotic_missions:
            print(f"   ✓ Exotic Missions: {len(exotic_missions.get('encounters', []))} encounters")
            # Check for exotic weapons
            expected_exotics = ["Dead Man's Tale", "Vexcalibur", "Whisper of the Worm", "Choir of One"]
            found_exotics = []
            for enc in exotic_missions.get("encounters", []):
                for item in enc.get("items", []):
                    if item.get("rarity") == "Exotic":
                        found_exotics.append(item.get("name"))
            print(f"   ✓ Exotic weapons found: {found_exotics}")

        # Test 6: Nightfall: The Ordeal (empty encounters, shared_weapons pool)
        success, nightfall_ordeal = self.test(
            "GET /api/activities/nightfall_ordeal",
            "GET",
            "activities/nightfall_ordeal",
            validate=lambda d: (
                assert_eq(d.get("id"), "nightfall_ordeal", "should have correct id"),
                assert_eq(d.get("name"), "Nightfall: The Ordeal", "should have correct name"),
                assert_eq(d.get("type"), "nightfall", "should be type nightfall"),
                assert_eq(len(d.get("encounters", [])), 0, "should have empty encounters"),
                assert_gt(len(d.get("shared_weapons", [])), 0, "should have shared_weapons pool"),
            )
        )
        if success and nightfall_ordeal:
            print(f"   ✓ Nightfall: The Ordeal - {len(nightfall_ordeal.get('shared_weapons', []))} weapons in pool")

        # ========== PHASE 6: Crucible Activities (Trials + Iron Banner) ==========
        print("\n📋 Testing Phase 6: Crucible Activities...")
        
        # Test: List crucible activities
        success, crucible_list = self.test(
            "GET /api/activities?type=crucible",
            "GET",
            "activities",
            params={"type": "crucible"},
            validate=lambda d: (
                assert_eq(d.get("total"), 2, "should have 2 crucible activities"),
                assert_eq(len(d.get("activities", [])), 2, "should return 2 crucible activities"),
            )
        )
        if success and crucible_list:
            for c in crucible_list["activities"]:
                print(f"   ✓ Crucible activity: {c.get('name')}")
                print(f"      - Banner: {'present' if c.get('banner') else 'missing'}")
                print(f"      - Weapons: {c.get('counts', {}).get('weapons', 0)}, Armor: {c.get('counts', {}).get('armor', 0)}")

        # Test: Trials of Osiris detail
        success, trials = self.test(
            "GET /api/activities/trials_of_osiris",
            "GET",
            "activities/trials_of_osiris",
            validate=lambda d: (
                assert_eq(d.get("id"), "trials_of_osiris", "should have correct id"),
                assert_eq(d.get("name"), "Trials of Osiris", "should have correct name"),
                assert_eq(d.get("type"), "crucible", "should be type crucible"),
                assert_eq(len(d.get("encounters", [])), 0, "should have empty encounters (no bosses in PvP)"),
                assert_gt(len(d.get("shared_weapons", [])), 0, "should have shared_weapons pool"),
                assert_gt(len(d.get("armor", [])), 0, "should have armor set"),
            )
        )
        if success and trials:
            print(f"   ✓ Trials of Osiris: {len(trials.get('shared_weapons', []))} weapons, {len(trials.get('armor', []))} armor pieces")

        # Test: Iron Banner detail
        success, iron_banner = self.test(
            "GET /api/activities/iron_banner",
            "GET",
            "activities/iron_banner",
            validate=lambda d: (
                assert_eq(d.get("id"), "iron_banner", "should have correct id"),
                assert_eq(d.get("name"), "Iron Banner", "should have correct name"),
                assert_eq(d.get("type"), "crucible", "should be type crucible"),
                assert_eq(len(d.get("encounters", [])), 0, "should have empty encounters (no bosses in PvP)"),
                assert_gt(len(d.get("shared_weapons", [])), 0, "should have shared_weapons pool"),
                assert_gt(len(d.get("armor", [])), 0, "should have armor set"),
            )
        )
        if success and iron_banner:
            print(f"   ✓ Iron Banner: {len(iron_banner.get('shared_weapons', []))} weapons, {len(iron_banner.get('armor', []))} armor pieces")

        # ========== PHASE 3: Live Manifest Refresh ==========
        print("\n📋 Testing Phase 3: Live Manifest Refresh...")
        
        # Test 7: POST /api/refresh (start refresh)
        success, refresh_start = self.test(
            "POST /api/refresh (start)",
            "POST",
            "refresh",
            validate=lambda d: (
                assert_eq(d.get("state"), "running", "should return state=running"),
            )
        )
        
        # Test 8: GET /api/refresh/status (poll until done or timeout)
        if success:
            print("   ⏳ Polling /api/refresh/status (max 40s)...")
            max_wait = 40
            start_time = time.time()
            final_state = None
            while time.time() - start_time < max_wait:
                success, status = self.test(
                    "GET /api/refresh/status (polling)",
                    "GET",
                    "refresh/status",
                    validate=lambda d: (
                        assert_in("state", d, "should have state"),
                        assert_in("items", d, "should have items count"),
                        assert_in("activities", d, "should have activities count"),
                    )
                )
                if success and status:
                    state = status.get("state")
                    if state == "done":
                        print(f"   ✅ Refresh completed: {status.get('message')}")
                        print(f"   ✓ Items: {status.get('items')}, Activities: {status.get('activities')}")
                        final_state = "done"
                        break
                    elif state == "error":
                        print(f"   ❌ Refresh failed: {status.get('message')}")
                        final_state = "error"
                        break
                    elif state == "running":
                        print(f"   ⏳ Still running... ({int(time.time() - start_time)}s)")
                        time.sleep(3)
                else:
                    break
            
            if final_state != "done":
                print(f"   ⚠️  Refresh did not complete in {max_wait}s (state: {final_state})")

        # ========== PHASE 4: Auth & Sync ==========
        print("\n📋 Testing Phase 4: Auth & Sync...")
        
        # Test 9: Register new user
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "testpass123"
        success, register_data = self.test(
            "POST /api/auth/register (new user)",
            "POST",
            "auth/register",
            data={"email": test_email, "password": test_password},
            validate=lambda d: (
                assert_in("token", d, "should return token"),
                assert_in("user", d, "should return user"),
                assert_eq(d.get("user", {}).get("email"), test_email, "should have correct email"),
            )
        )
        if success and register_data:
            self.token = register_data.get("token")
            self.test_user_email = test_email
            print(f"   ✓ Registered: {test_email}")

        # Test 10: Register duplicate email (should fail)
        self.test(
            "POST /api/auth/register (duplicate email - 400)",
            "POST",
            "auth/register",
            data={"email": test_email, "password": test_password},
            expected_status=400,
            use_auth=False
        )

        # Test 11: Login with test credentials
        success, login_data = self.test(
            "POST /api/auth/login (guardian@test.com)",
            "POST",
            "auth/login",
            data={"email": "guardian@test.com", "password": "vanguard123"},
            use_auth=False,
            validate=lambda d: (
                assert_in("token", d, "should return token"),
                assert_in("user", d, "should return user"),
                assert_eq(d.get("user", {}).get("email"), "guardian@test.com", "should have correct email"),
            )
        )
        if success and login_data:
            self.token = login_data.get("token")
            print(f"   ✓ Logged in as: guardian@test.com")

        # Test 12: Login with wrong password (should fail)
        self.test(
            "POST /api/auth/login (wrong password - 401)",
            "POST",
            "auth/login",
            data={"email": "guardian@test.com", "password": "wrongpassword"},
            expected_status=401,
            use_auth=False
        )

        # Test 13: GET /api/auth/me (with token)
        success, me_data = self.test(
            "GET /api/auth/me (with Bearer token)",
            "GET",
            "auth/me",
            validate=lambda d: (
                assert_in("id", d, "should have id"),
                assert_in("email", d, "should have email"),
                assert_eq(d.get("email"), "guardian@test.com", "should be guardian@test.com"),
            )
        )

        # Test 14: GET /api/auth/me (without token - should fail)
        self.test(
            "GET /api/auth/me (no token - 401)",
            "GET",
            "auth/me",
            expected_status=401,
            use_auth=False
        )

        # Test 15: GET /api/user/data (initial empty state)
        success, user_data = self.test(
            "GET /api/user/data (initial)",
            "GET",
            "user/data",
            validate=lambda d: (
                assert_in("obtained", d, "should have obtained"),
                assert_in("fav_items", d, "should have fav_items"),
                assert_in("fav_activities", d, "should have fav_activities"),
            )
        )
        if success and user_data:
            print(f"   ✓ Initial state: obtained={len(user_data.get('obtained', []))}, fav_items={len(user_data.get('fav_items', []))}")

        # Test 16: PUT /api/user/data (update state)
        test_obtained = ["1234567890", "0987654321"]
        test_fav_items = ["1111111111"]
        test_fav_activities = ["vault_of_glass"]
        success, put_data = self.test(
            "PUT /api/user/data (update)",
            "PUT",
            "user/data",
            data={"obtained": test_obtained, "fav_items": test_fav_items, "fav_activities": test_fav_activities},
            validate=lambda d: (
                assert_eq(len(d.get("obtained", [])), 2, "should have 2 obtained"),
                assert_eq(len(d.get("fav_items", [])), 1, "should have 1 fav_item"),
                assert_eq(len(d.get("fav_activities", [])), 1, "should have 1 fav_activity"),
            )
        )

        # Test 17: GET /api/user/data (verify persistence)
        success, verify_data = self.test(
            "GET /api/user/data (verify persistence)",
            "GET",
            "user/data",
            validate=lambda d: (
                assert_eq(len(d.get("obtained", [])), 2, "should still have 2 obtained"),
                assert_in("1234567890", d.get("obtained", []), "should have test item"),
            )
        )

        # Test 18: POST /api/user/sync (union merge)
        additional_obtained = ["2222222222", "3333333333"]
        success, sync_data = self.test(
            "POST /api/user/sync (union merge)",
            "POST",
            "user/sync",
            data={"obtained": additional_obtained, "fav_items": [], "fav_activities": []},
            validate=lambda d: (
                assert_gte(len(d.get("obtained", [])), 3, "should have at least 3 obtained (union merge)"),
            )
        )
        if success and sync_data:
            print(f"   ✓ After sync: obtained={len(sync_data.get('obtained', []))}")

        # ========== PHASE 5: Emergent Google Auth ==========
        print("\n📋 Testing Phase 5: Emergent Google Auth (session_token)...")
        
        # Create a test user + session directly in Mongo (simulating Google login)
        print("   🔧 Creating test Google user + session in Mongo...")
        mongo_script = """
use('test_database');
var userId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({ 
    id: userId, 
    email: 'test.google.' + Date.now() + '@example.com', 
    name: 'Test Google User', 
    picture: 'https://via.placeholder.com/150', 
    auth_provider: 'google', 
    created_at: new Date().toISOString() 
});
db.user_data.insertOne({ 
    user_id: userId, 
    obtained: [], 
    fav_items: [], 
    fav_activities: [] 
});
db.user_sessions.insertOne({ 
    session_token: sessionToken, 
    user_id: userId, 
    expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(), 
    created_at: new Date().toISOString() 
});
print('SESSION_TOKEN:' + sessionToken);
print('USER_ID:' + userId);
"""
        try:
            result = subprocess.run(
                ["mongosh", "--quiet", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                print(f"   ❌ Failed to create test Google user: {result.stderr}")
                google_session_token = None
                google_user_id = None
            else:
                # Parse output to extract session_token and user_id
                lines = result.stdout.strip().split('\n')
                google_session_token = None
                google_user_id = None
                for line in lines:
                    if line.startswith('SESSION_TOKEN:'):
                        google_session_token = line.split(':', 1)[1].strip()
                    elif line.startswith('USER_ID:'):
                        google_user_id = line.split(':', 1)[1].strip()
                
                if google_session_token and google_user_id:
                    print(f"   ✓ Created Google user: {google_user_id}")
                    print(f"   ✓ Session token: {google_session_token[:20]}...")
                else:
                    print(f"   ❌ Failed to parse session_token/user_id from output")
        except Exception as e:
            print(f"   ❌ Error creating test Google user: {e}")
            google_session_token = None
            google_user_id = None
        
        # Test 19: GET /api/auth/me with session_token (Bearer)
        if google_session_token:
            success, me_google = self.test(
                "GET /api/auth/me (with session_token Bearer)",
                "GET",
                "auth/me",
                headers={"Authorization": f"Bearer {google_session_token}"},
                use_auth=False,
                validate=lambda d: (
                    assert_in("id", d, "should have id"),
                    assert_in("email", d, "should have email"),
                    assert_in("name", d, "should have name"),
                    assert_eq(d.get("name"), "Test Google User", "should be Test Google User"),
                )
            )
            if success and me_google:
                print(f"   ✓ Google user authenticated: {me_google.get('email')}")
        
        # Test 20: GET /api/user/data with session_token
        if google_session_token:
            success, google_data = self.test(
                "GET /api/user/data (with session_token)",
                "GET",
                "user/data",
                headers={"Authorization": f"Bearer {google_session_token}"},
                use_auth=False,
                validate=lambda d: (
                    assert_in("obtained", d, "should have obtained"),
                    assert_in("fav_items", d, "should have fav_items"),
                    assert_in("fav_activities", d, "should have fav_activities"),
                )
            )
        
        # Test 21: PUT /api/user/data with session_token
        if google_session_token:
            google_obtained = ["9999999999", "8888888888"]
            success, google_put = self.test(
                "PUT /api/user/data (with session_token)",
                "PUT",
                "user/data",
                headers={"Authorization": f"Bearer {google_session_token}"},
                data={"obtained": google_obtained, "fav_items": ["7777777777"], "fav_activities": ["kings_fall"]},
                use_auth=False,
                validate=lambda d: (
                    assert_eq(len(d.get("obtained", [])), 2, "should have 2 obtained"),
                    assert_in("9999999999", d.get("obtained", []), "should have test item"),
                )
            )
        
        # Test 22: POST /api/auth/session with invalid session_id (should 401)
        self.test(
            "POST /api/auth/session (invalid session_id - 401)",
            "POST",
            "auth/session",
            data={"session_id": "invalid_session_id_12345"},
            expected_status=401,
            use_auth=False
        )
        
        # Test 23: POST /api/auth/logout (delete session)
        if google_session_token:
            # First, verify the session works
            success_before, _ = self.test(
                "GET /api/auth/me (before logout)",
                "GET",
                "auth/me",
                headers={"Authorization": f"Bearer {google_session_token}"},
                use_auth=False,
                validate=lambda d: assert_in("id", d, "should have id")
            )
            
            # Logout (note: logout expects session_token in cookie, but we'll test with header)
            # Since we can't set cookies in requests easily, we'll just verify the endpoint exists
            # and returns ok (it won't actually delete our session since it's not in a cookie)
            success_logout, _ = self.test(
                "POST /api/auth/logout (returns ok)",
                "POST",
                "auth/logout",
                use_auth=False,
                validate=lambda d: assert_eq(d.get("ok"), True, "should return ok=True")
            )
            
            # Note: We can't fully test session deletion via Bearer token since logout
            # only deletes sessions from cookies. This is a limitation of the test.
            print("   ⚠️  Note: Full session deletion test requires cookie support")
        
        # Test 24: REGRESSION - Email/password auth still works
        print("\n📋 Testing Regression: Email/Password Auth Still Works...")
        
        # Login with guardian@test.com
        success, jwt_login = self.test(
            "POST /api/auth/login (guardian@test.com - JWT)",
            "POST",
            "auth/login",
            data={"email": "guardian@test.com", "password": "vanguard123"},
            use_auth=False,
            validate=lambda d: (
                assert_in("token", d, "should return JWT token"),
                assert_in("user", d, "should return user"),
            )
        )
        
        jwt_token = None
        if success and jwt_login:
            jwt_token = jwt_login.get("token")
            print(f"   ✓ JWT login successful")
        
        # GET /api/auth/me with JWT
        if jwt_token:
            success, jwt_me = self.test(
                "GET /api/auth/me (with JWT Bearer)",
                "GET",
                "auth/me",
                headers={"Authorization": f"Bearer {jwt_token}"},
                use_auth=False,
                validate=lambda d: (
                    assert_in("id", d, "should have id"),
                    assert_eq(d.get("email"), "guardian@test.com", "should be guardian@test.com"),
                )
            )
        
        # GET /api/user/data with JWT
        if jwt_token:
            success, jwt_data = self.test(
                "GET /api/user/data (with JWT)",
                "GET",
                "user/data",
                headers={"Authorization": f"Bearer {jwt_token}"},
                use_auth=False,
                validate=lambda d: (
                    assert_in("obtained", d, "should have obtained"),
                )
            )
        
        # POST /api/user/sync with JWT
        if jwt_token:
            success, jwt_sync = self.test(
                "POST /api/user/sync (with JWT)",
                "POST",
                "user/sync",
                headers={"Authorization": f"Bearer {jwt_token}"},
                data={"obtained": ["5555555555"], "fav_items": [], "fav_activities": []},
                use_auth=False,
                validate=lambda d: (
                    assert_in("obtained", d, "should have obtained"),
                )
            )

        # ========== Regression Tests ==========
        print("\n📋 Testing Regression: Existing Features...")
        
        # Test 19: Health check
        self.test(
            "GET /api/health",
            "GET",
            "health",
            use_auth=False,
            validate=lambda d: (
                assert_eq(d.get("status"), "ok", "status should be 'ok'"),
                assert_eq(d.get("activities"), 24, "should have 24 activities"),
                assert_eq(d.get("items"), 1020, "should have 1020 items"),
            )
        )

        # Test 20: Filters
        self.test(
            "GET /api/filters",
            "GET",
            "filters",
            use_auth=False,
            validate=lambda d: (
                assert_in("elements", d, "should have elements"),
                assert_in("rarities", d, "should have rarities"),
                assert_in("activity_types", d, "should have activity_types"),
            )
        )

        # Test 21: List all activities
        self.test(
            "GET /api/activities (all 24)",
            "GET",
            "activities",
            use_auth=False,
            validate=lambda d: (
                assert_eq(d.get("total"), 24, "should have 24 total activities"),
            )
        )

        # Test 22: Get raid detail (Vault of Glass)
        self.test(
            "GET /api/activities/vault_of_glass",
            "GET",
            "activities/vault_of_glass",
            use_auth=False,
            validate=lambda d: (
                assert_eq(d.get("type"), "raid", "should be type raid"),
                assert_gt(len(d.get("encounters", [])), 0, "should have encounters"),
            )
        )

        # Test 23: Search items
        self.test(
            "GET /api/items?q=fatebringer",
            "GET",
            "items",
            params={"q": "fatebringer"},
            use_auth=False,
            validate=lambda d: (
                assert_gt(d.get("total", 0), 0, "should find items"),
            )
        )

        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.tests_failed)}")
        
        if self.tests_failed:
            print("\n❌ Failed tests:")
            for test in self.tests_failed:
                print(f"   - {test}")
            return 1
        else:
            print("\n✅ All tests passed!")
            return 0


# Helper validation functions
def assert_eq(actual, expected, msg=""):
    if actual != expected:
        raise AssertionError(f"{msg}: expected {expected}, got {actual}")

def assert_in(key, obj, msg=""):
    if key not in obj:
        raise AssertionError(f"{msg}: key '{key}' not found")

def assert_gt(actual, threshold, msg=""):
    if not (actual > threshold):
        raise AssertionError(f"{msg}: expected > {threshold}, got {actual}")

def assert_gte(actual, threshold, msg=""):
    if not (actual >= threshold):
        raise AssertionError(f"{msg}: expected >= {threshold}, got {actual}")

def assert_lte(actual, threshold, msg=""):
    if not (actual <= threshold):
        raise AssertionError(f"{msg}: expected <= {threshold}, got {actual}")


if __name__ == "__main__":
    tester = D2APITester()
    sys.exit(tester.run_all_tests())
