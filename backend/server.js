/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import replicateRoutes from './routes/replicate.js';

// Import middleware
import { 
    generalLimiter, 
    authLimiter, 
    sessionLimiter,
    apiLimiter, 
    requestLogger, 
    errorHandler, 
    corsOptions 
} from './middleware/security.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // Disable for API server
}));

// CORS configuration
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Request logging
app.use(requestLogger);

// General rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Fit Check Backend API',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            replicate: '/api/replicate'
        }
    });
});

// API routes with specific rate limiting
// Apply strict rate limiting to login/logout, lenient to session operations
app.use('/api/auth/init', authLimiter);
app.use('/api/auth/logout', authLimiter);
app.use('/api/auth/validate', sessionLimiter);
app.use('/api/auth/refresh', sessionLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/replicate', apiLimiter, replicateRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableEndpoints: [
            '/api/auth/init',
            '/api/auth/validate', 
            '/api/auth/refresh',
            '/api/auth/logout',
            '/api/replicate/predictions',
            '/api/replicate/predictions/:id'
        ]
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Fit Check Backend Server Started!
───────────────────────────────────────
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔒 Security: Enabled
🎯 API Base: http://localhost:${PORT}/api
───────────────────────────────────────
Available Endpoints:
• POST /api/auth/init      - Initialize session with API key
• GET  /api/auth/validate  - Validate session
• POST /api/auth/refresh   - Refresh session
• POST /api/auth/logout    - Logout
• POST /api/replicate/predictions - Create prediction
• GET  /api/replicate/predictions/:id - Get prediction status
───────────────────────────────────────
    `);
});

export default app;