/*
[FIX] Payments Table RLS Policy - Allow Anonymous Payment Creation
This ensures anonymous users can create payment records during registration.
*/

-- Drop conflicting payment policies
DROP POLICY IF EXISTS "Allow users to create their own payment records" ON payments;
DROP POLICY IF EXISTS "Anyone can insert payments" ON payments;
DROP POLICY IF EXISTS "Public can insert pending payments" ON payments;
DROP POLICY IF EXISTS "Public insert pending payments" ON payments;
DROP POLICY IF EXISTS "Allow users to create their own payment records" ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Public can insert pending payments" ON public.payments;
DROP POLICY IF EXISTS "Public insert pending payments" ON public.payments;

-- Create a simple policy for anonymous payment creation
CREATE POLICY "anonymous_payment_creation"
ON payments 
FOR INSERT 
TO anon 
WITH CHECK (status = 'pending');

-- Ensure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;