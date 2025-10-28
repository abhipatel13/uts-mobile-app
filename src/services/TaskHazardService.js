import { TaskHazardApi } from './TaskHazardApi';
import DatabaseService from './DatabaseService';
import { ApiError } from '../lib/api-client';
import NetInfo from '@react-native-community/netinfo';
import { AuthService } from './AuthService';

/**
 * Hybrid Task Hazard Service
 * Handles both online API calls and offline SQLite storage
 * Automatically tries API first, falls back to cache if offline
 */
export const TaskHazardService = {
  /**
   * Convert a local DB record back into API payload shape
   */
  buildApiPayloadFromLocal: (item) => {
    const metadata = item.metadata ? (() => { try { return JSON.parse(item.metadata); } catch { return {}; } })() : {};
    
    // Get risks from metadata (which stores the full original data)
    let risks = metadata.risks ?? [];
    
    // If risks is not an array or is empty, try to parse from hazards field
    if (!Array.isArray(risks) || risks.length === 0) {
      const parsedHazards = Array.isArray(item.hazards) ? item.hazards : (() => { try { return item.hazards ? JSON.parse(item.hazards) : []; } catch { return []; } })();
      if (parsedHazards.length > 0) {
        risks = parsedHazards;
      }
    }
    
    // Ensure risks is always a non-empty array (API requirement)
    if (!Array.isArray(risks) || risks.length === 0) {
      risks = [{
        hazard: 'No hazards specified',
        control: 'No controls specified',
        asIsLikelihood: 1,
        asIsConsequence: 1,
        toBeReviewDate: new Date().toISOString(),
        responsiblePerson: item.supervisor || metadata.supervisor || 'Not assigned'
      }];
    }

    return {
      taskName: metadata.taskName ?? item.task_name ?? null,
      scopeOfWork: metadata.scopeOfWork ?? item.task_name ?? null,
      supervisor: item.supervisor ?? metadata.supervisor ?? null,
      individual: metadata.individual ?? null,
      location: item.location ?? metadata.location ?? null,
      date: item.date ?? metadata.date ?? null,
      time: metadata.time ?? null,
      status: item.status ?? metadata.status ?? 'draft',
      risks: risks,
      assetSystem: metadata.assetSystem ?? null,
      systemLockoutRequired: metadata.systemLockoutRequired ?? false,
      trainedWorkforce: metadata.trainedWorkforce ?? false,
      geoFenceLimit: metadata.geoFenceLimit ?? 200,
      riskLevel: item.risk_level ?? metadata.riskLevel ?? null,
      createdBy: item.created_by ?? metadata.createdBy ?? null,
    };
  },

  /**
   * Get all task hazards - tries API first, falls back to local cache
   */
  getAll: async (params = {}) => {
    try {
      // Check authentication first
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        console.warn('TaskHazardService: User not authenticated, skipping API calls');
        // Return cached data only
        const cachedTaskHazards = await TaskHazardService.getTaskHazardsFromCache();
        return {
          data: cachedTaskHazards,
          source: 'cache',
          cached: true,
          offline: true
        };
      }

      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      // Try to fetch from API first
      try {
        const response = await TaskHazardApi.getAll(params);
        const apiTaskHazards = response.data || [];

        // Cache the task hazards in SQLite for offline use (clear existing data first)
        await TaskHazardService.cacheTaskHazards(apiTaskHazards, true);

        return {
          data: apiTaskHazards,
          source: 'api',
          cached: true
        };
      } catch (apiError) {
        // Check if it's an authentication error - if so, re-throw it to trigger logout
        if (apiError.code === 'AUTH_EXPIRED' || apiError.status === 401) {
          console.warn('Authentication expired - user will be logged out');
          throw apiError;
        }
        
        // Fall through to cache for other errors
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
      console.error('Error in TaskHazardService.getAll:', error);
      throw error;
    }
  },

  /**
   * Cache task hazards to SQLite database
   * @param {Array} taskHazards - Array of task hazards to cache
   * @param {boolean} clearExisting - Whether to clear existing data first (default: false)
   */
  cacheTaskHazards: async (taskHazards, clearExisting = false) => {
    try {
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      if (!Array.isArray(taskHazards) || taskHazards.length === 0) {
        return;
      }

      // Only clear existing task hazards when explicitly requested (e.g., initial API fetch)
      if (clearExisting) {
        await DatabaseService.executeQuery('DELETE FROM task_hazards');
      }

      // Insert all task hazards
      for (const taskHazard of taskHazards) {
        const taskHazardData = {
          id: taskHazard._id || taskHazard.id,
          task_name: taskHazard.taskName || taskHazard.scopeOfWork || 'Unnamed Task',
          location: taskHazard.location || '',
          date: taskHazard.date || new Date().toISOString(),
          supervisor: taskHazard.supervisor || '',
          hazards: JSON.stringify(taskHazard.risks || taskHazard.hazards || []),
          controls: JSON.stringify(taskHazard.controls || []),
          risk_level: taskHazard.riskLevel || 'Low',
          status: taskHazard.status || 'draft',
          created_by: taskHazard.createdBy || '',
          synced: 1,
          // Store all extra data as metadata including the full risks array
          metadata: JSON.stringify({
            scopeOfWork: taskHazard.scopeOfWork,
            taskName: taskHazard.taskName,
            time: taskHazard.time,
            individual: taskHazard.individual,
            risks: taskHazard.risks || [], // Store complete risks array
            assetSystem: taskHazard.assetSystem,
            systemLockoutRequired: taskHazard.systemLockoutRequired,
            trainedWorkforce: taskHazard.trainedWorkforce,
            geoFenceLimit: taskHazard.geoFenceLimit,
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
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      const cachedTaskHazards = await DatabaseService.getAll('task_hazards', 'status != ?', ['deleted']);
      
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
          risks: metadata.risks || hazards, // Use risks from metadata, fallback to hazards
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
        // Check if it's an authentication error - if so, re-throw it to trigger logout
        if (apiError.code === 'AUTH_EXPIRED' || apiError.status === 401) {
          console.warn('Authentication expired - user will be logged out');
          throw apiError;
        }
        
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
   * Create new task hazard (works both online and offline)
   */
  create: async (data) => {
    try {
      // Check authentication first
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated. Please login again.');
      }

      // Try to create on server first
      try {
        const response = await TaskHazardApi.create(data);
        
        // Add to cache with synced flag
        if (response.data) {
          await TaskHazardService.cacheTaskHazards([response.data]);
        }

        return response;
      } catch (apiError) {
        // If offline or network error, save locally
        const isNetworkError = apiError.message?.toLowerCase().includes('network') || 
                              apiError.message?.toLowerCase().includes('fetch') ||
                              apiError.code === 'NETWORK_ERROR';
        
        if (isNetworkError) {
          // Generate a temporary ID
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Save to local database with synced = 0
          const localTaskHazard = {
            id: tempId,
            task_name: data.taskName || data.scopeOfWork || 'Unnamed Task',
            location: data.location || '',
            date: data.date || new Date().toISOString(),
            supervisor: data.supervisor || '',
            hazards: JSON.stringify(data.risks || data.hazards || []),
            controls: JSON.stringify(data.controls || []),
            risk_level: data.riskLevel || 'Low',
            status: data.status || 'draft',
            created_by: data.createdBy || '',
            synced: 0, // Mark as not synced
            metadata: JSON.stringify({
              ...data,
              risks: data.risks || data.hazards || [], // Ensure risks are stored
              _offline: true,
              _createdOffline: new Date().toISOString()
            })
          };

          await DatabaseService.insert('task_hazards', localTaskHazard);
          
          // Return a response-like object
          return {
            data: {
              _id: tempId,
              id: tempId,
              ...data,
              _offline: true,
              _pendingSync: true
            },
            status: true,
            message: 'Task hazard saved offline. Will sync when online.'
          };
        }
        
        // If not a network error, throw it
        throw apiError;
      }
    } catch (error) {
      console.error('Error creating task hazard:', error);
      throw error;
    }
  },

  /**
   * Update task hazard (works both online and offline)
   */
  update: async (id, data) => {
    try {
      // Check authentication first
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated. Please login again.');
      }

      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        // Update on server
        const response = await TaskHazardApi.update(id, data);
        if (response && response.data) {
          // Update cache
          await TaskHazardService.cacheTaskHazards([response.data]);
        }
        return response;
      } else {
        // Update locally when offline
        const updateData = {
          task_name: data.taskName || data.scopeOfWork || null,
          location: data.location || null,
          date: data.date || null,
          supervisor: data.supervisor || null,
          hazards: data.risks ? JSON.stringify(data.risks) : (data.hazards ? JSON.stringify(data.hazards) : null),
          controls: data.controls ? JSON.stringify(data.controls) : null,
          risk_level: data.riskLevel || null,
          status: data.status || null,
          created_by: data.createdBy || null,
          metadata: JSON.stringify({
            ...data,
            risks: data.risks || data.hazards || [], // Ensure risks are stored
            time: data.time,
            individual: data.individual
          }),
          synced: 0,
          updated_at: Math.floor(Date.now() / 1000)
        };

        await DatabaseService.update('task_hazards', id, updateData);
        
        // Add to sync queue
        await DatabaseService.insert('sync_queue', {
          entity_type: 'task_hazard',
          entity_id: id,
          operation: 'update',
          data: JSON.stringify(updateData)
        });

        return { data: { id, ...updateData }, source: 'offline' };
      }
    } catch (error) {
      console.error('Error in TaskHazardService.update:', error);
      throw error;
    }
  },

  /**
   * Delete task hazard (works both online and offline)
   */
  delete: async (id) => {
    try {
      // Check authentication first
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated. Please login again.');
      }

      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        // Delete from server
        await TaskHazardApi.delete(id);
        // Remove from cache
        await DatabaseService.delete('task_hazards', id);
        return { success: true };
      } else {
        // If it's a temp ID (created offline but not yet synced), just delete it locally
        if (id && typeof id === 'string' && id.startsWith('temp_')) {
          await DatabaseService.delete('task_hazards', id);
          // Also remove from sync queue if it was there
          await DatabaseService.executeQuery(
            'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
            ['task_hazard', id]
          );
          return { success: true, source: 'offline' };
        }
        
        // For items that exist on server, mark for deletion when offline
        await DatabaseService.update('task_hazards', id, { 
          synced: 0, 
          status: 'deleted',
          updated_at: Math.floor(Date.now() / 1000)
        });
        
        // Add to sync queue
        await DatabaseService.insert('sync_queue', {
          entity_type: 'task_hazard',
          entity_id: id,
          operation: 'delete',
          data: JSON.stringify({ id })
        });

        return { success: true, source: 'offline' };
      }
    } catch (error) {
      console.error('Error in TaskHazardService.delete:', error);
      throw error;
    }
  },

  /**
   * Delete task hazard universal (works both online and offline)
   */
  deleteUniversal: async (id) => {
    try {
      // Check authentication first
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated. Please login again.');
      }

      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        // Delete from server
        await TaskHazardApi.deleteUniversal(id);
        // Remove from cache
        await DatabaseService.delete('task_hazards', id);
        return { success: true };
      } else {
        // If it's a temp ID (created offline but not yet synced), just delete it locally
        if (id && typeof id === 'string' && id.startsWith('temp_')) {
          await DatabaseService.delete('task_hazards', id);
          // Also remove from sync queue if it was there
          await DatabaseService.executeQuery(
            'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
            ['task_hazard', id]
          );
          return { success: true, source: 'offline' };
        }
        
        // For items that exist on server, mark for deletion when offline
        await DatabaseService.update('task_hazards', id, { 
          synced: 0, 
          status: 'deleted',
          updated_at: Math.floor(Date.now() / 1000)
        });
        
        // Add to sync queue for universal delete
        await DatabaseService.insert('sync_queue', {
          entity_type: 'task_hazard',
          entity_id: id,
          operation: 'delete_universal',
          data: JSON.stringify({ id, universal: true })
        });

        return { success: true, source: 'offline' };
      }
    } catch (error) {
      console.error('Error in TaskHazardService.deleteUniversal:', error);
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
  },

  /**
   * Sync pending (offline-created/updated/deleted) task hazards to server
   * Only syncs when device is online
   */
  syncPendingTaskHazards: async () => {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      if (!isOnline) {
        return { synced: 0, message: 'Offline - sync will happen when online' };
      }

      const unsyncedTaskHazards = await DatabaseService.getAll('task_hazards', 'synced = ?', [0]);
      
      if (unsyncedTaskHazards.length === 0) {
        return { synced: 0, failed: 0 };
      }
      
      let syncedCount = 0;
      let failedCount = 0;

      for (const localTaskHazard of unsyncedTaskHazards) {
        try {
          let metadata = {};
          try {
            metadata = JSON.parse(localTaskHazard.metadata || '{}');
          } catch (e) {
            console.warn('Failed to parse metadata for task hazard:', localTaskHazard.id);
            failedCount++;
            continue;
          }

          // Check if this is a deleted item
          if (localTaskHazard.status === 'deleted') {
            try {
              // If it's a temp ID, it was never created on server, so just remove locally
              if (localTaskHazard.id && typeof localTaskHazard.id === 'string' && localTaskHazard.id.startsWith('temp_')) {
                // Remove from local database
                await DatabaseService.delete('task_hazards', localTaskHazard.id);
                
                // Remove from sync queue
                await DatabaseService.executeQuery(
                  'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
                  ['task_hazard', localTaskHazard.id]
                );
                
                syncedCount++;
                continue;
              }
              
              // For real IDs, try to delete from server
              try{
                // Check if it's a universal delete
                if (metadata._universalDelete) {
                  await TaskHazardApi.deleteUniversal(localTaskHazard.id);
                } else {
                  await TaskHazardApi.delete(localTaskHazard.id);
                }
              } catch (apiError) {
                // If the item doesn't exist on server (404/400), treat as successful deletion
                const isNotFound = apiError.status === 404 || 
                                  apiError.status === 400 ||
                                  apiError.message?.toLowerCase().includes('not found') ||
                                  apiError.message?.toLowerCase().includes('does not exist');
                
                if (isNotFound) {
                  // Item not found on server, removing locally
                } else {
                  // Re-throw if it's a different error
                  throw apiError;
                }
              }
              
              // Remove from local database
              await DatabaseService.delete('task_hazards', localTaskHazard.id);
              
              // Remove from sync queue
              await DatabaseService.executeQuery(
                'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
                ['task_hazard', localTaskHazard.id]
              );
              
              syncedCount++;
            } catch (deleteError) {
              console.error(`❌ Failed to delete task hazard ${localTaskHazard.id}:`, deleteError.message);
              console.error('Stack:', deleteError.stack);
              failedCount++;
            }
            continue;
          }

          // Validate metadata has required fields for create/update
          if (!metadata || Object.keys(metadata).length === 0) {
            console.warn('Empty metadata for task hazard:', localTaskHazard.id);
            failedCount++;
            continue;
          }

          // Check if this is a new item (temp ID) or an update
          if (localTaskHazard.id && typeof localTaskHazard.id === 'string' && localTaskHazard.id.startsWith('temp_')) {
            // This is a new item, create it
            const apiPayload = TaskHazardService.buildApiPayloadFromLocal(localTaskHazard);
            
            // Mark as synced immediately to prevent concurrent sync from processing it again
            await DatabaseService.update('task_hazards', localTaskHazard.id, { synced: 1 });
            
            try {
              const response = await TaskHazardApi.create(apiPayload);
              
              if (response && response.data) {
                // IMPORTANT: Delete temp record and remove from sync queue FIRST to prevent duplicates
                await DatabaseService.delete('task_hazards', localTaskHazard.id);
                await DatabaseService.executeQuery(
                  'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
                  ['task_hazard', localTaskHazard.id]
                );
                
                // Then add the server version to cache (don't clear existing)
                await TaskHazardService.cacheTaskHazards([response.data], false);
                
                syncedCount++;
              }
            } catch (createError) {
              // If creation failed, revert synced flag so it can be retried
              await DatabaseService.update('task_hazards', localTaskHazard.id, { synced: 0 });
              throw createError;
            }
          } else {
            // This is an update to an existing item
            const apiPayload = TaskHazardService.buildApiPayloadFromLocal(localTaskHazard);

            // Mark as synced immediately to prevent concurrent sync from processing it again
            await DatabaseService.update('task_hazards', localTaskHazard.id, { synced: 1 });
            
            try {
              const response = await TaskHazardApi.update(localTaskHazard.id, apiPayload);
              
              if (response && response.data) {
                // Update cache with server version (don't clear existing)
                await TaskHazardService.cacheTaskHazards([response.data], false);
                
                // Remove from sync queue
                await DatabaseService.executeQuery(
                  'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
                  ['task_hazard', localTaskHazard.id]
                );
                
                syncedCount++;
              }
            } catch (updateError) {
              // If update failed, revert synced flag so it can be retried
              await DatabaseService.update('task_hazards', localTaskHazard.id, { synced: 0 });
              throw updateError;
            }
          }
        } catch (error) {
          const message = error?.message?.toLowerCase?.() || '';
          const isNetworkError = message.includes('network request failed') || message.includes('network') || message.includes('fetch');
          if (isNetworkError) {
            // do not increment failed; keep pending
          } else {
            console.error(`❌ Failed to sync task hazard ${localTaskHazard.id}:`);
            console.error('Error:', error?.message || error);
            console.error('Stack:', error?.stack);
            failedCount++;
          }
        }
      }

      return { synced: syncedCount, failed: failedCount, message: `Synced ${syncedCount} task hazards` };
    } catch (error) {
      console.error('Error syncing pending task hazards:', error);
      const msg = error?.message?.toLowerCase?.() || '';
      if (msg.includes('network')) {
        return { synced: 0, failed: 0, offline: true, message: 'Offline - will retry' };
      }
      return { synced: 0, failed: 0, message: 'Sync failed', error: error.message };
    }
  },

  /**
   * Get count of pending (unsynced) task hazards
   */
  getPendingCount: async () => {
    try {
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      const pendingItems = await DatabaseService.getAll('task_hazards', 'synced = ?', [0]);
      return pendingItems.length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  },

  /**
   * Check for network connectivity and sync pending items
   */
  checkAndSync: async () => {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      if (isOnline) {
        const pendingCount = await TaskHazardService.getPendingCount();
        if (pendingCount > 0) {
          return await TaskHazardService.syncPendingTaskHazards();
        }
      }
      return { synced: 0, message: 'No pending items to sync' };
    } catch (error) {
      console.error('Error in checkAndSync:', error);
      return { synced: 0, message: 'Sync failed', error: error.message };
    }
  },

  /**
   * Start automatic sync monitoring
   */
  startAutoSync: () => {
    // Check for sync every 30 seconds when online
    const syncInterval = setInterval(async () => {
      try {
        const isOnline = await NetInfo.fetch().then(state => state.isConnected);
        if (isOnline) {
          const result = await TaskHazardService.checkAndSync();
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Also listen for network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        TaskHazardService.checkAndSync();
      }
    });

    return () => {
      clearInterval(syncInterval);
      unsubscribe();
    };
  }
};

