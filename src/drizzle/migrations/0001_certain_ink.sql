CREATE TABLE IF NOT EXISTS "queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"merge_request_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "queue" ADD CONSTRAINT "queue_merge_request_id_merge_requests_id_fk" FOREIGN KEY ("merge_request_id") REFERENCES "merge_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
