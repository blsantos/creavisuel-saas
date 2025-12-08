# 🔧 Fix Media Upload - RLS Infinite Recursion Error

## ❌ Current Problem

Media uploads fail with this error:
```
StorageApiError: infinite recursion detected in policy for relation "muro_users"
```

## 🎯 Root Cause

The `chat-media` storage bucket has RLS policies that reference the `muro_users` table. However, the `muro_users` table itself has circular/recursive RLS policies, causing an infinite loop when trying to upload files.

## ✅ Solution Options

### Option 1: Disable RLS on chat-media Bucket (QUICKEST)

This is the fastest way to test if uploads work without the RLS blocking.

**Steps:**
1. Go to Supabase Dashboard → **Storage** → **chat-media** bucket
2. Click on **Settings** or **Configuration**
3. **Uncheck "Enable RLS"** (or toggle RLS off)
4. Save the changes
5. Test upload in the app at https://jeffterra.creavisuel.pro

**Pros:**
- Quick fix to test functionality
- Files are still organized by user ID in folder structure

**Cons:**
- Anyone with the bucket URL could potentially upload (mitigated by client-side checks)
- Less secure than proper RLS

---

### Option 2: Simplify RLS Policies (RECOMMENDED)

Replace the complex RLS policies with simpler ones that don't reference other tables.

**Current Policies** (causing recursion):
```sql
-- These reference muro_users table which has circular dependencies
INSERT: (bucket_id = 'chat-media') AND (auth.role() = 'authenticated')
UPDATE: (bucket_id = 'chat-media') AND (auth.uid()::text = (storage.foldername(name))[1])
DELETE: (bucket_id = 'chat-media') AND (auth.uid()::text = (storage.foldername(name))[1])
SELECT: bucket_id = 'chat-media'
```

**New Simplified Policies** (no table references):
1. Go to Supabase Dashboard → **Storage** → **chat-media** → **Policies**
2. **Delete all existing policies**
3. Create new policies:

#### INSERT Policy - "Allow authenticated uploads"
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
);
```

#### SELECT Policy - "Allow public reads"
```sql
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'chat-media'
);
```

#### UPDATE Policy - "Allow user to update own files"
```sql
CREATE POLICY "Allow user to update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND owner = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat-media'
  AND owner = auth.uid()::text
);
```

#### DELETE Policy - "Allow user to delete own files"
```sql
CREATE POLICY "Allow user to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND owner = auth.uid()::text
);
```

**Pros:**
- Secure - users can only modify their own files
- No circular dependencies
- No infinite recursion

**Cons:**
- Requires SQL access to apply policies

---

### Option 3: Fix muro_users Table RLS (LONG-TERM)

Fix the underlying circular RLS issue in the `muro_users` table.

**Database Linter Issues Found:**
- `image_templates` table: RLS policies defined but RLS not enabled
- `pricing_plans` table: RLS disabled but should be enabled
- `token_usage_detailed` view: Security definer detected
- 17 functions with mutable `search_path` security warnings

**Steps:**
1. Go to Supabase Dashboard → **Database** → **Linter**
2. Review each RLS warning
3. Fix circular dependencies in `muro_users` policies
4. Enable RLS on tables that have policies but RLS disabled
5. Re-test media upload

**Pros:**
- Fixes root cause
- Improves overall database security

**Cons:**
- Time-consuming
- Risk of breaking other features
- Requires careful testing

---

## 🧪 Testing After Fix

After applying one of the solutions above:

1. **Clear browser cache** (CTRL+SHIFT+R or CMD+SHIFT+R)
2. Go to https://jeffterra.creavisuel.pro
3. Login with: `blsantosdesigner@gmail.com`
4. Start a new conversation
5. Click the **image/video/audio upload button**
6. Select a small test image (< 5MB)
7. **Open browser console** (F12) to see debug logs:
   - Look for: `🔍 useMediaUpload - Starting upload`
   - Check for: `✅ File uploaded successfully`
   - Or error: `❌ Upload error`

8. If successful, you should see:
   - `📷 Image: [URL]` in the message
   - The image displayed visually in the chat

---

## 📊 Console Debug Logs

The code now includes comprehensive debug logging to help diagnose upload issues:

```
🔍 useMediaUpload - Starting upload:
  ├─ fileName: test.jpg
  ├─ conversationId: abc123...
  ├─ hasUser: true
  ├─ isConfigured: true
  └─ hasSupabase: true

📁 Uploading to path: user-id/conversation-id/timestamp.jpg

✅ File uploaded successfully

🔗 Public URL: https://supabase.lecoach.digital/storage/v1/object/public/chat-media/...

📨 Sending message with media URL: 📷 Image: [URL]

🏁 Upload process completed
```

---

## 📋 Current Status

- ✅ Frontend code updated with debug logging
- ✅ Image URL detection and display working
- ✅ Build deployed to production
- ❌ **Upload blocked by RLS infinite recursion**
- ⏳ **Waiting for RLS fix** (see options above)

---

## 🔗 Related Issues

### Issue 2: Conversation History Not Loading

When clicking on saved conversations in the dashboard, messages don't load.

**Error in console:**
```
HEAD https://supabase.lecoach.digital/rest/v1/messages?select=*&tenant_id=eq.66fd102d... 400 (Bad Request)
```

**Possible causes:**
- RLS policies on `messages` table blocking reads
- Incorrect query parameters
- Missing conversation_id filter

**Action needed:**
Check RLS policies on `messages` table and ensure users can read their own messages.

---

**🤖 Generated with Claude Code**
**Last updated:** 2025-12-08
