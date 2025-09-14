/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { encrypt, decrypt, createHash } from './encryption.js';

// In-memory storage (in production, use a secure database)
const apiKeyStorage = new Map();
const sessionTokens = new Map();

/**
 * Securely stores the Replicate API key with encryption
 * @param {string} sessionToken - Unique session token
 * @param {string} apiKey - The Replicate API key to store
 * @returns {Object} - Success status and session info
 */
export function storeApiKey(sessionToken, apiKey) {
    try {
        // Validate API key format (Replicate keys start with 'r8_')
        if (!apiKey || !apiKey.startsWith('r8_')) {
            throw new Error('Invalid Replicate API key format');
        }

        // Encrypt the API key
        const encryptedKey = encrypt(apiKey);
        
        // Store with session token
        apiKeyStorage.set(sessionToken, {
            encrypted: encryptedKey,
            hash: createHash(apiKey),
            timestamp: Date.now(),
            lastUsed: Date.now()
        });

        // Track session
        sessionTokens.set(sessionToken, {
            created: Date.now(),
            lastActivity: Date.now(),
            apiKeySet: true
        });

        console.log(`API key securely stored for session: ${sessionToken.substring(0, 8)}...`);
        
        return {
            success: true,
            message: 'API key stored securely',
            sessionToken
        };
    } catch (error) {
        console.error('Error storing API key:', error);
        throw new Error('Failed to store API key securely');
    }
}

/**
 * Retrieves and decrypts the API key for a session
 * @param {string} sessionToken - Session token
 * @returns {string} - Decrypted API key
 */
export function getApiKey(sessionToken) {
    try {
        const storedData = apiKeyStorage.get(sessionToken);
        
        if (!storedData) {
            throw new Error('API key not found for session');
        }

        // Update last used timestamp
        storedData.lastUsed = Date.now();
        apiKeyStorage.set(sessionToken, storedData);

        // Update session activity
        const session = sessionTokens.get(sessionToken);
        if (session) {
            session.lastActivity = Date.now();
            sessionTokens.set(sessionToken, session);
        }

        // Decrypt and return the API key
        return decrypt(storedData.encrypted);
    } catch (error) {
        console.error('Error retrieving API key:', error);
        throw new Error('Failed to retrieve API key');
    }
}

/**
 * Validates if a session has a valid API key
 * @param {string} sessionToken - Session token to validate
 * @returns {boolean} - True if session has valid API key
 */
export function validateSession(sessionToken) {
    const storedData = apiKeyStorage.get(sessionToken);
    const session = sessionTokens.get(sessionToken);
    
    if (!storedData || !session) {
        return false;
    }

    // Use activity-based expiration: 7 days of inactivity (much more generous)
    const maxInactivity = 7 * 24 * 60 * 60 * 1000; // 7 days
    const inactiveTime = Date.now() - session.lastActivity;
    
    // Session is valid if it has been active within the last 7 days
    if (inactiveTime < maxInactivity) {
        // Update last activity to extend the session
        session.lastActivity = Date.now();
        sessionTokens.set(sessionToken, session);
        
        // Also update the API key storage last used time
        storedData.lastUsed = Date.now();
        apiKeyStorage.set(sessionToken, storedData);
        
        return true;
    }
    
    return false;
}

/**
 * Cleans up expired sessions and API keys
 */
export function cleanupExpiredSessions() {
    // Clean up sessions that have been inactive for more than 7 days
    const maxInactivity = 7 * 24 * 60 * 60 * 1000; // 7 days
    // Also clean up sessions older than 30 days regardless of activity (absolute max)
    const maxAbsoluteAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();
    
    let cleanedCount = 0;
    
    for (const [token, session] of sessionTokens.entries()) {
        const inactiveTime = now - session.lastActivity;
        const totalAge = now - session.created;
        
        // Remove if inactive for 7+ days OR older than 30 days total
        if (inactiveTime > maxInactivity || totalAge > maxAbsoluteAge) {
            sessionTokens.delete(token);
            apiKeyStorage.delete(token);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired sessions (inactive >7 days or >30 days old)`);
    }
}

/**
 * Removes API key and session data
 * @param {string} sessionToken - Session token to remove
 */
export function removeSession(sessionToken) {
    apiKeyStorage.delete(sessionToken);
    sessionTokens.delete(sessionToken);
    console.log(`Session removed: ${sessionToken.substring(0, 8)}...`);
}

// Run cleanup every 6 hours (less aggressive)
setInterval(cleanupExpiredSessions, 6 * 60 * 60 * 1000);