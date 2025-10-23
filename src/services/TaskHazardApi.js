import { api } from '../lib/api-client';

export const TaskHazardApi = {
  // Create new task hazard
  create: async (data) => {
    return api.post('/api/task-hazards', data);
  },

  // Get all task hazards
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/task-hazards${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get task hazards by company (for universal users)
  getByCompany: async (companyId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/task-hazards/company/${companyId}${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get a specific task hazard
  getOne: async (id) => {
    return api.get(`/api/task-hazards/${id}`);
  },

  // Update a task hazard
  update: async (id, data) => {
    return api.put(`/api/task-hazards/${id}`, { ...data, id });
  },

  // Delete a task hazard
  delete: async (id) => {
    return api.delete(`/api/task-hazards/${id}`);
  },

  // Delete a task hazard (universal user)
  deleteUniversal: async (id) => {
    return api.delete(`/api/task-hazards/universal/${id}`);
  },

  // Get supervisor approvals
  getApprovals: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/api/task-hazards/approvals${queryParams ? `?${queryParams}` : ''}`);
  },

  // Process approval (approve/reject)
  processApproval: async (taskHazardId, data) => {
    try {
      // Ensure taskHazardId is a string and not undefined
      const safeTaskHazardId = String(taskHazardId);
      if (!safeTaskHazardId || safeTaskHazardId === 'undefined' || safeTaskHazardId === 'null') {
        throw new Error('Invalid task hazard ID provided');
      }
      
      // Include the task hazard ID in the request body as well
      const requestData = {
        ...data,
        taskHazardId: safeTaskHazardId,
        id: safeTaskHazardId
      };
      
      const approvalUrl = `/api/task-hazards/${safeTaskHazardId}/approval`;
      
      // Try PUT first, if it fails, try POST
      let response;
      try {
        response = await api.put(approvalUrl, requestData);
      } catch (putError) {
        response = await api.post(approvalUrl, requestData);
      }
      return response;
    } catch (error) {
      console.error('TaskHazardApi.processApproval error:', error);
      throw error;
    }
  },

  // Get approval history for a task hazard
  getApprovalHistory: async (id) => {
    return api.get(`/api/task-hazards/${id}/approval-history`);
  },
};
