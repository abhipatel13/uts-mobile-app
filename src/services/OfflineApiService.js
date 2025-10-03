import DatabaseService from './DatabaseService';
import NetworkService from './NetworkService';
import { api } from '../lib/api-client';

/**
 * Offline API Service for Mine Operations
 * Handles API calls with offline fallback to local database
 */
class OfflineApiService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the offline API service
   */
  async initialize() {
    try {
      await DatabaseService.initialize();
      await NetworkService.initialize();
      this.isInitialized = true;
      console.log('Offline API Service initialized');
    } catch (error) {
      console.error('Offline API Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get network status
   */
  getNetworkStatus() {
    return NetworkService.getNetworkStatus();
  }

  /**
   * Mining Equipment API
   */
  async getEquipment(id = null) {
    try {
      if (NetworkService.isConnected()) {
        try {
          // Try to fetch from server first
          const endpoint = id ? `/api/mining-equipment/${id}` : '/api/mining-equipment';
          const serverData = await api.get(endpoint);
          
          // Update local database with server data
          if (Array.isArray(serverData)) {
            for (const equipment of serverData) {
              await DatabaseService.updateEquipment(equipment.id, equipment);
            }
          } else if (serverData) {
            await DatabaseService.updateEquipment(serverData.id, serverData);
          }
          
          return serverData;
        } catch (error) {
          console.log('Server fetch failed, using local data:', error.message);
        }
      }

      // Fallback to local database
      return await DatabaseService.getEquipment(id);
    } catch (error) {
      console.error('Error getting equipment:', error);
      throw error;
    }
  }

  async createEquipment(equipmentData) {
    try {
      console.log('Creating equipment with data:', equipmentData);
      
      // Always save to local database first
      const localEquipment = await DatabaseService.createEquipment(equipmentData);
      console.log('Equipment created locally:', localEquipment);

      // Try to sync with server if online
      if (NetworkService.isConnected()) {
        try {
          const serverEquipment = await api.post('/api/mining-equipment', equipmentData);
          // Update local record with server response
          await DatabaseService.updateEquipment(localEquipment.id, {
            ...serverEquipment,
            sync_status: 'synced'
          });
          console.log('Equipment synced with server');
          return serverEquipment;
        } catch (error) {
          console.log('Server sync failed, equipment saved locally:', error.message);
        }
      } else {
        console.log('Offline mode - equipment saved locally only');
      }

      return localEquipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  }

  async updateEquipment(id, updateData) {
    try {
      // Always update local database first
      const localEquipment = await DatabaseService.updateEquipment(id, updateData);

      // Try to sync with server if online
      if (NetworkService.isConnected()) {
        try {
          const serverEquipment = await api.put(`/api/mining-equipment/${id}`, updateData);
          // Update local record with server response
          await DatabaseService.updateEquipment(id, {
            ...serverEquipment,
            sync_status: 'synced'
          });
          return serverEquipment;
        } catch (error) {
          console.log('Server sync failed, equipment updated locally:', error.message);
        }
      }

      return localEquipment;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  async deleteEquipment(id) {
    try {
      // Always delete from local database first
      await DatabaseService.deleteEquipment(id);

      // Try to sync with server if online
      if (NetworkService.isConnected()) {
        try {
          await api.delete(`/api/mining-equipment/${id}`);
        } catch (error) {
          console.log('Server sync failed, equipment deleted locally:', error.message);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  /**
   * Mining Hazards API
   */
  async getHazards(id = null) {
    try {
      if (NetworkService.isConnected()) {
        try {
          const endpoint = id ? `/api/mining-hazards/${id}` : '/api/mining-hazards';
          const serverData = await api.get(endpoint);
          
          // Update local database
          if (Array.isArray(serverData)) {
            for (const hazard of serverData) {
              await DatabaseService.updateHazard(hazard.id, hazard);
            }
          } else if (serverData) {
            await DatabaseService.updateHazard(serverData.id, serverData);
          }
          
          return serverData;
        } catch (error) {
          console.log('Server fetch failed, using local data:', error.message);
        }
      }

      return await DatabaseService.getHazards(id);
    } catch (error) {
      console.error('Error getting hazards:', error);
      throw error;
    }
  }

  async createHazard(hazardData) {
    try {
      const localHazard = await DatabaseService.createHazard(hazardData);

      if (NetworkService.isConnected()) {
        try {
          const serverHazard = await api.post('/api/mining-hazards', hazardData);
          await DatabaseService.updateHazard(localHazard.id, {
            ...serverHazard,
            sync_status: 'synced'
          });
          return serverHazard;
        } catch (error) {
          console.log('Server sync failed, hazard saved locally:', error.message);
        }
      }

      return localHazard;
    } catch (error) {
      console.error('Error creating hazard:', error);
      throw error;
    }
  }

  /**
   * Risk Assessments API
   */
  async getRiskAssessments(id = null) {
    try {
      if (NetworkService.isConnected()) {
        try {
          const endpoint = id ? `/api/risk-assessments/${id}` : '/api/risk-assessments';
          const serverData = await api.get(endpoint);
          
          if (Array.isArray(serverData)) {
            for (const assessment of serverData) {
              await DatabaseService.updateRiskAssessment(assessment.id, assessment);
            }
          } else if (serverData) {
            await DatabaseService.updateRiskAssessment(serverData.id, serverData);
          }
          
          return serverData;
        } catch (error) {
          console.log('Server fetch failed, using local data:', error.message);
        }
      }

      return await DatabaseService.getRiskAssessments(id);
    } catch (error) {
      console.error('Error getting risk assessments:', error);
      throw error;
    }
  }

  async createRiskAssessment(assessmentData) {
    try {
      const localAssessment = await DatabaseService.createRiskAssessment(assessmentData);

      if (NetworkService.isConnected()) {
        try {
          const serverAssessment = await api.post('/api/risk-assessments', assessmentData);
          await DatabaseService.updateRiskAssessment(localAssessment.id, {
            ...serverAssessment,
            sync_status: 'synced'
          });
          return serverAssessment;
        } catch (error) {
          console.log('Server sync failed, assessment saved locally:', error.message);
        }
      }

      return localAssessment;
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      throw error;
    }
  }

  /**
   * Task Hazards API
   */
  async getTaskHazards(id = null) {
    try {
      if (NetworkService.isConnected()) {
        try {
          const endpoint = id ? `/api/task-hazards/${id}` : '/api/task-hazards';
          const serverData = await api.get(endpoint);
          
          if (Array.isArray(serverData)) {
            for (const task of serverData) {
              await DatabaseService.updateTaskHazard(task.id, task);
            }
          } else if (serverData) {
            await DatabaseService.updateTaskHazard(serverData.id, serverData);
          }
          
          return serverData;
        } catch (error) {
          console.log('Server fetch failed, using local data:', error.message);
        }
      }

      return await DatabaseService.getTaskHazards(id);
    } catch (error) {
      console.error('Error getting task hazards:', error);
      throw error;
    }
  }

  async createTaskHazard(taskData) {
    try {
      const localTask = await DatabaseService.createTaskHazard(taskData);

      if (NetworkService.isConnected()) {
        try {
          const serverTask = await api.post('/api/task-hazards', taskData);
          await DatabaseService.updateTaskHazard(localTask.id, {
            ...serverTask,
            sync_status: 'synced'
          });
          return serverTask;
        } catch (error) {
          console.log('Server sync failed, task saved locally:', error.message);
        }
      }

      return localTask;
    } catch (error) {
      console.error('Error creating task hazard:', error);
      throw error;
    }
  }

  /**
   * Location Management
   */
  async saveLocation(locationData) {
    try {
      const localLocation = await DatabaseService.saveLocation(locationData);

      if (NetworkService.isConnected()) {
        try {
          const serverLocation = await api.post('/api/locations', locationData);
          await DatabaseService.updateLocation(localLocation.id, {
            ...serverLocation,
            sync_status: 'synced'
          });
          return serverLocation;
        } catch (error) {
          console.log('Server sync failed, location saved locally:', error.message);
        }
      }

      return localLocation;
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }

  async getLocations() {
    try {
      if (NetworkService.isConnected()) {
        try {
          const serverData = await api.get('/api/locations');
          
          if (Array.isArray(serverData)) {
            for (const location of serverData) {
              await DatabaseService.updateLocation(location.id, location);
            }
          }
          
          return serverData;
        } catch (error) {
          console.log('Server fetch failed, using local data:', error.message);
        }
      }

      return await DatabaseService.getLocations();
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  /**
   * Data Synchronization
   */
  async syncAllData() {
    try {
      if (!NetworkService.isConnected()) {
        throw new Error('No internet connection available for sync');
      }

      console.log('Starting data synchronization...');
      
      // Sync all pending changes
      await DatabaseService.syncData();
      
      // Fetch latest data from server
      await this.refreshAllData();
      
      console.log('Data synchronization completed');
      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  async refreshAllData() {
    try {
      if (!NetworkService.isConnected()) {
        console.log('No internet connection, skipping data refresh');
        return;
      }

      console.log('Refreshing all data from server...');
      
      // Refresh all data types
      await this.getEquipment();
      await this.getHazards();
      await this.getRiskAssessments();
      await this.getTaskHazards();
      await this.getLocations();
      
      console.log('Data refresh completed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    try {
      const syncQueue = await DatabaseService.getSyncQueue();
      const pendingItems = syncQueue.filter(item => item.status === 'pending');
      const failedItems = syncQueue.filter(item => item.status === 'failed');
      
      return {
        totalPending: pendingItems.length,
        totalFailed: failedItems.length,
        canSync: NetworkService.isConnected(),
        lastSync: syncQueue.length > 0 ? 
          Math.max(...syncQueue.map(item => new Date(item.created_at).getTime())) : null
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const stats = await DatabaseService.getDatabaseStats();
      console.log('Database stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Clear all local data
   */
  async clearAllData() {
    try {
      await DatabaseService.clearAllData();
      console.log('All local data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new OfflineApiService();
