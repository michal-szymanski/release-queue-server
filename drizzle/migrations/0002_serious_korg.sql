CREATE TABLE IF NOT EXISTS "pipelines" (
	"id" integer PRIMARY KEY NOT NULL,
	"commit_id" integer NOT NULL,
	"json" json NOT NULL
);
