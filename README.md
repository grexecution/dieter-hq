# Dieter HQ 🚀

## Deployment

### Vercel Deployment

1. Connect GitHub Repository
2. Configure Build Settings
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SITE_URL`
- Database connection strings
- Authentication secrets

## Development

- `npm run dev`: Start development server
- `npm run build`: Production build
- `npm run start`: Run production build

## Contributing

- Always work on feature branches
- Pull requests require review
- CI/CD checks must pass