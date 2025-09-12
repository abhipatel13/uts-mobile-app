import { api } from '../lib/api-client';

export const TacticsApi = {
  // Create new tactic
  create: async (data) => {
    return api.post('/api/tactics', data);
  },

  // Get all tactics
  getAll: async () => {
    return api.get('/api/tactics');
  },

  // Get all tactics (for universal users)
  getAllUniversal: async () => {
    return api.get('/api/tactics/universal');
  },

  // Get a specific tactic
  getOne: async (id) => {
    return api.get(`/api/tactics/${id}`);
  },

  // Update a tactic
  update: async (id, data) => {
    return api.put(`/api/tactics/${id}`, data);
  },

  // Delete a tactic
  delete: async (id) => {
    return api.delete(`/api/tactics/${id}`);
  },
};
