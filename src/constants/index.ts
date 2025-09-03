// Constants for UTS Mobile App

export const BLE_CONFIG = {
  SERVICE_UUID: '12345678-1234-1234-1234-123456789abc',
  CHARACTERISTIC_UUID: '87654321-4321-4321-4321-cba987654321',
  ADVERTISING_INTERVAL: 1000, // ms
  SCAN_INTERVAL: 5000, // ms
  SCAN_DURATION: 10000, // ms
  CONNECTION_TIMEOUT: 10000, // ms
} as const;

export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 30000, // 30 seconds
  FASTEST_INTERVAL: 10000, // 10 seconds
  GEOFENCE_RADIUS: 100, // meters
  HIGH_ACCURACY: true,
  BACKGROUND_MODE: true,
} as const;

export const SYNC_CONFIG = {
  INTERVAL: 60000, // 1 minute
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
} as const;

export const RSSI_THRESHOLDS = {
  VERY_NEAR: -40, // < 1 meter
  NEAR: -60,      // 1-3 meters
  FAR: -80,       // 3-10 meters
} as const;

export const PERMISSIONS = {
  BLUETOOTH: 'bluetooth',
  LOCATION: 'location',
  NOTIFICATIONS: 'notifications',
} as const;

export const STORAGE_KEYS = {
  USER: '@uts_user',
  DEVICE: '@uts_device',
  CONFIG: '@uts_config',
  ENCOUNTERS: '@uts_encounters',
  LOCATIONS: '@uts_locations',
  SYNC_QUEUE: '@uts_sync_queue',
} as const;

export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:3000', // Update with your backend URL
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  DEVICE: {
    REGISTER: '/api/devices/register',
    UPDATE: '/api/devices/update',
    STATUS: '/api/devices/status',
  },
  ENCOUNTERS: {
    SYNC: '/api/encounters/sync',
    BATCH: '/api/encounters/batch',
  },
  LOCATIONS: {
    SYNC: '/api/locations/sync',
    BATCH: '/api/locations/batch',
  },
  CONFIG: {
    GET: '/api/config',
    UPDATE: '/api/config/update',
  },
} as const;

export const NOTIFICATION_TYPES = {
  PROXIMITY_ALERT: 'proximity_alert',
  GEOFENCE_ENTER: 'geofence_enter',
  GEOFENCE_EXIT: 'geofence_exit',
  SYNC_COMPLETE: 'sync_complete',
  SYNC_ERROR: 'sync_error',
} as const;

export const COLORS = {
  PRIMARY: '#2C3E50',
  SECONDARY: '#3498DB',
  SUCCESS: '#27AE60',
  WARNING: '#F39C12',
  ERROR: '#E74C3C',
  INFO: '#8E44AD',
  BACKGROUND: '#FFFFFF',
  TEXT: '#2C3E50',
  TEXT_SECONDARY: '#7F8C8D',
  BORDER: '#BDC3C7',
} as const;
