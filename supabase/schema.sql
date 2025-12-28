-- HuisOS Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Family Members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  initials TEXT NOT NULL CHECK (length(initials) <= 2),
  color TEXT NOT NULL,
  email TEXT,
  push_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'every_other_day')),
  eligible_member_ids UUID[] NOT NULL,
  current_member_idx INTEGER NOT NULL DEFAULT 0,
  token_value INTEGER NOT NULL DEFAULT 1,
  linked_chore_id UUID REFERENCES chores(id),
  delegated_to UUID REFERENCES family_members(id),
  delegation_note TEXT,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chore Completions table
CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  assigned_to UUID NOT NULL REFERENCES family_members(id),
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES family_members(id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT FALSE,
  member_ids UUID[] NOT NULL,
  recurring TEXT CHECK (recurring IN ('weekly', 'monthly', 'daily')),
  recurring_end DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presence table
CREATE TABLE IF NOT EXISTS presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES family_members(id),
  date DATE NOT NULL,
  morning BOOLEAN DEFAULT TRUE,
  afternoon BOOLEAN DEFAULT TRUE,
  evening BOOLEAN DEFAULT TRUE,
  note TEXT,
  UNIQUE(member_id, date)
);

-- Tokens table (for Quinten's gamification)
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES family_members(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  chore_completion_id UUID REFERENCES chore_completions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chores_member ON chores USING GIN (eligible_member_ids);
CREATE INDEX IF NOT EXISTS idx_chore_completions_date ON chore_completions(date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(datetime);
CREATE INDEX IF NOT EXISTS idx_presence_date ON presence(date);
CREATE INDEX IF NOT EXISTS idx_tokens_member ON tokens(member_id);

-- Enable Row Level Security (RLS)
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (family app, no auth)
CREATE POLICY "Allow all on family_members" ON family_members FOR ALL USING (true);
CREATE POLICY "Allow all on chores" ON chores FOR ALL USING (true);
CREATE POLICY "Allow all on chore_completions" ON chore_completions FOR ALL USING (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all on presence" ON presence FOR ALL USING (true);
CREATE POLICY "Allow all on tokens" ON tokens FOR ALL USING (true);
CREATE POLICY "Allow all on rewards" ON rewards FOR ALL USING (true);
