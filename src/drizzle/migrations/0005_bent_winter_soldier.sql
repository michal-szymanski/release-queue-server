CREATE TABLE IF NOT EXISTS "jobs" (
	"id" integer PRIMARY KEY NOT NULL,
	"pipeline_id" integer NOT NULL,
	"json" json NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
