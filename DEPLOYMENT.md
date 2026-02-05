# Dieter HQ - Deployment Guide

**Version:** 0.1.0 (MVP)  
**Last Updated:** February 5, 2026

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Vercel Deployment](#vercel-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Configuration](#configuration)
7. [Database Setup](#database-setup)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js:** 22.x LTS or later
- **npm:** 10.x or later
- **Git:** 2.x or later

### Accounts & Services

- **Vercel Account** (recommended for production)
- **GitHub Repository** access
- **Domain** (optional, for custom domains)

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/grexecution/dieter-hq.git
cd dieter-hq
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Database (SQLite for MVP - path relative to project root)
DATABASE_URL=./your_database.sqlite

# Authentication
HQ_SECRET_KEY=your-secure-secret-key-min-32-chars

# Optional: OpenClaw Integration
OPENCLAW_GATEWAY_URL=http://localhost:3030
OPENCLAW_API_KEY=your-api-key

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

---

## Local Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run Playwright tests |
| `npm run format` | Format code with Prettier |

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate database schema |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio (GUI) |

---

## Vercel Deployment

### Automatic Deployment (Recommended)

1. **Connect Repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project settings

2. **Configure GitHub Secrets:**
   
   Go to your GitHub repo → Settings → Secrets → Actions and add:
   
   | Secret | Description |
   |--------|-------------|
   | `VERCEL_TOKEN` | Your Vercel API token |
   | `VERCEL_ORG_ID` | Your Vercel organization ID |
   | `VERCEL_PROJECT_ID` | Your Vercel project ID |

3. **Add Environment Variables in Vercel:**
   
   Go to Project Settings → Environment Variables and add:
   
   - `DATABASE_URL`
   - `HQ_SECRET_KEY`
   - Any other environment-specific variables

4. **Deploy:**
   
   Push to `main` branch to trigger automatic deployment:
   
   ```bash
   git push origin main
   ```

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration

The project includes `vercel.json` with optimized settings:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 30
    }
  }
}
```

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t dieter-hq .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=/app/data/db.sqlite \
  -e HQ_SECRET_KEY=your-secret-key \
  -v $(pwd)/data:/app/data \
  dieter-hq
```

### Docker Compose

```bash
docker-compose up -d
```

The `docker-compose.yml` includes:
- Production-ready Next.js container
- Persistent volume for database
- Health checks
- Auto-restart policy

---

## Configuration

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path |
| `HQ_SECRET_KEY` | Yes | 32+ char secret for auth |
| `NODE_ENV` | No | `development` or `production` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_GATEWAY_URL` | - | OpenClaw gateway URL |
| `OPENCLAW_API_KEY` | - | OpenClaw API key |
| `NEXT_PUBLIC_ANALYTICS_ID` | - | Analytics tracking ID |
| `LOG_LEVEL` | `info` | Logging verbosity |

### Feature Flags

Feature flags can be set via environment variables:

```env
FEATURE_AI_ROUTING=true
FEATURE_PWA=true
FEATURE_OFFLINE_MODE=true
```

---

## Database Setup

### SQLite (MVP Default)

SQLite is used for the MVP for simplicity. The database file will be created automatically.

```bash
# Initialize database
npm run db:generate
npm run db:migrate
```

### Database Location

- **Development:** `./your_database.sqlite`
- **Production:** Configure via `DATABASE_URL`

### Backup

```bash
# Create backup
cp your_database.sqlite your_database.sqlite.backup

# Restore
cp your_database.sqlite.backup your_database.sqlite
```

---

## Post-Deployment Checklist

### Security

- [ ] Generate strong `HQ_SECRET_KEY` (min 32 characters)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Configure CSP headers (included in `next.config.ts`)
- [ ] Review CORS settings
- [ ] Set up rate limiting (included in middleware)

### Performance

- [ ] Verify build output size
- [ ] Check Lighthouse score (target: 90+)
- [ ] Enable compression (automatic on Vercel)
- [ ] Configure CDN caching

### Monitoring

- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure analytics
- [ ] Set up uptime monitoring
- [ ] Enable Vercel Analytics (if using Vercel)

### Testing

- [ ] Run E2E tests on staging
- [ ] Verify all API routes
- [ ] Test PWA installation
- [ ] Verify offline functionality

---

## Monitoring & Maintenance

### Health Check

The `/api/health` endpoint returns system status:

```bash
curl https://your-domain.vercel.app/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T00:00:00.000Z",
  "version": "0.1.0"
}
```

### Logs

**Vercel:**
- Access logs in Vercel Dashboard → Project → Logs
- Filter by function, status code, or time range

**Docker:**
```bash
docker logs dieter-hq
docker logs -f dieter-hq  # Follow logs
```

### Updates

1. Create a new branch for updates
2. Make changes and test locally
3. Open a PR to `main`
4. Merge triggers automatic deployment

---

## Troubleshooting

### Build Failures

**Issue:** TypeScript errors during build

```bash
# Check for type errors
npm run type-check

# Common fix: Update dependencies
npm update
```

**Issue:** Missing dependencies

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Issue:** Database connection failed

- Verify `DATABASE_URL` is correct
- Check file permissions for SQLite
- Ensure database directory exists

**Issue:** API routes returning 500

- Check Vercel function logs
- Verify environment variables are set
- Check for missing secrets

### PWA Issues

**Issue:** Service worker not registering

- Clear browser cache
- Check HTTPS (required for SW)
- Verify `/sw.js` is accessible

**Issue:** App not installable

- Check manifest at `/manifest.webmanifest`
- Verify icons are accessible
- Check browser console for errors

### Performance Issues

**Issue:** Slow initial load

```bash
# Analyze bundle
npm run build
# Check .next/analyze/client.html
```

**Issue:** High memory usage

- Review API route complexity
- Check for memory leaks in components
- Enable edge runtime for APIs

---

## Support

- **Documentation:** This file and inline code comments
- **Issues:** GitHub Issues
- **Security:** Report to security contact

---

## Quick Start Summary

```bash
# 1. Clone and install
git clone https://github.com/grexecution/dieter-hq.git
cd dieter-hq
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Initialize database
npm run db:generate
npm run db:migrate

# 4. Start development
npm run dev

# 5. Deploy to production
git push origin main  # Triggers Vercel deployment
```

---

**Happy deploying! 🚀**
