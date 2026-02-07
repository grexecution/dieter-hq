# Authentication

Dieter HQ uses a simple single-user password authentication system.

## Overview

- **Single password** stored in `HQ_PASSWORD` environment variable
- **Session-based** using signed cookies (HMAC-SHA256)
- **30-day session lifetime** with automatic expiration
- **bcrypt support** for secure password hashing (recommended)
- **Rate limiting** to prevent brute-force attacks
- **CSRF protection** on the login form

## Setup

### Option 1: Plain Text Password (Development Only)

```bash
# .env.local
HQ_PASSWORD=my-secret-password
```

⚠️ **Not recommended for production** - the password is stored in plain text.

### Option 2: Bcrypt Hash (Recommended for Production)

1. Generate a bcrypt hash:

```bash
node -e "require('bcrypt').hash('your-secure-password', 12).then(console.log)"
```

2. Set the hash as the password:

```bash
# .env.local or production environment
HQ_PASSWORD=$2b$12$abcdefghijklmnopqrstuv...
```

The system automatically detects bcrypt hashes and uses secure comparison.

### Option 3: Disable Auth (Local Development)

Leave `HQ_PASSWORD` unset to disable authentication entirely:

```bash
# .env.local
# HQ_PASSWORD=  (commented out or empty)
```

## Security Features

### Session Tokens

- Signed with HMAC-SHA256 using the password as the secret key
- Contains `iat` (issued at) timestamp for expiration checking
- Stored in httpOnly, secure (in production), SameSite=Lax cookies
- 30-day maximum lifetime

### Rate Limiting

- **5 failed attempts** within a 15-minute window triggers lockout
- **30-minute lockout** after exceeding attempts
- Per-IP tracking
- Automatically clears on successful login

### CSRF Protection

- Random CSRF token generated per login page visit
- Stored in httpOnly, SameSite=Strict cookie
- Validated on form submission using timing-safe comparison
- Cleared after successful login

## API Endpoints

### POST `/api/auth/login`

Authenticate with password.

**Request:**
```json
{
  "password": "your-password"
}
```

**Response (success):**
```json
{
  "success": true
}
```

**Response (failure):**
```json
{
  "error": "bad_password",
  "message": "Invalid password.",
  "remainingAttempts": 4
}
```

**Response (rate limited):**
```json
{
  "error": "rate_limited",
  "message": "Too many failed attempts. Please wait before trying again.",
  "retryAfterSec": 1800
}
```

### POST `/api/auth/logout`

Clear session cookie.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### GET `/api/auth/logout`

Clear session and redirect to login page.

## Protected Routes

The middleware protects these routes:
- `/chat/*`
- `/events/*`
- `/kanban/*`
- `/calendar/*`
- `/api/*`

Unprotected routes:
- `/login`
- `/manifest.webmanifest`
- `/api/health`

## File Structure

```
src/
├── middleware.ts           # Route protection
├── server/auth/
│   ├── constants.ts        # Cookie name, password helpers
│   ├── csrf.ts             # CSRF token generation/validation
│   ├── edge.ts             # Edge runtime session validation
│   ├── node.ts             # Node runtime session/cookie helpers
│   ├── password.ts         # bcrypt hashing/verification
│   └── rate-limit.ts       # In-memory rate limiting
└── app/
    ├── login/
    │   ├── page.tsx        # Login page with server action
    │   └── LoginView.tsx   # Login form component
    └── api/auth/
        ├── login/route.ts  # API login endpoint
        └── logout/route.ts # API logout endpoint
```

## Logout

Users can log out by:

1. Calling `POST /api/auth/logout`
2. Visiting `GET /api/auth/logout` (redirects to login)
3. Using a logout button that calls the logout API

Example logout button:
```tsx
async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}
```

## Notes

- Rate limiting is in-memory and resets on server restart
- For multi-instance deployments, consider using Redis for rate limiting
- The password is never exposed to the client
- Session tokens are validated on every protected request
