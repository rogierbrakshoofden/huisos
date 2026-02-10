# JWT Authentication Migration - Complete

## What Changed

We've migrated HuisOS from header-based authentication to proper JWT-based authentication with Supabase Auth. This fixes the RLS issue where client-side queries couldn't access data.

## Changes Made

### 1. Authentication Flow (`lib/passcode.ts`)
- ✅ Updated `loginWithPasscode()` to use `supabase.auth.signInAnonymously()`
- ✅ Store `household_id` in JWT `user_metadata` claims
- ✅ Added async session management
- ✅ Added `initializeAuth()` for restoring sessions on app load

### 2. Login Screen (`components/v4/LoginScreen.tsx`)
- ✅ Updated to use async `loginWithPasscode()`

### 3. Client Queries (`lib/hooks-v2-enhanced.ts`)
- ✅ Removed `withHouseholdId()` header wrapper
- ✅ Client queries now work directly - RLS reads from JWT

### 4. Database RLS Policies
- 📝 **NEEDS TO BE RUN**: `migrations/003_jwt_rls_policies.sql`

## Next Steps

### CRITICAL: Run Database Migration

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy the contents** of `migrations/003_jwt_rls_policies.sql`
3. **Run the migration** - this will:
   - Drop old RLS policies using `current_setting()`
   - Create new policies reading from JWT: `auth.jwt() -> 'user_metadata' ->> 'household_id'`
   - Apply to all 11 tables

### Testing After Migration

1. **Clear browser data**:
   ```javascript
   // In browser console:
   localStorage.clear()
   location.reload()
   ```

2. **Log in with your 6-digit passcode**

3. **Check console logs** for:
   - ✅ "Logged in with household_id: ..."
   - ✅ "family_members result: X rows"
   - ✅ "tasks result: X rows"
   - ✅ Data should now load!

4. **Verify isolation**:
   - Try logging in with a different 6-digit code
   - Should see different (or no) data

## How It Works Now

### Login Flow
```
User enters passcode (123456)
  ↓
Hash with SHA256 → household_id (9f86d081...)
  ↓
supabase.auth.signInAnonymously({
  data: { household_id: "9f86d081..." }
})
  ↓
JWT created with user_metadata.household_id
  ↓
Stored in Supabase session + localStorage
```

### Query Flow
```
Client: supabase.from('tasks').select('*')
  ↓
Supabase reads JWT from session
  ↓
RLS policy checks: household_id = auth.jwt() -> 'user_metadata' ->> 'household_id'
  ↓
Only matching rows returned
```

## Architecture Benefits

✅ **Proper security**: RLS reads from authenticated JWT, not custom headers
✅ **Standard pattern**: Uses Supabase Auth as designed
✅ **Session management**: Auto-refresh, proper logout
✅ **Real-time support**: Subscriptions work correctly with RLS
✅ **Cleaner code**: No header wrapper needed

## API Routes

API routes still validate `x-household-id` header for extra security layer, but this is now optional. The primary security is at the RLS level.

## Troubleshooting

### If data still doesn't load:

1. **Check JWT contents** in browser console:
   ```javascript
   supabase.auth.getSession().then(({ data }) => {
     console.log('User metadata:', data.session?.user?.user_metadata)
   })
   ```
   Should show: `{ household_id: "9f86d081..." }`

2. **Test RLS policy** in Supabase SQL Editor:
   ```sql
   SELECT auth.jwt() -> 'user_metadata' ->> 'household_id' as extracted_id;
   ```
   Should return your household_id

3. **Check table policies**:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```
   All tables should have "household_isolation" policy

### If policies don't work:

The RLS policy syntax should be:
```sql
CREATE POLICY "household_isolation" ON [table_name]
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));
```

## Files Changed

- `lib/passcode.ts` - JWT authentication
- `components/v4/LoginScreen.tsx` - Async login
- `lib/hooks-v2-enhanced.ts` - Removed header wrapper
- `migrations/003_jwt_rls_policies.sql` - **NEEDS TO BE RUN**

## Session Persistence

Sessions are maintained across:
- Page refreshes (JWT stored in Supabase)
- Browser restarts (passcode stored in localStorage)
- Tab switches (shared session state)

To log out: Clear localStorage and call `supabase.auth.signOut()`
