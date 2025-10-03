import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Database Service for Mine Operations
 * Handles offline data storage and synchronization
 */
class DatabaseService {
  constructor() {
    this.databaseName = 'mine_operations_db';
    this.version = '1.0';
    this.isInitialized = false;
  }

  /**
   * Initialize database and create tables
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Create database tables
      await this.createTables();
      this.isInitialized = true;
      console.log('Mine Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables for mine operations
   */
  async createTables() {
    const tables = {
      // Mining Equipment
      mining_equipment: {
        id: 'TEXT PRIMARY KEY',
        name: 'TEXT NOT NULL',
        type: 'TEXT NOT NULL', // excavator, truck, drill, etc.
        location: 'TEXT', // GPS coordinates or beacon zone
        status: 'TEXT DEFAULT "operational"', // operational, maintenance, offline
        last_inspection: 'TEXT',
        created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        sync_status: 'TEXT DEFAULT "pending"' // pending, synced, failed
      },

      // Mining Hazards
      mining_hazards: {
        id: 'TEXT PRIMARY KEY',
        title: 'TEXT NOT NULL',
        description: 'TEXT',
        hazard_type: 'TEXT NOT NULL', // geological, equipment, environmental, etc.
        risk_level: 'TEXT NOT NULL', // low, medium, high, critical
        location: 'TEXT', // GPS coordinates
        mine_section: 'TEXT', // underground level, surface area
        reported_by: 'TEXT NOT NULL',
        status: 'TEXT DEFAULT "open"', // open, investigating, resolved
        created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        sync_status: 'TEXT DEFAULT "pending"'
      },

      // Risk Assessments
      risk_assessments: {
        id: 'TEXT PRIMARY KEY',
        title: 'TEXT NOT NULL',
        location: 'TEXT', // GPS coordinates
        mine_section: 'TEXT',
        risk_level: 'TEXT NOT NULL',
        probability: 'INTEGER', // 1-5 scale
        impact: 'INTEGER', // 1-5 scale
        mitigation_measures: 'TEXT',
        assessed_by: 'TEXT NOT NULL',
        status: 'TEXT DEFAULT "draft"', // draft, approved, implemented
        created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        sync_status: 'TEXT DEFAULT "pending"'
      },

      // Task Hazards
      task_hazards: {
        id: 'TEXT PRIMARY KEY',
        task_name: 'TEXT NOT NULL',
        description: 'TEXT',
        location: 'TEXT', // GPS coordinates
        mine_section: 'TEXT',
        hazard_identification: 'TEXT',
        risk_controls: 'TEXT',
        assigned_to: 'TEXT',
        supervisor: 'TEXT',
        status: 'TEXT DEFAULT "pending"', // pending, approved, completed
        created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        sync_status: 'TEXT DEFAULT "pending"'
      },

      // Location Data
      locations: {
        id: 'TEXT PRIMARY KEY',
        name: 'TEXT NOT NULL',
        type: 'TEXT NOT NULL', // surface, underground, equipment_zone, hazard_zone
        coordinates: 'TEXT', // GPS coordinates
        beacon_id: 'TEXT', // Bluetooth beacon identifier
        mine_level: 'TEXT', // underground level
        description: 'TEXT',
        created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        sync_status: 'TEXT DEFAULT "pending"'
      },

      // Sync Queue
      sync_queue: {
        id: 'TEXT PRIMARY KEY',
        table_name: 'TEXT NOT NULL',
        record_id: 'TEXT NOT NULL',
        operation: 'TEXT NOT NULL', // create, update, delete
        data: 'TEXT NOT NULL', // JSON string
        created_at: 'TEXT DEFAULT CURRENT_TIMESTAMP',
        retry_count: 'INTEGER DEFAULT 0',
        status: 'TEXT DEFAULT "pending"' // pending, syncing, synced, failed
      }
    };

    // Store table schemas
    await AsyncStorage.setItem('database_schemas', JSON.stringify(tables));
    console.log('Database tables created successfully');
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current timestamp
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * CRUD Operations for Mining Equipment
   */
  async createEquipment(equipmentData) {
    try {
      const id = this.generateId();
      const equipment = {
        id,
        ...equipmentData,
        created_at: this.getCurrentTimestamp(),
        updated_at: this.getCurrentTimestamp(),
        sync_status: 'pending'
      };

      await AsyncStorage.setItem(`equipment_${id}`, JSON.stringify(equipment));
      await this.addToSyncQueue('mining_equipment', id, 'create', equipment);
      
      return equipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  }

  async getEquipment(id = null) {
    try {
      if (id) {
        const equipment = await AsyncStorage.getItem(`equipment_${id}`);
        return equipment ? JSON.parse(equipment) : null;
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const equipmentKeys = keys.filter(key => key.startsWith('equipment_'));
        const equipmentList = await AsyncStorage.multiGet(equipmentKeys);
        return equipmentList.map(([key, value]) => JSON.parse(value));
      }
    } catch (error) {
      console.error('Error getting equipment:', error);
      throw error;
    }
  }

  async updateEquipment(id, updateData) {
    try {
      const existing = await this.getEquipment(id);
      if (!existing) throw new Error('Equipment not found');

      const updated = {
        ...existing,
        ...updateData,
        updated_at: this.getCurrentTimestamp(),
        sync_status: 'pending'
      };

      await AsyncStorage.setItem(`equipment_${id}`, JSON.stringify(updated));
      await this.addToSyncQueue('mining_equipment', id, 'update', updated);
      
      return updated;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  async deleteEquipment(id) {
    try {
      await AsyncStorage.removeItem(`equipment_${id}`);
      await this.addToSyncQueue('mining_equipment', id, 'delete', { id });
      return true;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  /**
   * CRUD Operations for Mining Hazards
   */
  async createHazard(hazardData) {
    try {
      const id = this.generateId();
      const hazard = {
        id,
        ...hazardData,
        created_at: this.getCurrentTimestamp(),
        updated_at: this.getCurrentTimestamp(),
        sync_status: 'pending'
      };

      await AsyncStorage.setItem(`hazard_${id}`, JSON.stringify(hazard));
      await this.addToSyncQueue('mining_hazards', id, 'create', hazard);
      
      return hazard;
    } catch (error) {
      console.error('Error creating hazard:', error);
      throw error;
    }
  }

  async getHazards(id = null) {
    try {
      if (id) {
        const hazard = await AsyncStorage.getItem(`hazard_${id}`);
        return hazard ? JSON.parse(hazard) : null;
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const hazardKeys = keys.filter(key => key.startsWith('hazard_'));
        const hazardList = await AsyncStorage.multiGet(hazardKeys);
        return hazardList.map(([key, value]) => JSON.parse(value));
      }
    } catch (error) {
      console.error('Error getting hazards:', error);
      throw error;
    }
  }

  /**
   * CRUD Operations for Risk Assessments
   */
  async createRiskAssessment(assessmentData) {
    try {
      const id = this.generateId();
      const assessment = {
        id,
        ...assessmentData,
        created_at: this.getCurrentTimestamp(),
        updated_at: this.getCurrentTimestamp(),
        sync_status: 'pending'
      };

      await AsyncStorage.setItem(`risk_assessment_${id}`, JSON.stringify(assessment));
      await this.addToSyncQueue('risk_assessments', id, 'create', assessment);
      
      return assessment;
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      throw error;
    }
  }

  async getRiskAssessments(id = null) {
    try {
      if (id) {
        const assessment = await AsyncStorage.getItem(`risk_assessment_${id}`);
        return assessment ? JSON.parse(assessment) : null;
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const assessmentKeys = keys.filter(key => key.startsWith('risk_assessment_'));
        const assessmentList = await AsyncStorage.multiGet(assessmentKeys);
        return assessmentList.map(([key, value]) => JSON.parse(value));
      }
    } catch (error) {
      console.error('Error getting risk assessments:', error);
      throw error;
    }
  }

  /**
   * CRUD Operations for Task Hazards
   */
  async createTaskHazard(taskData) {
    try {
      const id = this.generateId();
      const task = {
        id,
        ...taskData,
        created_at: this.getCurrentTimestamp(),
        updated_at: this.getCurrentTimestamp(),
        sync_status: 'pending'
      };

      await AsyncStorage.setItem(`task_hazard_${id}`, JSON.stringify(task));
      await this.addToSyncQueue('task_hazards', id, 'create', task);
      
      return task;
    } catch (error) {
      console.error('Error creating task hazard:', error);
      throw error;
    }
  }

  async getTaskHazards(id = null) {
    try {
      if (id) {
        const task = await AsyncStorage.getItem(`task_hazard_${id}`);
        return task ? JSON.parse(task) : null;
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const taskKeys = keys.filter(key => key.startsWith('task_hazard_'));
        const taskList = await AsyncStorage.multiGet(taskKeys);
        return taskList.map(([key, value]) => JSON.parse(value));
      }
    } catch (error) {
      console.error('Error getting task hazards:', error);
      throw error;
    }
  }

  /**
   * Location Management
   */
  async saveLocation(locationData) {
    try {
      const id = this.generateId();
      const location = {
        id,
        ...locationData,
        created_at: this.getCurrentTimestamp(),
        sync_status: 'pending'
      };

      await AsyncStorage.setItem(`location_${id}`, JSON.stringify(location));
      await this.addToSyncQueue('locations', id, 'create', location);
      
      return location;
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }

  async getLocations() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const locationKeys = keys.filter(key => key.startsWith('location_'));
      const locationList = await AsyncStorage.multiGet(locationKeys);
      return locationList.map(([key, value]) => JSON.parse(value));
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  /**
   * Sync Queue Management
   */
  async addToSyncQueue(tableName, recordId, operation, data) {
    try {
      const id = this.generateId();
      const syncItem = {
        id,
        table_name: tableName,
        record_id: recordId,
        operation,
        data: JSON.stringify(data),
        created_at: this.getCurrentTimestamp(),
        retry_count: 0,
        status: 'pending'
      };

      await AsyncStorage.setItem(`sync_${id}`, JSON.stringify(syncItem));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  async getSyncQueue() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(key => key.startsWith('sync_'));
      const syncList = await AsyncStorage.multiGet(syncKeys);
      return syncList.map(([key, value]) => JSON.parse(value));
    } catch (error) {
      console.error('Error getting sync queue:', error);
      throw error;
    }
  }

  async clearSyncQueue() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(key => key.startsWith('sync_'));
      await AsyncStorage.multiRemove(syncKeys);
      return true;
    } catch (error) {
      console.error('Error clearing sync queue:', error);
      throw error;
    }
  }

  /**
   * Data Synchronization
   */
  async syncData() {
    try {
      const syncQueue = await this.getSyncQueue();
      const pendingItems = syncQueue.filter(item => item.status === 'pending');
      
      console.log(`Syncing ${pendingItems.length} items...`);
      
      for (const item of pendingItems) {
        try {
          // Update sync status to syncing
          item.status = 'syncing';
          await AsyncStorage.setItem(`sync_${item.id}`, JSON.stringify(item));
          
          // Here you would make API calls to sync with server
          // For now, we'll just mark as synced
          await this.markAsSynced(item);
          
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          item.retry_count += 1;
          item.status = item.retry_count >= 3 ? 'failed' : 'pending';
          await AsyncStorage.setItem(`sync_${item.id}`, JSON.stringify(item));
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  async markAsSynced(syncItem) {
    try {
      // Mark sync item as synced
      syncItem.status = 'synced';
      await AsyncStorage.setItem(`sync_${syncItem.id}`, JSON.stringify(syncItem));
      
      // Update the original record's sync status
      const recordKey = `${syncItem.table_name.slice(0, -1)}_${syncItem.record_id}`;
      const record = await AsyncStorage.getItem(recordKey);
      if (record) {
        const recordData = JSON.parse(record);
        recordData.sync_status = 'synced';
        await AsyncStorage.setItem(recordKey, JSON.stringify(recordData));
      }
    } catch (error) {
      console.error('Error marking as synced:', error);
      throw error;
    }
  }

  /**
   * Database Statistics
   */
  async getDatabaseStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      const stats = {
        equipment: keys.filter(key => key.startsWith('equipment_')).length,
        hazards: keys.filter(key => key.startsWith('hazard_')).length,
        riskAssessments: keys.filter(key => key.startsWith('risk_assessment_')).length,
        taskHazards: keys.filter(key => key.startsWith('task_hazard_')).length,
        locations: keys.filter(key => key.startsWith('location_')).length,
        pendingSync: keys.filter(key => key.startsWith('sync_')).length
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAllData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => 
        key.startsWith('equipment_') ||
        key.startsWith('hazard_') ||
        key.startsWith('risk_assessment_') ||
        key.startsWith('task_hazard_') ||
        key.startsWith('location_') ||
        key.startsWith('sync_')
      );
      
      await AsyncStorage.multiRemove(appKeys);
      console.log('All mine data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new DatabaseService();
