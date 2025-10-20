import { RiskAssessmentApi } from './RiskAssessmentApi';
import DatabaseService from './DatabaseService';
import NetInfo from '@react-native-community/netinfo';

class RiskAssessmentService {
  /**
   * Convert a local DB record back into API payload shape
   */
  static buildApiPayloadFromLocal(item) {
    const metadata = item.metadata ? (() => { try { return JSON.parse(item.metadata); } catch { return {}; } })() : {};
    const parsedRisks = Array.isArray(item.risks) ? item.risks : (() => { try { return item.risks ? JSON.parse(item.risks) : []; } catch { return []; } })();
    const parsedControls = Array.isArray(item.controls) ? item.controls : (() => { try { return item.controls ? JSON.parse(item.controls) : []; } catch { return []; } })();

    return {
      // API expects these names
      scopeOfWork: metadata.scopeOfWork ?? item.title ?? null,
      supervisor: metadata.supervisor ?? item.assessor ?? null,
      individuals: (() => {
        const individuals = metadata.individuals ?? null;
        if (Array.isArray(individuals)) {
          return individuals.join(', ');
        }
        return individuals;
      })(),
      assessmentTeam: metadata.assessmentTeam ?? null,
      assetSystem: metadata.assetSystem ?? null,
      company: metadata.company ?? null,
      createdAt: metadata.createdAt ?? null,
      // common fields
      location: item.location ?? metadata.location ?? null,
      date: item.date ?? metadata.date ?? null,
      time: item.time ?? metadata.time ?? null,
      status: item.status ?? metadata.status ?? 'draft',
      risks: parsedRisks,
      controls: parsedControls,
      severity: item.severity ?? null,
      likelihood: item.likelihood ?? null,
    };
  }
  /**
   * Get all risk assessments - try API first, fallback to cache
   */
  static async getAll(params = {}) {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        try {
          const response = await RiskAssessmentApi.getAll(params);          
          if (response && response.data) {
            try {
              // Cache the data for offline use
              await this.cacheRiskAssessments(response.data);
              return { ...response, source: 'api' };
            } catch (cacheError) {
              console.error('RiskAssessmentService: Caching failed, but API data is available:', cacheError);
              // Even if caching fails, return the API data
              return { ...response, source: 'api' };
            }
          }
        } catch (apiError) {
          console.error('RiskAssessmentService: API call failed:', apiError);
        }
      }
      
      // Fallback to cache
      const cachedData = await this.getRiskAssessmentsFromCache();
      return { data: cachedData, source: 'cache' };
    } catch (error) {
      console.error('Error in RiskAssessmentService.getAll:', error);
      
      // Fallback to cache on error
      try {
        const cachedData = await this.getRiskAssessmentsFromCache();
        return { data: cachedData, source: 'cache' };
      } catch (cacheError) {
        console.error('Error fetching from cache:', cacheError);
        throw error;
      }
    }
  }

  /**
   * Get a specific risk assessment
   */
  static async getOne(id) {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        return await RiskAssessmentApi.getOne(id);
      } else {
        // Get from cache
        const cached = await DatabaseService.get('risk_assessments', { id });
        return { data: cached };
      }
    } catch (error) {
      console.error('Error in RiskAssessmentService.getOne:', error);
      throw error;
    }
  }

  /**
   * Create a new risk assessment
   */
  static async create(data) {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        // Create on server
        const response = await RiskAssessmentApi.create(data);
        if (response && response.data) {
          // Cache the created item
          await this.cacheRiskAssessments([response.data]);
        }
        return response;
      } else {
        // Save locally when offline
        const riskAssessmentData = {
          id: data.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.scopeOfWork || data.title || null,
          location: data.location || null,
          date: data.date || null,
          time: data.time || null,
          assessor: data.supervisor || data.assessor || null,
          risks: data.risks ? JSON.stringify(data.risks) : null,
          controls: data.controls ? JSON.stringify(data.controls) : null,
          severity: data.severity || null,
          likelihood: data.likelihood || null,
          status: data.status || 'draft',
          created_by: data.created_by || null,
          metadata: JSON.stringify({
            scopeOfWork: data.scopeOfWork,
            supervisor: data.supervisor,
            individuals: data.individuals,
            assessmentTeam: data.assessmentTeam,
            time: data.time,
            assetSystem: data.assetSystem,
            company: data.company,
            createdAt: data.createdAt,
            ...data
          }),
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          synced: 0
        };

        await DatabaseService.insert('risk_assessments', riskAssessmentData);
        
        // Add to sync queue
        await DatabaseService.insert('sync_queue', {
          entity_type: 'risk_assessment',
          entity_id: riskAssessmentData.id,
          operation: 'create',
          data: JSON.stringify(riskAssessmentData)
        });

        return { data: riskAssessmentData, source: 'offline' };
      }
    } catch (error) {
      console.error('Error in RiskAssessmentService.create:', error);
      throw error;
    }
  }

  /**
   * Update a risk assessment
   */
  static async update(id, data) {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        // Update on server
        const response = await RiskAssessmentApi.update(id, data);
        if (response && response.data) {
          // Update cache
          await DatabaseService.update('risk_assessments', id, { ...data, synced: 1 });
        }
        return response;
      } else {
        // Update locally when offline
        const updateData = {
          title: data.scopeOfWork || data.title || null,
          location: data.location || null,
          date: data.date || null,
          time: data.time || null,
          assessor: data.supervisor || data.assessor || null,
          risks: data.risks ? JSON.stringify(data.risks) : null,
          controls: data.controls ? JSON.stringify(data.controls) : null,
          severity: data.severity || null,
          likelihood: data.likelihood || null,
          status: data.status || null,
          created_by: data.created_by || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          synced: 0,
          updated_at: Math.floor(Date.now() / 1000)
        };

        await DatabaseService.update('risk_assessments', id, updateData);
        
        // Add to sync queue
        await DatabaseService.insert('sync_queue', {
          entity_type: 'risk_assessment',
          entity_id: id,
          operation: 'update',
          data: JSON.stringify(updateData)
        });

        return { data: { id, ...updateData }, source: 'offline' };
      }
    } catch (error) {
      console.error('Error in RiskAssessmentService.update:', error);
      throw error;
    }
  }

  /**
   * Delete a risk assessment
   */
  static async delete(id) {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isOnline) {
        // Delete from server
        await RiskAssessmentApi.delete(id);
        // Remove from cache
        await DatabaseService.delete('risk_assessments', id);
        return { success: true };
      } else {
        // Mark for deletion when offline
        await DatabaseService.update('risk_assessments', id, { 
          synced: 0, 
          status: 'deleted',
          updated_at: Math.floor(Date.now() / 1000)
        });
        
        // Add to sync queue
        await DatabaseService.insert('sync_queue', {
          entity_type: 'risk_assessment',
          entity_id: id,
          operation: 'delete',
          data: JSON.stringify({ id })
        });

        return { success: true, source: 'offline' };
      }
    } catch (error) {
      console.error('Error in RiskAssessmentService.delete:', error);
      throw error;
    }
  }

  /**
   * Cache risk assessments to local database
   */
  static async cacheRiskAssessments(riskAssessments) {
    try {
      if (!riskAssessments || riskAssessments.length === 0) {
        return;
      }

      // Clear existing data before caching
      await DatabaseService.executeQuery('DELETE FROM risk_assessments');

      // Disable foreign key constraints during bulk insert
      await DatabaseService.executeQuery('PRAGMA foreign_keys = OFF');
      
      for (const assessment of riskAssessments) {
        const assessmentData = {
          id: assessment.id,
          title: assessment.scopeOfWork || assessment.title || null, // Map scopeOfWork to title
          location: assessment.location || null,
          date: assessment.date || null,
          assessor: assessment.supervisor || assessment.assessor || null, // Map supervisor to assessor
          risks: assessment.risks ? JSON.stringify(assessment.risks) : null,
          controls: assessment.controls ? JSON.stringify(assessment.controls) : null,
          severity: assessment.severity || null,
          likelihood: assessment.likelihood || null,
          status: assessment.status || 'draft',
          created_by: assessment.created_by || null,
          // Store all extra data as metadata
          metadata: JSON.stringify({
            scopeOfWork: assessment.scopeOfWork,
            supervisor: assessment.supervisor,
            individuals: assessment.individuals,
            time: assessment.time,
            assetSystem: assessment.assetSystem,
            company: assessment.company,
            createdAt: assessment.createdAt,
            ...assessment
          }),
          created_at: assessment.createdAt ? new Date(assessment.createdAt).getTime() / 1000 : Math.floor(Date.now() / 1000),
          updated_at: assessment.updatedAt ? new Date(assessment.updatedAt).getTime() / 1000 : Math.floor(Date.now() / 1000),
          synced: 1
        };

        try {
          // Use INSERT OR REPLACE to handle duplicate IDs
          await DatabaseService.executeQuery(`
            INSERT OR REPLACE INTO risk_assessments 
            (id, title, location, date, assessor, risks, controls, severity, likelihood, status, created_by, metadata, created_at, updated_at, synced)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            assessmentData.id,
            assessmentData.title,
            assessmentData.location,
            assessmentData.date,
            assessmentData.assessor,
            assessmentData.risks,
            assessmentData.controls,
            assessmentData.severity,
            assessmentData.likelihood,
            assessmentData.status,
            assessmentData.created_by,
            assessmentData.metadata,
            assessmentData.created_at,
            assessmentData.updated_at,
            assessmentData.synced
          ]);
        } catch (insertError) {
          console.error('Error inserting assessment:', assessment.id, insertError);
          // Continue with other assessments even if one fails
        }
      }

      // Re-enable foreign key constraints
      await DatabaseService.executeQuery('PRAGMA foreign_keys = ON');
    } catch (error) {
      console.error('Error caching risk assessments:', error);
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
   * Get risk assessments from cache
   */
  static async getRiskAssessmentsFromCache() {
    try {
      const assessments = await DatabaseService.getAll('risk_assessments', 'status != ?', ['deleted']);
      return assessments.map(assessment => {
        const metadata = assessment.metadata ? JSON.parse(assessment.metadata) : {};
        return {
          id: assessment.id,
          scopeOfWork: metadata.scopeOfWork || assessment.title, // Map title back to scopeOfWork
          supervisor: metadata.supervisor || assessment.assessor, // Map assessor back to supervisor
          individuals: metadata.individuals,
          time: metadata.time,
          location: assessment.location,
          date: assessment.date,
          status: assessment.status,
          risks: assessment.risks ? JSON.parse(assessment.risks) : [],
          controls: assessment.controls ? JSON.parse(assessment.controls) : [],
          assetSystem: metadata.assetSystem,
          company: metadata.company,
          createdAt: metadata.createdAt || new Date(assessment.created_at * 1000).toISOString(),
          updatedAt: metadata.updatedAt || new Date(assessment.updated_at * 1000).toISOString(),
          ...metadata
        };
      });
    } catch (error) {
      console.error('Error getting risk assessments from cache:', error);
      throw error;
    }
  }

  /**
   * Sync pending risk assessments to server
   */
  static async syncPendingRiskAssessments() {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      if (!isOnline) {
        return { synced: 0, message: 'Offline - sync will happen when online' };
      }

      const pendingItems = await DatabaseService.getAll('risk_assessments', 'synced = ?', [0]);
      let syncedCount = 0;
      let failedCount = 0;

      console.log(`Syncing ${pendingItems.length} pending risk assessments`);

      for (const item of pendingItems) {
        // Double-check the item is still unsynced (in case of concurrent processing)
        const currentItem = await DatabaseService.getById('risk_assessments', item.id);
        if (!currentItem || currentItem.synced === 1) {
          console.log(`Skipping already synced item: ${item.id}`);
          continue;
        }
        try {
          if (item.status === 'deleted') {
            console.log(`Deleting risk assessment: ${item.id}`);
            await RiskAssessmentApi.delete(item.id);
            await DatabaseService.delete('risk_assessments', item.id);
          } else {
            // Try to create or update
            if (item.id.startsWith('temp_')) {
              // This is a new item, create it
              console.log(`Creating new risk assessment: ${item.id}`);
              const apiPayload = RiskAssessmentService.buildApiPayloadFromLocal(item);
              const response = await RiskAssessmentApi.create(apiPayload);
              if (response && response.data) {
                console.log(`Created risk assessment with server ID: ${response.data.id}`);
                // Delete the temp record and insert the server version
                await DatabaseService.delete('risk_assessments', item.id);
                
                // Insert the server version with the real ID
                const serverData = {
                  id: response.data.id,
                  title: response.data.title || response.data.scopeOfWork,
                  location: response.data.location,
                  date: response.data.date,
                  time: response.data.time,
                  assessor: response.data.assessor || response.data.supervisor,
                  risks: response.data.risks ? JSON.stringify(response.data.risks) : null,
                  controls: response.data.controls ? JSON.stringify(response.data.controls) : null,
                  severity: response.data.severity,
                  likelihood: response.data.likelihood,
                  status: response.data.status || 'draft',
                  created_by: response.data.created_by,
                  metadata: JSON.stringify({
                    ...response.data,
                    _syncedFromServer: true
                  }),
                  created_at: Math.floor(Date.now() / 1000),
                  updated_at: Math.floor(Date.now() / 1000),
                  synced: 1
                };
                
                await DatabaseService.insert('risk_assessments', serverData);
                console.log(`Successfully synced risk assessment: ${item.id} -> ${response.data.id}`);
              }
            } else {
              // This is an update
              console.log(`Updating risk assessment: ${item.id}`);
              const apiPayload = RiskAssessmentService.buildApiPayloadFromLocal(item);
              await RiskAssessmentApi.update(item.id, apiPayload);
              await DatabaseService.update('risk_assessments', item.id, { synced: 1 });
              console.log(`Successfully updated risk assessment: ${item.id}`);
            }
          }
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing risk assessment ${item.id}:`, error);
          const message = error?.message?.toLowerCase?.() || '';
          const isNetworkError = message.includes('network request failed') || message.includes('network') || message.includes('fetch');
          if (isNetworkError) {
            console.log(`Network error for ${item.id}, keeping as pending`);
            // do not increment failed; keep pending
          } else {
            console.error(`❌ Failed to sync risk assessment ${item.id}:`, error?.message || error);
            failedCount++;
          }
        }
      }

      return { synced: syncedCount, failed: failedCount, message: `Synced ${syncedCount} risk assessments` };
    } catch (error) {
      console.error('Error syncing pending risk assessments:', error);
      const msg = error?.message?.toLowerCase?.() || '';
      if (msg.includes('network')) {
        return { synced: 0, failed: 0, offline: true, message: 'Offline - will retry' };
      }
      return { synced: 0, failed: 0, message: 'Sync failed', error: error.message };
    }
  }

  /**
   * Get count of pending sync items
   */
  static async getPendingCount() {
    try {
      const pendingItems = await DatabaseService.getAll('risk_assessments', 'synced = ?', [0]);
      return pendingItems.length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Check for network connectivity and sync pending items
   */
  static async checkAndSync() {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      if (isOnline) {
        const pendingCount = await this.getPendingCount();
        if (pendingCount > 0) {
          return await this.syncPendingRiskAssessments();
        }
      }
      return { synced: 0, message: 'No pending items to sync' };
    } catch (error) {
      console.error('Error in checkAndSync:', error);
      return { synced: 0, message: 'Sync failed', error: error.message };
    }
  }

  /**
   * Start automatic sync monitoring
   */
  static startAutoSync() {
    // Check for sync every 30 seconds when online
    const syncInterval = setInterval(async () => {
      try {
        const isOnline = await NetInfo.fetch().then(state => state.isConnected);
        if (isOnline) {
          const result = await this.checkAndSync();
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Also listen for network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.checkAndSync();
      }
    });

    return () => {
      clearInterval(syncInterval);
      unsubscribe();
    };
  }
}

export default RiskAssessmentService;
