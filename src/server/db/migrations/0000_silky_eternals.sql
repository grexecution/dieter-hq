CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`type` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
