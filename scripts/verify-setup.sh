#!/bin/bash

# Verification script to check if everything is set up correctly

echo "🔍 Verifying Dieter HQ Setup..."
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 missing"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1/"
    else
        echo "❌ $1/ missing"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📁 Checking project structure..."
check_file "package.json"
check_file "next.config.ts"
check_file "tsconfig.json"
check_file "tailwind.config.ts"
check_file "components.json"
check_file ".env.local.example"
check_dir "src"
check_dir "src/app"
check_dir "src/components"
check_dir "src/lib"
echo ""

echo "🔧 Checking configuration files..."
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/deploy.yml"
check_file ".github/workflows/codeql.yml"
check_file ".github/dependabot.yml"
check_file "vercel.json"
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file "playwright.config.ts"
echo ""

echo "📚 Checking documentation..."
check_file "README.md"
check_file "CONTRIBUTING.md"
check_file "SECURITY.md"
check_file "docs/ARCHITECTURE.md"
check_file "docs/DEPLOYMENT.md"
echo ""

echo "🛠️ Checking utilities..."
check_file "src/lib/env.ts"
check_file "src/lib/logger.ts"
check_file "src/lib/security.ts"
check_file "src/lib/api-error.ts"
check_file "src/lib/utils.ts"
echo ""

echo "🧩 Checking components..."
check_file "src/components/error-boundary.tsx"
check_file "src/components/ui/button.tsx"
check_file "src/components/ui/card.tsx"
echo ""

echo "🧪 Checking tests..."
check_dir "tests"
check_dir "tests/e2e"
check_file "tests/e2e/example.spec.ts"
echo ""

echo "🔐 Checking security setup..."
# Check if security headers are in next.config.ts
if grep -q "X-Frame-Options" next.config.ts; then
    echo "✅ Security headers configured"
else
    echo "⚠️  Security headers may not be configured"
    WARNINGS=$((WARNINGS + 1))
fi

# Check if TypeScript strict mode is enabled
if grep -q '"strict": true' tsconfig.json; then
    echo "✅ TypeScript strict mode enabled"
else
    echo "❌ TypeScript strict mode not enabled"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules installed"
else
    echo "⚠️  node_modules not installed (run 'npm install')"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "🌍 Checking environment..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
else
    echo "⚠️  .env.local not found (copy from .env.local.example)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Setup is complete."
    echo ""
    echo "Next steps:"
    echo "  1. Update .env.local with your configuration"
    echo "  2. Run 'npm run dev' to start development server"
    echo "  3. Visit http://localhost:3000"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup complete with $WARNINGS warning(s)"
    echo ""
    echo "Review warnings above and fix if needed."
    exit 0
else
    echo "❌ Setup incomplete: $ERRORS error(s), $WARNINGS warning(s)"
    echo ""
    echo "Please fix errors above and try again."
    echo "You may need to run './scripts/setup.sh'"
    exit 1
fi
