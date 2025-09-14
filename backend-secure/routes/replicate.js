/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Replicate API Routes for Virtual Try-On Backend
 * Handles secure communication with Replicate API with rate limiting
 */

import express from 'express';
import axios from 'axios';
import { getApiKey, validateSession } from '../utils/sessionManager.js';
import { 
    replicateRateLimit, 
    validateSessionToken 
} from '../middleware/security.js';

const router = express.Router();

// Replicate API configuration
const REPLICATE_API_BASE = 'https://api.replicate.com/v1';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays in ms

/**
 * Create axios instance for Replicate API
 */
function createReplicateClient(apiKey) {
    return axios.create({
        baseURL: REPLICATE_API_BASE,
        headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Virtual-TryOn-Backend/2.0'
        },
        timeout: 30000 // 30 second timeout
    });
}

/**
 * Handle Replicate API requests with retry logic
 */
async function makeReplicateRequest(apiKey, requestFn, maxRetries = MAX_RETRIES) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = createReplicateClient(apiKey);
            return await requestFn(client);
        } catch (error) {
            lastError = error;
            
            // Log the attempt
            console.warn(`⚠️  Replicate API attempt ${attempt}/${maxRetries} failed:`, error.message);
            
            // Check if it's a rate limit error
            if (error.response?.status === 429) {
                const retryAfter = parseInt(error.response.headers['retry-after']) || RETRY_DELAYS[attempt - 1] / 1000;
                
                if (attempt === maxRetries) {
                    throw new Error(`Replicate API rate limit exceeded. Please wait ${retryAfter} seconds and try again.`);
                }
                
                console.log(`⏱️  Rate limited, waiting ${retryAfter} seconds before retry ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            }
            
            // Check if it's a temporary server error (5xx)
            if (error.response?.status >= 500 && attempt < maxRetries) {
                const delay = RETRY_DELAYS[attempt - 1];
                console.log(`🔄 Server error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // For other errors, don't retry
            break;
        }
    }
    
    // All retries failed
    throw lastError;
}

/**
 * POST /api/replicate/predictions
 * Create a new prediction
 */
router.post('/predictions', replicateRateLimit, validateSessionToken, async (req, res) => {
    try {
        const { sessionToken } = req;
        const { model, version, input } = req.body;
        
        // Validate session and get API key
        const sessionValidation = validateSession(sessionToken);
        if (!sessionValidation.valid) {
            return res.status(401).json({
                error: 'Invalid session',
                message: sessionValidation.error || 'Session validation failed'
            });
        }
        
        // Get decrypted API key
        const apiKey = getApiKey(sessionToken);
        
        // Validate request body
        if (!input || typeof input !== 'object') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Input is required and must be an object'
            });
        }
        
        // Prepare prediction request
        const predictionData = {
            input
        };
        
        // Add model/version if provided
        if (model) {
            predictionData.model = model;
        }
        if (version) {
            predictionData.version = version;
        }
        
        console.log(`🎯 Creating prediction for session: ${sessionToken.substring(0, 8)}...`);
        
        // Make request to Replicate API with retry logic
        const response = await makeReplicateRequest(apiKey, async (client) => {
            return await client.post('/predictions', predictionData);
        });
        
        console.log(`✅ Prediction created: ${response.data.id}`);
        
        res.status(201).json(response.data);
        
    } catch (error) {
        console.error('❌ Prediction creation error:', error.message);
        
        if (error.response) {
            // Replicate API error
            const status = error.response.status;
            const data = error.response.data;
            
            res.status(status).json({
                error: 'Replicate API Error',
                message: data.detail || error.message,
                ...(data && { details: data })
            });
        } else if (error.message.includes('rate limit')) {
            res.status(429).json({
                error: 'Rate Limit Exceeded',
                message: error.message
            });
        } else {
            res.status(500).json({
                error: 'Prediction Failed',
                message: 'Failed to create prediction'
            });
        }
    }
});

/**
 * GET /api/replicate/predictions/:id
 * Get prediction status and result
 */
router.get('/predictions/:id', replicateRateLimit, validateSessionToken, async (req, res) => {
    try {
        const { sessionToken } = req;
        const { id } = req.params;
        
        // Validate session and get API key
        const sessionValidation = validateSession(sessionToken);
        if (!sessionValidation.valid) {
            return res.status(401).json({
                error: 'Invalid session',
                message: sessionValidation.error || 'Session validation failed'
            });
        }
        
        // Get decrypted API key
        const apiKey = getApiKey(sessionToken);
        
        // Validate prediction ID
        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Prediction ID is required'
            });
        }
        
        console.log(`📊 Getting prediction status: ${id}`);
        
        // Make request to Replicate API with retry logic
        const response = await makeReplicateRequest(apiKey, async (client) => {
            return await client.get(`/predictions/${id}`);
        });
        
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ Prediction status error:', error.message);
        
        if (error.response) {
            // Replicate API error
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 404) {
                res.status(404).json({
                    error: 'Prediction Not Found',
                    message: 'The specified prediction was not found'
                });
            } else {
                res.status(status).json({
                    error: 'Replicate API Error',
                    message: data.detail || error.message,
                    ...(data && { details: data })
                });
            }
        } else if (error.message.includes('rate limit')) {
            res.status(429).json({
                error: 'Rate Limit Exceeded',
                message: error.message
            });
        } else {
            res.status(500).json({
                error: 'Status Check Failed',
                message: 'Failed to get prediction status'
            });
        }
    }
});

/**
 * DELETE /api/replicate/predictions/:id
 * Cancel a prediction
 */
router.delete('/predictions/:id', replicateRateLimit, validateSessionToken, async (req, res) => {
    try {
        const { sessionToken } = req;
        const { id } = req.params;
        
        // Validate session and get API key
        const sessionValidation = validateSession(sessionToken);
        if (!sessionValidation.valid) {
            return res.status(401).json({
                error: 'Invalid session',
                message: sessionValidation.error || 'Session validation failed'
            });
        }
        
        // Get decrypted API key
        const apiKey = getApiKey(sessionToken);
        
        console.log(`🛑 Canceling prediction: ${id}`);
        
        // Make request to Replicate API
        const response = await makeReplicateRequest(apiKey, async (client) => {
            return await client.post(`/predictions/${id}/cancel`);
        });
        
        console.log(`✅ Prediction canceled: ${id}`);
        
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ Prediction cancellation error:', error.message);
        
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            res.status(status).json({
                error: 'Replicate API Error',
                message: data.detail || error.message,
                ...(data && { details: data })
            });
        } else {
            res.status(500).json({
                error: 'Cancellation Failed',
                message: 'Failed to cancel prediction'
            });
        }
    }
});

export default router;