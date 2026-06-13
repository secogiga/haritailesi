CREATE TABLE "newsletter_growth_snapshots" (
	"date" date PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
