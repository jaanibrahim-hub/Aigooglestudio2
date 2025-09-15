/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Backend API configuration - Cloudflare Worker deployed backend
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://virtual-tryon-backend.kiakiaa1290.workers.dev/api';

// Session management
let sessionToken: string | null = localStorage.getItem('session_token');

interface BackendResponse<T = any> {
    success?: boolean;
    error?: string;
    message?: string;
    data?: T;
}

interface SessionData {
    sessionToken: string;
    expiresIn: string;
}

interface PredictionRequest {
    model?: string;
    version?: string;
    input: Record<string, any>;
}

interface PredictionResponse {
    id: string;
    version: string;
    input: Record<string, any>;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output?: any;
    error?: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

/**
 * Initialize session with Replicate API key (replaces localStorage API key)
 */
export async function initializeSession(apiKey: string): Promise<SessionData> {
    try {
        // First try the backend API
        const response = await fetch(`${BACKEND_BASE_URL}/auth/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ apiKey }),
        });

        const data: BackendResponse<SessionData> = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to initialize session');
        }

        // Store session token securely
        sessionToken = data.sessionToken!;
        localStorage.setItem('session_token', sessionToken);
        
        // Remove old replicate API key from localStorage for security
        localStorage.removeItem('replicate_api_key');

        return {
            sessionToken: sessionToken,
            expiresIn: data.expiresIn || '24h'
        };
    } catch (error) {
        console.error('Backend connection failed, falling back to direct API:', error);
        
        // Fallback: Store API key directly (temporary solution)
        sessionToken = `fallback_${Date.now()}`;
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('replicate_api_key_fallback', apiKey);
        
        return {
            sessionToken: sessionToken,
            expiresIn: '24h'
        };
    }
}

/**
 * Check if session is valid and automatically refresh if needed
 */
export async function validateSession(): Promise<boolean> {
    if (!sessionToken) {
        return false;
    }

    // For fallback mode, check if we have the API key stored
    if (sessionToken.startsWith('fallback_')) {
        const fallbackApiKey = localStorage.getItem('replicate_api_key_fallback');
        return Boolean(fallbackApiKey);
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'X-Session-Token': sessionToken,
            },
        });

        if (response.status === 429) {
            // Rate limited - but this doesn't mean session is invalid
            console.warn('Session validation rate limited - assuming session is still valid');
            return true; // Assume session is valid if we're just rate limited
        }

        const data = await response.json();
        const isValid = data.valid === true;
        
        // If valid, automatically refresh the session to extend it
        if (isValid) {
            try {
                await refreshSession();
            } catch (refreshError) {
                console.warn('Session refresh failed, but session is still valid:', refreshError);
            }
        }
        
        return isValid;
    } catch (error) {
        console.error('Backend validation error, checking fallback mode:', error);
        
        // If backend validation fails, check if we can use fallback mode
        const fallbackApiKey = localStorage.getItem('replicate_api_key_fallback');
        if (fallbackApiKey) {
            console.log('Using fallback mode for session validation');
            return true;
        }
        
        return false;
    }
}

/**
 * Refresh session to extend expiration
 */
export async function refreshSession(): Promise<void> {
    if (!sessionToken) {
        throw new Error('No active session to refresh');
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'X-Session-Token': sessionToken,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to refresh session');
        }

        console.log('✅ Session refreshed successfully');
    } catch (error) {
        console.error('Session refresh error:', error);
        throw error;
    }
}

/**
 * Create a Replicate prediction through the backend
 */
export async function createPrediction(predictionData: PredictionRequest): Promise<PredictionResponse> {
    if (!sessionToken) {
        throw new Error('No active session. Please initialize with API key first.');
    }

    // Check if we're using fallback mode (when backend is not available)
    const fallbackApiKey = localStorage.getItem('replicate_api_key_fallback');
    if (sessionToken.startsWith('fallback_') && fallbackApiKey) {
        return createDirectPrediction(predictionData, fallbackApiKey);
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/replicate/predictions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': sessionToken,
            },
            body: JSON.stringify(predictionData),
        });

        if (response.status === 429) {
            const errorData = await response.json();
            if (errorData.message?.includes('Replicate')) {
                throw new Error('Replicate API is busy. The system will automatically retry. Please wait a moment...');
            }
            throw new Error('Server is busy, please wait a moment and try again');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to create prediction`);
        }

        return await response.json();
    } catch (error) {
        console.error('Backend prediction creation error, trying fallback:', error);
        
        // Fallback to direct API if backend fails
        if (fallbackApiKey) {
            return createDirectPrediction(predictionData, fallbackApiKey);
        }
        
        throw new Error(`Failed to create prediction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Direct Replicate API call (fallback when backend is not available)
 */
async function createDirectPrediction(predictionData: PredictionRequest, apiKey: string): Promise<PredictionResponse> {
    try {
        // Use the correct model endpoint format
        const model = predictionData.model || 'google/nano-banana';
        const apiUrl = `https://api.replicate.com/v1/models/${model}/predictions`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                input: predictionData.input,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}: Failed to create prediction`);
        }

        return await response.json();
    } catch (error) {
        console.error('Direct Replicate API error:', error);
        throw new Error(`Failed to create prediction via direct API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get prediction status through the backend
 */
export async function getPredictionStatus(predictionId: string): Promise<PredictionResponse> {
    if (!sessionToken) {
        throw new Error('No active session. Please initialize with API key first.');
    }

    // Check if we're using fallback mode
    const fallbackApiKey = localStorage.getItem('replicate_api_key_fallback');
    if (sessionToken.startsWith('fallback_') && fallbackApiKey) {
        return getDirectPredictionStatus(predictionId, fallbackApiKey);
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/replicate/predictions/${predictionId}`, {
            method: 'GET',
            headers: {
                'X-Session-Token': sessionToken,
            },
        });

        if (response.status === 429) {
            const errorData = await response.json();
            if (errorData.message?.includes('Replicate')) {
                throw new Error('Replicate API is busy. The system will automatically retry. Please wait a moment...');
            }
            throw new Error('Server is busy, please wait a moment and try again');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to get prediction status`);
        }

        return await response.json();
    } catch (error) {
        console.error('Backend prediction status error, trying fallback:', error);
        
        // Fallback to direct API if backend fails
        if (fallbackApiKey) {
            return getDirectPredictionStatus(predictionId, fallbackApiKey);
        }
        
        throw new Error(`Failed to get prediction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Direct Replicate API status check (fallback when backend is not available)
 */
async function getDirectPredictionStatus(predictionId: string, apiKey: string): Promise<PredictionResponse> {
    try {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}: Failed to get prediction status`);
        }

        return await response.json();
    } catch (error) {
        console.error('Direct Replicate API status error:', error);
        throw new Error(`Failed to get prediction status via direct API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Poll for prediction completion
 */
export async function pollForCompletion(
    predictionId: string,
    onUpdate?: (prediction: PredictionResponse) => void,
    maxAttempts: number = 120,
    interval: number = 2500
): Promise<PredictionResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const prediction = await getPredictionStatus(predictionId);
            
            if (onUpdate) {
                onUpdate(prediction);
            }

            if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
                return prediction;
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            console.error(`Polling attempt ${attempt + 1} failed:`, error);
            
            // If it's the last attempt, throw the error
            if (attempt === maxAttempts - 1) {
                throw error;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    throw new Error('Prediction polling timed out');
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
    try {
        if (sessionToken) {
            await fetch(`${BACKEND_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'X-Session-Token': sessionToken,
                },
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear local session data
        sessionToken = null;
        localStorage.removeItem('session_token');
        localStorage.removeItem('replicate_api_key'); // Clean up old key
    }
}

/**
 * Check if user has an active session
 */
export function hasActiveSession(): boolean {
    return Boolean(sessionToken && localStorage.getItem('session_token'));
}

/**
 * Get current session token (for debugging)
 */
export function getSessionToken(): string | null {
    return sessionToken;
}