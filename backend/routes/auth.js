/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { storeApiKey, validateSession, removeSession } from '../utils/apiKeyManager.js';
import { generateToken } from '../utils/encryption.js';

const router = express.Router();

/**
 * Initialize session and store encrypted API key
 */
router.post('/init', async (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({
                error: 'Missing API key',
                message: 'Replicate API key is required'
            });
        }

        // Generate a secure session token
        const sessionToken = generateToken(32);

        // Store the API key securely
        const result = storeApiKey(sessionToken, apiKey);

        res.json({
            success: true,
            message: 'Session initialized successfully',
            sessionToken: result.sessionToken,
            expiresIn: '24h'
        });

        console.log(`New session initialized: ${sessionToken.substring(0, 8)}...`);
    } catch (error) {
        console.error('Session initialization error:', error);
        res.status(400).json({
            error: 'Initialization failed',
            message: error.message || 'Failed to initialize session'
        });
    }
});

/**
 * Validate session status
 */
router.get('/validate', (req, res) => {
    try {
        const sessionToken = req.headers['x-session-token'];

        if (!sessionToken) {
            return res.status(401).json({
                valid: false,
                message: 'No session token provided'
            });
        }

        const isValid = validateSession(sessionToken);

        res.json({
            valid: isValid,
            message: isValid ? 'Session is valid' : 'Session expired or invalid'
        });
    } catch (error) {
        console.error('Session validation error:', error);
        res.status(500).json({
            valid: false,
            message: 'Failed to validate session'
        });
    }
});

/**
 * Refresh/extend session
 */
router.post('/refresh', (req, res) => {
    try {
        const sessionToken = req.headers['x-session-token'];

        if (!sessionToken) {
            return res.status(401).json({
                error: 'No session token',
                message: 'Session token is required'
            });
        }

        if (!validateSession(sessionToken)) {
            return res.status(401).json({
                error: 'Invalid session',
                message: 'Session expired or invalid'
            });
        }

        // Session is valid - it's automatically extended when accessed
        res.json({
            success: true,
            message: 'Session refreshed successfully',
            expiresIn: '24h'
        });
    } catch (error) {
        console.error('Session refresh error:', error);
        res.status(500).json({
            error: 'Refresh failed',
            message: 'Failed to refresh session'
        });
    }
});

/**
 * Logout and clear session
 */
router.post('/logout', (req, res) => {
    try {
        const sessionToken = req.headers['x-session-token'];

        if (sessionToken) {
            removeSession(sessionToken);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'Failed to logout properly'
        });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Fit Check Authentication Service'
    });
});

export default router;