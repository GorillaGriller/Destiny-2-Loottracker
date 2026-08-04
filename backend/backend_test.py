"""
Backend API tests for Destiny 2 Boss Drops application.
Tests all endpoints using the public URL from REACT_APP_BACKEND_URL.
"""
import requests
import sys
from pathlib import Path

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

    def test(self, name, method, endpoint, expected_status=200, params=None, validate=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        self.tests_run += 1
        
        try:
            if method == "GET":
                response = requests.get(url, params=params, timeout=10)
            else:
                print(f"❌ {name} - Unsupported method {method}")
                self.tests_failed.append(name)
                return False, None
            
            if response.status_code != expected_status:
                print(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.tests_failed.append(name)
                return False, None
            
            data = response.json()
            
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
        print("\n" + "="*60)
        print("BACKEND API TESTS")
        print("="*60 + "\n")

        # Test 1: Health check
        print("📋 Testing Health & Stats Endpoints...")
        success, health_data = self.test(
            "GET /api/health",
            "GET",
            "health",
            validate=lambda d: (
                assert_eq(d.get("status"), "ok", "status should be 'ok'"),
                assert_eq(d.get("activities"), 19, "should have 19 activities"),
                assert_eq(d.get("items"), 482, "should have 482 items"),
            )
        )

        # Test 2: Stats
        success, stats_data = self.test(
            "GET /api/stats",
            "GET",
            "stats",
            validate=lambda d: (
                assert_eq(d.get("activities"), 19, "should have 19 activities"),
                assert_in("by_type", d, "should have by_type"),
                assert_eq(d.get("by_type", {}).get("raid"), 9, "should have 9 raids"),
                assert_eq(d.get("by_type", {}).get("dungeon"), 10, "should have 10 dungeons"),
                assert_gt(d.get("weapons", 0), 0, "should have weapons"),
                assert_gt(d.get("armor", 0), 0, "should have armor"),
                assert_gt(d.get("exotics", 0), 0, "should have exotics"),
            )
        )

        # Test 3: Filters
        print("\n📋 Testing Filters Endpoint...")
        success, filters_data = self.test(
            "GET /api/filters",
            "GET",
            "filters",
            validate=lambda d: (
                assert_in("elements", d, "should have elements"),
                assert_in("rarities", d, "should have rarities"),
                assert_in("weapon_types", d, "should have weapon_types"),
                assert_in("classes", d, "should have classes"),
                assert_in("Exotic", d.get("rarities", []), "should have Exotic rarity"),
            )
        )

        # Test 4: List all activities
        print("\n📋 Testing Activities Endpoints...")
        success, all_activities = self.test(
            "GET /api/activities (all)",
            "GET",
            "activities",
            validate=lambda d: (
                assert_eq(d.get("total"), 19, "should have 19 total activities"),
                assert_eq(len(d.get("activities", [])), 19, "should return 19 activities"),
            )
        )

        # Test 5: List raids only
        success, raids = self.test(
            "GET /api/activities?type=raid",
            "GET",
            "activities",
            params={"type": "raid"},
            validate=lambda d: (
                assert_eq(d.get("total"), 9, "should have 9 raids"),
                assert_eq(len(d.get("activities", [])), 9, "should return 9 raids"),
            )
        )

        # Test 6: List dungeons only
        success, dungeons = self.test(
            "GET /api/activities?type=dungeon",
            "GET",
            "activities",
            params={"type": "dungeon"},
            validate=lambda d: (
                assert_eq(d.get("total"), 10, "should have 10 dungeons"),
                assert_eq(len(d.get("activities", [])), 10, "should return 10 dungeons"),
            )
        )

        # Test 7: Get specific activity (Vault of Glass)
        print("\n📋 Testing Activity Detail Endpoint...")
        success, vog = self.test(
            "GET /api/activities/vault_of_glass",
            "GET",
            "activities/vault_of_glass",
            validate=lambda d: (
                assert_eq(d.get("id"), "vault_of_glass", "should have correct id"),
                assert_eq(d.get("name"), "Vault of Glass", "should have correct name"),
                assert_in("encounters", d, "should have encounters"),
                assert_gt(len(d.get("encounters", [])), 0, "should have at least one encounter"),
                assert_in("shared_weapons", d, "should have shared_weapons"),
                assert_in("armor", d, "should have armor"),
            )
        )

        # Validate encounter structure
        if success and vog:
            enc = vog.get("encounters", [{}])[0]
            if enc:
                try:
                    assert "name" in enc, "encounter should have name"
                    assert "boss" in enc, "encounter should have boss"
                    assert "items" in enc, "encounter should have items"
                    if enc.get("items"):
                        item = enc["items"][0]
                        assert "name" in item, "item should have name"
                        assert "icon" in item, "item should have icon"
                        assert "rarity" in item, "item should have rarity"
                        print("   ✓ Encounter items have resolved data (name, icon, rarity)")
                except AssertionError as e:
                    print(f"   ⚠️  Encounter validation: {e}")

        # Test 8: Get invalid activity (should 404)
        print("\n📋 Testing Error Handling...")
        self.test(
            "GET /api/activities/invalid_activity (404)",
            "GET",
            "activities/invalid_activity_xyz",
            expected_status=404
        )

        # Test 9: Search items - by name
        print("\n📋 Testing Items Search Endpoint...")
        success, fatebringer = self.test(
            "GET /api/items?q=fatebringer",
            "GET",
            "items",
            params={"q": "fatebringer"},
            validate=lambda d: (
                assert_gt(d.get("total", 0), 0, "should find fatebringer items"),
                assert_in("items", d, "should have items array"),
            )
        )
        if success and fatebringer:
            print(f"   Found {fatebringer.get('total')} items matching 'fatebringer'")

        # Test 10: Search items - by kind
        success, weapons = self.test(
            "GET /api/items?kind=weapon",
            "GET",
            "items",
            params={"kind": "weapon"},
            validate=lambda d: (
                assert_gt(d.get("total", 0), 0, "should find weapons"),
            )
        )
        if success and weapons:
            print(f"   Found {weapons.get('total')} weapons")

        # Test 11: Search items - by rarity
        success, exotics = self.test(
            "GET /api/items?rarity=Exotic",
            "GET",
            "items",
            params={"rarity": "Exotic"},
            validate=lambda d: (
                assert_gt(d.get("total", 0), 0, "should find exotics"),
            )
        )
        if success and exotics:
            print(f"   Found {exotics.get('total')} Exotic items")

        # Test 12: Search items - by element
        success, solar = self.test(
            "GET /api/items?element=Solar",
            "GET",
            "items",
            params={"element": "Solar"},
            validate=lambda d: (
                assert_gt(d.get("total", 0), 0, "should find Solar items"),
            )
        )

        # Test 13: Search items - pagination
        success, page1 = self.test(
            "GET /api/items?limit=10&offset=0",
            "GET",
            "items",
            params={"limit": 10, "offset": 0},
            validate=lambda d: (
                assert_eq(d.get("limit"), 10, "should respect limit"),
                assert_eq(d.get("offset"), 0, "should respect offset"),
                assert_lte(len(d.get("items", [])), 10, "should return at most 10 items"),
            )
        )

        # Test 14: Get specific item
        print("\n📋 Testing Item Detail Endpoint...")
        # First get an item hash from search
        if fatebringer and fatebringer.get("items"):
            item_hash = fatebringer["items"][0].get("hash")
            if item_hash:
                success, item_detail = self.test(
                    f"GET /api/items/{item_hash}",
                    "GET",
                    f"items/{item_hash}",
                    validate=lambda d: (
                        assert_in("name", d, "should have name"),
                        assert_in("icon", d, "should have icon"),
                        assert_in("sources", d, "should have sources"),
                        assert_gt(len(d.get("sources", [])), 0, "should have at least one source"),
                    )
                )
                if success and item_detail:
                    print(f"   Item: {item_detail.get('name')}")
                    print(f"   Sources: {len(item_detail.get('sources', []))} activities")

        # Test 15: Get invalid item (should 404)
        self.test(
            "GET /api/items/invalid_hash (404)",
            "GET",
            "items/999999999",
            expected_status=404
        )

        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
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
