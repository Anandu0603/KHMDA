-- Ensure service role can insert into donations
DROP POLICY IF EXISTS "Service role full access to donations" ON donations;
CREATE POLICY "Service role full access to donations" ON donations
FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert donations" ON donations;
CREATE POLICY "Service role can insert donations" ON donations
FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update donations" ON donations;
CREATE POLICY "Service role can update donations" ON donations
FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can delete donations" ON donations;
CREATE POLICY "Service role can delete donations" ON donations
FOR DELETE USING (auth.role() = 'service_role');