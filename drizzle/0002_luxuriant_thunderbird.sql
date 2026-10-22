CREATE TABLE `retrieval_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `knowledge_records` ADD `category` text DEFAULT 'faq' NOT NULL;--> statement-breakpoint
ALTER TABLE `knowledge_records` ADD `expires_at` text;