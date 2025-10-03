/**
 * Mock Offline Service for Testing in Expo Go
 * Simulates offline functionality for development
 */
class MockOfflineService {
  constructor() {
    this.isOffline = false;
    this.mockData = {
      equipment: [],
      hazards: [],
      riskAssessments: [],
      locations: []
    };
  }

  /**
   * Toggle offline mode for testing
   */
  toggleOfflineMode() {
    this.isOffline = !this.isOffline;
    console.log('Mock offline mode:', this.isOffline ? 'ON' : 'OFF');
    return this.isOffline;
  }

  /**
   * Get offline status
   */
  getOfflineStatus() {
    return {
      isOffline: this.isOffline,
      message: this.isOffline ? 'Simulated offline mode' : 'Online mode',
      canSync: !this.isOffline
    };
  }

  /**
   * Mock equipment data
   */
  getMockEquipment() {
    return [
      {
        id: '1',
        name: 'Excavator #001',
        type: 'excavator',
        location: 'Surface Level',
        status: 'operational',
        lastInspection: '2024-01-15',
        coordinates: { latitude: 40.7128, longitude: -74.0060 }
      },
      {
        id: '2',
        name: 'Haul Truck #002',
        type: 'truck',
        location: 'Underground Level 1',
        status: 'maintenance',
        lastInspection: '2024-01-10',
        coordinates: { latitude: 40.7130, longitude: -74.0058 }
      }
    ];
  }

  /**
   * Mock hazard data
   */
  getMockHazards() {
    return [
      {
        id: '1',
        title: 'Rock Fall Risk',
        description: 'Potential rock fall in tunnel section A',
        hazardType: 'geological',
        riskLevel: 'high',
        location: 'Tunnel A',
        coordinates: { latitude: 40.7125, longitude: -74.0055 },
        reportedBy: 'Safety Inspector',
        status: 'open'
      },
      {
        id: '2',
        title: 'Equipment Malfunction',
        description: 'Hydraulic leak in excavator',
        hazardType: 'equipment',
        riskLevel: 'medium',
        location: 'Equipment Zone B',
        coordinates: { latitude: 40.7135, longitude: -74.0065 },
        reportedBy: 'Equipment Operator',
        status: 'investigating'
      }
    ];
  }

  /**
   * Mock location data
   */
  getMockLocations() {
    return [
      {
        id: '1',
        name: 'Mine Entrance',
        type: 'surface',
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        description: 'Main mine entrance'
      },
      {
        id: '2',
        name: 'Underground Level 1',
        type: 'underground',
        coordinates: { latitude: 40.7130, longitude: -74.0058 },
        description: 'First underground level'
      }
    ];
  }

  /**
   * Simulate offline data operations
   */
  simulateOfflineOperations() {
    if (this.isOffline) {
      return {
        equipment: this.getMockEquipment(),
        hazards: this.getMockHazards(),
        locations: this.getMockLocations(),
        message: 'Working with cached offline data'
      };
    } else {
      return {
        equipment: [],
        hazards: [],
        locations: [],
        message: 'Connected to server - fetching live data'
      };
    }
  }

  /**
   * Simulate GPS location
   */
  getMockLocation() {
    return {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
      accuracy: 5,
      timestamp: new Date().toISOString(),
      source: 'mock_gps'
    };
  }

  /**
   * Simulate mine section detection
   */
  getMockMineSection() {
    const sections = [
      'Surface Operations',
      'Underground Level 1',
      'Equipment Zone A',
      'Hazard Zone B'
    ];
    return sections[Math.floor(Math.random() * sections.length)];
  }
}

// Export singleton instance
export default new MockOfflineService();
