/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authentication Routes for Virtual Try-On Backend
 * Handles secure session management and API key encryption
 */

import express from 'express';
import { 
    createSession, 
    validateSession, 
    deleteSession, 
    getSessionStats 
} from '../utils/sessionManager.js';
import { 
    authRateLimit, 
    sessionRateLimit, 
    validateApiKeyRequest, 
    validateSessionToken 
} from '../middleware/security.js';

const router = express.Router();

/**
 * POST /api/auth/init
 * Initialize a new secure session with Replicate API key
 */
router.post('/init', authRateLimit, validateApiKeyRequest, async (req, res) => {
    try {
        const { apiKey } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'unknown';
        
        console.log(`🔐 Session initialization request from IP: ${clientIP}`);
        
        // Create encrypted session
        const sessionData = createSession(apiKey);
        
        // Update session with client info (this would normally be done in session manager)
        // For now, we'll log it
        console.log(`✅ Session created for IP: ${clientIP}, UA: ${userAgent.substring(0, 50)}...`);
        
        res.status(201).json({
            success: true,
            message: 'Session initialized successfully',
            sessionToken: sessionData.sessionToken,
            expiresIn: sessionData.expiresIn,
            created: new Date(sessionData.created).toISOString()
        });
        
    } catch (error) {
        console.error('❌ Session initialization error:', error.message);
        res.status(400).json({
            error: 'Initialization failed',
            message: error.message || 'Failed to initialize session'
        });
    }
});

/**
 * GET /api/auth/validate
 * Validate and refresh an existing session
 */
router.get('/validate', sessionRateLimit, validateSessionToken, async (req, res) => {
    try {
        const { sessionToken } = req;
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'unknown';
        
        // Validate the session
        const validation = validateSession(sessionToken, clientIP, userAgent);
        
        if (!validation.valid) {
            return res.status(401).json({
                valid: false,
                error: 'Session invalid',
                message: validation.error || 'Session validation failed'
            });
        }
        
        res.json({
            valid: true,
            message: 'Session is valid and refreshed',
            session: {
                created: new Date(validation.session.created).toISOString(),
                lastAccessed: new Date(validation.session.lastAccessed).toISOString(),
                expiresAt: new Date(validation.session.expiresAt).toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Session validation error:', error.message);
        res.status(500).json({
            valid: false,
            error: 'Validation failed',
            message: 'Internal server error during validation'
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh session expiration time
 */
router.post('/refresh', sessionRateLimit, validateSessionToken, async (req, res) => {
    try {
        const { sessionToken } = req;
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'unknown';
        
        // Validate and refresh the session
        const validation = validateSession(sessionToken, clientIP, userAgent);
        
        if (!validation.valid) {
            return res.status(401).json({
                error: 'Session invalid',
                message: validation.error || 'Cannot refresh invalid session'
            });
        }
        
        res.json({
            success: true,
            message: 'Session refreshed successfully',
            expiresAt: new Date(validation.session.expiresAt).toISOString()
        });
        
    } catch (error) {
        console.error('❌ Session refresh error:', error.message);
        res.status(500).json({
            error: 'Refresh failed',
            message: 'Internal server error during refresh'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout and delete session
 */
router.post('/logout', sessionRateLimit, validateSessionToken, async (req, res) => {
    try {
        const { sessionToken } = req;
        
        // Delete the session
        const deleted = deleteSession(sessionToken);
        
        if (deleted) {
            console.log(`👋 Session logged out: ${sessionToken.substring(0, 8)}...`);
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } else {
            res.status(404).json({
                error: 'Session not found',
                message: 'Session was already deleted or did not exist'
            });
        }
        
    } catch (error) {
        console.error('❌ Logout error:', error.message);
        res.status(500).json({
            error: 'Logout failed',
            message: 'Internal server error during logout'
        });
    }
});

/**
 * GET /api/auth/stats (Development only)
 * Get session statistics
 */
router.get('/stats', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
            error: 'Not Found',
            message: 'Endpoint not available in production'
        });
    }
    
    try {
        const stats = getSessionStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('❌ Stats error:', error.message);
        res.status(500).json({
            error: 'Stats failed',
            message: 'Could not retrieve session statistics'
        });
    }
});

export default router;