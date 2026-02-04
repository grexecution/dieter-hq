# Contributing to Dieter HQ

Thank you for your interest in contributing to Dieter HQ! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dieter-hq.git
   cd dieter-hq
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/grexecution/dieter-hq.git
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `chore/` - Maintenance tasks
- `refactor/` - Code refactoring

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

Before committing:

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Test
npm test

# Build
npm run build
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in component"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

Commit message format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] Code passes all tests
- [ ] Code follows project style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this?

## Screenshots (if applicable)

## Related Issues
Fixes #123
```

### Review Process

1. Automated checks must pass (CI)
2. Code review by maintainers
3. Address any feedback
4. Squash commits if needed
5. Merge when approved

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Define proper types, avoid `any`
- Use interfaces for objects
- Export types when used across files

```typescript
// Good
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User {
  // ...
}

// Avoid
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components
- Use TypeScript for props
- Keep components small and focused
- Extract reusable logic to hooks

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Hooks: `use-hook-name.ts`
- Types: `types.ts` or inline

### Import Order

```typescript
// 1. React & Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. External libraries
import { z } from 'zod';

// 3. Internal absolute imports
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 4. Relative imports
import { helper } from './helper';

// 5. Types
import type { User } from '@/types';
```

## Adding New Features

### Component Development

1. Create component in appropriate directory
2. Add TypeScript types for props
3. Add to component exports if needed
4. Write tests
5. Document usage in component or README

### API Routes

1. Create route in `src/app/api/`
2. Use error handling wrapper
3. Validate input
4. Add proper TypeScript types
5. Document endpoint

Example:
```typescript
import { withErrorHandler, ApiErrors } from '@/lib/api-error';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
});

export const POST = withErrorHandler(async (req) => {
  const body = await req.json();
  const data = schema.parse(body);
  
  // Process...
  
  return Response.json({ success: true });
});
```

### Database Changes

1. Update schema in Drizzle
2. Generate migration: `npm run db:generate`
3. Test migration locally
4. Document changes

## Testing

### Unit Tests

Place tests next to the code being tested:
```
src/
  components/
    Button.tsx
    Button.test.tsx
```

### E2E Tests

Add to `tests/e2e/`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test('should work correctly', async ({ page }) => {
    // Test implementation
  });
});
```

## Documentation

- Update README.md for new features
- Add JSDoc comments for complex functions
- Update API documentation
- Include examples where helpful

## Questions?

- Open an issue for bugs
- Open a discussion for questions
- Check existing issues/PRs first

Thank you for contributing! 🎉
