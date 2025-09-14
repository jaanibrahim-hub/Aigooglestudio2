/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

// Generate a secure encryption key - in production, this should be from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // 32 bytes key for AES-256
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {string} text - The text to encrypt
 * @returns {Object} - Object containing encrypted data and metadata
 */
export function encrypt(text) {
    try {
        const iv = crypto.randomBytes(16); // Initialization vector
        const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypts data encrypted with encrypt function
 * @param {Object} encryptedData - Object containing encrypted data and metadata
 * @returns {string} - Decrypted text
 */
export function decrypt(encryptedData) {
    try {
        const { encrypted, iv, authTag } = encryptedData;
        const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
        
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Creates a hash of sensitive data for verification
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
export function createHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generates a secure random token
 * @param {number} length - Length of the token in bytes
 * @returns {string} - Random token in hex format
 */
export function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}