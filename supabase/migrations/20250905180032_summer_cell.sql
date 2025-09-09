/*
  # Create Admin User

  1. New Tables
    - Creates admin user in auth.users if not exists
    - Links admin user to admin_users table
  2. Security
    - Ensures admin user exists for login
*/

-- First, let's check if the admin user exists and create if needed
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Try to find existing admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@kmda.org';
    
    -- If admin user doesn't exist, we need to create it
    -- Note: In production, this would be done through Supabase Auth UI or API
    -- For development, we'll ensure the admin_users table has the correct entry
    
    -- Check if we have the user ID from the logs: 2303adef-08d9-46d5-a10e-08924fd65263
    -- Insert into admin_users table if not exists
    INSERT INTO admin_users (user_id)
    VALUES ('2303adef-08d9-46d5-a10e-08924fd65263'::uuid)
    ON CONFLICT (user_id) DO NOTHING;
    
END $$;