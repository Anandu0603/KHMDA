/*
[SCHEMA FIX] Add missing joined_at column to members table
This ensures the members table has the joined_at column for backward compatibility.
*/

-- Add joined_at column if it doesn't exist
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have joined_at = created_at if joined_at is null
UPDATE members 
SET joined_at = created_at 
WHERE joined_at IS NULL;