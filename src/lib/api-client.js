import AsyncStorage from '@react-native-async-storage/async-storage';

// Get auth token from AsyncStorage
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// API client configuration
const API_BASE_URL = 'https://18.188.112.65.nip.io';

// API error class
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Unified API client function
 * Handles authentication, error handling, and response parsing consistently
 */
export async function apiClient(endpoint, options = {}) {
  const { body, requireAuth = true, headers = {}, ...fetchOptions } = options;

  // Build URL
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Prepare headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if required
  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Prepare request options
  const requestOptions = {
    ...fetchOptions,
    headers: requestHeaders,
  };

  // Handle body serialization
  if (body !== undefined) {
    if (body instanceof FormData) {
      // Remove Content-Type for FormData to let browser set boundary
      delete requestHeaders['Content-Type'];
      requestOptions.body = body;
    } else {
      requestOptions.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, requestOptions);

    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Handle HTTP errors
    if (!response.ok) {
      // Handle authentication errors
      if (data?.code === 'INVALID_TOKEN' || data?.code === 'TOKEN_EXPIRED') {
        // Clear auth data and navigate to login
        await AsyncStorage.multiRemove(['user', 'authToken']);
        throw new ApiError(
          'Authentication expired. Please login again.',
          401,
          'AUTH_EXPIRED'
        );
      }

      // Handle other errors
      const errorMessage =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data?.code);
    }

    return data;
  } catch (error) {
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

// Convenience methods for common HTTP verbs
export const api = {
  get: (endpoint, options = {}) =>
    apiClient(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    apiClient(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint, body, options = {}) =>
    apiClient(endpoint, { ...options, method: 'PUT', body }),

  patch: (endpoint, body, options = {}) =>
    apiClient(endpoint, { ...options, method: 'PATCH', body }),

  delete: (endpoint, options = {}) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
