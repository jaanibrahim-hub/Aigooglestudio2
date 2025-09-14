/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Virtual Try-On Secure Backend Server
 * Production-ready Express server optimized for Cloudflare deployment
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import replicateRoutes from './routes/replicate.js';

// Import middleware
import {
    corsConfig,
    securityHeaders,
    generalRateLimit,
    requestLogger,
    errorHandler,
    notFoundHandler
} from './middleware/security.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (important for Cloudflare and rate limiting)
app.set('trust proxy', 1);

// Compression middleware (should be early in the stack)
app.use(compression());

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsConfig));

// Request parsing middleware
app.use(express.json({ 
    limit: '10mb',
    strict: true
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Logging middleware
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(requestLogger);

// General rate limiting
app.use(generalRateLimit);

// Health check endpoint (before authentication)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: NODE_ENV,
        uptime: Math.floor(process.uptime())
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Virtual Try-On Secure Backend',
        version: '2.0.0',
        status: 'online',
        endpoints: {
            health: 'GET /api/health',
            auth: 'POST /api/auth/*',
            replicate: 'POST /api/replicate/*'
        },
        documentation: 'https://github.com/your-repo/virtual-tryon-backend'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/replicate', replicateRoutes);

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, starting graceful shutdown...');
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, starting graceful shutdown...');
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 Virtual Try-On Secure Backend Started');
    console.log('───────────────────────────────────────');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔒 Security: Enhanced`);
    console.log(`🎯 API Base: http://localhost:${PORT}/api`);
    console.log('───────────────────────────────────────');
    console.log('Available Endpoints:');
    console.log('• GET  /api/health           - Health check');
    console.log('• POST /api/auth/init        - Initialize session with API key');
    console.log('• GET  /api/auth/validate    - Validate session');
    console.log('• POST /api/auth/refresh     - Refresh session');
    console.log('• POST /api/auth/logout      - Logout and clear session');
    console.log('• POST /api/replicate/predictions - Create prediction');
    console.log('• GET  /api/replicate/predictions/:id - Get prediction status');
    console.log('• DELETE /api/replicate/predictions/:id - Cancel prediction');
    console.log('───────────────────────────────────────');
    console.log('🌐 Ready for Cloudflare deployment');
    console.log('');
    
    // Log environment status
    if (NODE_ENV === 'development') {
        console.log('⚠️  Development mode - Debug features enabled');
    } else {
        console.log('🔒 Production mode - Security optimized');
    }
    
    // Validate critical environment variables
    const requiredEnvVars = ['ENCRYPTION_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
        console.warn('⚠️  Using generated values for development');
    }
});

export default app;