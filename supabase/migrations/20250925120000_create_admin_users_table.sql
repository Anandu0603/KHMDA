-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own admin status
CREATE POLICY "Users can view own admin status" ON admin_users
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can manage admin users (for inserts/updates by admin)
CREATE POLICY "Service role can manage admin users" ON admin_users
FOR ALL USING (auth.role() = 'service_role');

-- Insert initial admin if needed (replace with actual admin user_id)
-- INSERT INTO admin_users (user_id) VALUES ('your-admin-user-id-here') ON CONFLICT (user_id) DO NOTHING;