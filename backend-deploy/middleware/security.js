/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Security Middleware for Virtual Try-On Backend
 * Optimized for Cloudflare deployment with comprehensive security
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

/**
 * Comprehensive CORS configuration for Cloudflare deployment
 */
export const corsConfig = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // Define allowed origins patterns
        const allowedPatterns = [
            // Localhost for development
            /^https?:\/\/localhost(:\d+)?$/,
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
            
            // E2B sandbox domains
            /^https:\/\/\d+-[a-zA-Z0-9-]+\.e2b\.dev$/,
            /^https:\/\/[a-zA-Z0-9-]+\.e2b\.dev$/,
            
            // Cloudflare domains
            /^https:\/\/[a-zA-Z0-9-]+\.pages\.dev$/,
            /^https:\/\/[a-zA-Z0-9-]+\.workers\.dev$/,
            
            // Custom domains (add your production domains here)
            /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
            /^https:\/\/[a-zA-Z0-9-]+\.netlify\.app$/
        ];

        // Check if origin matches any allowed pattern
        const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(null, false); // Don't throw error, just deny
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Session-Token',
        'X-Requested-With',
        'Accept',
        'Origin',
        'User-Agent',
        'Cache-Control'
    ],
    credentials: false, // Set to true if you need cookies
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200
};

/**
 * Security headers configuration
 */
export const securityHeaders = helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding for iframe usage
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Be careful with unsafe-inline
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.replicate.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

/**
 * Rate limiting configurations
 */

// General API rate limiting
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Authentication endpoints rate limiting (more restrictive)
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts',
        message: 'Authentication rate limit exceeded. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Session validation rate limiting (more lenient)
export const sessionRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // limit each IP to 500 session requests per minute
    message: {
        error: 'Too many session requests',
        message: 'Session validation rate limit exceeded. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// API calls to Replicate (conservative to stay within their limits)
export const replicateRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // well below Replicate's 600/min limit
    message: {
        error: 'API rate limit exceeded',
        message: 'Replicate API rate limit exceeded. Please wait before making more requests.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Request validation middleware
 */
export const validateApiKeyRequest = [
    body('apiKey')
        .notEmpty()
        .withMessage('API key is required')
        .isLength({ min: 10 })
        .withMessage('API key must be at least 10 characters')
        .matches(/^r8_[A-Za-z0-9]+$/)
        .withMessage('Invalid Replicate API key format'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Invalid request data',
                details: errors.array()
            });
        }
        next();
    }
];

/**
 * Session token validation middleware
 */
export function validateSessionToken(req, res, next) {
    const sessionToken = req.headers['x-session-token'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!sessionToken) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'No session token provided'
        });
    }
    
    if (typeof sessionToken !== 'string' || sessionToken.length < 32) {
        return res.status(401).json({
            error: 'Invalid session token',
            message: 'Session token format is invalid'
        });
    }
    
    req.sessionToken = sessionToken;
    next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Log request
    console.log(`📝 [${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(0, 100)}`);
    
    // Log response
    const originalSend = res.send;
    const start = Date.now();
    
    res.send = function(data) {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
        
        console.log(`${statusEmoji} [${timestamp}] ${method} ${url} - ${status} - ${duration}ms`);
        
        originalSend.call(this, data);
    };
    
    next();
}

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
    const timestamp = new Date().toISOString();
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log the error
    console.error(`💥 [${timestamp}] Error in ${req.method} ${req.originalUrl || req.url}:`, {
        message: err.message,
        stack: isDevelopment ? err.stack : 'Stack trace hidden in production',
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Send error response
    res.status(statusCode).json({
        error: err.name || 'Internal Server Error',
        message: isDevelopment ? err.message : 'An internal error occurred',
        timestamp,
        ...(isDevelopment && { stack: err.stack })
    });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl || req.url} not found`,
        availableEndpoints: [
            'POST /api/auth/init - Initialize session with API key',
            'GET /api/auth/validate - Validate session',
            'POST /api/auth/refresh - Refresh session',
            'POST /api/auth/logout - Logout and clear session',
            'POST /api/replicate/predictions - Create prediction',
            'GET /api/replicate/predictions/:id - Get prediction status',
            'GET /api/health - Health check'
        ]
    });
}