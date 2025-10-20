import { UserApi } from './UserApi';
import DatabaseService from './DatabaseService';

/**
 * Hybrid User Service
 * Handles both online API calls and offline SQLite storage
 * Automatically tries API first, falls back to cache if offline
 */
export const UserService = {
  /**
   * Get all users - tries API first, falls back to local cache
   */
  getAll: async () => {
    try {
      // Try to fetch from API first
      try {
        const response = await UserApi.getAll();
        const apiUsers = response.data || [];

        // Cache the users in SQLite for offline use
        await UserService.cacheUsers(apiUsers);

        return {
          data: apiUsers,
          source: 'api',
          cached: true
        };
      } catch (apiError) {
        // Fall through to cache
        const cachedUsers = await UserService.getUsersFromCache();
        
        if (cachedUsers.length === 0) {
          // No cached data available
          throw new Error('Unable to load users. Please connect to the internet to download data for offline use.');
        }
        
        return {
          data: cachedUsers,
          source: 'cache',
          cached: true,
          offline: true
        };
      }
    } catch (error) {
      console.error('Error in UserService.getAll:', error);
      throw error;
    }
  },

  /**
   * Cache users to SQLite database
   */
  cacheUsers: async (users) => {
    try {
      if (!Array.isArray(users) || users.length === 0) {
        return;
      }

      // Clear existing users before caching new ones
      await DatabaseService.executeQuery('DELETE FROM users');

      // Insert all users
      for (const user of users) {
        // Skip users without a valid ID
        if (!user._id && !user.id) {
          console.warn('Skipping user without ID:', user);
          continue;
        }

        // Handle company field - if it's an object, extract name or id
        let companyValue = null;
        if (user.company) {
          if (typeof user.company === 'object') {
            companyValue = user.company.name || user.company.id || null;
          } else {
            companyValue = user.company;
          }
        } else if (user.companyId) {
          companyValue = user.companyId;
        }

        const userData = {
          id: user._id || user.id,
          username: user.username || null,
          email: user.email || null,
          name: user.name || user.fullName || user.username || null,
          full_name: user.fullName || user.full_name || null,
          role: user.role || 'user',
          company: companyValue,
          synced: 1,
          // Store all extra data as metadata
          metadata: JSON.stringify({
            ...user,
            fullName: user.fullName || null,
            phone: user.phone || null,
            department: user.department || null,
            companyId: user.companyId || null,
            status: user.status || null,
            createdAt: user.createdAt || null,
            updatedAt: user.updatedAt || null
          })
        };

        try {
          await DatabaseService.insert('users', userData);
        } catch (insertError) {
          // If insert fails (duplicate), try update
          if (insertError.message?.includes('UNIQUE constraint failed') || 
              insertError.message?.includes('PRIMARY KEY')) {
            try {
              await DatabaseService.update('users', userData.id, userData);
            } catch (updateError) {
              console.error('Error updating user:', userData.id, updateError);
            }
          } else {
            console.error('Error inserting user:', userData.id, insertError);
          }
        }
      }
    } catch (error) {
      console.error('Error caching users:', error);
      throw error;
    }
  },

  /**
   * Get users from local cache
   */
  getUsersFromCache: async () => {
    try {
      const cachedUsers = await DatabaseService.getAll('users');
      
      if (!cachedUsers || cachedUsers.length === 0) {
        return [];
      }

      // Parse metadata and reconstruct user objects
      const users = cachedUsers.map(cached => {
        let metadata = {};
        try {
          metadata = JSON.parse(cached.metadata || '{}');
        } catch (e) {
          console.warn('Failed to parse user metadata:', cached.id);
        }

        return {
          _id: cached.id,
          id: cached.id,
          username: cached.username,
          email: cached.email,
          role: cached.role,
          fullName: cached.full_name || metadata.fullName,
          ...metadata
        };
      });

      return users;
    } catch (error) {
      console.error('Error getting users from cache:', error);
      return [];
    }
  },

  /**
   * Get a single user by ID
   */
  getOne: async (id) => {
    try {
      // Try API first
      try {
        const response = await UserApi.getOne(id);

        console.log('response', response);
        return response;
      } catch (apiError) {
        // Fall back to cache
        const cachedUser = await DatabaseService.getById('users', id);
        
        if (!cachedUser) {
          throw new Error('User not found');
        }

        let metadata = {};
        try {
          metadata = JSON.parse(cachedUser.metadata || '{}');
        } catch (e) {
          console.warn('Failed to parse user metadata');
        }

        return {
          data: {
            _id: cachedUser.id,
            id: cachedUser.id,
            username: cachedUser.username,
            email: cachedUser.email,
            role: cachedUser.role,
            fullName: cachedUser.full_name || metadata.fullName,
            ...metadata
          },
          source: 'cache',
          offline: true
        };
      }
    } catch (error) {
      console.error('Error in UserService.getOne:', error);
      throw error;
    }
  },

  /**
   * Create new user (online only)
   */
  create: async (data) => {
    try {
      const response = await UserApi.create(data);
      
      // Add to cache
      if (response.data) {
        await UserService.cacheUsers([response.data]);
      }

      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update user (online only)
   */
  update: async (id, data) => {
    try {
      const response = await UserApi.update(id, data);
      
      // Update cache
      if (response.data) {
        await UserService.cacheUsers([response.data]);
      }

      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Delete user (online only)
   */
  delete: async (id) => {
    try {
      const response = await UserApi.delete(id);
      
      // Remove from cache
      await DatabaseService.delete('users', id);

      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Clear all cached users
   */
  clearCache: async () => {
    try {
      await DatabaseService.executeQuery('DELETE FROM users');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }
};

