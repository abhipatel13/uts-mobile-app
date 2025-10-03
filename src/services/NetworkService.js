/**
 * Network Service for Mine Operations
 * Handles network connectivity detection and offline/online status
 * Uses fetch-based connectivity detection for Expo compatibility
 */
class NetworkService {
  constructor() {
    this.isOnline = false;
    this.listeners = [];
    this.connectionType = 'unknown';
    this.isReachable = false;
    this.checkInterval = null;
  }

  /**
   * Initialize network monitoring
   */
  async initialize() {
    try {
      // Check initial network state
      await this.checkConnectivity();
      
      // Set up periodic connectivity checks
      this.startConnectivityMonitoring();

      console.log('Network service initialized');
    } catch (error) {
      console.error('Network service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check network connectivity using fetch
   */
  async checkConnectivity() {
    try {
      // Try to fetch a small resource to test connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      this.updateNetworkState({
        isConnected: true,
        isInternetReachable: response.ok,
        type: 'wifi' // Default to wifi for successful connections
      });
      
    } catch (error) {
      this.updateNetworkState({
        isConnected: false,
        isInternetReachable: false,
        type: 'none'
      });
    }
  }

  /**
   * Start periodic connectivity monitoring
   */
  startConnectivityMonitoring() {
    // Check connectivity every 30 seconds
    this.checkInterval = setInterval(async () => {
      await this.checkConnectivity();
      this.notifyListeners();
    }, 30000);
  }

  /**
   * Stop connectivity monitoring
   */
  stopConnectivityMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Update network state
   */
  updateNetworkState(state) {
    this.isOnline = state.isConnected && state.isInternetReachable;
    this.connectionType = state.type;
    this.isReachable = state.isInternetReachable;
    
    console.log('Network state updated:', {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      isReachable: this.isReachable
    });
  }

  /**
   * Get current network status
   */
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      isReachable: this.isReachable,
      isOffline: !this.isOnline
    };
  }

  /**
   * Check if device is online
   */
  isConnected() {
    return this.isOnline;
  }

  /**
   * Check if device is offline
   */
  isOffline() {
    return !this.isOnline;
  }

  /**
   * Get connection type
   */
  getConnectionType() {
    return this.connectionType;
  }

  /**
   * Check if connection is WiFi
   */
  isWiFi() {
    return this.connectionType === 'wifi';
  }

  /**
   * Check if connection is cellular
   */
  isCellular() {
    return this.connectionType === 'cellular';
  }

  /**
   * Check if connection is ethernet
   */
  isEthernet() {
    return this.connectionType === 'ethernet';
  }

  /**
   * Check if connection is unknown
   */
  isUnknown() {
    return this.connectionType === 'unknown';
  }

  /**
   * Add network state listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of network state change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getNetworkStatus());
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  /**
   * Get network quality indicator
   */
  getNetworkQuality() {
    if (this.isOffline()) {
      return 'offline';
    }

    switch (this.connectionType) {
      case 'wifi':
        return 'excellent';
      case 'ethernet':
        return 'excellent';
      case 'cellular':
        return 'good';
      case 'bluetooth':
        return 'poor';
      case 'unknown':
        return 'unknown';
      default:
        return 'unknown';
    }
  }

  /**
   * Get network status for display
   */
  getNetworkStatusDisplay() {
    const status = this.getNetworkStatus();
    
    if (status.isOffline) {
      return {
        text: 'Offline',
        color: '#ef4444',
        icon: 'cloud-offline-outline'
      };
    }

    switch (status.connectionType) {
      case 'wifi':
        return {
          text: 'WiFi Connected',
          color: '#22c55e',
          icon: 'wifi-outline'
        };
      case 'cellular':
        return {
          text: 'Mobile Data',
          color: '#f59e0b',
          icon: 'phone-portrait-outline'
        };
      case 'ethernet':
        return {
          text: 'Ethernet',
          color: '#22c55e',
          icon: 'hardware-chip-outline'
        };
      case 'bluetooth':
        return {
          text: 'Bluetooth',
          color: '#8b5cf6',
          icon: 'bluetooth-outline'
        };
      default:
        return {
          text: 'Connected',
          color: '#22c55e',
          icon: 'checkmark-circle-outline'
        };
    }
  }

  /**
   * Check if sync should be attempted
   */
  shouldAttemptSync() {
    // Only attempt sync if online and connection is good
    return this.isOnline && (this.isWiFi() || this.isEthernet());
  }

  /**
   * Check if data should be cached
   */
  shouldCacheData() {
    // Always cache data when offline or on poor connections
    return this.isOffline() || this.isCellular() || this.isUnknown();
  }

  /**
   * Get sync recommendations
   */
  getSyncRecommendations() {
    if (this.isOffline()) {
      return {
        canSync: false,
        message: 'No internet connection. Data will be synced when online.',
        recommendation: 'Continue working offline. All data is saved locally.'
      };
    }

    if (this.isWiFi() || this.isEthernet()) {
      return {
        canSync: true,
        message: 'Good connection detected. Safe to sync data.',
        recommendation: 'Sync now to upload offline data.'
      };
    }

    if (this.isCellular()) {
      return {
        canSync: true,
        message: 'Mobile data connection. Consider WiFi for large syncs.',
        recommendation: 'Sync critical data only to save mobile data.'
      };
    }

    return {
      canSync: false,
      message: 'Unknown connection type. Proceed with caution.',
      recommendation: 'Check connection and try again.'
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopConnectivityMonitoring();
    this.listeners = [];
    this.isOnline = false;
    this.connectionType = 'unknown';
    this.isReachable = false;
    console.log('Network service cleaned up');
  }
}

// Export singleton instance
export default new NetworkService();
