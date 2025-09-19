import { api } from '../lib/api-client';

export const UserApi = {
  // Get all users
  getAll: async () => {
    return api.get('/api/users/getAllUser');
  },

  // Get a specific user
  getOne: async (id) => {
    return api.get(`/api/users/getUserById/${id}`);
  },

  // Create a new user
  create: async (userData) => {
    return api.post('/api/users/createUser', userData);
  },

  // Update user
  update: async (id, userData) => {
    return api.put(`/api/users/editUser/${id}`, userData);
  },

  // Delete user
  delete: async (id) => {
    return api.delete(`/api/users/deleteUser/${id}`);
  },

  // Reset user password
  resetPassword: async (id, newPassword) => {
    return api.put(`/api/users/resetPassword/${id}`, { newPassword });
  },

  // Update user profile (uses edit endpoint)
  updateProfile: async (userId, profileData) => {
    return api.put(`/api/users/editUser/${userId}`, profileData);
  },

  // Universal user operations
  universal: {
    // Create user in any company (universal user only)
    createUserAnyCompany: async (userData) => {
      return api.post('/api/universal/users', userData);
    },

    // Get all users across all companies (universal user only)
    getAllUsers: async () => {
      return api.get('/api/universal/users');
    },
  },
};
