CREATE TABLE `artefacts` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`storage_path` text NOT NULL,
	`created_at` integer NOT NULL
);
