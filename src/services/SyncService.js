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
        const created = await RiskAssessmentApi.create(data);
        await DatabaseService.update('risk_assessments', riskAssessmentId, { synced: 1 });
        return created;
      
      case 'update':
        const updated = await RiskAssessmentApi.update(riskAssessmentId, data);
        await DatabaseService.update('risk_assessments', riskAssessmentId, { synced: 1 });
        return updated;
      
      case 'delete':
        await RiskAssessmentApi.delete(riskAssessmentId);
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
      if (!Array.isArray(assets) || assets.length === 0) {
        return;
      }

      // Temporarily disable foreign key constraints to avoid insertion order issues
      await DatabaseService.executeQuery('PRAGMA foreign_keys = OFF');

      try {
        for (const asset of assets) {
          const existing = await DatabaseService.getById('assets', asset._id || asset.id);
          
          const assetData = {
            id: asset._id || asset.id,
            name: asset.name || 'Unnamed Asset',
            type: asset.type || 'Unknown',
            parent_id: asset.parentId || asset.parent_id || null,
            hierarchy_path: asset.hierarchyPath || asset.hierarchy_path || '',
            metadata: JSON.stringify(asset.metadata || {}),
            synced: 1
          };

          // Check if parent exists in our asset list or database, if not, set parent_id to null
          if (assetData.parent_id) {
            const parentExistsInBatch = assets.some(a => (a._id || a.id) === assetData.parent_id);
            let parentExistsInDatabase = false;
            
            if (!parentExistsInBatch) {
              try {
                const parentInDb = await DatabaseService.getById('assets', assetData.parent_id);
                parentExistsInDatabase = !!parentInDb;
              } catch (error) {
                console.log(`Error checking parent in database: ${error.message}`);
                parentExistsInDatabase = false;
              }
            }
            
            if (!parentExistsInBatch && !parentExistsInDatabase) {
              console.log(`Parent asset ${assetData.parent_id} not found in batch or database, setting parent_id to null for ${assetData.id}`);
              assetData.parent_id = null;
            }
          }

          try {
            // Use INSERT OR REPLACE to handle both UNIQUE and FOREIGN KEY constraints
            await DatabaseService.executeQuery(`
              INSERT OR REPLACE INTO assets 
              (id, name, type, parent_id, hierarchy_path, metadata, synced, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              assetData.id,
              assetData.name,
              assetData.type,
              assetData.parent_id,
              assetData.hierarchy_path,
              assetData.metadata,
              assetData.synced,
              Math.floor(Date.now() / 1000),
              Math.floor(Date.now() / 1000)
            ]);
          } catch (insertError) {
            // Handle UNIQUE constraint failures
            if (insertError.message.includes('UNIQUE constraint failed')) {
              try {
                await DatabaseService.update('assets', assetData.id, assetData);
              } catch (updateError) {
                console.error('Error updating asset after UNIQUE constraint failure:', assetData.id, updateError);
              }
            } else if (insertError.message.includes('FOREIGN KEY constraint failed') && assetData.parent_id) {
              // Check if parent exists, if not, create a placeholder
              const parentExists = await DatabaseService.getById('assets', assetData.parent_id);
              if (!parentExists) {
                // Create a placeholder parent asset
                const parentData = {
                  id: assetData.parent_id,
                  name: 'Parent Asset (Placeholder)',
                  type: 'Unknown',
                  parent_id: null,
                  hierarchy_path: '',
                  metadata: JSON.stringify({ placeholder: true }),
                  synced: 1
                };
                
                try {
                  await DatabaseService.insert('assets', parentData);
                } catch (parentInsertError) {
                  // If parent insert fails due to UNIQUE constraint, try update
                  if (parentInsertError.message.includes('UNIQUE constraint failed')) {
                    try {
                      await DatabaseService.update('assets', parentData.id, parentData);
                    } catch (parentUpdateError) {
                      console.error('Error updating parent asset:', parentData.id, parentUpdateError);
                    }
                  } else {
                    console.error('Error inserting parent asset:', parentData.id, parentInsertError);
                  }
                }
              }
              
              // Now try to insert the original asset
              try {
                if (existing) {
                  await DatabaseService.update('assets', assetData.id, assetData);
                } else {
                  await DatabaseService.insert('assets', assetData);
                }
              } catch (retryError) {
                // If retry fails due to UNIQUE constraint, try update
                if (retryError.message.includes('UNIQUE constraint failed')) {
                  try {
                    await DatabaseService.update('assets', assetData.id, assetData);
                  } catch (updateRetryError) {
                    console.error('Error updating asset after parent creation:', assetData.id, updateRetryError);
                  }
                } else {
                  console.error('Error inserting asset after parent creation:', assetData.id, retryError);
                }
              }
            } else {
              console.error('Error inserting asset:', assetData.id, insertError);
            }
          }
        }
      } finally {
        // Re-enable foreign key constraints
        await DatabaseService.executeQuery('PRAGMA foreign_keys = ON');
      }
    } catch (error) {
      console.error('Error caching assets:', error);
      // Re-enable foreign key constraints even if there was an error
      try {
        await DatabaseService.executeQuery('PRAGMA foreign_keys = ON');
      } catch (fkError) {
        console.error('Error re-enabling foreign key constraints:', fkError);
      }
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

