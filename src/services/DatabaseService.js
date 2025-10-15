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
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          role TEXT,
          company TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
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
          title TEXT NOT NULL,
          location TEXT,
          date TEXT,
          assessor TEXT,
          risks TEXT,
          controls TEXT,
          severity TEXT,
          likelihood TEXT,
          status TEXT DEFAULT 'draft',
          created_by TEXT,
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
      // Add metadata column to task_hazards if it doesn't exist
      try {
        await this.db.execAsync(`
          ALTER TABLE task_hazards ADD COLUMN metadata TEXT;
        `);
      } catch (error) {
        // Column might already exist, ignore error
        if (!error.message.includes('duplicate column')) {
          console.log('Metadata column already exists in task_hazards or migration not needed');
        } 
      }

      // Add metadata column to risk_assessments if it doesn't exist
      try {
        await this.db.execAsync(`
          ALTER TABLE risk_assessments ADD COLUMN metadata TEXT;
        `);
      } catch (error) {
        // Column might already exist, ignore error
        if (!error.message.includes('duplicate column')) {
          console.log('Metadata column already exists in risk_assessments or migration not needed');
        }
      }
    } catch (error) {
      console.error('Error running migrations:', error);
      // Don't throw - migrations are optional upgrades
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
      return await this.db.runAsync(sql, params);
    } catch (error) {
      console.error('Error executing query:', error);
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
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      const result = await this.executeQuery(sql, values);
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(table, id, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
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

