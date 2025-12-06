// File: src/server/index.ts

import express from 'express';
import { handlers } from '../auth';
import { db } from '../db';
import { discordGuilds, guildMembers, discordUsers } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for development
app.use((req, res, next): void => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// NextAuth API routes
app.all('/api/auth/*', async (req, res): Promise<void> => {
  try {
    const { GET, POST } = handlers;
    const handler = req.method === 'GET' ? GET : POST;

    if (!handler) {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Build full URL
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    // Convert Express req to Next.js Request
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    });

    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.is('application/json')) {
        body = JSON.stringify(req.body);
      } else if (req.is('application/x-www-form-urlencoded')) {
        body = new URLSearchParams(req.body as Record<string, string>).toString();
      }
    }

    const nextReq = new Request(fullUrl, {
      method: req.method,
      headers,
      body,
    });

    const nextRes = await handler(nextReq);

    // Convert Next.js Response to Express response
    const bodyText = await nextRes.text();
    res.status(nextRes.status);

    // Copy headers, handling Set-Cookie specially
    nextRes.headers.forEach((value: string, key: string) => {
      if (key.toLowerCase() === 'set-cookie') {
        // Set-Cookie headers need special handling
        const cookies = nextRes.headers.getSetCookie();
        cookies.forEach((cookie: string) => {
          res.append('Set-Cookie', cookie);
        });
      } else {
        res.setHeader(key, value);
      }
    });

    res.send(bodyText);
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get user's Discord guilds
app.get('/api/guilds', async (req, res): Promise<void> => {
  try {
    // Convert Express req to Next.js Request for auth()
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';
    const fullUrl = `${protocol}://${host}/api/auth/session`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    });

    const nextReq = new Request(fullUrl, {
      method: 'GET',
      headers,
    });

    // Get session from NextAuth
    const sessionResponse = await handlers.GET(nextReq);
    const sessionText = await sessionResponse.text();
    const session = sessionText ? JSON.parse(sessionText) : null;
    
    if (!session?.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get Discord user ID
    const discordUser = await db
      .select()
      .from(discordUsers)
      .where(eq(discordUsers.userId, session.user.id))
      .limit(1);

    if (discordUser.length === 0) {
      res.json({ guilds: [] });
      return;
    }

    const discordUserId = discordUser[0].id;

    // Get all guilds the user is a member of
    const userGuilds = await db
      .select({
        id: discordGuilds.id,
        name: discordGuilds.name,
        icon: discordGuilds.icon,
        permissions: guildMembers.permissions,
      })
      .from(guildMembers)
      .innerJoin(discordGuilds, eq(guildMembers.guildId, discordGuilds.id))
      .where(eq(guildMembers.userId, discordUserId));

    res.json({ guilds: userGuilds });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint that proxies to the bot's health server
app.get('/api/health', async (_req, res): Promise<void> => {
  try {
    // Get bot health server URL from environment variables
    const botHealthPort = process.env.BOT_HEALTH_PORT || '3002';
    const botHealthUrl = process.env.BOT_HEALTH_URL || `http://localhost:${botHealthPort}`;
    
    const response = await fetch(`${botHealthUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Bot health server returned ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching bot health:', error);
    // Return error status instead of throwing
    res.status(503).json({
      status: 'error',
      ready: false,
      error: 'Bot health server unavailable',
    });
  }
});

// Legacy health endpoint for web server itself
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
