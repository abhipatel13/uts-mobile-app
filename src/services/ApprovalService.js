import { TaskHazardApi } from './TaskHazardApi';
import DatabaseService from './DatabaseService';
import NetInfo from '@react-native-community/netinfo';

/**
 * Approval Service
 * Handles both online API calls and offline SQLite storage for approvals
 */

// Sync lock to prevent multiple simultaneous syncs
let isSyncing = false;
let lastSyncTime = 0;
const SYNC_DEBOUNCE_MS = 5000; // Don't sync more than once every 5 seconds

export const ApprovalService = {
  /**
   * Get all approval requests - tries API first, falls back to local cache
   */
  getApprovals: async (params = {}) => {
    try {
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      // Try to fetch from API first
      try {
        const response = await TaskHazardApi.getApprovals(params);
        const apiApprovals = response.data?.taskHazards || [];

        // Cache the approvals in SQLite for offline use
        await ApprovalService.cacheApprovals(apiApprovals);

        return {
          data: apiApprovals,
          source: 'api',
          cached: true
        };
      } catch (apiError) {
        console.warn('Approval API failed, loading from cache:', apiError.message);
        
        // Fall back to cache
        const cachedApprovals = await ApprovalService.getApprovalsFromCache();
        
        if (cachedApprovals.length === 0) {
          // No cached data available
          throw new Error('Unable to load approval requests. Please connect to the internet to download data for offline use.');
        }
        
        return {
          data: cachedApprovals,
          source: 'cache',
          cached: true,
          offline: true
        };
      }
    } catch (error) {
      console.error('Error in ApprovalService.getApprovals:', error);
      throw error;
    }
  },

  /**
   * Cache approval requests to SQLite database
   */
  cacheApprovals: async (approvals) => {
    try {
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      if (!Array.isArray(approvals) || approvals.length === 0) {
        return;
      }

      console.log(`💾 Caching ${approvals.length} approval(s) to local database...`);

      for (const approval of approvals) {
        // Extract supervisor information
        let supervisorEmail = null;
        let supervisorName = null;

        if (approval.approvals && approval.approvals.length > 0) {
          const latestApproval = approval.approvals.find(a => a.isLatest) || approval.approvals[0];
          if (latestApproval && latestApproval.supervisor) {
            supervisorEmail = latestApproval.supervisor.email || latestApproval.supervisor;
            supervisorName = latestApproval.supervisor.name || latestApproval.supervisor;
          }
        }

        // Fallback to direct supervisor fields
        if (!supervisorEmail) {
          supervisorEmail = approval.supervisor || approval.supervisorEmail;
        }

        // Get approval status
        const latestApproval = approval.approvals?.find(a => a.isLatest) || approval.approvals?.[0];
        const approvalStatus = latestApproval?.status || approval.approvalStatus || 'pending';

        const approvalId = approval._id || approval.id;
        
        // Check if approval already exists
        const existing = await DatabaseService.getById('approvals', approvalId);

        const approvalData = {
          id: approvalId,
          task_hazard_id: approval._id || approval.id,
          scope_of_work: approval.scopeOfWork || approval.taskName || '',
          location: approval.location || '',
          date: approval.date || '',
          time: approval.time || '',
          supervisor: supervisorName || supervisorEmail || '',
          supervisor_email: supervisorEmail || '',
          approval_status: approvalStatus,
          approval_comments: latestApproval?.comments || '',
          approved_by: latestApproval?.approvedBy || latestApproval?.rejectedBy || '',
          approved_at: latestApproval?.processedAt || '',
          signature: latestApproval?.signature || '',
          risks: JSON.stringify(approval.risks || []),
          individuals: JSON.stringify(approval.individuals || []),
          synced: 1,
          metadata: JSON.stringify({
            ...approval,
            approvals: approval.approvals || []
          })
        };

        try {
          if (existing) {
            // Update existing record
            await DatabaseService.update('approvals', approvalId, approvalData);
          } else {
            // Insert new record
            await DatabaseService.insert('approvals', approvalData);
          }
        } catch (error) {
          // Silently handle any remaining UNIQUE constraint errors
          if (!error.message.includes('UNIQUE constraint failed')) {
            console.error(`Error caching approval ${approvalId}:`, error.message);
          }
        }
      }

      console.log(`✅ Successfully cached ${approvals.length} approval(s)`);
    } catch (error) {
      console.error('Error caching approvals:', error);
      // Don't throw - we want to continue even if caching fails
    }
  },

  /**
   * Get approval requests from local cache
   */
  getApprovalsFromCache: async () => {
    try {
      // Ensure database is ready before proceeding
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      const cachedApprovals = await DatabaseService.getAll('approvals');
      
      if (!cachedApprovals || cachedApprovals.length === 0) {
        return [];
      }

      // Transform cached approvals back to API format
      const approvals = cachedApprovals.map(cached => {
        let risks = [];
        let individuals = [];
        let metadata = {};
        
        try {
          risks = JSON.parse(cached.risks || '[]');
          individuals = JSON.parse(cached.individuals || '[]');
          metadata = JSON.parse(cached.metadata || '{}');
        } catch (e) {
          console.warn('Failed to parse data for approval:', cached.id);
        }

        // Merge all fields from metadata with cached fields
        return {
          id: cached.id,
          _id: cached.id,
          scopeOfWork: cached.scope_of_work,
          location: cached.location,
          date: cached.date,
          time: cached.time,
          supervisor: cached.supervisor,
          supervisorEmail: cached.supervisor_email,
          risks: risks,
          individuals: individuals,
          approvalStatus: cached.approval_status,
          requiresApproval: true,
          status: cached.approval_status === 'pending' ? 'Pending' : cached.approval_status,
          approvals: metadata.approvals || [{
            status: cached.approval_status,
            comments: cached.approval_comments,
            approvedBy: cached.approved_by,
            rejectedBy: cached.approved_by,
            processedAt: cached.approved_at,
            signature: cached.signature,
            isLatest: true,
            supervisor: {
              email: cached.supervisor_email,
              name: cached.supervisor
            }
          }],
          ...metadata
        };
      });

      return approvals;
    } catch (error) {
      console.error('Error loading approvals from cache:', error);
      return [];
    }
  },

  /**
   * Process approval (approve/reject) - works both online and offline
   */
  processApproval: async (taskHazardId, data) => {
    try {
      console.log(`🔄 Processing approval for task hazard: ${taskHazardId}`);
      console.log(`   Status: ${data.status}, By: ${data.approvedBy || data.rejectedBy}`);
      
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        // Process approval online
        try {
          console.log('📡 Attempting to process approval online...');
          const response = await TaskHazardApi.processApproval(taskHazardId, data);
          
          console.log('✅ Approval processed successfully on server');
          
          // Update cache
          await ApprovalService.updateApprovalInCache(taskHazardId, data);
          
          // Remove from sync queue if it was there
          await DatabaseService.executeQuery(
            'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
            ['approval', taskHazardId]
          );
          
          return response;
        } catch (apiError) {
          console.warn('⚠️ API approval failed, saving offline:', apiError.message);
          // If API fails, fall through to offline processing
        }
      } else {
        console.log('📴 Device is offline, saving approval locally');
      }
      
      // Process approval offline
      const cachedApproval = await DatabaseService.getById('approvals', taskHazardId);
      
      if (!cachedApproval) {
        console.error(`❌ Approval request not found in cache: ${taskHazardId}`);
        throw new Error('Approval request not found in cache. Please refresh and try again.');
      }

      const updateData = {
        approval_status: data.status === 'Approved' ? 'approved' : 'rejected',
        approval_comments: data.comments || '',
        approved_by: data.approvedBy || data.rejectedBy || '',
        approved_at: data.approvedAt || data.rejectedAt || new Date().toISOString(),
        signature: data.signature || '',
        synced: 0
      };

      console.log('💾 Saving approval to local database...');
      await DatabaseService.update('approvals', taskHazardId, updateData);
      
      // Check if already in sync queue
      const existingQueueItem = await DatabaseService.selectQuery(
        'SELECT * FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
        ['approval', taskHazardId]
      );
      
      if (existingQueueItem.length === 0) {
        // Add to sync queue
        console.log('📋 Adding approval to sync queue...');
        await DatabaseService.addToSyncQueue(
          'approval',
          taskHazardId,
          'process',
          data
        );
        console.log('✅ Approval queued for sync');
      } else {
        console.log('ℹ️ Approval already in sync queue, updating...');
        await DatabaseService.executeQuery(
          'UPDATE sync_queue SET data = ?, retry_count = 0 WHERE entity_type = ? AND entity_id = ?',
          [JSON.stringify(data), 'approval', taskHazardId]
        );
      }

      return {
        data: { id: taskHazardId, ...data },
        source: 'offline',
        message: 'Approval saved offline. Will sync when online.'
      };
    } catch (error) {
      console.error('❌ Error processing approval:', error);
      console.error('   Stack:', error.stack);
      throw error;
    }
  },

  /**
   * Update approval in cache
   */
  updateApprovalInCache: async (taskHazardId, data) => {
    try {
      const cached = await DatabaseService.getById('approvals', taskHazardId);
      
      if (!cached) {
        return;
      }

      const updateData = {
        approval_status: data.status === 'Approved' ? 'approved' : 'rejected',
        approval_comments: data.comments || '',
        approved_by: data.approvedBy || data.rejectedBy || '',
        approved_at: data.approvedAt || data.rejectedAt || new Date().toISOString(),
        signature: data.signature || '',
        synced: 1
      };

      await DatabaseService.update('approvals', taskHazardId, updateData);
    } catch (error) {
      console.error('Error updating approval in cache:', error);
    }
  },

  /**
   * Sync pending approvals to server
   */
  syncPendingApprovals: async () => {
    // Check if already syncing
    if (isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return { synced: 0, message: 'Sync already in progress' };
    }

    // Check debounce - don't sync too frequently
    const now = Date.now();
    if (now - lastSyncTime < SYNC_DEBOUNCE_MS) {
      console.log('⏱️ Sync debounced, waiting...');
      return { synced: 0, message: 'Sync debounced' };
    }

    try {
      isSyncing = true;
      lastSyncTime = now;

      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (!isOnline) {
        console.log('⚠️ Offline - approval sync will happen when online');
        return { synced: 0, message: 'Offline - sync will happen when online' };
      }

      // Get pending approvals from sync queue
      const pendingQueueItems = await DatabaseService.selectQuery(
        'SELECT * FROM sync_queue WHERE entity_type = ?',
        ['approval']
      );
      
      if (pendingQueueItems.length === 0) {
        return { synced: 0, failed: 0, message: 'No pending approvals to sync' };
      }
      
      console.log(`📤 Found ${pendingQueueItems.length} approval(s) in sync queue`);
            
      let syncedCount = 0;
      let failedCount = 0;

      for (const queueItem of pendingQueueItems) {
        try {
          // Parse the original approval data from queue
          const approvalData = JSON.parse(queueItem.data);
          const taskHazardId = queueItem.entity_id;
          
          console.log(`🔄 Syncing approval for task hazard: ${taskHazardId}`);
          console.log(`   Status: ${approvalData.status}, By: ${approvalData.approvedBy || approvalData.rejectedBy}`);
          
          // Process the approval on server
          const response = await TaskHazardApi.processApproval(taskHazardId, approvalData);
          
          console.log(`✅ Successfully synced approval for task hazard: ${taskHazardId}`);
          
          // Mark as synced in approvals table
          await DatabaseService.update('approvals', taskHazardId, { synced: 1 });
          
          // Remove from sync queue
          await DatabaseService.removeFromSyncQueue(queueItem.id);
          
          syncedCount++;
        } catch (error) {
          console.error(`❌ Failed to sync approval ${queueItem.entity_id}:`, error.message);
          console.error('   Error details:', error);
          
          // Increment retry count
          const retryCount = (queueItem.retry_count || 0) + 1;
          
          if (retryCount >= 5) {
            console.error(`   Max retries reached for approval ${queueItem.entity_id}, removing from queue`);
            await DatabaseService.removeFromSyncQueue(queueItem.id);
          } else {
            console.log(`   Retry ${retryCount}/5 for approval ${queueItem.entity_id}`);
            await DatabaseService.executeQuery(
              'UPDATE sync_queue SET retry_count = ? WHERE id = ?',
              [retryCount, queueItem.id]
            );
          }
          
          failedCount++;
        }
      }

      const message = `Synced ${syncedCount} approval(s), ${failedCount} failed`;
      console.log(`📊 Approval sync complete: ${message}`);
      
      return { synced: syncedCount, failed: failedCount, message };
    } catch (error) {
      console.error('❌ Error syncing pending approvals:', error);
      return { synced: 0, failed: 0, error: error.message };
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Get count of pending (unsynced) approvals
   */
  getPendingCount: async () => {
    try {
      if (!DatabaseService.isDatabaseReady()) {
        await DatabaseService.waitForDatabaseReady();
      }

      // Count items in sync queue for approvals
      const pendingQueueItems = await DatabaseService.selectQuery(
        'SELECT COUNT(*) as count FROM sync_queue WHERE entity_type = ?',
        ['approval']
      );
      return pendingQueueItems[0]?.count || 0;
    } catch (error) {
      console.error('Error getting pending approval count:', error);
      return 0;
    }
  },

  /**
   * Check if we have cached approval data
   */
  hasCachedData: async () => {
    try {
      const count = await DatabaseService.selectQuery(
        'SELECT COUNT(*) as count FROM approvals'
      );
      return count[0]?.count > 0;
    } catch (error) {
      console.error('Error checking cached approval data:', error);
      return false;
    }
  },

  /**
   * Clear all cached approvals
   */
  clearCache: async () => {
    try {
      await DatabaseService.executeQuery('DELETE FROM approvals');
    } catch (error) {
      console.error('Error clearing approval cache:', error);
      throw error;
    }
  },

  /**
   * Check for network connectivity and sync pending approvals
   */
  checkAndSync: async () => {
    try {
      // Skip if already syncing
      if (isSyncing) {
        return { synced: 0, message: 'Sync already in progress' };
      }

      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      if (isOnline) {
        const pendingCount = await ApprovalService.getPendingCount();
        if (pendingCount > 0) {
          console.log(`🔄 Syncing ${pendingCount} pending approval(s)...`);
          return await ApprovalService.syncPendingApprovals();
        }
      }
      return { synced: 0, message: 'No pending approvals to sync' };
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
          await ApprovalService.checkAndSync();
        }
      } catch (error) {
        console.error('Approval auto-sync error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Also listen for network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('📡 Network connected, syncing pending approvals...');
        ApprovalService.checkAndSync();
      }
    });

    return () => {
      clearInterval(syncInterval);
      unsubscribe();
    };
  },

  /**
   * Debug utility: Get sync queue status for approvals
   */
  getDebugInfo: async () => {
    try {
      // Get all pending approvals from sync queue
      const queueItems = await DatabaseService.selectQuery(
        'SELECT * FROM sync_queue WHERE entity_type = ?',
        ['approval']
      );

      // Get all approvals from cache
      const cachedApprovals = await DatabaseService.selectQuery(
        'SELECT id, task_hazard_id, approval_status, synced, created_at FROM approvals'
      );

      // Get network status
      const networkState = await NetInfo.fetch();

      const debugInfo = {
        networkStatus: {
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type
        },
        syncQueue: {
          count: queueItems.length,
          items: queueItems.map(item => ({
            id: item.id,
            taskHazardId: item.entity_id,
            operation: item.operation,
            retryCount: item.retry_count,
            createdAt: new Date(item.created_at * 1000).toISOString(),
            data: JSON.parse(item.data)
          }))
        },
        cachedApprovals: {
          total: cachedApprovals.length,
          synced: cachedApprovals.filter(a => a.synced === 1).length,
          unsynced: cachedApprovals.filter(a => a.synced === 0).length,
          items: cachedApprovals.map(a => ({
            id: a.id,
            taskHazardId: a.task_hazard_id,
            status: a.approval_status,
            synced: a.synced === 1,
            createdAt: new Date(a.created_at * 1000).toISOString()
          }))
        }
      };

      console.log('📊 Approval Sync Debug Info:');
      console.log(JSON.stringify(debugInfo, null, 2));

      return debugInfo;
    } catch (error) {
      console.error('Error getting debug info:', error);
      return null;
    }
  }
};

