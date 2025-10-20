import * as SQLite from 'expo-sqlite';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the database and create tables
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return;
      }      
      // Open database connection
      this.db = await SQLite.openDatabaseAsync('uts_mobile.db');
      
      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      
      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Create all database tables
   */
  async createTables() {
    try {
      // Users table for caching user data
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT,
          email TEXT,
          name TEXT,
          full_name TEXT,
          role TEXT,
          company TEXT,
          metadata TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          synced INTEGER DEFAULT 1
        );
      `);

      // Assets table for offline asset hierarchy
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT,
          parent_id TEXT,
          hierarchy_path TEXT,
          metadata TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (parent_id) REFERENCES assets(id) ON DELETE CASCADE
        );
      `);

      // Task Hazards table for offline storage
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS task_hazards (
          id TEXT PRIMARY KEY,
          task_name TEXT NOT NULL,
          location TEXT,
          date TEXT,
          supervisor TEXT,
          hazards TEXT,
          controls TEXT,
          risk_level TEXT,
          status TEXT DEFAULT 'draft',
          created_by TEXT,
          metadata TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          synced INTEGER DEFAULT 0
        );
      `);

      // Risk Assessments table for offline storage
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS risk_assessments (
          id TEXT PRIMARY KEY,
          title TEXT,
          location TEXT,
          date TEXT,
          time TEXT,
          assessor TEXT,
          risks TEXT,
          controls TEXT,
          severity TEXT,
          likelihood TEXT,
          status TEXT DEFAULT 'draft',
          created_by TEXT,
          metadata TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          synced INTEGER DEFAULT 0
        );
      `);

      // Sync queue table for tracking pending sync operations
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          retry_count INTEGER DEFAULT 0
        );
      `);

      // Create indexes for better performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_assets_parent ON assets(parent_id);
        CREATE INDEX IF NOT EXISTS idx_assets_synced ON assets(synced);
        CREATE INDEX IF NOT EXISTS idx_task_hazards_synced ON task_hazards(synced);
        CREATE INDEX IF NOT EXISTS idx_risk_assessments_synced ON risk_assessments(synced);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
      `);      
      // Run migrations to add new columns to existing tables
      await this.runMigrations();
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Run database migrations to add new columns to existing tables
   */
  async runMigrations() {
    try {
      
      // Check and add time column to risk_assessments
      const hasTimeColumn = await this.columnExists('risk_assessments', 'time');
      if (!hasTimeColumn) {
        try {
          await this.executeQuery('ALTER TABLE risk_assessments ADD COLUMN time TEXT');
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
          } else {
            throw error;
          }
        }
      }

      // Check and add metadata column to risk_assessments
      const hasRiskMetadataColumn = await this.columnExists('risk_assessments', 'metadata');
      if (!hasRiskMetadataColumn) {
        try {
          await this.executeQuery('ALTER TABLE risk_assessments ADD COLUMN metadata TEXT');
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            // console.log('Metadata column already exists, skipping...');
          } else {
            throw error;
          }
        }
      }

      // Check and add metadata column to task_hazards
      const hasTaskMetadataColumn = await this.columnExists('task_hazards', 'metadata');
      if (!hasTaskMetadataColumn) {
        // console.log('Adding metadata column to task_hazards');
        try {
          await this.executeQuery('ALTER TABLE task_hazards ADD COLUMN metadata TEXT');
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            // console.log('Metadata column already exists, skipping...');
          } else {
            throw error;
          }
        }
      }

      // Check and add username column to users
      const hasUsernameColumn = await this.columnExists('users', 'username');
      if (!hasUsernameColumn) {
        // console.log('Adding username column to users');
        try {
          await this.executeQuery('ALTER TABLE users ADD COLUMN username TEXT');
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            // console.log('Username column already exists, skipping...');
          } else {
            throw error;
          }
        }
      }

      // Check and add full_name column to users
      const hasFullNameColumn = await this.columnExists('users', 'full_name');
      if (!hasFullNameColumn) {
        // console.log('Adding full_name column to users');
        try {
          await this.executeQuery('ALTER TABLE users ADD COLUMN full_name TEXT');
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            // console.log('Full_name column already exists, skipping...');
          } else {
            throw error;
          }
        }
      }

      // Check and add metadata column to users
      const hasUserMetadataColumn = await this.columnExists('users', 'metadata');
      if (!hasUserMetadataColumn) {
        // console.log('Adding metadata column to users');
        try {
          await this.executeQuery('ALTER TABLE users ADD COLUMN metadata TEXT');
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            // console.log('Metadata column already exists, skipping...');
          } else {
            throw error;
          }
        }
      }

      // Check and add synced column to users
      const hasUserSyncedColumn = await this.columnExists('users', 'synced');
      if (!hasUserSyncedColumn) {
        // console.log('Adding synced column to users');
        try {
          await this.executeQuery('ALTER TABLE users ADD COLUMN synced INTEGER DEFAULT 1');
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            // console.log('Synced column already exists, skipping...');
          } else {
            throw error;
          }
        }
      }

      // console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Check if a column exists in a table
   */
  async columnExists(tableName, columnName) {
    try {
      const result = await this.db.getAllAsync(`PRAGMA table_info(${tableName})`);
      return result.some(column => column.name === columnName);
    } catch (error) {
      console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Execute a raw SQL query
   */
  async executeQuery(sql, params = []) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      // Validate params - ensure no undefined values
      const cleanParams = params.map(p => p === undefined ? null : p);
      
      return await this.db.runAsync(sql, cleanParams);
    } catch (error) {
      console.error('Error executing query:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Execute a SELECT query
   */
  async selectQuery(sql, params = []) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      return await this.db.getAllAsync(sql, params);
    } catch (error) {
      console.error('Error executing select query:', error);
      throw error;
    }
  }

  /**
   * Insert a record
   */
  async insert(table, data) {
    try {
      // Filter out undefined values and convert objects to strings
      const cleanData = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          // If value is an object (but not null), convert to JSON string
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            cleanData[key] = JSON.stringify(value);
          } else {
            cleanData[key] = value;
          }
        }
      }
      
      const keys = Object.keys(cleanData);
      const values = Object.values(cleanData);
      
      if (keys.length === 0) {
        throw new Error('No valid data to insert');
      }
      
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      const result = await this.executeQuery(sql, values);
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      console.error('Data:', JSON.stringify(data, null, 2));
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(table, id, data) {
    try {
      // Filter out undefined values and convert objects to strings
      const cleanData = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && key !== 'id') {
          // If value is an object (but not null), convert to JSON string
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            cleanData[key] = JSON.stringify(value);
          } else {
            cleanData[key] = value;
          }
        }
      }
      
      const keys = Object.keys(cleanData);
      const values = Object.values(cleanData);
      
      if (keys.length === 0) {
        console.warn('No valid data to update');
        return true;
      }
      
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      const sql = `UPDATE ${table} SET ${setClause}, updated_at = strftime('%s', 'now') WHERE id = ?`;
      await this.executeQuery(sql, [...values, id]);
      
      return true;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(table, id) {
    try {
      const sql = `DELETE FROM ${table} WHERE id = ?`;
      await this.executeQuery(sql, [id]);
      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Get all records from a table
   */
  async getAll(table, where = '', params = []) {
    try {
      const sql = `SELECT * FROM ${table}${where ? ` WHERE ${where}` : ''}`;
      return await this.selectQuery(sql, params);
    } catch (error) {
      console.error(`Error getting records from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Get a single record by ID
   */
  async getById(table, id) {
    try {
      const sql = `SELECT * FROM ${table} WHERE id = ? LIMIT 1`;
      const results = await this.selectQuery(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting record from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(entityType, entityId, operation, data) {
    try {
      await this.insert('sync_queue', {
        entity_type: entityType,
        entity_id: entityId,
        operation: operation,
        data: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get pending sync items
   */
  async getPendingSyncItems(limit = 50) {
    try {
      const sql = `SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT ?`;
      return await this.selectQuery(sql, [limit]);
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      throw error;
    }
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id) {
    try {
      const sql = `DELETE FROM sync_queue WHERE id = ?`;
      await this.executeQuery(sql, [id]);
    } catch (error) {
      console.error('Error removing from sync queue:', error);
      throw error;
    }
  }

  /**
   * Clear all data from database (for testing or logout)
   */
  async clearAllData() {
    try {
      await this.db.execAsync(`
        DELETE FROM users;
        DELETE FROM assets;
        DELETE FROM task_hazards;
        DELETE FROM risk_assessments;
        DELETE FROM sync_queue;
      `);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getDatabase() {
    return this.db;
  }
}

// Export singleton instance
export default new DatabaseService();

