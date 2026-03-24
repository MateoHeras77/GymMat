-- ============================================================
-- CLEANUP MOCK DATA (tag: MOCK_SEED_2026)
-- Run this SQL in Supabase to remove all seeded mock data
-- ============================================================

-- Delete workout sets from mock sessions
DELETE FROM workout_sets
WHERE session_id IN (
  SELECT id FROM workout_sessions
  WHERE notes = 'MOCK_SEED_2026'
);

-- Delete mock workout sessions
DELETE FROM workout_sessions
WHERE notes = 'MOCK_SEED_2026';

-- Delete mock body measurements
DELETE FROM body_measurements
WHERE notes = 'MOCK_SEED_2026';

-- Delete mock personal records (no tag field, so delete by date range + user)
DELETE FROM personal_records
WHERE user_id = 'efca0aa8-c443-4e49-9121-2c501dfb077a'
  AND workout_set_id IS NULL
  AND achieved_at >= NOW() - INTERVAL '60 days';
