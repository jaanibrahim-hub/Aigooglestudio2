/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Backend API configuration
const BACKEND_BASE_URL = 'https://5000-i39kfzrghbubkmyjd0sc1-6532622b.e2b.dev/api';

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
    version: string;
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
        console.error('Session initialization error:', error);
        throw new Error(`Failed to initialize session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if session is valid
 */
export async function validateSession(): Promise<boolean> {
    if (!sessionToken) {
        return false;
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/auth/validate`, {
            method: 'GET',
            headers: {
                'X-Session-Token': sessionToken,
            },
        });

        const data = await response.json();
        return data.valid === true;
    } catch (error) {
        console.error('Session validation error:', error);
        return false;
    }
}

/**
 * Create a Replicate prediction through the backend
 */
export async function createPrediction(predictionData: PredictionRequest): Promise<PredictionResponse> {
    if (!sessionToken) {
        throw new Error('No active session. Please initialize with API key first.');
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to create prediction`);
        }

        return await response.json();
    } catch (error) {
        console.error('Prediction creation error:', error);
        throw new Error(`Failed to create prediction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get prediction status through the backend
 */
export async function getPredictionStatus(predictionId: string): Promise<PredictionResponse> {
    if (!sessionToken) {
        throw new Error('No active session. Please initialize with API key first.');
    }

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/replicate/predictions/${predictionId}`, {
            method: 'GET',
            headers: {
                'X-Session-Token': sessionToken,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: Failed to get prediction status`);
        }

        return await response.json();
    } catch (error) {
        console.error('Prediction status error:', error);
        throw new Error(`Failed to get prediction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
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