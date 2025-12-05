// File: src/auth/config.ts
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Discord from 'next-auth/providers/discord';
import { db } from '../db';
import { discordUsers, discordGuilds, guildMembers } from '../db/schema';
import { eq } from 'drizzle-orm';
export const authConfig = {
    adapter: DrizzleAdapter(db),
    trustHost: true, // Required for NextAuth v5 when not using Next.js
    basePath: '/api/auth', // Set the base path for auth routes
    providers: [
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: 'identify email guilds',
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'discord' && account.access_token && profile && user.id) {
                try {
                    // Save or update Discord user data
                    const discordUserData = {
                        id: profile.id,
                        userId: user.id,
                        username: (profile.username || profile.name || 'Unknown'),
                        discriminator: profile.discriminator || null,
                        globalName: profile.global_name || null,
                        avatar: profile.avatar || null,
                        bot: false,
                        system: false,
                        mfaEnabled: false,
                        verified: false,
                        updatedAt: new Date(),
                    };
                    await db
                        .insert(discordUsers)
                        .values(discordUserData)
                        .onConflictDoUpdate({
                        target: discordUsers.id,
                        set: {
                            username: discordUserData.username,
                            globalName: discordUserData.globalName,
                            avatar: discordUserData.avatar,
                            updatedAt: discordUserData.updatedAt,
                        },
                    });
                    // Fetch and save user's guilds
                    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                        headers: {
                            Authorization: `Bearer ${account.access_token}`,
                        },
                    });
                    if (guildsResponse.ok) {
                        const guilds = await guildsResponse.json();
                        const discordUserId = profile.id;
                        for (const guild of guilds) {
                            // Save or update guild
                            const guildData = {
                                id: guild.id,
                                name: guild.name,
                                icon: guild.icon || null,
                                ownerId: guild.owner_id || '',
                                owner: guild.owner || false,
                                permissions: guild.permissions?.toString() || null,
                                updatedAt: new Date(),
                            };
                            await db
                                .insert(discordGuilds)
                                .values(guildData)
                                .onConflictDoUpdate({
                                target: discordGuilds.id,
                                set: {
                                    name: guildData.name,
                                    icon: guildData.icon,
                                    permissions: guildData.permissions,
                                    updatedAt: guildData.updatedAt,
                                },
                            });
                            // Create or update guild member relationship
                            const memberId = `${guild.id}_${discordUserId}`;
                            await db
                                .insert(guildMembers)
                                .values({
                                id: memberId,
                                guildId: guild.id,
                                userId: discordUserId,
                                permissions: guild.permissions?.toString() || null,
                                updatedAt: new Date(),
                            })
                                .onConflictDoUpdate({
                                target: guildMembers.id,
                                set: {
                                    permissions: guild.permissions?.toString() || null,
                                    updatedAt: new Date(),
                                },
                            });
                        }
                    }
                }
                catch (error) {
                    console.error('Error saving Discord data:', error);
                    // Don't block sign-in if guild fetching fails
                }
            }
            return true;
        },
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Get Discord ID from discordUsers table
                const discordUser = await db
                    .select()
                    .from(discordUsers)
                    .where(eq(discordUsers.userId, user.id))
                    .limit(1);
                if (discordUser.length > 0) {
                    session.user.discordId = discordUser[0].id;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: 'database',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
