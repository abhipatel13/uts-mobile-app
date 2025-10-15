import DatabaseService from './DatabaseService';
import { AssetHierarchyApi } from './AssetHierarchyApi';
import { TaskHazardApi } from './TaskHazardApi';
import { RiskAssessmentApi } from './RiskAssessmentApi';
import { ApiError } from '../lib/api-client';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
  }

  /**
   * Start automatic sync (every 5 minutes)
   */
  startAutoSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      return;
    }

    
    // Run initial sync
    this.syncAll();

    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all pending changes to server
   */
  async syncAll() {
    if (this.isSyncing) {
      return;
    }

    try {
      this.isSyncing = true;

      // Get pending sync items
      const pendingItems = await DatabaseService.getPendingSyncItems();
      
      if (pendingItems.length === 0) {
        return;
      }

      // Process each item
      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item);
          await DatabaseService.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync ${item.entity_type} ${item.entity_id}:`, error);
          
          // Increment retry count
          await DatabaseService.update('sync_queue', item.id, {
            retry_count: item.retry_count + 1
          });

          // If too many retries, remove from queue
          if (item.retry_count >= 5) {
            await DatabaseService.removeFromSyncQueue(item.id);
          }
        }
      }

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single sync item
   */
  async processSyncItem(item) {
    const data = JSON.parse(item.data);

    switch (item.entity_type) {
      case 'asset':
        return await this.syncAsset(item.operation, item.entity_id, data);
      
      case 'task_hazard':
        return await this.syncTaskHazard(item.operation, item.entity_id, data);
      
      case 'risk_assessment':
        return await this.syncRiskAssessment(item.operation, item.entity_id, data);
      
      default:
        console.warn(`Unknown entity type: ${item.entity_type}`);
    }
  }

  /**
   * Sync asset to server
   */
  async syncAsset(operation, assetId, data) {
    switch (operation) {
      case 'create':
        const createdAsset = await AssetHierarchyApi.createAsset(data);
        await DatabaseService.update('assets', assetId, { synced: 1 });
        return createdAsset;
      
      case 'update':
        const updatedAsset = await AssetHierarchyApi.updateAsset(assetId, data);
        await DatabaseService.update('assets', assetId, { synced: 1 });
        return updatedAsset;
      
      case 'delete':
        await AssetHierarchyApi.deleteAsset(assetId);
        await DatabaseService.delete('assets', assetId);
        return;
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Sync task hazard to server
   */
  async syncTaskHazard(operation, taskHazardId, data) {
    switch (operation) {
      case 'create':
        const created = await TaskHazardApi.createTaskHazard(data);
        await DatabaseService.update('task_hazards', taskHazardId, { synced: 1 });
        return created;
      
      case 'update':
        const updated = await TaskHazardApi.updateTaskHazard(taskHazardId, data);
        await DatabaseService.update('task_hazards', taskHazardId, { synced: 1 });
        return updated;
      
      case 'delete':
        await TaskHazardApi.deleteTaskHazard(taskHazardId);
        await DatabaseService.delete('task_hazards', taskHazardId);
        return;
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Sync risk assessment to server
   */
  async syncRiskAssessment(operation, riskAssessmentId, data) {
    switch (operation) {
      case 'create':
        const created = await RiskAssessmentApi.createRiskAssessment(data);
        await DatabaseService.update('risk_assessments', riskAssessmentId, { synced: 1 });
        return created;
      
      case 'update':
        const updated = await RiskAssessmentApi.updateRiskAssessment(riskAssessmentId, data);
        await DatabaseService.update('risk_assessments', riskAssessmentId, { synced: 1 });
        return updated;
      
      case 'delete':
        await RiskAssessmentApi.deleteRiskAssessment(riskAssessmentId);
        await DatabaseService.delete('risk_assessments', riskAssessmentId);
        return;
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Cache data from server to local database
   */
  async cacheAssets(assets) {
    try {
      for (const asset of assets) {
        const existing = await DatabaseService.getById('assets', asset._id || asset.id);
        
        const assetData = {
          id: asset._id || asset.id,
          name: asset.name,
          type: asset.type,
          parent_id: asset.parentId || asset.parent_id,
          hierarchy_path: asset.hierarchyPath || asset.hierarchy_path,
          metadata: JSON.stringify(asset.metadata || {}),
          synced: 1
        };

        if (existing) {
          await DatabaseService.update('assets', assetData.id, assetData);
        } else {
          await DatabaseService.insert('assets', assetData);
        }
      }
    } catch (error) {
      console.error('Error caching assets:', error);
      throw error;
    }
  }

  /**
   * Cache task hazards from server to local database
   */
  async cacheTaskHazards(taskHazards) {
    try {
      for (const taskHazard of taskHazards) {
        const existing = await DatabaseService.getById('task_hazards', taskHazard._id || taskHazard.id);
        
        const data = {
          id: taskHazard._id || taskHazard.id,
          task_name: taskHazard.taskName || taskHazard.task_name,
          location: taskHazard.location,
          date: taskHazard.date,
          supervisor: taskHazard.supervisor,
          hazards: JSON.stringify(taskHazard.hazards || []),
          controls: JSON.stringify(taskHazard.controls || []),
          risk_level: taskHazard.riskLevel || taskHazard.risk_level,
          status: taskHazard.status,
          created_by: taskHazard.createdBy || taskHazard.created_by,
          synced: 1
        };

        if (existing) {
          await DatabaseService.update('task_hazards', data.id, data);
        } else {
          await DatabaseService.insert('task_hazards', data);
        }
      }
    } catch (error) {
      console.error('Error caching task hazards:', error);
      throw error;
    }
  }

  /**
   * Cache risk assessments from server to local database
   */
  async cacheRiskAssessments(riskAssessments) {
    try {
      for (const riskAssessment of riskAssessments) {
        const existing = await DatabaseService.getById('risk_assessments', riskAssessment._id || riskAssessment.id);
        
        const data = {
          id: riskAssessment._id || riskAssessment.id,
          title: riskAssessment.title,
          location: riskAssessment.location,
          date: riskAssessment.date,
          assessor: riskAssessment.assessor,
          risks: JSON.stringify(riskAssessment.risks || []),
          controls: JSON.stringify(riskAssessment.controls || []),
          severity: riskAssessment.severity,
          likelihood: riskAssessment.likelihood,
          status: riskAssessment.status,
          created_by: riskAssessment.createdBy || riskAssessment.created_by,
          synced: 1
        };

        if (existing) {
          await DatabaseService.update('risk_assessments', data.id, data);
        } else {
          await DatabaseService.insert('risk_assessments', data);
        }
      }
    } catch (error) {
      console.error('Error caching risk assessments:', error);
      throw error;
    }
  }

  /**
   * Check sync status
   */
  async getSyncStatus() {
    try {
      const pendingItems = await DatabaseService.getPendingSyncItems();
      const unsyncedAssets = await DatabaseService.getAll('assets', 'synced = 0');
      const unsyncedTaskHazards = await DatabaseService.getAll('task_hazards', 'synced = 0');
      const unsyncedRiskAssessments = await DatabaseService.getAll('risk_assessments', 'synced = 0');

      return {
        isSyncing: this.isSyncing,
        pendingCount: pendingItems.length,
        unsynced: {
          assets: unsyncedAssets.length,
          taskHazards: unsyncedTaskHazards.length,
          riskAssessments: unsyncedRiskAssessments.length
        }
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new SyncService();

