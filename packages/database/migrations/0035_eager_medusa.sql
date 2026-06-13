CREATE TABLE "project_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"body" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_comments_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
CREATE TABLE "project_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"category" text NOT NULL,
	"embedding" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "problem" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "solution" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "features" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "gains" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "innovation_score" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "maturity_level" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "impact_domains" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "target_audience" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_type" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "editorial_note" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "editorial_score" real;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "editorial_strengths" jsonb;--> statement-breakpoint
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_favorites" ADD CONSTRAINT "project_favorites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_favorites" ADD CONSTRAINT "project_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_likes" ADD CONSTRAINT "project_likes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_likes" ADD CONSTRAINT "project_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_embeddings" ADD CONSTRAINT "ticket_embeddings_ticket_id_feedback_reports_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."feedback_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_comments_project_idx" ON "project_comments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_comments_email_idx" ON "project_comments" USING btree ("email");--> statement-breakpoint
CREATE INDEX "project_comments_token_idx" ON "project_comments" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "project_comments_verified_idx" ON "project_comments" USING btree ("project_id","email_verified");--> statement-breakpoint
CREATE UNIQUE INDEX "project_favorites_project_user_idx" ON "project_favorites" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_favorites_project_idx" ON "project_favorites" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_favorites_user_idx" ON "project_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_likes_project_user_idx" ON "project_likes" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_likes_project_idx" ON "project_likes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_likes_user_idx" ON "project_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ticket_embeddings_ticket_idx" ON "ticket_embeddings" USING btree ("ticket_id");