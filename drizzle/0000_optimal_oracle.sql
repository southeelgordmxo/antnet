CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sources` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tokens` integer NOT NULL,
	`ant_id` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_url_unique` ON `documents` (`url`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`ant_id` text NOT NULL,
	`status` text NOT NULL,
	`pages` integer DEFAULT 0 NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
