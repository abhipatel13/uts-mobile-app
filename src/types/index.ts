// Core types for UTS Mobile App

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'superuser' | 'admin' | 'user';
  company_id?: number;
  isActive: boolean;
}

export interface Device {
  id: string;
  userId: number;
  platform: 'ios' | 'android';
  bleKey: string;
  rotatingKeySeed: string;
  lastSeen: Date;
  isActive: boolean;
}

export interface Encounter {
  id: string;
  deviceId: string;
  encounteredDeviceId: string;
  rssi: number;
  distance: 'very-near' | 'near' | 'far';
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  isSynced: boolean;
}

export interface LocationBreadcrumb {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  activity?: 'still' | 'walking' | 'running' | 'driving';
  isSynced: boolean;
}

export interface GeofenceEvent {
  id: string;
  deviceId: string;
  geofenceId: string;
  action: 'enter' | 'exit' | 'dwell';
  latitude: number;
  longitude: number;
  timestamp: Date;
  isSynced: boolean;
}

export interface SyncItem {
  id: string;
  type: 'encounter' | 'location' | 'geofence';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface AppConfig {
  bleAdvertisingInterval: number;
  bleScanInterval: number;
  locationUpdateInterval: number;
  syncInterval: number;
  rssiThresholds: {
    veryNear: number;
    near: number;
    far: number;
  };
  privacySettings: {
    rotateKeysInterval: number;
    shareLocationData: boolean;
    shareEncounterData: boolean;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Encounters: undefined;
  Location: undefined;
  Sync: undefined;
};

// Store types
export interface AppState {
  user: User | null;
  device: Device | null;
  encounters: Encounter[];
  locations: LocationBreadcrumb[];
  syncQueue: SyncItem[];
  config: AppConfig;
  isOnline: boolean;
  isBluetoothEnabled: boolean;
  isLocationEnabled: boolean;
  permissions: {
    bluetooth: boolean;
    location: boolean;
    notifications: boolean;
  };
}
