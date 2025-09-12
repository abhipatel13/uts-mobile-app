import { api } from '../lib/api-client';

export const RiskAssessmentApi = {
  // Create new risk assessment
  create: async (data) => {
    return api.post('/api/risk-assessments', data);
  },

  // Get all risk assessments
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/risk-assessments${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get all risk assessments (for universal users)
  getAllUniversal: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/risk-assessments/universal${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get a specific risk assessment
  getOne: async (id) => {
    return api.get(`/api/risk-assessments/${id}`);
  },

  // Update a risk assessment
  update: async (id, data) => {
    return api.put(`/api/risk-assessments/${id}`, { ...data, id });
  },

  // Delete a risk assessment
  delete: async (id) => {
    return api.delete(`/api/risk-assessments/${id}`);
  },

  // Delete a risk assessment (universal user)
  deleteUniversal: async (id) => {
    return api.delete(`/api/risk-assessments/universal/${id}`);
  },
};
