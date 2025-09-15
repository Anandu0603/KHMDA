# 🔧 SETUP GUIDE: Getting Your Supabase Credentials

## Current Issue
You're getting this error because the `.env` file still contains placeholder values instead of your real Supabase project credentials:

```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
your-project-id.supabase.co (this is not a real URL!)
```

## Step-by-Step Solution

### 1. Get Your Supabase Credentials

#### Option A: If you already have a Supabase project
1. 🌐 Go to: https://supabase.com/dashboard
2. 🔑 Login to your account
3. 📁 Click on your project (the one for this membership app)
4. ⚙️ Go to **Settings** → **API** (in the left sidebar)
5. 📋 Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Project API Keys** → **anon public** (long string starting with `eyJ...`)

#### Option B: If you don't have a Supabase project yet
1. 🌐 Go to: https://supabase.com
2. 🔑 Sign up or login
3. ➕ Click "New Project"
4. 📝 Fill in:
   - Project name: "KMDA Membership"
   - Database password: (choose a strong password)
   - Region: (choose closest to your users)
5. ⏳ Wait for project creation (2-3 minutes)
6. 📋 Copy the URL and anon key from Settings → API

### 2. Update Your .env File

Replace the placeholder values in your `.env` file:

```bash
# Replace these lines:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# With your actual values (example):
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4OTMwNDI3MSwiZXhwIjoyMDA0ODgwMjcxfQ.example-signature-here
```

### 3. Apply Database Migration (if using existing project)

If you're using an existing Supabase project, you need to apply our storage fix:

1. 🌐 Go to your Supabase Dashboard
2. 📊 Click **SQL Editor** (in left sidebar)
3. 📋 Copy the contents of: `supabase/migrations/20250915000000_final_storage_fix.sql`
4. 📝 Paste into SQL Editor and click **Run**

### 4. Restart Development Server

After updating `.env`:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 5. Test the Registration Form

1. 🌐 Go to: http://localhost:5173
2. 📝 Navigate to registration form
3. 📁 Try uploading files - should work now!

## Security Note 🔒

- ✅ The **anon key** is safe to use in frontend code
- ❌ Never use the **service_role key** in frontend code
- 🔐 Keep your database password private

## Still Having Issues?

### Common Problems:
1. **Wrong URL format**: Must start with `https://` and end with `.supabase.co`
2. **Wrong key**: Make sure you copied the **anon** key, not service_role
3. **Typos**: Double-check for any extra spaces or missing characters
4. **Cache**: Clear browser cache or try incognito mode
5. **Server restart**: Make sure you restarted the dev server after changing `.env`

### Verification Steps:
1. Check browser console for new error messages
2. Verify the URL in console shows your real project ID
3. Test with a simple file upload first

Need help? Check the detailed logs in browser console for more specific errors.