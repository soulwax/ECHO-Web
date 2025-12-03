CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `discord_guild` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`iconHash` text,
	`splash` text,
	`discoverySplash` text,
	`ownerId` text NOT NULL,
	`owner` integer DEFAULT false NOT NULL,
	`permissions` text,
	`region` text,
	`afkChannelId` text,
	`afkTimeout` integer,
	`widgetEnabled` integer,
	`widgetChannelId` text,
	`verificationLevel` integer,
	`defaultMessageNotifications` integer,
	`explicitContentFilter` integer,
	`roles` text,
	`emojis` text,
	`features` text,
	`mfaLevel` integer,
	`applicationId` text,
	`systemChannelId` text,
	`systemChannelFlags` integer,
	`rulesChannelId` text,
	`maxMembers` integer,
	`maxPresences` integer,
	`vanityUrlCode` text,
	`description` text,
	`banner` text,
	`premiumTier` integer,
	`premiumSubscriptionCount` integer,
	`preferredLocale` text,
	`publicUpdatesChannelId` text,
	`maxVideoChannelUsers` integer,
	`maxStageVideoChannelUsers` integer,
	`approximateMemberCount` integer,
	`approximatePresenceCount` integer,
	`nsfwLevel` integer,
	`joinedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `discord_user` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`username` text NOT NULL,
	`discriminator` text,
	`globalName` text,
	`avatar` text,
	`bot` integer DEFAULT false NOT NULL,
	`system` integer DEFAULT false NOT NULL,
	`mfaEnabled` integer DEFAULT false NOT NULL,
	`banner` text,
	`accentColor` integer,
	`locale` text,
	`verified` integer DEFAULT false NOT NULL,
	`email` text,
	`flags` integer,
	`premiumType` integer,
	`publicFlags` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discord_user_userId_unique` ON `discord_user` (`userId`);--> statement-breakpoint
CREATE TABLE `guild_member` (
	`id` text PRIMARY KEY NOT NULL,
	`guildId` text NOT NULL,
	`userId` text NOT NULL,
	`nick` text,
	`avatar` text,
	`roles` text DEFAULT '[]' NOT NULL,
	`joinedAt` integer,
	`premiumSince` integer,
	`deaf` integer DEFAULT false NOT NULL,
	`mute` integer DEFAULT false NOT NULL,
	`pending` integer,
	`permissions` text,
	`communicationDisabledUntil` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`guildId`) REFERENCES `discord_guild`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `discord_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
