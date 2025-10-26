/**
 * ProxyFlow API Client
 * Handles all communication with FastAPI backend
 */

const API_BASE_URL = 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
    this.apiKey = localStorage.getItem('apiKey');
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  /**
   * Set API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    if (apiKey) {
      localStorage.setItem('apiKey', apiKey);
    } else {
      localStorage.removeItem('apiKey');
    }
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Bearer token if available
    if (this.token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          data.detail || data.message || 'Request failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, error);
    }
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  /**
   * Register new user
   * POST /auth/register
   */
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
    return response;
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    
    // Save tokens
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    if (response.api_key) {
      this.setApiKey(response.api_key);
    }
    
    return response;
  }

  // ============================================
  // USER ENDPOINTS
  // ============================================

  /**
   * Get current user info
   * GET /user/me
   */
  async getMe() {
    return this.request('/user/me');
  }

  /**
   * Get user subscription info
   * GET /user/subscription
   */
  async getSubscription() {
    return this.request('/user/subscription');
  }

  /**
   * Get user usage statistics
   * GET /user/stats
   */
  async getStats() {
    return this.request('/user/stats');
  }

  /**
   * Update user subscription
   * PUT /user/subscription
   */
  async updateSubscription(data) {
    return this.request('/user/subscription', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // PROXY ENDPOINTS
  // ============================================

  /**
   * Get proxies
   * POST /proxy/get
   */
  async getProxies(proxyRequest) {
    if (!this.apiKey) {
      throw new ApiError('API key not found', 401);
    }

    return this.request('/proxy/get', {
      method: 'POST',
      body: JSON.stringify(proxyRequest),
      headers: {
        'X-API-Key': this.apiKey,
      },
      skipAuth: true, // Using API key instead
    });
  }

  /**
   * Get available proxy types
   * GET /proxy/types
   */
  async getProxyTypes() {
    return this.request('/proxy/types');
  }

  // ============================================
  // SYSTEM ENDPOINTS
  // ============================================

  /**
   * Health check
   * GET /health
   */
  async healthCheck() {
    return this.request('/health', { skipAuth: true });
  }

  /**
   * Clear all stored credentials
   */
  logout() {
    this.token = null;
    this.apiKey = null;
    localStorage.removeItem('token');
    localStorage.removeItem('apiKey');
    localStorage.removeItem('tokenExpiry');
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isValidationError() {
    return this.status === 422 || this.status === 400;
  }

  get isServerError() {
    return this.status >= 500;
  }
}

// Export singleton instance
const api = new ApiClient();

export default api;
export { ApiError };