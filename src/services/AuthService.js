import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api-client';

export const AuthService = {
  // Login user
  login: async (credentials) => {
    try {
      const data = await api.post('/api/auth/login', credentials, { requireAuth: false });
      return data;
    } catch (error) {
      console.error('AuthService.login error:', error);
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const data = await api.post('/api/auth/forgot-password', { email }, { requireAuth: false });
      return data;
    } catch (error) {
      console.error('AuthService.forgotPassword error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'authToken']);
    } catch (error) {
      console.error('AuthService.logout error:', error);
      throw error;
    }
  },

  // Get stored user data
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('AuthService.getCurrentUser error:', error);
      return null;
    }
  },

  // Get stored auth token
  getAuthToken: async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('AuthService.getAuthToken error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      const authenticated = !!(user && token);
      return authenticated;
    } catch (error) {
      console.error('AuthService.isAuthenticated error:', error);
      return false;
    }
  },

  // Store user data and token
  storeAuthData: async (userData, token) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('AuthService.storeAuthData error:', error);
      throw error;
    }
  },
};
