import { TaskHazardApi } from './TaskHazardApi';
import DatabaseService from './DatabaseService';
import { ApiError } from '../lib/api-client';
import NetInfo from '@react-native-community/netinfo';

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
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        console.log('Database not ready, waiting...');
        await DatabaseService.waitForDatabaseReady();
      }

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
      console.error('Error in TaskHazardService.getAll:', error);
      throw error;
    }
  },

  /**
   * Cache task hazards to SQLite database
   */
  cacheTaskHazards: async (taskHazards) => {
    try {
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        console.log('Database not ready for cache write, waiting...');
        await DatabaseService.waitForDatabaseReady();
      }

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
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        console.log('Database not ready for cache read, waiting...');
        await DatabaseService.waitForDatabaseReady();
      }

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
   * Create new task hazard (works both online and offline)
   */
  create: async (data) => {
    try {
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
            hazards: JSON.stringify(data.hazards || []),
            controls: JSON.stringify(data.controls || []),
            risk_level: data.riskLevel || 'Low',
            status: data.status || 'draft',
            created_by: data.createdBy || '',
            synced: 0, // Mark as not synced
            metadata: JSON.stringify({
              ...data,
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
      // Try to update on server first
      try {
        const response = await TaskHazardApi.update(id, data);
        
        // Update cache
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
          // Check if the task hazard exists locally
          const existingTaskHazard = await DatabaseService.getById('task_hazards', id);
          
          if (!existingTaskHazard) {
            throw new Error('Task hazard not found locally. Please sync your data first.');
          }

          // Update local database with synced = 0
          const updatedTaskHazard = {
            task_name: data.taskName || data.scopeOfWork || existingTaskHazard.task_name,
            location: data.location || existingTaskHazard.location,
            date: data.date || existingTaskHazard.date,
            supervisor: data.supervisor || existingTaskHazard.supervisor,
            hazards: JSON.stringify(data.hazards || []),
            controls: JSON.stringify(data.controls || []),
            risk_level: data.riskLevel || existingTaskHazard.risk_level,
            status: data.status || existingTaskHazard.status,
            created_by: data.createdBy || existingTaskHazard.created_by,
            synced: 0, // Mark as not synced
            updated_at: Math.floor(Date.now() / 1000),
            metadata: JSON.stringify({
              ...data,
              _offline: true,
              _updatedOffline: new Date().toISOString(),
              _originalId: id
            })
          };

          await DatabaseService.update('task_hazards', id, updatedTaskHazard);
          
          // Add to sync queue for update operation
          await DatabaseService.addToSyncQueue('task_hazard', id, 'update', {
            ...updatedTaskHazard,
            id: id
          });
          
          // Return a response-like object
          return {
            data: {
              ...updatedTaskHazard,
              id: id,
              _offline: true,
              _pendingSync: true
            },
            source: 'offline',
            message: 'Updated locally - will sync when online'
          };
        } else {
          // Re-throw non-network errors
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error updating task hazard:', error);
      throw error;
    }
  },

  /**
   * Delete task hazard (works both online and offline)
   */
  delete: async (id) => {
    try {
      // Check if it's a temp ID first - these were never on the server
      if (id && typeof id === 'string' && id.startsWith('temp_')) {
        // For temp IDs, just delete locally (they were never on server)
        await DatabaseService.delete('task_hazards', id);
        
        // Remove from sync queue if it exists
        await DatabaseService.executeQuery(
          'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
          ['task_hazard', id]
        );
        
        return {
          data: {
            id: id,
            status: 'deleted',
            _offline: true,
            _tempDeleted: true
          },
          source: 'offline',
          message: 'Deleted locally (was never synced to server)'
        };
      }

      // Try to delete on server first
      try {
        const response = await TaskHazardApi.delete(id);
        
        // Remove from cache
        await DatabaseService.delete('task_hazards', id);

        return response;
      } catch (apiError) {
        // Check if it's a "not found" error (400 or 404)
        const isNotFoundError = apiError.status === 400 || 
                               apiError.status === 404 ||
                               apiError.message?.toLowerCase().includes('not found') ||
                               apiError.message?.toLowerCase().includes('does not exist');
        
        // If offline, network error, or not found error, handle locally
        const isNetworkError = apiError.message?.toLowerCase().includes('network') || 
                              apiError.message?.toLowerCase().includes('fetch') ||
                              apiError.code === 'NETWORK_ERROR';
        
        if (isNetworkError || isNotFoundError) {
          // Check if the task hazard exists locally
          const existingTaskHazard = await DatabaseService.getById('task_hazards', id);
          
          if (!existingTaskHazard) {
            throw new Error('Task hazard not found locally. Please sync your data first.');
          }

          // For real IDs, mark as deleted locally (soft delete)
          await DatabaseService.update('task_hazards', id, {
            status: 'deleted',
            synced: 0, // Mark as not synced
            updated_at: Math.floor(Date.now() / 1000),
            metadata: JSON.stringify({
              ...JSON.parse(existingTaskHazard.metadata || '{}'),
              _offline: true,
              _deletedOffline: new Date().toISOString(),
              _originalId: id
            })
          });
          
          // Add to sync queue for delete operation
          await DatabaseService.addToSyncQueue('task_hazard', id, 'delete', {
            id: id,
            status: 'deleted'
          });
          
          // Return a response-like object
          return {
            data: {
              id: id,
              status: 'deleted',
              _offline: true,
              _pendingSync: true
            },
            source: 'offline',
            message: 'Deleted locally - will sync when online'
          };
        } else {
          // Re-throw non-network errors
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error deleting task hazard:', error);
      throw error;
    }
  },

  /**
   * Delete task hazard universal (works both online and offline)
   */
  deleteUniversal: async (id) => {
    try {
      // Check if it's a temp ID first - these were never on the server
      if (id && typeof id === 'string' && id.startsWith('temp_')) {
        // For temp IDs, just delete locally (they were never on server)
        await DatabaseService.delete('task_hazards', id);
        
        // Remove from sync queue if it exists
        await DatabaseService.executeQuery(
          'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
          ['task_hazard', id]
        );
        
        return {
          data: {
            id: id,
            status: 'deleted',
            _offline: true,
            _tempDeleted: true
          },
          source: 'offline',
          message: 'Deleted locally (was never synced to server)'
        };
      }

      // Try to delete on server first
      try {
        const response = await TaskHazardApi.deleteUniversal(id);
        
        // Remove from cache
        await DatabaseService.delete('task_hazards', id);

        return response;
      } catch (apiError) {
        // Check if it's a "not found" error (400 or 404)
        const isNotFoundError = apiError.status === 400 || 
                               apiError.status === 404 ||
                               apiError.message?.toLowerCase().includes('not found') ||
                               apiError.message?.toLowerCase().includes('does not exist');
        
        // If offline, network error, or not found error, handle locally
        const isNetworkError = apiError.message?.toLowerCase().includes('network') || 
                              apiError.message?.toLowerCase().includes('fetch') ||
                              apiError.code === 'NETWORK_ERROR';
        
        if (isNetworkError || isNotFoundError) {
          // Check if the task hazard exists locally
          const existingTaskHazard = await DatabaseService.getById('task_hazards', id);
          
          if (!existingTaskHazard) {
            throw new Error('Task hazard not found locally. Please sync your data first.');
          }

          // For real IDs, mark as deleted locally (soft delete)
          await DatabaseService.update('task_hazards', id, {
            status: 'deleted',
            synced: 0, // Mark as not synced
            updated_at: Math.floor(Date.now() / 1000),
            metadata: JSON.stringify({
              ...JSON.parse(existingTaskHazard.metadata || '{}'),
              _offline: true,
              _deletedOffline: new Date().toISOString(),
              _originalId: id,
              _universalDelete: true
            })
          });
          
          // Add to sync queue for universal delete operation
          await DatabaseService.addToSyncQueue('task_hazard', id, 'delete_universal', {
            id: id,
            status: 'deleted',
            universal: true
          });
          
          // Return a response-like object
          return {
            data: {
              id: id,
              status: 'deleted',
              _offline: true,
              _pendingSync: true
            },
            source: 'offline',
            message: 'Deleted locally - will sync when online'
          };
        } else {
          // Re-throw non-network errors
          throw apiError;
        }
      }
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
  },

  /**
   * Sync pending (offline-created/updated/deleted) task hazards to server
   * Only syncs when device is online
   */
  syncPendingTaskHazards: async () => {
    try {
      // Get all unsynced task hazards
      const unsyncedTaskHazards = await DatabaseService.getAll('task_hazards', 'synced = 0');
      
      if (unsyncedTaskHazards.length === 0) {
        return { synced: 0, failed: 0 };
      }

      // Check if we're online by attempting to fetch existing data
      let isOnline = false;
      try {
        await TaskHazardApi.getAll({ limit: 1 });
        isOnline = true;
      } catch (error) {
        const isNetworkError = error.message?.toLowerCase().includes('network') || 
                              error.message?.toLowerCase().includes('fetch') ||
                              error.code === 'NETWORK_ERROR';
        
        if (isNetworkError) {
          return { synced: 0, failed: 0, offline: true };
        }
        // If it's not a network error, we might still be online (could be auth or other error)
        isOnline = true;
      }

      if (!isOnline) {
        return { synced: 0, failed: 0, offline: true };
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
              // Check if it's a universal delete
              if (metadata._universalDelete) {
                await TaskHazardApi.deleteUniversal(localTaskHazard.id);
              } else {
                await TaskHazardApi.delete(localTaskHazard.id);
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
            const response = await TaskHazardApi.create(metadata);
            
            if (response.data) {
              // Delete the temp local record
              await DatabaseService.delete('task_hazards', localTaskHazard.id);
              
              // Add the server version to cache
              await TaskHazardService.cacheTaskHazards([response.data]);
              
              // Remove from sync queue
              await DatabaseService.executeQuery(
                'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
                ['task_hazard', localTaskHazard.id]
              );
              
              syncedCount++;
            }
          } else {
            // This is an update to an existing item
            const response = await TaskHazardApi.update(localTaskHazard.id, metadata);
            
            if (response.data) {
              // Update the local record with synced flag
              await DatabaseService.update('task_hazards', localTaskHazard.id, {
                synced: 1,
                updated_at: Math.floor(Date.now() / 1000)
              });
              
              // Update cache with server version
              await TaskHazardService.cacheTaskHazards([response.data]);
              
              // Remove from sync queue
              await DatabaseService.executeQuery(
                'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
                ['task_hazard', localTaskHazard.id]
              );
              
              syncedCount++;
            }
          }
        } catch (error) {
          // Check if it's a network error - if so, device went offline during sync
          const isNetworkError = error.message?.toLowerCase().includes('network') || 
                                error.message?.toLowerCase().includes('fetch') ||
                                error.code === 'NETWORK_ERROR';
          
          if (isNetworkError) {
            // Don't count as failed - just not synced yet
          } else {
            console.error(`❌ Failed to sync task hazard ${localTaskHazard.id}:`, error.message);
            failedCount++;
          }
        }
      }

      return { synced: syncedCount, failed: failedCount };
    } catch (error) {
      console.error('Error syncing pending task hazards:', error);
      return { synced: 0, failed: 0, error: error.message };
    }
  },

  /**
   * Get count of pending (unsynced) task hazards
   */
  getPendingCount: async () => {
    try {
      const result = await DatabaseService.selectQuery(
        'SELECT COUNT(*) as count FROM task_hazards WHERE synced = 0'
      );
      return result[0]?.count || 0;
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

