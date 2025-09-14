/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modern AES-256-GCM Encryption System for Virtual Try-On Backend
 * Designed for Cloudflare deployment with proper security practices
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment or generate a secure one
 */
function getEncryptionKey() {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) {
        // If hex string provided, convert to buffer
        if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
            return Buffer.from(envKey, 'hex');
        }
        // If base64 provided
        if (envKey.length === 44 && envKey.endsWith('=')) {
            return Buffer.from(envKey, 'base64');
        }
        // Otherwise, hash it to get consistent 32 bytes
        return crypto.createHash('sha256').update(envKey).digest();
    }
    
    // Generate a new key for development (not recommended for production)
    console.warn('⚠️  No ENCRYPTION_KEY found in environment, generating temporary key');
    return crypto.randomBytes(KEY_LENGTH);
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {Object} Encrypted data with metadata
 */
export function encryptData(plaintext) {
    try {
        if (!plaintext || typeof plaintext !== 'string') {
            throw new Error('Invalid plaintext: must be a non-empty string');
        }

        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: ALGORITHM
        };
    } catch (error) {
        console.error('❌ Encryption error:', error.message);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data encrypted with encryptData function
 * @param {Object} encryptedData - Object containing encrypted data and metadata
 * @returns {string} Decrypted plaintext
 */
export function decryptData(encryptedData) {
    try {
        const { encrypted, iv, authTag, algorithm } = encryptedData;
        
        if (!encrypted || !iv || !authTag) {
            throw new Error('Invalid encrypted data: missing required fields');
        }
        
        if (algorithm && algorithm !== ALGORITHM) {
            throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
        
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('❌ Decryption error:', error.message);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Create a secure hash of data for verification
 * @param {string} data - Data to hash
 * @returns {string} SHA-256 hash in hex format
 */
export function createSecureHash(data) {
    if (!data || typeof data !== 'string') {
        throw new Error('Invalid data for hashing');
    }
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a cryptographically secure random token
 * @param {number} length - Length in bytes (default: 32)
 * @returns {string} Random token in hex format
 */
export function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate Replicate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid format
 */
export function validateReplicateKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }
    
    // Replicate keys start with 'r8_' and are followed by alphanumeric characters
    return /^r8_[A-Za-z0-9]+$/.test(apiKey) && apiKey.length >= 10;
}

/**
 * Securely compare two strings to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
export function secureCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    
    if (a.length !== b.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}