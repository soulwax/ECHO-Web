// File: src/db/schema.ts

import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// NextAuth required tables
export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  emailVerified: integer('emailVerified', { mode: 'timestamp' }),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable('account', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// Discord-specific tables
export const discordUsers = sqliteTable('discord_user', {
  id: text('id').primaryKey(), // Discord user ID
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(), // Link to NextAuth user
  username: text('username').notNull(),
  discriminator: text('discriminator'), // Legacy discriminator (may be null for new users)
  globalName: text('globalName'), // New username system
  avatar: text('avatar'),
  bot: integer('bot', { mode: 'boolean' }).notNull().default(false),
  system: integer('system', { mode: 'boolean' }).notNull().default(false),
  mfaEnabled: integer('mfaEnabled', { mode: 'boolean' }).notNull().default(false),
  banner: text('banner'),
  accentColor: integer('accentColor'),
  locale: text('locale'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  email: text('email'),
  flags: integer('flags'),
  premiumType: integer('premiumType'),
  publicFlags: integer('publicFlags'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const discordGuilds = sqliteTable('discord_guild', {
  id: text('id').primaryKey(), // Discord guild ID
  name: text('name').notNull(),
  icon: text('icon'),
  iconHash: text('iconHash'),
  splash: text('splash'),
  discoverySplash: text('discoverySplash'),
  ownerId: text('ownerId').notNull(), // Discord user ID of owner
  owner: integer('owner', { mode: 'boolean' }).notNull().default(false), // Whether the bot is the owner
  permissions: text('permissions'), // Bitwise permissions as string
  region: text('region'),
  afkChannelId: text('afkChannelId'),
  afkTimeout: integer('afkTimeout'),
  widgetEnabled: integer('widgetEnabled', { mode: 'boolean' }),
  widgetChannelId: text('widgetChannelId'),
  verificationLevel: integer('verificationLevel'),
  defaultMessageNotifications: integer('defaultMessageNotifications'),
  explicitContentFilter: integer('explicitContentFilter'),
  roles: text('roles'), // JSON array of role IDs
  emojis: text('emojis'), // JSON array of emoji data
  features: text('features'), // JSON array of guild features
  mfaLevel: integer('mfaLevel'),
  applicationId: text('applicationId'),
  systemChannelId: text('systemChannelId'),
  systemChannelFlags: integer('systemChannelFlags'),
  rulesChannelId: text('rulesChannelId'),
  maxMembers: integer('maxMembers'),
  maxPresences: integer('maxPresences'),
  vanityUrlCode: text('vanityUrlCode'),
  description: text('description'),
  banner: text('banner'),
  premiumTier: integer('premiumTier'),
  premiumSubscriptionCount: integer('premiumSubscriptionCount'),
  preferredLocale: text('preferredLocale'),
  publicUpdatesChannelId: text('publicUpdatesChannelId'),
  maxVideoChannelUsers: integer('maxVideoChannelUsers'),
  maxStageVideoChannelUsers: integer('maxStageVideoChannelUsers'),
  approximateMemberCount: integer('approximateMemberCount'),
  approximatePresenceCount: integer('approximatePresenceCount'),
  nsfwLevel: integer('nsfwLevel'),
  joinedAt: integer('joinedAt', { mode: 'timestamp' }), // When bot joined
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Guild members (users in guilds)
export const guildMembers = sqliteTable('guild_member', {
  id: text('id').primaryKey(), // Composite: guildId_userId
  guildId: text('guildId')
    .notNull()
    .references(() => discordGuilds.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => discordUsers.id, { onDelete: 'cascade' }),
  nick: text('nick'),
  avatar: text('avatar'),
  roles: text('roles').notNull().default('[]'), // JSON array of role IDs
  joinedAt: integer('joinedAt', { mode: 'timestamp' }),
  premiumSince: integer('premiumSince', { mode: 'timestamp' }),
  deaf: integer('deaf', { mode: 'boolean' }).notNull().default(false),
  mute: integer('mute', { mode: 'boolean' }).notNull().default(false),
  pending: integer('pending', { mode: 'boolean' }),
  permissions: text('permissions'), // Computed permissions as string
  communicationDisabledUntil: integer('communicationDisabledUntil', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  discordUser: one(discordUsers),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const discordUsersRelations = relations(discordUsers, ({ one, many }) => ({
  user: one(users, { fields: [discordUsers.userId], references: [users.id] }),
  guildMembers: many(guildMembers),
}));

export const discordGuildsRelations = relations(discordGuilds, ({ many }) => ({
  members: many(guildMembers),
}));

export const guildMembersRelations = relations(guildMembers, ({ one }) => ({
  guild: one(discordGuilds, { fields: [guildMembers.guildId], references: [discordGuilds.id] }),
  user: one(discordUsers, { fields: [guildMembers.userId], references: [discordUsers.id] }),
}));
