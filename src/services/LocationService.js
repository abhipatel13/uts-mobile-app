import * as Location from 'expo-location';

/**
 * Location Service for Mine Operations
 * Handles GPS, Bluetooth beacons, and location management
 */
class LocationService {
  constructor() {
    this.isInitialized = false;
    this.currentLocation = null;
    this.locationPermission = null;
    this.watchId = null;
    this.beacons = new Map();
    this.locationUpdateInterval = 30000; // 30 seconds
  }

  /**
   * Initialize location service
   */
  async initialize() {
    try {
      // Request location permissions
      await this.requestLocationPermissions();
      
      // Get initial location
      await this.getCurrentLocation();
      
      // Set up location watching
      this.startLocationWatching();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Location service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermissions() {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        this.locationPermission = status;
      } else {
        this.locationPermission = existingStatus;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation() {
    try {
      if (this.locationPermission !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 60000
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: new Date().toISOString(),
        source: 'gps'
      };

      // Location tracking (no offline database)
      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // Fallback to last known location
      const lastLocation = await this.getLastKnownLocation();
      if (lastLocation) {
        this.currentLocation = lastLocation;
        return lastLocation;
      }
      
      throw error;
    }
  }

  /**
   * Start watching location changes
   */
  startLocationWatching() {
    try {
      if (this.watchId) {
        this.stopLocationWatching();
      }

      this.watchId = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.locationUpdateInterval,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('Error starting location watching:', error);
    }
  }

  /**
   * Stop watching location changes
   */
  stopLocationWatching() {
    if (this.watchId) {
      this.watchId.then(subscription => {
        if (subscription && subscription.remove) {
          subscription.remove();
        }
      }).catch(error => {
        console.error('Error removing location watch:', error);
      });
      this.watchId = null;
    }
  }

  /**
   * Handle location updates
   */
  async handleLocationUpdate(location) {
    try {
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: new Date().toISOString(),
        source: 'gps'
      };

      // Check if location has changed significantly
      if (this.hasLocationChanged(newLocation)) {
        this.currentLocation = newLocation;
        
        // Location tracking (no offline database)
      }
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  /**
   * Check if location has changed significantly
   */
  hasLocationChanged(newLocation) {
    if (!this.currentLocation) return true;
    
    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );
    
    // Update if moved more than 10 meters
    return distance > 10;
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }


  /**
   * Get last known location (from memory only)
   */
  async getLastKnownLocation() {
    return this.currentLocation;
  }

  /**
   * Get current location (cached or fresh)
   */
  getCurrentLocationSync() {
    return this.currentLocation;
  }

  /**
   * Set up Bluetooth beacons for underground locations
   */
  async setupBeacons() {
    try {
      // Define mine beacon zones
      const mineBeacons = [
        {
          id: 'mine_entrance',
          name: 'Mine Entrance',
          uuid: '12345678-1234-1234-1234-123456789abc',
          major: 1,
          minor: 1,
          coordinates: { latitude: 0, longitude: 0 }, // Set actual coordinates
          range: 50 // 50 meters
        },
        {
          id: 'level_1',
          name: 'Level 1',
          uuid: '12345678-1234-1234-1234-123456789abc',
          major: 1,
          minor: 2,
          coordinates: { latitude: 0, longitude: 0 },
          range: 30
        },
        {
          id: 'equipment_zone_a',
          name: 'Equipment Zone A',
          uuid: '12345678-1234-1234-1234-123456789abc',
          major: 2,
          minor: 1,
          coordinates: { latitude: 0, longitude: 0 },
          range: 20
        }
      ];

      // Store beacons in memory
      mineBeacons.forEach(beacon => {
        this.beacons.set(beacon.id, beacon);
      });
    } catch (error) {
      console.error('Error setting up beacons:', error);
    }
  }

  /**
   * Detect nearby Bluetooth beacons
   */
  async detectNearbyBeacons() {
    try {
      // This would integrate with actual Bluetooth beacon detection
      // For now, return mock data
      const nearbyBeacons = [];
      
      // In a real implementation, you would:
      // 1. Scan for Bluetooth beacons
      // 2. Calculate distance based on signal strength
      // 3. Return the closest beacon
      
      return nearbyBeacons;
    } catch (error) {
      console.error('Error detecting beacons:', error);
      return [];
    }
  }

  /**
   * Get location by type (GPS, beacon, manual)
   */
  async getLocationByType(type = 'gps') {
    try {
      switch (type) {
        case 'gps':
          return await this.getCurrentLocation();
        
        case 'beacon':
          const beacons = await this.detectNearbyBeacons();
          if (beacons.length > 0) {
            return {
              ...beacons[0].coordinates,
              source: 'beacon',
              beaconId: beacons[0].id,
              accuracy: beacons[0].range,
              timestamp: new Date().toISOString()
            };
          }
          break;
        
        case 'manual':
          // Return last known location or default
          return this.currentLocation || {
            latitude: 0,
            longitude: 0,
            source: 'manual',
            timestamp: new Date().toISOString()
          };
        
        default:
          return await this.getCurrentLocation();
      }
    } catch (error) {
      console.error('Error getting location by type:', error);
      throw error;
    }
  }

  /**
   * Get mine section based on location
   */
  async getMineSection(location = null) {
    try {
      const currentLoc = location || this.currentLocation;
      if (!currentLoc) return null;

      // Define mine sections with GPS boundaries
      const mineSections = [
        {
          name: 'Surface Operations',
          bounds: {
            north: 40.0,
            south: 39.9,
            east: -111.0,
            west: -111.1
          }
        },
        {
          name: 'Underground Level 1',
          bounds: {
            north: 39.95,
            south: 39.9,
            east: -111.05,
            west: -111.1
          }
        }
      ];

      // Check which section the location falls into
      for (const section of mineSections) {
        if (
          currentLoc.latitude >= section.bounds.south &&
          currentLoc.latitude <= section.bounds.north &&
          currentLoc.longitude >= section.bounds.west &&
          currentLoc.longitude <= section.bounds.east
        ) {
          return section.name;
        }
      }

      return 'Unknown Section';
    } catch (error) {
      console.error('Error getting mine section:', error);
      return 'Unknown Section';
    }
  }

  /**
   * Check if location is in hazard zone (simplified - no offline database)
   */
  async isInHazardZone(location = null) {
    // Simplified implementation without offline database
    return { isInHazard: false };
  }

  /**
   * Get location status
   */
  getLocationStatus() {
    return {
      isInitialized: this.isInitialized,
      hasPermission: this.locationPermission === 'granted',
      currentLocation: this.currentLocation,
      isWatching: !!this.watchId,
      updateInterval: this.locationUpdateInterval
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopLocationWatching();
    this.beacons.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new LocationService();
