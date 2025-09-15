/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Secure Session Management System
 * Handles encrypted API key storage and session lifecycle
 */

import { 
    encryptData, 
    decryptData, 
    createSecureHash, 
    generateSecureToken, 
    validateReplicateKey 
} from './encryption.js';

// In-memory storage for sessions (in production, use Redis or database)
const sessions = new Map();
const apiKeys = new Map();

// Session configuration
const SESSION_CONFIG = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    maxSessions: 1000 // Prevent memory overflow
};

// Periodic cleanup of expired sessions
setInterval(() => {
    cleanupExpiredSessions();
}, SESSION_CONFIG.cleanupInterval);

/**
 * Create a new secure session with encrypted API key
 * @param {string} apiKey - Replicate API key
 * @returns {Object} Session details
 */
export function createSession(apiKey) {
    try {
        // Validate API key format
        if (!validateReplicateKey(apiKey)) {
            throw new Error('Invalid Replicate API key format. Must start with "r8_" and be at least 10 characters.');
        }

        // Check if we're at session limit
        if (sessions.size >= SESSION_CONFIG.maxSessions) {
            // Clean up expired sessions first
            cleanupExpiredSessions();
            
            // If still at limit, remove oldest session
            if (sessions.size >= SESSION_CONFIG.maxSessions) {
                const oldestToken = sessions.keys().next().value;
                deleteSession(oldestToken);
            }
        }

        // Generate secure session token
        const sessionToken = generateSecureToken(32);
        
        // Encrypt the API key
        const encryptedKey = encryptData(apiKey);
        
        // Create session metadata
        const sessionData = {
            created: Date.now(),
            lastAccessed: Date.now(),
            expiresAt: Date.now() + SESSION_CONFIG.maxAge,
            keyHash: createSecureHash(apiKey),
            ipAddress: null, // Will be set by the route handler
            userAgent: null  // Will be set by the route handler
        };

        // Store session and encrypted API key
        sessions.set(sessionToken, sessionData);
        apiKeys.set(sessionToken, encryptedKey);

        console.log(`✅ Session created: ${sessionToken.substring(0, 8)}... expires at ${new Date(sessionData.expiresAt).toISOString()}`);

        return {
            sessionToken,
            expiresIn: '24h',
            created: sessionData.created
        };
    } catch (error) {
        console.error('❌ Session creation error:', error.message);
        throw new Error(`Failed to create session: ${error.message}`);
    }
}

/**
 * Validate and refresh a session
 * @param {string} sessionToken - Session token to validate
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Object} Session validation result
 */
export function validateSession(sessionToken, ipAddress = null, userAgent = null) {
    try {
        if (!sessionToken || typeof sessionToken !== 'string') {
            return { valid: false, error: 'Invalid session token' };
        }

        const session = sessions.get(sessionToken);
        
        if (!session) {
            return { valid: false, error: 'Session not found' };
        }

        // Check if session has expired
        if (Date.now() > session.expiresAt) {
            deleteSession(sessionToken);
            return { valid: false, error: 'Session expired' };
        }

        // Update last accessed time and extend session
        session.lastAccessed = Date.now();
        session.expiresAt = Date.now() + SESSION_CONFIG.maxAge;
        
        // Update IP and user agent if provided
        if (ipAddress) session.ipAddress = ipAddress;
        if (userAgent) session.userAgent = userAgent;

        return { 
            valid: true, 
            session: {
                created: session.created,
                lastAccessed: session.lastAccessed,
                expiresAt: session.expiresAt
            }
        };
    } catch (error) {
        console.error('❌ Session validation error:', error.message);
        return { valid: false, error: 'Session validation failed' };
    }
}

/**
 * Retrieve decrypted API key for a valid session
 * @param {string} sessionToken - Session token
 * @returns {string} Decrypted API key
 */
export function getApiKey(sessionToken) {
    try {
        // First validate the session
        const validation = validateSession(sessionToken);
        if (!validation.valid) {
            throw new Error(validation.error || 'Invalid session');
        }

        const encryptedKey = apiKeys.get(sessionToken);
        if (!encryptedKey) {
            throw new Error('API key not found for session');
        }

        // Decrypt and return the API key
        const apiKey = decryptData(encryptedKey);
        
        // Update session access time
        const session = sessions.get(sessionToken);
        if (session) {
            session.lastAccessed = Date.now();
        }

        return apiKey;
    } catch (error) {
        console.error('❌ API key retrieval error:', error.message);
        throw new Error(`Failed to retrieve API key: ${error.message}`);
    }
}

/**
 * Delete a session and its associated data
 * @param {string} sessionToken - Session token to delete
 * @returns {boolean} True if session was deleted
 */
export function deleteSession(sessionToken) {
    try {
        const hadSession = sessions.has(sessionToken);
        const hadApiKey = apiKeys.has(sessionToken);
        
        sessions.delete(sessionToken);
        apiKeys.delete(sessionToken);
        
        if (hadSession || hadApiKey) {
            console.log(`🗑️  Session deleted: ${sessionToken.substring(0, 8)}...`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Session deletion error:', error.message);
        return false;
    }
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions() {
    try {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [token, session] of sessions.entries()) {
            if (now > session.expiresAt) {
                deleteSession(token);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
        }
        
        return cleanedCount;
    } catch (error) {
        console.error('❌ Session cleanup error:', error.message);
        return 0;
    }
}

/**
 * Get session statistics
 * @returns {Object} Session statistics
 */
export function getSessionStats() {
    return {
        totalSessions: sessions.size,
        totalApiKeys: apiKeys.size,
        maxSessions: SESSION_CONFIG.maxSessions,
        sessionMaxAge: SESSION_CONFIG.maxAge,
        cleanupInterval: SESSION_CONFIG.cleanupInterval
    };
}