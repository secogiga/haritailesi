-- Rename Jitsi room name field to platform-agnostic meeting URL
ALTER TABLE events RENAME COLUMN online_room_name TO meeting_url;

-- Attendance tracking table (ready for gamification; populated when Mutfak gets events page)
CREATE TABLE IF NOT EXISTS event_attendances (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_joined_at timestamptz NOT NULL DEFAULT now(),
  join_count    integer     NOT NULL DEFAULT 1,
  UNIQUE(event_id, user_id)
);
