import React, { useState, useEffect, createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './src/services/AuthService';
import OfflineApiService from './src/services/OfflineApiService';
import NetworkService from './src/services/NetworkService';
import LocationService from './src/services/LocationService';
import CustomDrawerContent from './src/components/CustomDrawerContent';
import { setGlobalLogoutHandler, setGlobalAuthRefreshHandler } from './src/utils/globalHandlers';

// Create navigation reference
const navigationRef = createRef();

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AssetHierarchyScreen from './src/screens/AssetHierarchyScreen';
import SafetyScreen from './src/screens/SafetyScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import TaskHazardScreen from './src/screens/TaskHazardScreen';
import RiskAssessmentScreen from './src/screens/RiskAssessmentScreen';
import TaskHazardAnalyticsScreen from './src/screens/TaskHazardAnalyticsScreen';
import RiskAssessmentAnalyticsScreen from './src/screens/RiskAssessmentAnalyticsScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import ApprovalRequestsScreen from './src/screens/ApprovalRequestsScreen';

const Stack = createNativeStackNavigator();

// Custom Header Button Component
function HeaderMenuButton({ onPress }) {
  return (
    <TouchableOpacity
      style={{ marginLeft: 10, padding: 8 }}
      onPress={onPress}
    >
      <Ionicons name="menu" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

// Sidebar Modal Component
function SidebarModal({ visible, onClose, navigation, currentRoute }) {
  const handleNavigate = (routeName) => {
    onClose();
    if (navigation && navigation.navigate) {
      navigation.navigate(routeName);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sidebarContainer}>
          <CustomDrawerContent 
            navigation={{
              navigate: handleNavigate,
              reset: navigation?.reset,
            }} 
            state={{ 
              routeNames: [currentRoute], 
              index: 0 
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

// Main App Navigator with Custom Sidebar
function MainAppNavigator() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={({ navigation, route }) => ({
          headerStyle: {
            backgroundColor: 'rgb(52, 73, 94)',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <HeaderMenuButton onPress={toggleSidebar} />
          ),
        })}
        screenListeners={{
          state: (e) => {
            // Track current route for sidebar
            const state = e.data.state;
            if (state) {
              const currentRouteName = state.routes[state.index].name;
              setCurrentRoute(currentRouteName);
            }
          },
        }}
      >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Utah Technical Services LLC',
        }}
      />
      <Stack.Screen 
        name="AssetHierarchy" 
        component={AssetHierarchyScreen}
        options={{
          title: 'Asset Hierarchy',
        }}
      />
      <Stack.Screen 
        name="Safety" 
        component={SafetyScreen}
        options={{
          title: 'Safety',
        }}
      />
      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen 
        name="TaskHazard" 
        component={TaskHazardScreen}
        options={{
          title: 'Task Hazard Assessment',
        }}
      />
      <Stack.Screen 
        name="RiskAssessment" 
        component={RiskAssessmentScreen}
        options={{
          title: 'Risk Assessment Dashboard',
        }}
      />
      <Stack.Screen 
        name="AnalyticsTaskHazard" 
        component={TaskHazardAnalyticsScreen}
        options={{
          title: 'Task Hazard Analytics',
        }}
      />
      <Stack.Screen 
        name="AnalyticsRiskAssessment" 
        component={RiskAssessmentAnalyticsScreen}
        options={{
          title: 'Risk Assessment Analytics',
        }}
      />
      <Stack.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen 
        name="ApprovalRequests" 
        component={ApprovalRequestsScreen}
        options={{
          title: 'Approval Requests',
        }}
      />
    </Stack.Navigator>

    {/* Custom Sidebar Modal */}
    <SidebarModal
      visible={sidebarVisible}
      onClose={() => setSidebarVisible(false)}
      navigation={navigationRef.current}
      currentRoute={currentRoute}
    />
  </View>
  );
}

// Global functions are now handled in src/utils/globalHandlers.js

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize offline services first
      await OfflineApiService.initialize();
      setIsOfflineReady(true);
      
      // Initialize location service
      await LocationService.initialize();
      
      // Set global logout handler
      setGlobalLogoutHandler(() => {
        setIsAuthenticated(false);
      });
      
      // Set global auth refresh handler
      setGlobalAuthRefreshHandler(() => {
        console.log('Global auth refresh handler called');
        checkAuthStatus();
      });
      
      // Set up network monitoring
      NetworkService.addListener((networkStatus) => {
        console.log('Network status changed:', networkStatus);
        if (networkStatus.isOnline && isAuthenticated) {
          // Attempt to sync data when back online
          OfflineApiService.syncAllData().catch(error => {
            console.log('Sync failed:', error.message);
          });
        }
      });
      
      // Check authentication status last
      await checkAuthStatus();
      
    } catch (error) {
      console.error('App initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      NetworkService.cleanup();
      LocationService.cleanup();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...');
      
      // Direct check of AsyncStorage
      const user = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      const authenticated = !!(user && token);
      
      console.log('User exists:', !!user);
      console.log('Token exists:', !!token);
      console.log('Authentication status:', authenticated);
      
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        console.log('User authenticated successfully');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" backgroundColor="rgb(52, 73, 94)" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainApp" component={MainAppNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    width: 280,
    backgroundColor: 'rgb(52, 73, 94)',
    height: '100%',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
