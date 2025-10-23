import { AssetHierarchyApi } from './AssetHierarchyApi';
import DatabaseService from './DatabaseService';
import { ApiError } from '../lib/api-client';

/**
 * Hybrid Asset Hierarchy Service
 * Handles both online API calls and offline SQLite storage
 * Automatically tries API first, falls back to cache if offline
 */
export const AssetHierarchyService = {
  /**
   * Get all assets - tries API first, falls back to local cache
   */
  getAll: async () => {
    try {
      // Try to fetch from API first
      try {
        const response = await AssetHierarchyApi.getAll();
        const apiAssets = response.data || [];

        // Cache the assets in SQLite for offline use
        await AssetHierarchyService.cacheAssets(apiAssets);

        return {
          data: apiAssets,
          source: 'api',
          cached: true
        };
      } catch (apiError) {
        // Fall through to cache
        const cachedAssets = await AssetHierarchyService.getAssetsFromCache();
        
        if (cachedAssets.length === 0) {
          // No cached data available
          throw new Error('Unable to load assets. Please connect to the internet to download data for offline use.');
        }
        
        return {
          data: cachedAssets,
          source: 'cache',
          cached: true,
          offline: true
        };
      }
    } catch (error) {
      console.error('❌ Error in AssetHierarchyService.getAll:', error);
      throw error;
    }
  },

  /**
   * Cache assets to SQLite database
   */
  cacheAssets: async (assets) => {
    try {
      if (!Array.isArray(assets) || assets.length === 0) {
        return;
      }

      // Clear existing assets before caching new ones
      await DatabaseService.executeQuery('DELETE FROM assets');

      // Sort assets by hierarchy level to ensure parents are inserted before children
      const sortedAssets = [...assets].sort((a, b) => {
        const levelA = a.level || 0;
        const levelB = b.level || 0;
        return levelA - levelB;
      });

      // Create a map of all asset IDs for quick lookup
      const assetIdMap = new Set(sortedAssets.map(asset => asset._id || asset.id));

      // Temporarily disable foreign key constraints to avoid insertion order issues
      const db = DatabaseService.getDatabase();
      await db.execAsync('PRAGMA foreign_keys = OFF;');
      
      try {
        // Insert all assets
        for (const asset of sortedAssets) {
          const assetData = {
            id: asset._id || asset.id,
            name: asset.name || 'Unnamed Asset',
            type: asset.objectType || 'Unknown',
            parent_id: asset.parent || null,
            hierarchy_path: asset.hierarchyPath || '',
            metadata: JSON.stringify({
              cmmsInternalId: asset.cmmsInternalId,
              objectType: asset.objectType,
              description: asset.description,
              location: asset.location,
              status: asset.status,
              company: asset.company,
              createdAt: asset.createdAt,
              updatedAt: asset.updatedAt,
              // Store any additional fields
              ...asset
            }),
            synced: 1
          };

          // Check if parent exists in our asset list or database, if not, set parent_id to null
          if (assetData.parent_id) {
            const parentExistsInBatch = assetIdMap.has(assetData.parent_id);
            let parentExistsInDatabase = false;
            
            if (!parentExistsInBatch) {
              try {
                const parentInDb = await DatabaseService.getById('assets', assetData.parent_id);
                parentExistsInDatabase = !!parentInDb;
              } catch (error) {
                parentExistsInDatabase = false;
              }
            }
            
            if (!parentExistsInBatch && !parentExistsInDatabase) {
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
            // If insert fails (duplicate), try update
            if (insertError.message.includes('UNIQUE constraint failed')) {
              try {
                await DatabaseService.update('assets', assetData.id, assetData);
              } catch (updateError) {
                console.error('Error updating asset:', assetData.id, updateError);
              }
            } else if (insertError.message.includes('FOREIGN KEY constraint failed') && assetData.parent_id) {
              // If foreign key constraint fails, create a placeholder parent
              const parentExists = await DatabaseService.getById('assets', assetData.parent_id);
              if (!parentExists) {
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
                
                // Now try to insert the original asset again
                try {
                  await DatabaseService.insert('assets', assetData);
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
                // Parent exists but still foreign key error, try update instead
                try {
                  await DatabaseService.update('assets', assetData.id, assetData);
                } catch (updateError) {
                  console.error('Error updating asset with existing parent:', assetData.id, updateError);
                }
              }
            } else {
              console.error('Error inserting asset:', assetData.id, insertError);
            }
          }
        }

      } finally {
        // Re-enable foreign key constraints
        const db = DatabaseService.getDatabase();
        await db.execAsync('PRAGMA foreign_keys = ON;');
      }
    } catch (error) {
      console.error('Error caching assets:', error);
      throw error;
    }
  },

  /**
   * Get assets from local cache
   */
  getAssetsFromCache: async () => {
    try {
      const cachedAssets = await DatabaseService.getAll('assets');
      
      if (!cachedAssets || cachedAssets.length === 0) {
        return [];
      }

      // Transform cached assets back to API format
      const assets = cachedAssets.map(cached => {
        let metadata = {};
        try {
          metadata = JSON.parse(cached.metadata || '{}');
        } catch (e) {
          console.warn('Failed to parse metadata for asset:', cached.id);
        }

        return {
          id: cached.id,
          _id: cached.id,
          name: cached.name,
          objectType: cached.type,
          parent: cached.parent_id,
          hierarchyPath: cached.hierarchy_path,
          cmmsInternalId: metadata.cmmsInternalId,
          description: metadata.description,
          location: metadata.location,
          status: metadata.status,
          company: metadata.company,
          createdAt: metadata.createdAt,
          updatedAt: metadata.updatedAt,
          // Include all other metadata fields
          ...metadata
        };
      });
      return assets;
    } catch (error) {
      console.error('Error loading assets from cache:', error);
      return [];
    }
  },

  /**
   * Get a specific asset - tries API first, falls back to cache
   */
  getOne: async (id) => {
    try {
      // Try API first
      try {
        const response = await AssetHierarchyApi.getOne(id);
        return {
          data: response.data,
          source: 'api'
        };
      } catch (apiError) {
        console.warn('API fetch failed, loading from cache:', apiError.message);
        
        // Load from cache
        const cachedAsset = await DatabaseService.getById('assets', id);
        if (!cachedAsset) {
          throw new Error('Asset not found');
        }

        let metadata = {};
        try {
          metadata = JSON.parse(cachedAsset.metadata || '{}');
        } catch (e) {
          console.warn('Failed to parse metadata for asset:', id);
        }

        const asset = {
          id: cachedAsset.id,
          _id: cachedAsset.id,
          name: cachedAsset.name,
          objectType: cachedAsset.type,
          parent: cachedAsset.parent_id,
          hierarchyPath: cachedAsset.hierarchy_path,
          ...metadata
        };

        return {
          data: asset,
          source: 'cache'
        };
      }
    } catch (error) {
      console.error('Error in AssetHierarchyService.getOne:', error);
      throw error;
    }
  },

  /**
   * Create new asset (online only)
   */
  create: async (data) => {
    try {
      const response = await AssetHierarchyApi.create(data);
      
      // Add to cache
      if (response.data) {
        await AssetHierarchyService.cacheAssets([response.data]);
      }

      return response;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  },

  /**
   * Upload CSV (online only)
   */
  uploadCSV: async (file) => {
    return await AssetHierarchyApi.uploadCSV(file);
  },

  /**
   * Get upload status (online only)
   */
  getUploadStatus: async (uploadId) => {
    return await AssetHierarchyApi.getUploadStatus(uploadId);
  },

  /**
   * Get upload history (online only)
   */
  getUploadHistory: async () => {
    return await AssetHierarchyApi.getUploadHistory();
  },

  /**
   * Delete asset (online only)
   */
  deleteAssetUniversal: async (id) => {
    try {
      const response = await AssetHierarchyApi.deleteAssetUniversal(id);
      
      // Remove from cache
      await DatabaseService.delete('assets', id);

      return response;
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  },

  /**
   * Check if we have cached data
   */
  hasCachedData: async () => {
    try {
      const count = await DatabaseService.selectQuery(
        'SELECT COUNT(*) as count FROM assets'
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
        'SELECT COUNT(*) as count FROM assets'
      );
      const lastUpdate = await DatabaseService.selectQuery(
        'SELECT MAX(updated_at) as last_update FROM assets'
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
   * Clear all cached assets
   */
  clearCache: async () => {
    try {
      await DatabaseService.executeQuery('DELETE FROM assets');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }
};

