import { TaskHazardApi } from './TaskHazardApi';
import DatabaseService from './DatabaseService';
import { ApiError } from '../lib/api-client';

/**
 * Hybrid Task Hazard Service
 * Handles both online API calls and offline SQLite storage
 * Automatically tries API first, falls back to cache if offline
 */
export const TaskHazardService = {
  /**
   * Get all task hazards - tries API first, falls back to local cache
   */
  getAll: async (params = {}) => {
    try {
      // Try to fetch from API first
      try {
        const response = await TaskHazardApi.getAll(params);
        const apiTaskHazards = response.data || [];

        // Cache the task hazards in SQLite for offline use
        await TaskHazardService.cacheTaskHazards(apiTaskHazards);

        return {
          data: apiTaskHazards,
          source: 'api',
          cached: true
        };
      } catch (apiError) {
        // Fall through to cache
        const cachedTaskHazards = await TaskHazardService.getTaskHazardsFromCache();
        
        if (cachedTaskHazards.length === 0) {
          // No cached data available
          throw new Error('Unable to load task hazards. Please connect to the internet to download data for offline use.');
        }
        
        return {
          data: cachedTaskHazards,
          source: 'cache',
          cached: true,
          offline: true
        };
      }
    } catch (error) {
      console.error('❌ Error in TaskHazardService.getAll:', error);
      throw error;
    }
  },

  /**
   * Cache task hazards to SQLite database
   */
  cacheTaskHazards: async (taskHazards) => {
    try {
      if (!Array.isArray(taskHazards) || taskHazards.length === 0) {
        return;
      }

      // Clear existing task hazards before caching new ones
      await DatabaseService.executeQuery('DELETE FROM task_hazards');

      // Insert all task hazards
      for (const taskHazard of taskHazards) {
        const taskHazardData = {
          id: taskHazard._id || taskHazard.id,
          task_name: taskHazard.taskName || taskHazard.scopeOfWork || 'Unnamed Task',
          location: taskHazard.location || '',
          date: taskHazard.date || new Date().toISOString(),
          supervisor: taskHazard.supervisor || '',
          hazards: JSON.stringify(taskHazard.hazards || []),
          controls: JSON.stringify(taskHazard.controls || []),
          risk_level: taskHazard.riskLevel || 'Low',
          status: taskHazard.status || 'draft',
          created_by: taskHazard.createdBy || '',
          synced: 1,
          // Store all extra data as metadata
          metadata: JSON.stringify({
            scopeOfWork: taskHazard.scopeOfWork,
            taskName: taskHazard.taskName,
            time: taskHazard.time,
            individual: taskHazard.individual,
            createdAt: taskHazard.createdAt,
            updatedAt: taskHazard.updatedAt,
            ...taskHazard
          })
        };

        try {
          await DatabaseService.insert('task_hazards', taskHazardData);
        } catch (insertError) {
          // If insert fails (duplicate), try update
          if (insertError.message.includes('UNIQUE constraint failed')) {
            await DatabaseService.update('task_hazards', taskHazardData.id, taskHazardData);
          } else {
            console.error('Error inserting task hazard:', insertError);
          }
        }
      }

    } catch (error) {
      console.error('Error caching task hazards:', error);
      throw error;
    }
  },

  /**
   * Get task hazards from local cache
   */
  getTaskHazardsFromCache: async () => {
    try {
      const cachedTaskHazards = await DatabaseService.getAll('task_hazards');
      
      if (!cachedTaskHazards || cachedTaskHazards.length === 0) {
        return [];
      }

      // Transform cached task hazards back to API format
      const taskHazards = cachedTaskHazards.map(cached => {
        let hazards = [];
        let controls = [];
        let metadata = {};
        
        try {
          hazards = JSON.parse(cached.hazards || '[]');
          controls = JSON.parse(cached.controls || '[]');
          metadata = JSON.parse(cached.metadata || '{}');
        } catch (e) {
          console.warn('Failed to parse data for task hazard:', cached.id);
        }

        // Merge all fields from metadata with base fields
        return {
          id: cached.id,
          _id: cached.id,
          taskName: cached.task_name,
          scopeOfWork: metadata.scopeOfWork || cached.task_name,
          location: cached.location,
          date: cached.date,
          time: metadata.time || '',
          supervisor: cached.supervisor,
          individual: metadata.individual || '',
          hazards: hazards,
          controls: controls,
          riskLevel: cached.risk_level,
          status: cached.status,
          createdBy: cached.created_by,
          createdAt: cached.created_at,
          updatedAt: cached.updated_at,
          // Include any other fields from metadata
          ...metadata
        };
      });

      return taskHazards;
    } catch (error) {
      console.error('Error loading task hazards from cache:', error);
      return [];
    }
  },

  /**
   * Get a specific task hazard - tries API first, falls back to cache
   */
  getOne: async (id) => {
    try {
      // Try API first
      try {
        const response = await TaskHazardApi.getOne(id);
        return {
          data: response.data,
          source: 'api'
        };
      } catch (apiError) {
        console.warn('API fetch failed, loading from cache:', apiError.message);
        
        // Load from cache
        const cachedTaskHazard = await DatabaseService.getById('task_hazards', id);
        if (!cachedTaskHazard) {
          throw new Error('Task hazard not found');
        }

        let hazards = [];
        let controls = [];
        let metadata = {};
        
        try {
          hazards = JSON.parse(cachedTaskHazard.hazards || '[]');
          controls = JSON.parse(cachedTaskHazard.controls || '[]');
          metadata = JSON.parse(cachedTaskHazard.metadata || '{}');
        } catch (e) {
          console.warn('Failed to parse data for task hazard:', id);
        }

        const taskHazard = {
          id: cachedTaskHazard.id,
          _id: cachedTaskHazard.id,
          taskName: cachedTaskHazard.task_name,
          scopeOfWork: metadata.scopeOfWork || cachedTaskHazard.task_name,
          location: cachedTaskHazard.location,
          date: cachedTaskHazard.date,
          time: metadata.time || '',
          supervisor: cachedTaskHazard.supervisor,
          individual: metadata.individual || '',
          hazards: hazards,
          controls: controls,
          riskLevel: cachedTaskHazard.risk_level,
          status: cachedTaskHazard.status,
          createdBy: cachedTaskHazard.created_by,
          ...metadata
        };

        return {
          data: taskHazard,
          source: 'cache'
        };
      }
    } catch (error) {
      console.error('Error in TaskHazardService.getOne:', error);
      throw error;
    }
  },

  /**
   * Create new task hazard (online only, with offline queue support)
   */
  create: async (data) => {
    try {
      const response = await TaskHazardApi.create(data);
      
      // Add to cache
      if (response.data) {
        await TaskHazardService.cacheTaskHazards([response.data]);
      }

      return response;
    } catch (error) {
      console.error('Error creating task hazard:', error);
      throw error;
    }
  },

  /**
   * Update task hazard (online only)
   */
  update: async (id, data) => {
    try {
      const response = await TaskHazardApi.update(id, data);
      
      // Update cache
      if (response.data) {
        await TaskHazardService.cacheTaskHazards([response.data]);
      }

      return response;
    } catch (error) {
      console.error('Error updating task hazard:', error);
      throw error;
    }
  },

  /**
   * Delete task hazard (online only)
   */
  delete: async (id) => {
    try {
      const response = await TaskHazardApi.delete(id);
      
      // Remove from cache
      await DatabaseService.delete('task_hazards', id);

      return response;
    } catch (error) {
      console.error('Error deleting task hazard:', error);
      throw error;
    }
  },

  /**
   * Delete task hazard universal (online only)
   */
  deleteUniversal: async (id) => {
    try {
      const response = await TaskHazardApi.deleteUniversal(id);
      
      // Remove from cache
      await DatabaseService.delete('task_hazards', id);

      return response;
    } catch (error) {
      console.error('Error deleting task hazard:', error);
      throw error;
    }
  },

  /**
   * Get approvals (online only)
   */
  getApprovals: async (params = {}) => {
    return await TaskHazardApi.getApprovals(params);
  },

  /**
   * Process approval (online only)
   */
  processApproval: async (taskHazardId, data) => {
    return await TaskHazardApi.processApproval(taskHazardId, data);
  },

  /**
   * Get approval history (online only)
   */
  getApprovalHistory: async (id) => {
    return await TaskHazardApi.getApprovalHistory(id);
  },

  /**
   * Check if we have cached data
   */
  hasCachedData: async () => {
    try {
      const count = await DatabaseService.selectQuery(
        'SELECT COUNT(*) as count FROM task_hazards'
      );
      return count[0]?.count > 0;
    } catch (error) {
      console.error('Error checking cached data:', error);
      return false;
    }
  },

  /**
   * Get cache info
   */
  getCacheInfo: async () => {
    try {
      const count = await DatabaseService.selectQuery(
        'SELECT COUNT(*) as count FROM task_hazards'
      );
      const lastUpdate = await DatabaseService.selectQuery(
        'SELECT MAX(updated_at) as last_update FROM task_hazards'
      );

      return {
        count: count[0]?.count || 0,
        lastUpdate: lastUpdate[0]?.last_update || null
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return { count: 0, lastUpdate: null };
    }
  },

  /**
   * Clear all cached task hazards
   */
  clearCache: async () => {
    try {
      await DatabaseService.executeQuery('DELETE FROM task_hazards');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }
};

