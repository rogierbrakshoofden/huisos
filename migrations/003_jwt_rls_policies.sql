-- Update RLS policies to read household_id from JWT claims instead of headers
-- Run this in Supabase SQL Editor

-- First, drop all existing RLS policies that use current_setting
DROP POLICY IF EXISTS "household_isolation" ON tasks;
DROP POLICY IF EXISTS "household_isolation" ON chores;
DROP POLICY IF EXISTS "household_isolation" ON events;
DROP POLICY IF EXISTS "household_isolation" ON presence;
DROP POLICY IF EXISTS "household_isolation" ON tokens;
DROP POLICY IF EXISTS "household_isolation" ON rewards;
DROP POLICY IF EXISTS "household_isolation" ON subtasks;
DROP POLICY IF EXISTS "household_isolation" ON activity_log;
DROP POLICY IF EXISTS "household_isolation" ON chore_completions;
DROP POLICY IF EXISTS "household_isolation" ON family_members;
DROP POLICY IF EXISTS "household_isolation" ON reward_claims;

-- Create new RLS policies that read household_id from JWT user_metadata
-- auth.jwt() -> 'user_metadata' ->> 'household_id' extracts the household_id from the JWT claims

CREATE POLICY "household_isolation" ON tasks
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON chores
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON events
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON presence
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON tokens
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON rewards
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON subtasks
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON activity_log
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON chore_completions
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON family_members
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

CREATE POLICY "household_isolation" ON reward_claims
  FOR ALL
  USING (household_id = (auth.jwt() -> 'user_metadata' ->> 'household_id'));

-- Verify RLS is enabled on all tables (should already be enabled)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- Test query to verify JWT extraction works
-- Run this after running the migration:
-- SELECT auth.jwt() -> 'user_metadata' ->> 'household_id' as household_id_from_jwt;
