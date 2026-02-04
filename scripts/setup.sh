#!/bin/bash

# Dieter HQ Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up Dieter HQ..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Error: Node.js 22+ is required. You have $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check npm version
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 10 ]; then
    echo "❌ Error: npm 10+ is required. You have $(npm -v)"
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Setup environment variables
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ .env.local created (please update with your values)"
else
    echo "⚠️  .env.local already exists, skipping..."
fi
echo ""

# Setup database
echo "🗄️  Setting up database..."
if [ ! -d "data" ]; then
    mkdir -p data
    echo "✅ Created data directory"
fi

npm run db:generate
npm run db:migrate
echo "✅ Database setup complete"
echo ""

# Setup VS Code (if using)
if [ -f ".vscode/settings.template.json" ] && [ ! -f ".vscode/settings.json" ]; then
    echo "🔧 Setting up VS Code settings..."
    mkdir -p .vscode
    cp .vscode/settings.template.json .vscode/settings.json
    echo "✅ VS Code settings created"
else
    echo "⚠️  VS Code settings already exist or not using VS Code"
fi
echo ""

# Run initial build to verify everything works
echo "🔨 Running initial build to verify setup..."
npm run build
echo "✅ Build successful"
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your configuration"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see README.md"
