import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Discord from 'next-auth/providers/discord';
import type { DefaultSession, NextAuthConfig } from 'next-auth';
import { db } from '../db';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      discordId?: string;
    } & DefaultSession['user'];
  }
}

export const authConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // You can add Discord ID lookup here if needed
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
} satisfies NextAuthConfig;

