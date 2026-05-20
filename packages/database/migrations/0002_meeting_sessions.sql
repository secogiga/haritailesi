-- meeting_sessions: mentorship / event / training buluşmalarının kayıt tablosu
CREATE TABLE "meeting_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reference_type" text NOT NULL,
  "reference_id" uuid NOT NULL,
  "room_name" text NOT NULL,
  "host_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "started_at" timestamp with time zone,
  "ended_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "public"."meeting_sessions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "left_at" timestamp with time zone,
  "duration_seconds" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- mentorship_requests: reschedule desteği için yeni alanlar
ALTER TABLE "mentorship_requests"
  ADD COLUMN "proposed_scheduled_at" timestamp with time zone,
  ADD COLUMN "reschedule_note" text;
--> statement-breakpoint
-- events: online toplantı odası
ALTER TABLE "events"
  ADD COLUMN "online_room_name" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_sessions_room_name_unique" ON "meeting_sessions" USING btree ("room_name");
CREATE INDEX "meeting_sessions_reference_idx" ON "meeting_sessions" USING btree ("reference_type", "reference_id");
CREATE UNIQUE INDEX "meeting_participants_session_user_unique" ON "meeting_participants" USING btree ("session_id", "user_id");
CREATE INDEX "meeting_participants_session_idx" ON "meeting_participants" USING btree ("session_id");
CREATE INDEX "meeting_participants_user_idx" ON "meeting_participants" USING btree ("user_id");
CREATE INDEX "events_online_idx" ON "events" USING btree ("online_room_name") WHERE "online_room_name" IS NOT NULL;
