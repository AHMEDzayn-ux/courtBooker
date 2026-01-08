# Fix Sports Not Showing - Implementation Steps

## Issue

Available sports are not displaying in the institution register form.

## Root Cause

The Row Level Security (RLS) policy on the `sports` table doesn't explicitly allow anonymous (unauthenticated) users to read the data.

## Solution Steps

### Step 1: Apply Database Fix (REQUIRED)

You **MUST** run the SQL migration in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `fix-sports-rls-policy.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the query

### Step 2: Verify the Fix

After running the SQL:

1. Refresh your browser on the register institution page
2. Open Browser DevTools (F12)
3. Go to the **Console** tab
4. You should see logs like:
   ```
   Fetching sports...
   Sports fetch result: { data: [...], error: null }
   Setting sports: [...]
   ```

### Step 3: Check for Errors

If sports still don't show:

1. Check the browser console for error messages
2. Look for the specific error from Supabase
3. Common errors:
   - **"permission denied"** → RLS policy not applied correctly
   - **"relation does not exist"** → Sports table missing
   - **"null" or empty array** → No sports data in database

### Step 4: Verify Sports Data Exists

Run this query in Supabase SQL Editor to check if sports exist:

```sql
SELECT * FROM sports;
```

If empty, run:

```sql
INSERT INTO sports (name) VALUES
  ('Badminton'),
  ('Futsal'),
  ('Cricket'),
  ('Table Tennis'),
  ('Squash'),
  ('Basketball'),
  ('Volleyball')
ON CONFLICT (name) DO NOTHING;
```

## What Was Changed

### Database (fix-sports-rls-policy.sql)

- Updated RLS policy to explicitly allow `anon` (anonymous) and `authenticated` roles
- Added GRANT permissions for SELECT on sports table

### Frontend (register page.js)

- Added comprehensive error handling and logging
- Added loading state display
- Better error messages for users

## Testing

1. Open the register page in an incognito/private browser window (to test as anonymous user)
2. Sports should now be visible
3. Check console logs to confirm data is fetched successfully
