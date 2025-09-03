import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User, Device, Encounter, LocationBreadcrumb, SyncItem, AppConfig } from '../types';
import { RSSI_THRESHOLDS } from '../constants';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setDevice: (device: Device | null) => void;
  addEncounter: (encounter: Encounter) => void;
  addLocation: (location: LocationBreadcrumb) => void;
  addToSyncQueue: (item: SyncItem) => void;
  removeFromSyncQueue: (id: string) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setBluetoothStatus: (isEnabled: boolean) => void;
  setLocationStatus: (isEnabled: boolean) => void;
  updatePermissions: (permissions: Partial<AppState['permissions']>) => void;
  clearUserData: () => void;
  getUnsynced: () => { encounters: Encounter[]; locations: LocationBreadcrumb[] };
}

const defaultConfig: AppConfig = {
  bleAdvertisingInterval: 1000,
  bleScanInterval: 5000,
  locationUpdateInterval: 30000,
  syncInterval: 60000,
  rssiThresholds: {
    veryNear: RSSI_THRESHOLDS.VERY_NEAR,
    near: RSSI_THRESHOLDS.NEAR,
    far: RSSI_THRESHOLDS.FAR,
  },
  privacySettings: {
    rotateKeysInterval: 3600000, // 1 hour
    shareLocationData: true,
    shareEncounterData: true,
  },
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      device: null,
      encounters: [],
      locations: [],
      syncQueue: [],
      config: defaultConfig,
      isOnline: false,
      isBluetoothEnabled: false,
      isLocationEnabled: false,
      permissions: {
        bluetooth: false,
        location: false,
        notifications: false,
      },

      // Actions
      setUser: (user) => set({ user }),
      
      setDevice: (device) => set({ device }),
      
      addEncounter: (encounter) =>
        set((state) => ({
          encounters: [encounter, ...state.encounters].slice(0, 1000), // Keep last 1000
        })),
      
      addLocation: (location) =>
        set((state) => ({
          locations: [location, ...state.locations].slice(0, 500), // Keep last 500
        })),
      
      addToSyncQueue: (item) =>
        set((state) => ({
          syncQueue: [...state.syncQueue, item],
        })),
      
      removeFromSyncQueue: (id) =>
        set((state) => ({
          syncQueue: state.syncQueue.filter((item) => item.id !== id),
        })),
      
      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      setBluetoothStatus: (isBluetoothEnabled) => set({ isBluetoothEnabled }),
      
      setLocationStatus: (isLocationEnabled) => set({ isLocationEnabled }),
      
      updatePermissions: (newPermissions) =>
        set((state) => ({
          permissions: { ...state.permissions, ...newPermissions },
        })),
      
      clearUserData: () =>
        set({
          user: null,
          device: null,
          encounters: [],
          locations: [],
          syncQueue: [],
        }),
      
      getUnsynced: () => {
        const state = get();
        return {
          encounters: state.encounters.filter((e) => !e.isSynced),
          locations: state.locations.filter((l) => !l.isSynced),
        };
      },
    }),
    {
      name: 'uts-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        device: state.device,
        config: state.config,
        permissions: state.permissions,
        // Don't persist encounters, locations, and syncQueue for performance
      }),
    }
  )
);
