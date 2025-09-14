#!/bin/bash

# Virtual Try-On AI Enhanced - Cloudflare Pages Deployment Script
# Usage: ./deploy.sh

echo "🚀 Deploying Virtual Try-On AI Enhanced to Cloudflare Pages..."

# Ensure we have the latest build
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."

# If CLOUDFLARE_API_TOKEN is set, use wrangler
if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "🔑 API token found, deploying with Wrangler..."
    
    # Try with wrangler.toml configuration first
    echo "📝 Using wrangler.toml configuration..."
    npx wrangler pages deploy --project-name virtual-tryon-ai-enhanced
    
    # If that fails, try explicit directory specification
    if [ $? -ne 0 ]; then
        echo "⚠️  Retrying with explicit directory..."
        npx wrangler pages deploy dist --project-name virtual-tryon-ai-enhanced
    fi
else
    echo "⚠️  No API token found."
    echo ""
    echo "📝 MANUAL DEPLOYMENT INSTRUCTIONS:"
    echo "1. Go to https://dash.cloudflare.com/pages"
    echo "2. Click 'Create a Project'"
    echo "3. Choose 'Upload assets'"
    echo "4. Set project name: virtual-tryon-ai-enhanced"
    echo "5. Upload the contents of the 'dist' folder"
    echo ""
    echo "🔧 OR SET UP API TOKEN:"
    echo "1. Go to https://developers.cloudflare.com/fundamentals/api/get-started/create-token/"
    echo "2. Create a token with 'Cloudflare Pages:Edit' permissions"
    echo "3. Run: export CLOUDFLARE_API_TOKEN=your_token_here"
    echo "4. Run this script again"
    echo ""
    echo "📂 Build files are ready in the 'dist' directory for manual upload"
fi

echo "🎯 Deployment process completed!"