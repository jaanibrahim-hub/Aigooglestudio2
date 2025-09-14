/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import axios from 'axios';
import { getApiKey, validateSession } from '../utils/apiKeyManager.js';

const router = express.Router();

// Replicate API configuration
const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

/**
 * Middleware to validate session and extract API key
 */
const validateApiKey = (req, res, next) => {
    try {
        const sessionToken = req.headers['x-session-token'];
        
        if (!sessionToken) {
            return res.status(401).json({
                error: 'Session token required',
                message: 'Please provide X-Session-Token header'
            });
        }

        if (!validateSession(sessionToken)) {
            return res.status(401).json({
                error: 'Invalid or expired session',
                message: 'Please re-authenticate'
            });
        }

        // Get the decrypted API key
        const apiKey = getApiKey(sessionToken);
        req.replicateApiKey = apiKey;
        next();
    } catch (error) {
        console.error('API key validation error:', error);
        res.status(401).json({
            error: 'Authentication failed',
            message: 'Unable to validate API key'
        });
    }
};

/**
 * Create a prediction (proxy to Replicate API)
 */
router.post('/predictions', validateApiKey, async (req, res) => {
    try {
        const { model, version, input } = req.body;

        if (!input) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Input is required'
            });
        }

        // Determine the correct endpoint
        let endpoint;
        let requestBody;

        if (model) {
            // Use model path (e.g., "google/nano-banana")
            endpoint = `${REPLICATE_API_BASE}/models/${model}/predictions`;
            requestBody = { input };
            console.log('Creating prediction for model:', model);
        } else if (version) {
            // Use version ID (legacy format)
            endpoint = `${REPLICATE_API_BASE}/predictions`;
            requestBody = { version, input };
            console.log('Creating prediction for version:', version);
        } else {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Either model or version is required'
            });
        }

        const response = await axios.post(endpoint, requestBody, {
            headers: {
                'Authorization': `Token ${req.replicateApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000 // 30 seconds timeout
        });

        res.json(response.data);
    } catch (error) {
        console.error('Prediction creation error:', error.response?.data || error.message);
        
        if (error.response) {
            res.status(error.response.status).json({
                error: 'Replicate API error',
                message: error.response.data?.detail || 'Failed to create prediction',
                status: error.response.status
            });
        } else {
            res.status(500).json({
                error: 'Network error',
                message: 'Failed to connect to Replicate API'
            });
        }
    }
});

/**
 * Get prediction status (proxy to Replicate API)
 */
router.get('/predictions/:id', validateApiKey, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: 'Missing prediction ID',
                message: 'Prediction ID is required'
            });
        }

        const response = await axios.get(`${REPLICATE_API_BASE}/predictions/${id}`, {
            headers: {
                'Authorization': `Token ${req.replicateApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000 // 15 seconds timeout
        });

        res.json(response.data);
    } catch (error) {
        console.error('Prediction status error:', error.response?.data || error.message);
        
        if (error.response) {
            res.status(error.response.status).json({
                error: 'Replicate API error',
                message: error.response.data?.detail || 'Failed to get prediction status',
                status: error.response.status
            });
        } else {
            res.status(500).json({
                error: 'Network error',
                message: 'Failed to connect to Replicate API'
            });
        }
    }
});

/**
 * Cancel a prediction (proxy to Replicate API)
 */
router.post('/predictions/:id/cancel', validateApiKey, async (req, res) => {
    try {
        const { id } = req.params;

        const response = await axios.post(`${REPLICATE_API_BASE}/predictions/${id}/cancel`, {}, {
            headers: {
                'Authorization': `Token ${req.replicateApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Prediction cancellation error:', error.response?.data || error.message);
        
        if (error.response) {
            res.status(error.response.status).json({
                error: 'Replicate API error',
                message: error.response.data?.detail || 'Failed to cancel prediction'
            });
        } else {
            res.status(500).json({
                error: 'Network error',
                message: 'Failed to connect to Replicate API'
            });
        }
    }
});

export default router;