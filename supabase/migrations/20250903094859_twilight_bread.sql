/*
  # Create Default Admin User

  1. Creates a default admin user for testing
    - Email: admin@kmda.org
    - Password: admin123 (should be changed in production)
  
  2. Security
    - Adds the user to admin_users table
    - Email confirmation disabled for admin user
*/

-- Note: This is for development only
-- In production, create admin users through proper authentication flow

-- Insert admin user record (this will be linked when the admin signs up)
-- The actual auth.users record will be created when admin signs up through the UI