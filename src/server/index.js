// File: src/server/index.ts
import express from 'express';
import { handlers } from '../auth';
import { db } from '../db';
import { discordGuilds, guildMembers, discordUsers, settings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3123';
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS middleware for development
app.use((req, res, next) => {
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
// NextAuth API routes - match all paths starting with /api/auth/
// Use a regex pattern to match /api/auth and everything after it
app.all(/^\/api\/auth\/.*/, async (req, res) => {
    try {
        const { GET, POST } = handlers;
        const handler = req.method === 'GET' ? GET : POST;
        if (!handler) {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // Build full URL using originalUrl which contains the full path
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
        let body;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            if (req.is('application/json')) {
                body = JSON.stringify(req.body);
            }
            else if (req.is('application/x-www-form-urlencoded')) {
                body = new URLSearchParams(req.body).toString();
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
        nextRes.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') {
                // Set-Cookie headers need special handling
                const cookies = nextRes.headers.getSetCookie();
                cookies.forEach((cookie) => {
                    res.append('Set-Cookie', cookie);
                });
            }
            else {
                res.setHeader(key, value);
            }
        });
        res.send(bodyText);
    }
    catch (error) {
        console.error('Auth handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// API endpoint to get user's Discord guilds
app.get('/api/guilds', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching guilds:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// API endpoint to get guild settings
app.get('/api/guilds/:guildId/settings', async (req, res) => {
    try {
        const { guildId } = req.params;
        // Verify user is authenticated and has access to this guild
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
        const sessionResponse = await handlers.GET(nextReq);
        const sessionText = await sessionResponse.text();
        const session = sessionText ? JSON.parse(sessionText) : null;
        if (!session?.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Verify user is a member of this guild
        const discordUser = await db
            .select()
            .from(discordUsers)
            .where(eq(discordUsers.userId, session.user.id))
            .limit(1);
        if (discordUser.length === 0) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const member = await db
            .select()
            .from(guildMembers)
            .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, discordUser[0].id)))
            .limit(1);
        if (member.length === 0) {
            res.status(403).json({ error: 'You are not a member of this server' });
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
    }
    catch (error) {
        console.error('Error fetching guild settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// API endpoint to update guild settings
app.post('/api/guilds/:guildId/settings', async (req, res) => {
    try {
        const { guildId } = req.params;
        const updates = req.body;
        // Verify user is authenticated and has access to this guild
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
        const sessionResponse = await handlers.GET(nextReq);
        const sessionText = await sessionResponse.text();
        const session = sessionText ? JSON.parse(sessionText) : null;
        if (!session?.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Verify user is a member of this guild
        const discordUser = await db
            .select()
            .from(discordUsers)
            .where(eq(discordUsers.userId, session.user.id))
            .limit(1);
        if (discordUser.length === 0) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const member = await db
            .select()
            .from(guildMembers)
            .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, discordUser[0].id)))
            .limit(1);
        if (member.length === 0) {
            res.status(403).json({ error: 'You are not a member of this server' });
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
    }
    catch (error) {
        console.error('Error updating guild settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`Auth server running on http://localhost:${PORT}`);
});
