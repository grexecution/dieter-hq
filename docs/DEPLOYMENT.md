# Deployment Guide

This guide covers deploying Dieter HQ to various platforms.

## Table of Contents

- [Vercel (Recommended)](#vercel-recommended)
- [Self-Hosted](#self-hosted)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)

## Vercel (Recommended)

Vercel provides the best Next.js deployment experience with zero configuration.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/grexecution/dieter-hq)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### GitHub Integration

For automatic deployments on every push:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy!

**Required Secrets for GitHub Actions:**

```bash
# Get these from Vercel dashboard
VERCEL_TOKEN=your_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID=your_project_id_here
```

Add these to your GitHub repository secrets:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

## Self-Hosted

### Requirements

- Node.js 22+
- npm 10+
- PM2 or similar process manager

### Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

   Or with PM2:
   ```bash
   pm2 start npm --name "dieter-hq" -- start
   ```

3. **Configure reverse proxy (Nginx example)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable HTTPS with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Docker

### Build Image

```bash
docker build -t dieter-hq .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  dieter-hq
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Environment Variables

### Production Environment Variables

Create a `.env.production` file:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Dieter HQ

# Database
DATABASE_URL=file:./data/sqlite.db

# Add your production secrets here
```

### Vercel Environment Variables

Set these in the Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development

**Required Variables:**
- `NODE_ENV`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL` (if using external DB)

## Database Setup

### SQLite (Default)

The default setup uses SQLite which works great for personal use:

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate
```

### PostgreSQL (Recommended for Production)

For production at scale, consider PostgreSQL:

1. **Update DATABASE_URL**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

2. **Update Drizzle config**
   ```typescript
   // drizzle.config.ts
   import { defineConfig } from 'drizzle-kit';

   export default defineConfig({
     schema: './src/server/db/schema.ts',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: {
       url: process.env.DATABASE_URL!,
     },
   });
   ```

3. **Install PostgreSQL driver**
   ```bash
   npm install pg
   ```

## Health Checks

Add a health check endpoint for monitoring:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
```

Test it:
```bash
curl https://yourdomain.com/api/health
```

## Monitoring

### Vercel Analytics

Enable in `vercel.json`:
```json
{
  "analytics": {
    "enable": true
  }
}
```

### Custom Monitoring

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Datadog** for infrastructure monitoring

## Rollback Strategy

### Vercel

Vercel keeps deployment history. To rollback:

1. Go to Deployments in Vercel dashboard
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Self-Hosted

Use PM2 or keep Git tags:

```bash
# Tag releases
git tag -a v1.0.0 -m "Release 1.0.0"
git push --tags

# Rollback to tag
git checkout v1.0.0
npm run build
pm2 restart dieter-hq
```

## Performance Optimization

### Enable Edge Functions

For global performance, use Edge Runtime where possible:

```typescript
export const runtime = 'edge';
```

### Enable ISR (Incremental Static Regeneration)

```typescript
export const revalidate = 3600; // Revalidate every hour
```

### CDN Configuration

Static assets are automatically optimized on Vercel. For self-hosted:

- Use CloudFront or Cloudflare
- Configure caching headers
- Enable gzip/brotli compression

## Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Migration Issues

```bash
# Reset database (development only!)
rm -rf data/*.db
npm run db:generate
npm run db:migrate
```

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Security Checklist

Before going to production:

- [ ] All environment variables are set
- [ ] HTTPS is configured
- [ ] Security headers are enabled
- [ ] Database credentials are secure
- [ ] API keys are not in code
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Dependencies are up to date
- [ ] `npm audit` shows no high/critical issues

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Open an issue on GitHub
- Contact support

---

Happy deploying! 🚀
