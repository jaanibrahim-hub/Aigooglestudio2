/**
 * Cloudflare Worker Backend for Virtual Try-On App
 * Handles Replicate API calls and session management
 */

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
  'Access-Control-Max-Age': '86400',
};

// Generate a secure session token
function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate and sanitize API key
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid API key format');
  }
  
  // Replicate API keys should start with 'r8_'
  if (!apiKey.startsWith('r8_')) {
    throw new Error('Invalid Replicate API key format');
  }
  
  return apiKey.trim();
}

// Create error response
function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ 
    success: false, 
    error: message 
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Create success response
function successResponse(data, status = 200) {
  return new Response(JSON.stringify({ 
    success: true, 
    ...data 
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Handle CORS preflight requests
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Initialize session with API key
async function handleAuthInit(request, env) {
  try {
    const { apiKey } = await request.json();
    
    // Validate API key
    const validatedKey = validateApiKey(apiKey);
    
    // Generate session token
    const sessionToken = generateSessionToken();
    
    // Store in KV with 24-hour expiration (86400 seconds)
    const sessionData = {
      apiKey: validatedKey,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    await env.SESSIONS.put(
      sessionToken, 
      JSON.stringify(sessionData), 
      { expirationTtl: 86400 } // 24 hours in seconds
    );
    
    return successResponse({
      sessionToken,
      expiresIn: '24h',
      message: 'Session initialized successfully'
    });
    
  } catch (error) {
    console.error('Auth init error:', error);
    return errorResponse(error.message || 'Failed to initialize session');
  }
}

// Validate session
async function handleAuthValidate(request, env) {
  try {
    const sessionToken = request.headers.get('X-Session-Token');
    
    if (!sessionToken) {
      return errorResponse('No session token provided', 401);
    }
    
    const sessionData = await env.SESSIONS.get(sessionToken);
    
    if (!sessionData) {
      return errorResponse('Invalid or expired session', 401);
    }
    
    const session = JSON.parse(sessionData);
    
    // Check if session is still valid
    if (Date.now() > session.expiresAt) {
      await env.SESSIONS.delete(sessionToken);
      return errorResponse('Session expired', 401);
    }
    
    return successResponse({
      valid: true,
      expiresAt: session.expiresAt,
      message: 'Session is valid'
    });
    
  } catch (error) {
    console.error('Auth validate error:', error);
    return errorResponse('Session validation failed', 401);
  }
}

// Refresh session (extend expiration)
async function handleAuthRefresh(request, env) {
  try {
    const sessionToken = request.headers.get('X-Session-Token');
    
    if (!sessionToken) {
      return errorResponse('No session token provided', 401);
    }
    
    const sessionData = await env.SESSIONS.get(sessionToken);
    
    if (!sessionData) {
      return errorResponse('Invalid or expired session', 401);
    }
    
    const session = JSON.parse(sessionData);
    
    // Extend session by 24 hours
    session.expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    
    await env.SESSIONS.put(
      sessionToken, 
      JSON.stringify(session), 
      { expirationTtl: 86400 }
    );
    
    return successResponse({
      message: 'Session refreshed successfully',
      expiresAt: session.expiresAt
    });
    
  } catch (error) {
    console.error('Auth refresh error:', error);
    return errorResponse('Failed to refresh session');
  }
}

// Logout and clear session
async function handleAuthLogout(request, env) {
  try {
    const sessionToken = request.headers.get('X-Session-Token');
    
    if (sessionToken) {
      await env.SESSIONS.delete(sessionToken);
    }
    
    return successResponse({
      message: 'Session cleared successfully'
    });
    
  } catch (error) {
    console.error('Auth logout error:', error);
    return errorResponse('Failed to logout');
  }
}

// Get API key from session
async function getApiKeyFromSession(sessionToken, env) {
  if (!sessionToken) {
    throw new Error('No session token provided');
  }
  
  const sessionData = await env.SESSIONS.get(sessionToken);
  
  if (!sessionData) {
    throw new Error('Invalid or expired session');
  }
  
  const session = JSON.parse(sessionData);
  
  if (Date.now() > session.expiresAt) {
    await env.SESSIONS.delete(sessionToken);
    throw new Error('Session expired');
  }
  
  return session.apiKey;
}

// Handle Replicate prediction creation
async function handleReplicateCreatePrediction(request, env) {
  try {
    const sessionToken = request.headers.get('X-Session-Token');
    const apiKey = await getApiKeyFromSession(sessionToken, env);
    
    const requestBody = await request.json();
    
    // Extract model from request and construct the correct endpoint
    const model = requestBody.model || 'google/nano-banana';
    const apiUrl = `https://api.replicate.com/v1/models/${model}/predictions`;
    
    // Prepare request body for Replicate API (only input, no model field)
    const replicateRequestBody = {
      input: requestBody.input
    };
    
    // Make request to Replicate API using the correct endpoint
    const replicateResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(replicateRequestBody),
    });
    
    const responseData = await replicateResponse.json();
    
    if (!replicateResponse.ok) {
      throw new Error(responseData.detail || 'Replicate API error');
    }
    
    return new Response(JSON.stringify(responseData), {
      status: replicateResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Replicate create prediction error:', error);
    return errorResponse(error.message || 'Failed to create prediction');
  }
}

// Handle Replicate prediction status check
async function handleReplicateGetPrediction(request, env, predictionId) {
  try {
    const sessionToken = request.headers.get('X-Session-Token');
    const apiKey = await getApiKeyFromSession(sessionToken, env);
    
    // Make request to Replicate API
    const replicateResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    const responseData = await replicateResponse.json();
    
    if (!replicateResponse.ok) {
      throw new Error(responseData.detail || 'Replicate API error');
    }
    
    return new Response(JSON.stringify(responseData), {
      status: replicateResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Replicate get prediction error:', error);
    return errorResponse(error.message || 'Failed to get prediction status');
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return handleOptions();
      }

      // Health check
      if (path === '/' || path === '/health') {
        return successResponse({
          message: 'Virtual Try-On Backend is running',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
      }

      // Auth routes
      if (path === '/api/auth/init' && method === 'POST') {
        return handleAuthInit(request, env);
      }

      if (path === '/api/auth/validate' && method === 'GET') {
        return handleAuthValidate(request, env);
      }

      if (path === '/api/auth/refresh' && method === 'POST') {
        return handleAuthRefresh(request, env);
      }

      if (path === '/api/auth/logout' && method === 'POST') {
        return handleAuthLogout(request, env);
      }

      // Replicate routes
      if (path === '/api/replicate/predictions' && method === 'POST') {
        return handleReplicateCreatePrediction(request, env);
      }

      if (path.startsWith('/api/replicate/predictions/') && method === 'GET') {
        const predictionId = path.split('/').pop();
        return handleReplicateGetPrediction(request, env, predictionId);
      }

      // 404 for unknown routes
      return errorResponse('Route not found', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse('Internal server error', 500);
    }
  },
};