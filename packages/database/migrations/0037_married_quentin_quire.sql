ALTER TABLE "projects" ADD COLUMN "linkedin_click_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "linkedin_like_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "linkedin_comment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "linkedin_post_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "university" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "graduation_type" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "graduation_year" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_category" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "award_cohort_month" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "award_rank" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "finalist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "winner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "award_community_votes" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "award_final_score" real;--> statement-breakpoint
CREATE INDEX "projects_award_idx" ON "projects" USING btree ("award_cohort_month","award_rank");--> statement-breakpoint
CREATE INDEX "projects_university_idx" ON "projects" USING btree ("university");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("project_category");