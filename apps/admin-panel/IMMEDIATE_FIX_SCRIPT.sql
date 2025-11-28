-- 🚨 IMMEDIATE FIX SCRIPT FOR ADMIN PANEL MEDIA DATA ISSUES
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. CRITICAL: Fix Foreign Key Relationship
-- ========================================

-- Drop existing foreign key constraint if it exists
ALTER TABLE sos_media DROP CONSTRAINT IF EXISTS sos_media_sos_event_id_fkey;

-- Rename column to match correct table
ALTER TABLE sos_media RENAME COLUMN sos_event_id TO sos_alert_id;

-- Add correct foreign key constraint
ALTER TABLE sos_media 
ADD CONSTRAINT sos_media_sos_alert_id_fkey 
FOREIGN KEY (sos_alert_id) REFERENCES sos_alerts(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sos_media_sos_alert_id ON sos_media(sos_alert_id);

-- ========================================
-- 2. HIGH: Add RLS Policies for sos_media
-- ========================================

-- Enable RLS on sos_media table
ALTER TABLE sos_media ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to sos_media
CREATE POLICY "Admin can view all sos_media" ON sos_media
FOR SELECT USING (true);

-- Create policy for admin to insert sos_media
CREATE POLICY "Admin can insert sos_media" ON sos_media
FOR INSERT WITH CHECK (true);

-- Create policy for admin to update sos_media
CREATE POLICY "Admin can update sos_media" ON sos_media
FOR UPDATE USING (true);

-- Create policy for admin to delete sos_media
CREATE POLICY "Admin can delete sos_media" ON sos_media
FOR DELETE USING (true);

-- ========================================
-- 3. HIGH: Fix Column Name Mismatch
-- ========================================

-- Ensure sos_media table has correct column name
-- (This should already be done above, but just in case)
ALTER TABLE sos_media RENAME COLUMN sos_event_id TO sos_alert_id;

-- ========================================
-- 4. MEDIUM: Add Missing Indexes
-- ========================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sos_media_media_type ON sos_media(media_type);
CREATE INDEX IF NOT EXISTS idx_sos_media_created_at ON sos_media(created_at);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_triggered_at ON sos_alerts(triggered_at);

-- ========================================
-- 5. VERIFICATION QUERIES
-- ========================================

-- Test 1: Check if sos_media table structure is correct
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sos_media' 
ORDER BY ordinal_position;

-- Test 2: Check foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'sos_media';

-- Test 3: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'sos_media';

-- Test 4: Test JOIN query (this should work after fixes)
SELECT 
    sa.id as alert_id,
    sa.emergency_type,
    sa.description,
    sa.triggered_at,
    sm.id as media_id,
    sm.media_type,
    sm.file_url,
    sm.created_at as media_created_at
FROM sos_alerts sa
LEFT JOIN sos_media sm ON sa.id = sm.sos_alert_id
ORDER BY sa.triggered_at DESC
LIMIT 5;

-- ========================================
-- 6. CLEANUP (if needed)
-- ========================================

-- If you have orphaned media records, clean them up
-- DELETE FROM sos_media WHERE sos_alert_id NOT IN (SELECT id FROM sos_alerts);

-- ========================================
-- 7. SUCCESS MESSAGE
-- ========================================

-- If all queries above run without errors, you should see:
-- ✅ Foreign key relationship fixed
-- ✅ RLS policies added
-- ✅ Column names corrected
-- ✅ Indexes created
-- ✅ JOIN query working

-- Your admin panel should now be able to see media data!
