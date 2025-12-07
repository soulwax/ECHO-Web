// File: src/server/index.ts

import express from "express";
import { handlers } from "../auth";
import { db } from "../db";
import {
  discordGuilds,
  guildMembers,
  discordUsers,
  settings,
} from "../db/schema";
import { eq, and } from "drizzle-orm";

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.NEXTAUTH_URL || "http://localhost:3001";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for development
app.use((req, res, next): void => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// NextAuth API routes - match all paths starting with /api/auth/
// Use a regex pattern to match /api/auth and everything after it
app.all(/^\/api\/auth\/.*/, async (req, res): Promise<void> => {
  try {
    const { GET, POST } = handlers;
    const handler = req.method === "GET" ? GET : POST;

    if (!handler) {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Build full URL using originalUrl which contains the full path
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    // Convert Express req to Next.js Request
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    });

    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.is("application/json")) {
        body = JSON.stringify(req.body);
      } else if (req.is("application/x-www-form-urlencoded")) {
        body = new URLSearchParams(
          req.body as Record<string, string>
        ).toString();
      }
    }

    const nextReq = new Request(fullUrl, {
      method: req.method,
      headers,
      body,
    }) as Parameters<typeof handler>[0];

    const nextRes = await handler(nextReq);

    // Convert Next.js Response to Express response
    const bodyText = await nextRes.text();
    res.status(nextRes.status);

    // Copy headers, handling Set-Cookie specially
    nextRes.headers.forEach((value: string, key: string) => {
      if (key.toLowerCase() === "set-cookie") {
        // Set-Cookie headers need special handling
        const cookies = nextRes.headers.getSetCookie();
        cookies.forEach((cookie: string) => {
          res.append("Set-Cookie", cookie);
        });
      } else {
        res.setHeader(key, value);
      }
    });

    res.send(bodyText);
  } catch (error) {
    console.error("Auth handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to get user's Discord guilds
app.get("/api/guilds", async (req, res): Promise<void> => {
  try {
    // Convert Express req to Next.js Request for auth()
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const fullUrl = `${protocol}://${host}/api/auth/session`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    });

    const nextReq = new Request(fullUrl, {
      method: "GET",
      headers,
    }) as Parameters<typeof handlers.GET>[0];

    // Get session from NextAuth
    const sessionResponse = await handlers.GET(nextReq);
    const sessionText = await sessionResponse.text();
    const session = sessionText ? JSON.parse(sessionText) : null;

    if (!session?.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
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
    console.error("Error fetching guilds:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to get guild settings
app.get("/api/guilds/:guildId/settings", async (req, res): Promise<void> => {
  try {
    const { guildId } = req.params;

    // Verify user is authenticated and has access to this guild
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const fullUrl = `${protocol}://${host}/api/auth/session`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    });

    const nextReq = new Request(fullUrl, {
      method: "GET",
      headers,
    }) as Parameters<typeof handlers.GET>[0];

    const sessionResponse = await handlers.GET(nextReq);
    const sessionText = await sessionResponse.text();
    const session = sessionText ? JSON.parse(sessionText) : null;

    if (!session?.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Verify user is a member of this guild
    const discordUser = await db
      .select()
      .from(discordUsers)
      .where(eq(discordUsers.userId, session.user.id))
      .limit(1);

    if (discordUser.length === 0) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const member = await db
      .select()
      .from(guildMembers)
      .where(
        and(
          eq(guildMembers.guildId, guildId),
          eq(guildMembers.userId, discordUser[0].id)
        )
      )
      .limit(1);

    if (member.length === 0) {
      res.status(403).json({ error: "You are not a member of this server" });
      return;
    }

    // Get or create default settings
    let guildSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.guildId, guildId))
      .limit(1);

    if (guildSettings.length === 0) {
      // Create default settings
      await db.insert(settings).values({
        guildId,
      });
      guildSettings = await db
        .select()
        .from(settings)
        .where(eq(settings.guildId, guildId))
        .limit(1);
    }

    res.json({ settings: guildSettings[0] });
  } catch (error) {
    console.error("Error fetching guild settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to update guild settings
app.post("/api/guilds/:guildId/settings", async (req, res): Promise<void> => {
  try {
    const { guildId } = req.params;
    const updates = req.body;

    // Verify user is authenticated and has access to this guild
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3001";
    const fullUrl = `${protocol}://${host}/api/auth/session`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    });

    const nextReq = new Request(fullUrl, {
      method: "GET",
      headers,
    }) as Parameters<typeof handlers.GET>[0];

    const sessionResponse = await handlers.GET(nextReq);
    const sessionText = await sessionResponse.text();
    const session = sessionText ? JSON.parse(sessionText) : null;

    if (!session?.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Verify user is a member of this guild
    const discordUser = await db
      .select()
      .from(discordUsers)
      .where(eq(discordUsers.userId, session.user.id))
      .limit(1);

    if (discordUser.length === 0) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const member = await db
      .select()
      .from(guildMembers)
      .where(
        and(
          eq(guildMembers.guildId, guildId),
          eq(guildMembers.userId, discordUser[0].id)
        )
      )
      .limit(1);

    if (member.length === 0) {
      res.status(403).json({ error: "You are not a member of this server" });
      return;
    }

    // Check if settings exist, create if not
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.guildId, guildId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(settings).values({ guildId });
    }

    // Update settings
    await db
      .update(settings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(settings.guildId, guildId));

    // Return updated settings
    const updated = await db
      .select()
      .from(settings)
      .where(eq(settings.guildId, guildId))
      .limit(1);

    res.json({ settings: updated[0] });
  } catch (error) {
    console.error("Error updating guild settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint - proxies to the bot's health server
app.get("/api/health", async (_req, res): Promise<void> => {
  try {
    const botHealthUrl = process.env.BOT_HEALTH_URL || "http://localhost:3002";
    const response = await fetch(`${botHealthUrl}/health`);

    if (!response.ok) {
      res.status(response.status).json({
        status: "error",
        ready: false,
        error: `Bot health check failed with status ${response.status}`
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error checking bot health:", error);
    res.status(503).json({
      status: "error",
      ready: false,
      error: "Unable to connect to bot health server"
    });
  }
});

// Web server health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Dynamic meta tags for search results (for Discord/social media previews)
// This route serves HTML with Open Graph meta tags when bots request search pages
app.get('/', async (req, res): Promise<void> => {
  const query = req.query.q as string | undefined;
  const userAgent = req.get('user-agent');
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:3001';
  const baseUrl = `${protocol}://${host}`;
  
  // Check if this is a bot/crawler request
  const isBotRequest = userAgent && (
    userAgent.toLowerCase().includes('bot') ||
    userAgent.toLowerCase().includes('crawler') ||
    userAgent.toLowerCase().includes('spider') ||
    userAgent.toLowerCase().includes('facebookexternalhit') ||
    userAgent.toLowerCase().includes('twitterbot') ||
    userAgent.toLowerCase().includes('discordbot') ||
    userAgent.toLowerCase().includes('slackbot') ||
    userAgent.toLowerCase().includes('whatsapp') ||
    userAgent.toLowerCase().includes('telegram')
  );
  
  // Only serve meta tags HTML to bots, otherwise let the React app handle it
  if (!isBotRequest || !query) {
    // For regular users or no query, serve the normal React app
    // In production, you'd serve the built index.html here
    res.redirect(`${baseUrl}?q=${encodeURIComponent(query || '')}`);
    return;
  }
  
  // For bots with a search query, fetch the first result and serve meta tags
  try {
    // TODO: Replace with your actual Starchild Music API endpoint
    const apiUrl = process.env.STARCHILD_API_URL || 'https://api.starchildmusic.com';
    const searchResponse = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}&limit=1`);
    
    let result: {
      title: string;
      artist?: string;
      album?: string;
      description?: string;
      image?: string;
      url?: string;
    } | null = null;
    
    if (searchResponse.ok) {
      const data = await searchResponse.json();
      // Adjust based on your API response structure
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        result = {
          title: firstResult.title || firstResult.name || 'Unknown',
          artist: firstResult.artist || firstResult.artistName,
          album: firstResult.album || firstResult.albumName,
          description: firstResult.description || `${firstResult.artist || ''} - ${firstResult.title || ''}`.trim(),
          image: firstResult.image || firstResult.thumbnail || firstResult.coverArt,
          url: firstResult.url || firstResult.id,
        };
      }
    }
    
    // Generate meta tags HTML
    const siteName = 'Starchild Music Stream';
    const defaultDescription = 'Modern music streaming and discovery platform with smart recommendations';
    
    let title: string;
    let description: string;
    let image: string;
    let url: string;
    
    if (result) {
      title = result.artist 
        ? `${result.title} by ${result.artist}`
        : result.title;
      description = result.description || 
        `${result.artist || ''}${result.album ? ` - ${result.album}` : ''}`.trim() ||
        defaultDescription;
      image = result.image || `${baseUrl}/default-album-art.jpg`;
      url = result.url ? `${baseUrl}/track/${result.url}` : `${baseUrl}?q=${encodeURIComponent(query)}`;
    } else {
      title = `${siteName} - Search: ${query}`;
      description = defaultDescription;
      image = `${baseUrl}/default-album-art.jpg`;
      url = `${baseUrl}?q=${encodeURIComponent(query)}`;
    }
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${siteName}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${result ? 'music.song' : 'website'}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="${siteName}">
  ${result?.artist ? `<meta property="music:musician" content="${result.artist}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  
  <script>
    // Redirect to the actual app
    window.location.href = '${baseUrl}?q=${encodeURIComponent(query)}';
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating meta tags:', error);
    // Fallback: serve default meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starchild Music Stream - Search: ${query}</title>
  <meta name="description" content="Modern music streaming and discovery platform with smart recommendations">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}?q=${encodeURIComponent(query)}">
  <meta property="og:title" content="Starchild Music Stream - Search: ${query}">
  <meta property="og:description" content="Modern music streaming and discovery platform with smart recommendations">
  <script>
    window.location.href = '${baseUrl}?q=${encodeURIComponent(query)}';
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
