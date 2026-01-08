-- =====================================================
-- RE-INSERT SPORTS DATA
-- =====================================================
-- This restores the sports data that was accidentally deleted
-- and adds new sports: Swimming and 8 Ball Pool

INSERT INTO sports (name) VALUES 
  ('Badminton'),
  ('Futsal'),
  ('Cricket'),
  ('Table Tennis'),
  ('Squash'),
  ('Basketball'),
  ('Volleyball'),
  ('Swimming'),
  ('8 Ball Pool')
ON CONFLICT (name) DO NOTHING;

-- Verify the insert
SELECT * FROM sports ORDER BY name;
