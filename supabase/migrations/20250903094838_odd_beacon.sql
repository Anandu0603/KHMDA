/*
  # KMDA Database Schema

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `company_name` (text, not null)
      - `mobile` (text, not null)
      - `email` (text, unique, not null)
      - `address` (text, not null)
      - `state` (text, default 'Kerala')
      - `district` (text, not null)
      - `taluk` (text, not null)
      - `city` (text, not null)
      - `status` (text, default 'pending')
      - `member_id` (text, unique, nullable)
      - `membership_fee` (numeric, default 5000)
      - `payment_gateway_charges` (numeric, default 150)
      - `expires_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
    
    - `payments`
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key to members)
      - `amount` (numeric, not null)
      - `membership_fee` (numeric, not null)
      - `gateway_charges` (numeric, default 0)
      - `donation_amount` (numeric, default 0)
      - `status` (text, default 'pending')
      - `payment_type` (text, not null)
      - `payment_gateway` (text, nullable)
      - `transaction_id` (text, nullable)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
    
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Members can only access their own data
    - Admins can access all data
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  mobile text NOT NULL,
  email text UNIQUE NOT NULL,
  address text NOT NULL,
  state text DEFAULT 'Kerala',
  district text NOT NULL,
  taluk text NOT NULL,
  city text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  member_id text UNIQUE,
  membership_fee numeric DEFAULT 5000,
  payment_gateway_charges numeric DEFAULT 150,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  membership_fee numeric NOT NULL,
  gateway_charges numeric DEFAULT 0,
  donation_amount numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_type text NOT NULL CHECK (payment_type IN ('registration', 'renewal')),
  payment_gateway text CHECK (payment_gateway IN ('stripe', 'razorpay')),
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Members can read own data"
  ON members
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Anyone can insert members"
  ON members
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can read all members"
  ON members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update members"
  ON members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Members can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = payments.member_id
      AND members.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Anyone can insert payments"
  ON payments
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can read all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Admin users policies
CREATE POLICY "Admins can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_expires_at ON members(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_members_updated_at 
  BEFORE UPDATE ON members 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();