# Architecture Documentation

This document describes the architecture and design decisions for Dieter HQ.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

## Overview

Dieter HQ is built as a modern, enterprise-grade web application using Next.js 16 with the App Router. It follows a modular architecture with clear separation of concerns.

### Key Principles

1. **Type Safety**: Everything is typed with TypeScript in strict mode
2. **Security First**: Multiple layers of security controls
3. **Developer Experience**: Fast feedback loops and great tooling
4. **Maintainability**: Clean code, good documentation, comprehensive tests
5. **Performance**: Optimized for speed and efficiency

## Tech Stack

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React hooks + Context API
- **Forms**: React Hook Form + Zod (planned)
- **Animation**: Framer Motion

### Backend

- **Runtime**: Node.js 22
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Drizzle ORM
- **API**: Next.js API Routes
- **File Upload**: Uppy

### DevOps

- **Deployment**: Vercel / Docker
- **CI/CD**: GitHub Actions
- **Testing**: Playwright
- **Monitoring**: Vercel Analytics (+ custom logging)

## Project Structure

```
dieter-hq/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (routes)/          # Route groups
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── error-boundary.tsx # Error handling
│   │   └── ...                # Custom components
│   │
│   ├── lib/                   # Utilities and helpers
│   │   ├── env.ts            # Environment validation
│   │   ├── logger.ts         # Structured logging
│   │   ├── security.ts       # Security utilities
│   │   ├── api-error.ts      # API error handling
│   │   └── utils.ts          # General utilities
│   │
│   ├── server/                # Server-side code
│   │   ├── db/               # Database schemas
│   │   └── services/         # Business logic
│   │
│   ├── types/                 # TypeScript types
│   │   └── index.ts          # Global types
│   │
│   └── middleware.ts          # Next.js middleware
│
├── tests/
│   └── e2e/                   # Playwright tests
│
├── public/                    # Static assets
├── docs/                      # Documentation
└── scripts/                   # Build and utility scripts
```

### Directory Responsibilities

- **app/**: Next.js routing and pages (file-system based routing)
- **components/**: Reusable React components
- **lib/**: Pure functions and utilities
- **server/**: Server-only code (database, business logic)
- **types/**: Shared TypeScript type definitions

## Design Patterns

### 1. Error Boundaries

React Error Boundaries catch runtime errors and display fallback UI:

```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### 2. API Error Handling

Consistent error handling across all API routes:

```typescript
export const GET = withErrorHandler(async (req) => {
  if (!authorized) {
    throw ApiErrors.Unauthorized();
  }
  // ...
});
```

### 3. Type-Safe Environment Variables

Centralized environment configuration with validation:

```typescript
import { env } from '@/lib/env';
// env.NEXT_PUBLIC_APP_URL is typed and validated
```

### 4. Composition over Inheritance

Components use composition for flexibility:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### 5. Server Actions (Next.js 14+)

Form submissions and mutations use Server Actions:

```typescript
async function submitForm(formData: FormData) {
  'use server';
  // Server-side code
}
```

## Data Flow

### Client → Server

```
User Input
  ↓
Component State
  ↓
Form Submission / API Call
  ↓
API Route Handler
  ↓
Service Layer
  ↓
Database
```

### Server → Client

```
Database
  ↓
Service Layer
  ↓
API Route Response
  ↓
Client State
  ↓
Component Render
  ↓
User Interface
```

## Security Architecture

### Defense in Depth

Multiple layers of security controls:

```
┌─────────────────────────────────────┐
│     WAF / CDN (Cloudflare/Vercel)  │
├─────────────────────────────────────┤
│     Security Headers (CSP, HSTS)   │
├─────────────────────────────────────┤
│     Rate Limiting                   │
├─────────────────────────────────────┤
│     Authentication & Authorization  │
├─────────────────────────────────────┤
│     Input Validation & Sanitization │
├─────────────────────────────────────┤
│     SQL Injection Protection (ORM)  │
└─────────────────────────────────────┘
```

### Security Headers

Configured in `next.config.ts`:

- `Strict-Transport-Security`: Force HTTPS
- `X-Frame-Options`: Prevent clickjacking
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Control referrer information
- `Permissions-Policy`: Feature permissions

### Rate Limiting

Simple in-memory rate limiter (production should use Redis):

```typescript
if (!rateLimiter.check(ip)) {
  throw ApiErrors.TooManyRequests();
}
```

### Input Validation

All inputs validated with Zod schemas:

```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});
```

## Scalability Considerations

### Current Architecture (MVP)

- **Database**: SQLite (single file)
- **Sessions**: In-memory
- **File Storage**: Local filesystem
- **Deployment**: Single instance

**Good for**: Personal use, development, small teams

### Scaling Path

As traffic grows, migrate to:

1. **Database**: PostgreSQL with connection pooling
2. **Sessions**: Redis for distributed sessions
3. **File Storage**: S3-compatible object storage
4. **Deployment**: Multiple instances with load balancer
5. **Caching**: Redis for application-level caching
6. **Queue**: BullMQ for background jobs

### Performance Optimizations

1. **Static Generation**: Pre-render pages when possible
2. **Incremental Static Regeneration**: Update static pages on demand
3. **Edge Runtime**: Run API routes at the edge
4. **Image Optimization**: Next.js Image component
5. **Code Splitting**: Automatic with Next.js
6. **Bundle Analysis**: Monitor bundle size

## Database Schema

### Entity Relationship

```
User
  ↓
  has many → Messages
  has many → Tasks
  has many → Events
  has many → Artifacts
```

### Migration Strategy

- Drizzle ORM for schema definitions
- Generated migrations in `drizzle/` directory
- Version controlled migrations
- Automated application on deployment

## API Design

### RESTful Conventions

```
GET    /api/resource       # List
GET    /api/resource/:id   # Get one
POST   /api/resource       # Create
PATCH  /api/resource/:id   # Update
DELETE /api/resource/:id   # Delete
```

### Response Format

```typescript
{
  data?: T,
  error?: {
    message: string,
    code: string,
  },
  meta?: {
    timestamp: string,
    requestId?: string,
  }
}
```

## Testing Strategy

### Test Pyramid

```
       E2E Tests (Playwright)
          ↑ Few
     ──────────────
    Integration Tests
          ↑ Some
     ──────────────
      Unit Tests
          ↑ Many
     ──────────────
```

### What to Test

- **Unit**: Pure functions, utilities
- **Integration**: API routes, database operations
- **E2E**: Critical user flows

## Monitoring & Observability

### Logging

Structured JSON logs in production:

```typescript
logger.info('User action', { 
  userId, 
  action: 'login',
  timestamp: Date.now() 
});
```

### Metrics to Track

- Response times
- Error rates
- Database query performance
- User actions
- API usage

### Alerting

Set up alerts for:
- High error rates (>1%)
- Slow response times (>2s p95)
- Database connection issues
- Deployment failures

## Future Enhancements

### Planned Features

- [ ] Real-time updates (WebSockets)
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] AI integration
- [ ] Multi-tenancy

### Technical Debt

- Migrate from in-memory rate limiting to Redis
- Add comprehensive test coverage
- Implement proper session management
- Add request tracing/correlation IDs
- Set up proper logging aggregation

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for architecture change proposals.

---

Last updated: 2024-02-04
