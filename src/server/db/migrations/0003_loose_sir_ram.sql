CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`all_day` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`channel` text NOT NULL,
	`target` text NOT NULL,
	`text` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`sent_at` integer
);
