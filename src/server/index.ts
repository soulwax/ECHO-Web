import express from 'express';
import { handlers } from '../auth';

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

    // Type assertion: NextAuth v5 handlers accept standard Request objects
    // The handler type expects NextRequest but standard Request is compatible
    const nextRes = await handler(nextReq as any);
    
    // Convert Next.js Response to Express response
    const bodyText = await nextRes.text();
    res.status(nextRes.status);
    
    // Copy headers, handling Set-Cookie specially
    nextRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        // Set-Cookie headers need special handling
        const cookies = nextRes.headers.getSetCookie();
        cookies.forEach(cookie => {
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});

