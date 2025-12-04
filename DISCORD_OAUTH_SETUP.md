# Discord OAuth Setup Guide

## Required Environment Variables

You need the following environment variables in your `.env` file:

### From Discord Developer Portal

1. **`DISCORD_CLIENT_ID`** (Required)
   - Get this from: [Discord Developer Portal](https://discord.com/developers/applications)
   - Navigate to: Your Application → OAuth2 → Client ID
   - This is your application's public identifier

2. **`DISCORD_CLIENT_SECRET`** (Required)
   - Get this from: [Discord Developer Portal](https://discord.com/developers/applications)
   - Navigate to: Your Application → OAuth2 → Client Secret
   - Click "Reset Secret" if you need to generate a new one
   - ⚠️ **Keep this secret! Never commit it to version control**

### Other Required Variables

3. **`NEXTAUTH_SECRET`** (Required)
   - Generate with: `openssl rand -base64 32`
   - Used to encrypt session tokens
   - Should be a random string, at least 32 characters

4. **`DATABASE_URL`** (Required)
   - Default: `./data/db.sqlite` (for SQLite)
   - Or use a full database URL for PostgreSQL/MySQL
   - Example: `postgresql://user:password@localhost:5432/dbname`

### Optional Environment Variables

5. **`NEXTAUTH_URL`** (Optional)
   - Default: `http://localhost:3123` (development)
   - Production: Your full domain URL (e.g., `https://yourdomain.com`)
   - Used for generating OAuth callback URLs

6. **`PORT`** (Optional)
   - Default: `3001` (for auth server)
   - Port where the auth server runs

7. **`VITE_AUTH_API_URL`** (Optional)
   - Default: `http://localhost:3001` (development)
   - Custom auth server URL for the frontend
   - Only needed if your auth server is on a different host/port

## Discord Redirect URIs Configuration

In the Discord Developer Portal, you need to add the following redirect URIs:

### Development

```
http://localhost:3001/api/auth/callback/discord
```

**OR** (if using Vite proxy):

```
http://localhost:3123/api/auth/callback/discord
```

### Production

```
https://yourdomain.com/api/auth/callback/discord
```

### How to Add Redirect URIs

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Navigate to **OAuth2** → **General**
4. Scroll down to **Redirects**
5. Click **Add Redirect**
6. Enter the callback URL: `http://localhost:3001/api/auth/callback/discord`
7. Click **Save Changes**

## OAuth Scopes

The application requests these Discord OAuth scopes:

- `identify` - Get user's basic information (username, avatar, etc.)
- `email` - Get user's email address
- `guilds` - Get list of Discord servers the user is in

These are configured in `src/auth/config.ts` and can be modified if needed.

## Available Auth Routes

The following routes are available on your auth server (port 3001):

### Authentication Routes

- `GET /api/auth/signin/discord` - Initiates Discord OAuth login
- `GET /api/auth/callback/discord` - Discord OAuth callback (handled automatically)
- `POST /api/auth/signout` - Logs out the current user
- `GET /api/auth/session` - Gets the current user session

### Other Routes

- `GET /health` - Health check endpoint

## Example .env File

```env
# Discord OAuth
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# NextAuth
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3123

# Database
DATABASE_URL=./data/db.sqlite

# Optional
PORT=3001
VITE_AUTH_API_URL=http://localhost:3001
```

## Testing the Setup

1. Make sure both servers are running:

   ```bash
   # Terminal 1: Auth server
   npm run dev:auth
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. Visit `http://localhost:3123` and click "Login with Discord"

3. You should be redirected to Discord's authorization page

4. After authorizing, you'll be redirected back to your app

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Make sure the redirect URI in Discord matches exactly: `http://localhost:3001/api/auth/callback/discord`
   - Check for typos, trailing slashes, or protocol mismatches

2. **"Invalid client secret"**
   - Verify `DISCORD_CLIENT_SECRET` in your `.env` file
   - Make sure there are no extra spaces or quotes
   - Try resetting the secret in Discord Developer Portal

3. **"Missing NEXTAUTH_SECRET"**
   - Generate a new secret: `openssl rand -base64 32`
   - Add it to your `.env` file

4. **CORS errors**
   - Make sure `NEXTAUTH_URL` matches your frontend URL
   - Check that the auth server is running on port 3001
