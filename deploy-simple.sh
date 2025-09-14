#!/bin/bash

# Simple Cloudflare Pages Deployment
# This script deploys directly without wrangler.toml configuration

echo "🚀 Simple Cloudflare Pages Deployment"
echo "====================================="

# Ensure we have the latest build
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy with explicit parameters
if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "🔑 API token found, deploying..."
    echo "📂 Deploying dist directory to virtual-tryon-ai-enhanced..."
    
    # Deploy with all explicit parameters
    npx wrangler pages deploy dist \
        --project-name virtual-tryon-ai-enhanced \
        --compatibility-date 2024-09-14
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "🔗 Your app should be live at: https://virtual-tryon-ai-enhanced.pages.dev"
    else
        echo "❌ Deployment failed. Check the error messages above."
        echo "💡 Try manual deployment instead:"
        echo "   1. Go to https://dash.cloudflare.com/pages"
        echo "   2. Upload contents of 'dist' folder"
    fi
else
    echo "⚠️  No CLOUDFLARE_API_TOKEN found"
    echo ""
    echo "📝 QUICK MANUAL DEPLOYMENT:"
    echo "1. Go to: https://dash.cloudflare.com/pages"
    echo "2. Click: 'Create a Project' → 'Upload assets'"
    echo "3. Project name: virtual-tryon-ai-enhanced"
    echo "4. Upload all files from the 'dist' folder below:"
    echo ""
    ls -la dist/
    echo ""
    echo "🔗 Expected URL: https://virtual-tryon-ai-enhanced.pages.dev"
fi

echo ""
echo "🎯 Deployment process completed!"