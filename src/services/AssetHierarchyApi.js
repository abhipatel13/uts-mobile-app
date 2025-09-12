import { api } from '../lib/api-client';

export const AssetHierarchyApi = {
  // Create new asset
  create: async (data) => {
    return api.post('/api/asset-hierarchy', data);
  },

  // Get all assets
  getAll: async () => {
    return api.get('/api/asset-hierarchy');
  },

  // Get assets by company (for universal users)
  getByCompany: async (companyId) => {
    return api.get(`/api/asset-hierarchy/company/${companyId}`);
  },

  // Get a specific asset
  getOne: async (id) => {
    return api.get(`/api/asset-hierarchy/${id}`);
  },

  // Upload CSV file
  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/api/asset-hierarchy/upload-csv', formData);
  },

  // Get upload status by ID
  getUploadStatus: async (uploadId) => {
    return api.get(`/api/asset-hierarchy/upload-status/${uploadId}`);
  },

  // Get upload history
  getUploadHistory: async () => {
    return api.get('/api/asset-hierarchy/upload-history');
  },

  // Delete an asset (Universal User - all companies)
  deleteAssetUniversal: async (id) => {
    return api.delete(`/api/asset-hierarchy/universal/${id}`);
  },
};
