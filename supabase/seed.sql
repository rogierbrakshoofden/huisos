-- HuisOS Seed Data
-- Run this AFTER schema.sql

-- Insert family members
INSERT INTO family_members (name, initials, color) VALUES
  ('Rogier', 'R', '#8B5CF6'),
  ('Anne', 'A', '#22C55E'),
  ('Isis', 'I', '#F97316'),
  ('Elin', 'E', '#FACC15'),
  ('Quinten', 'Q', '#3B82F6');

-- Get member IDs for chore assignments
DO $$
DECLARE
  r_id UUID;
  a_id UUID;
  i_id UUID;
  e_id UUID;
  q_id UUID;
  all_ids UUID[];
  adults_ids UUID[];
BEGIN
  -- Get all member IDs
  SELECT id INTO r_id FROM family_members WHERE initials = 'R';
  SELECT id INTO a_id FROM family_members WHERE initials = 'A';
  SELECT id INTO i_id FROM family_members WHERE initials = 'I';
  SELECT id INTO e_id FROM family_members WHERE initials = 'E';
  SELECT id INTO q_id FROM family_members WHERE initials = 'Q';
  
  all_ids := ARRAY[r_id, a_id, i_id, e_id, q_id];
  adults_ids := ARRAY[r_id, a_id, i_id, e_id];
  
  -- Insert initial chores
  INSERT INTO chores (name, frequency, eligible_member_ids, token_value) VALUES
    ('Hond uitlaten (ochtend)', 'daily', all_ids, 1),
    ('Kippen voeren', 'daily', all_ids, 1),
    ('Hond uitlaten (middag)', 'daily', all_ids, 1),
    ('Afwas / vaatwasser', 'daily', all_ids, 1),
    ('Vloer beneden', 'every_other_day', adults_ids, 1),
    ('Prullenbakken checken', 'every_other_day', all_ids, 1),
    ('WC beneden', 'weekly', adults_ids, 1),
    ('WC boven', 'weekly', adults_ids, 1),
    ('Vuile was naar machine', 'weekly', all_ids, 1);
  
  -- Link morning dog walk with chickens
  UPDATE chores 
  SET linked_chore_id = (SELECT id FROM chores WHERE name = 'Kippen voeren')
  WHERE name = 'Hond uitlaten (ochtend)';
  
  -- Insert rewards for Quinten
  INSERT INTO rewards (name, cost) VALUES
    ('30 min extra schermtijd', 5),
    ('Kies het avondeten', 10),
    ('Skip één klusje', 15),
    ('€5', 20);
END $$;
