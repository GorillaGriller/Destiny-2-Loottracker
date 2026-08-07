# Auth-Gated App Testing Playbook (Emergent Google Auth)

## Setup a test session directly in Mongo
```
mongosh --eval "
use('test_database');
var userId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({ id: userId, email: 'test.user.'+Date.now()+'@example.com', name: 'Test User', picture: 'https://via.placeholder.com/150', auth_provider:'google', created_at: new Date().toISOString() });
db.user_data.insertOne({ user_id: userId, obtained: [], fav_items: [], fav_activities: [] });
db.user_sessions.insertOne({ session_token: sessionToken, user_id: userId, expires_at: new Date(Date.now()+7*24*60*60*1000).toISOString(), created_at: new Date().toISOString() });
print('Session token: ' + sessionToken); print('User ID: ' + userId);
"
```

## Backend checks
```
# session cookie (preferred) OR Authorization header both accepted
curl -X GET "$URL/api/auth/me" -H "Authorization: Bearer <SESSION_TOKEN>"
curl -X GET "$URL/api/user/data" -H "Authorization: Bearer <SESSION_TOKEN>"
```

## Browser test
```
await page.context.add_cookies([{ "name":"session_token","value":"<SESSION_TOKEN>","domain":"loot-tracker-d2.preview.emergentagent.com","path":"/","httpOnly":true,"secure":true,"sameSite":"None" }])
await page.goto("https://loot-tracker-d2.preview.emergentagent.com/")
# header should show the account (email/name + Sign Out)
```

## Notes
- Google sign-in coexists with email/password JWT. Both resolve to a user with an `id` field.
- current_user accepts: session_token cookie -> user_sessions; OR Authorization Bearer (session_token OR legacy JWT).
- All user queries use `{"_id": 0}` projection.
- Clean test data:
```
mongosh --eval "use('test_database'); db.users.deleteMany({email:/test\\.user\\./}); db.user_sessions.deleteMany({session_token:/test_session/});"
```
