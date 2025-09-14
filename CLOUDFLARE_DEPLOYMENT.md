# 🚀 Cloudflare Deployment Guide - Virtual Try-On App

## Overview
This guide walks you through deploying the secure Virtual Try-On backend to Cloudflare Workers and the frontend to Cloudflare Pages.

## 🛠️ Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI** - Install globally: `npm install -g wrangler`
3. **GitHub Repository** - Your code is already pushed to: `https://github.com/jaanibrahim-hub/Aigooglestudio2`

## 🔧 Backend Deployment (Cloudflare Workers)

### Step 1: Setup Wrangler
```bash
# Login to Cloudflare
wrangler auth login

# Navigate to backend directory
cd backend-secure
```

### Step 2: Create wrangler.toml
Create a `wrangler.toml` file in `backend-secure/`:

```toml
name = "virtual-tryon-backend"
main = "server.js"
compatibility_date = "2024-09-14"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "virtual-tryon-backend-prod"

[env.staging]  
name = "virtual-tryon-backend-staging"

[[env.production.vars]]
NODE_ENV = "production"
PORT = "8787"

[[env.staging.vars]]
NODE_ENV = "staging"
PORT = "8787"

# Add your environment secrets (use wrangler secret put)
# ENCRYPTION_KEY - 64-character hex string for AES-256 encryption
# SESSION_SECRET - Random string for session security
```

### Step 3: Set Environment Secrets
```bash
# Set encryption key (generate a secure 64-character hex string)
wrangler secret put ENCRYPTION_KEY --env production
# Enter: [GENERATE A SECURE 64-CHARACTER HEX STRING]

# Set session secret
wrangler secret put SESSION_SECRET --env production  
# Enter: your-secure-session-secret-key-2024-production
```

### Step 4: Deploy Backend
```bash
# Deploy to staging
wrangler deploy --env staging

# Test staging deployment
curl https://virtual-tryon-backend-staging.your-subdomain.workers.dev/api/health

# Deploy to production
wrangler deploy --env production
```

### Your Backend URL
After deployment: `https://virtual-tryon-backend-prod.your-subdomain.workers.dev`

## 🎨 Frontend Deployment (Cloudflare Pages)

### Step 1: Update Backend URL
In `services/backendService.ts`, update:
```typescript
const BACKEND_BASE_URL = 'https://virtual-tryon-backend-prod.your-subdomain.workers.dev/api';
```

### Step 2: Deploy via GitHub Integration

1. **Connect Repository**:
   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
   - Click "Create a project" → "Connect to Git"
   - Select your GitHub account and repository: `Aigooglestudio2`

2. **Configure Build Settings**:
   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: / (leave empty)
   ```

3. **Environment Variables** (Optional):
   ```
   NODE_ENV=production
   ```

4. **Deploy**: Click "Save and Deploy"

### Your Frontend URL
After deployment: `https://virtual-tryon.pages.dev` (or custom domain)

## 🔒 Security Configuration

### Backend Security Headers
The backend is configured with:
- CORS for multiple environments (Cloudflare, E2B, localhost)
- Rate limiting (50 auth requests/15min, 500 session requests/min)
- Helmet.js security headers
- HSTS enforcement
- Input validation on all endpoints

### API Key Security
- Your Replicate API key is encrypted with AES-256-GCM
- Sessions expire after 24 hours of inactivity
- All sensitive data is encrypted at rest
- Timing-safe comparisons prevent timing attacks

## 🧪 Testing Deployment

### Test Backend Health
```bash
curl https://virtual-tryon-backend-prod.your-subdomain.workers.dev/api/health
```

### Test API Key Initialization
```bash
curl -X POST \
  https://virtual-tryon-backend-prod.your-subdomain.workers.dev/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_REPLICATE_API_KEY_HERE"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Session initialized successfully", 
  "sessionToken": "...",
  "expiresIn": "24h"
}
```

### Test Frontend
1. Open your Cloudflare Pages URL
2. Enter your Replicate API key when prompted
3. Upload a photo and test virtual try-on functionality

## 🔄 Updates & Maintenance

### Backend Updates
```bash
cd backend-secure
wrangler deploy --env production
```

### Frontend Updates  
1. Push changes to GitHub main branch
2. Cloudflare Pages will automatically redeploy

### Monitoring
- **Backend Logs**: `wrangler tail --env production`
- **Frontend Analytics**: Available in Cloudflare Pages dashboard
- **Performance**: Monitor via Cloudflare Analytics

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure frontend URL is included in backend CORS configuration
   - Check `backend-secure/middleware/security.js` corsConfig

2. **API Key Errors**:
   - Verify ENCRYPTION_KEY is set correctly in Wrangler secrets
   - Test API key format: must start with `r8_`

3. **Rate Limiting**:
   - Backend has conservative limits to stay within Replicate quotas
   - Monitor usage and adjust if needed

4. **Session Expiration**:
   - Sessions expire after 24 hours
   - Frontend will prompt to re-enter API key

### Debug Commands
```bash
# View backend logs
wrangler tail --env production

# Check environment variables
wrangler secret list --env production

# Test specific endpoints
curl -v https://your-backend.workers.dev/api/health
```

## 📊 Performance Optimization

### Cloudflare Settings
1. **Caching**: Set appropriate cache headers for static assets
2. **Minification**: Enable Auto Minify in Cloudflare dashboard
3. **Compression**: Brotli/Gzip compression is automatically enabled
4. **CDN**: Assets are served from Cloudflare's global CDN

### Rate Limit Recommendations
- Authentication: 50 requests/15 minutes per IP
- Session validation: 500 requests/minute per IP  
- Replicate API calls: 100 requests/minute per IP (well below 600/min limit)

## 🔐 Production Security Checklist

- ✅ Encryption key is randomly generated and securely stored
- ✅ HTTPS enforced with HSTS headers
- ✅ CORS properly configured for production domains
- ✅ Rate limiting prevents abuse
- ✅ Input validation on all endpoints
- ✅ Session expiration and cleanup
- ✅ Error messages don't leak sensitive information
- ✅ Logging excludes sensitive data

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Cloudflare Workers/Pages documentation
3. Verify all environment variables are set correctly
4. Test endpoints individually with curl

Your Virtual Try-On application is now ready for production deployment on Cloudflare! 🎉