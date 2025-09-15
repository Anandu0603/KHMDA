# Registration Form Fix - Setup Instructions

## Issue Resolved
Fixed the "signature verification failed" error during user registration file uploads to Supabase storage.

## What Was Fixed

### 1. Environment Configuration
- Created `.env` file with Supabase configuration placeholders
- You need to add your actual Supabase credentials

### 2. Storage Permissions
- Created a definitive storage migration that fixes all RLS policies
- Simplified storage policies to allow anonymous uploads during registration
- Ensured proper bucket configuration

### 3. Enhanced File Upload Logic
- Added better file validation (size, type checks)
- Improved error handling for upload failures
- Added retry logic for duplicate filename conflicts
- Better error messages for users

## Setup Steps

### 1. Configure Environment Variables
Edit the `.env` file and replace with your actual Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

You can find these in your Supabase project dashboard:
- Go to Settings > API
- Copy the URL and anon key

### 2. Apply Database Migration
Run the storage fix migration in your Supabase project:

```sql
-- Execute the contents of: supabase/migrations/20250915000000_final_storage_fix.sql
```

Or if using Supabase CLI:
```bash
supabase db push
```

### 3. Start Development Server
```bash
npm install
npm run dev
```

## File Upload Requirements
- **Allowed file types**: JPEG, PNG, PDF
- **Maximum file size**: 10MB per file
- **Required files**: Drug License + ID Proof

## Testing the Fix
1. Navigate to the registration form
2. Fill out all required fields
3. Upload both required documents
4. Submit the form
5. Verify files are uploaded successfully

## Key Changes Made

### Storage Bucket Configuration
- Ensured `member-documents` bucket exists
- Set to public for URL generation
- Configured proper MIME types and size limits

### RLS Policies
- `anonymous_upload_member_documents`: Allows anonymous file uploads
- `public_read_member_documents`: Allows reading uploaded files
- `authenticated_manage_member_documents`: Allows admin management

### File Upload Logic
- Added comprehensive file validation
- Enhanced error handling and user feedback
- Implemented retry mechanism for filename conflicts

## Troubleshooting

### If you still get "signature verification failed":
1. Verify your `.env` file has correct Supabase credentials
2. Ensure the migration has been applied to your database
3. Check Supabase dashboard Storage > Settings for bucket permissions
4. Restart the development server after changing `.env`

### Common Issues:
- **File too large**: Ensure files are under 10MB
- **Invalid file type**: Only JPEG, PNG, and PDF files are allowed
- **Network issues**: Check your internet connection
- **Supabase service issues**: Check Supabase status page

## Support
If issues persist, check:
1. Browser console for detailed error messages
2. Supabase dashboard logs
3. Ensure all dependencies are installed (`npm install`)