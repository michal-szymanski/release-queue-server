CREATE TABLE IF NOT EXISTS "merge_requests" (
	"id" integer PRIMARY KEY NOT NULL,
	"author_id" integer NOT NULL,
	"json" json NOT NULL
);
