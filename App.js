import React, { useState, useEffect, createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Modal, Animated, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './src/services/AuthService';
import LocationService from './src/services/LocationService';
import DatabaseService from './src/services/DatabaseService';
import { UserService } from './src/services/UserService';
import { AssetHierarchyService } from './src/services/AssetHierarchyService';
import RiskAssessmentService from './src/services/RiskAssessmentService';
import { TaskHazardService } from './src/services/TaskHazardService';
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
  const slideAnim = useState(new Animated.Value(-280))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -280,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleNavigate = (routeName) => {
    onClose();
    if (navigation && navigation.navigate) {
      navigation.navigate(routeName);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
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
        </Animated.View>
        <Animated.View style={[styles.modalBackground, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackgroundTouchable}
            onPress={onClose}
          />
        </Animated.View>
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

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Starting app initialization...');
      
      // Initialize database first
      console.log('Initializing database...');
      await DatabaseService.initialize();
      
      // Wait for database to be fully ready
      console.log('Waiting for database to be ready...');
      await DatabaseService.waitForDatabaseReady();
      console.log('Database is ready!');
      
      // Initialize location service
      console.log('Initializing location service...');
      await LocationService.initialize();
      
      // Start auto-sync for risk assessments
      console.log('Starting risk assessment auto-sync...');
      RiskAssessmentService.startAutoSync();

      // Start auto-sync for task hazards
      console.log('Starting task hazard auto-sync...');
      TaskHazardService.startAutoSync();
      
      // Set global logout handler
      setGlobalLogoutHandler(() => {
        setIsAuthenticated(false);
      });
      
      // Set global auth refresh handler
      setGlobalAuthRefreshHandler(() => {
        checkAuthStatus();
      });
      
      // Check authentication status
      console.log('Checking authentication status...');
      await checkAuthStatus();
      
      console.log('App initialization completed successfully!');
      
    } catch (error) {
      console.error('App initialization failed:', error);
      // Show error to user
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart the application.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      LocationService.cleanup();
      DatabaseService.close();
    };
  }, []);

  // Cache initial data for offline use
  const cacheInitialData = async () => {
    try {      
      // Cache users in background (don't block app loading)
      UserService.getAll().catch(err => {
        console.log('Could not cache users:', err.message);
      });
      
      // Cache assets in background
      AssetHierarchyService.getAll().catch(err => {
        console.log('Could not cache assets:', err.message);
      });
      
      // Cache risk assessments in background
      RiskAssessmentService.getAll().catch(err => {
        console.log('Could not cache risk assessments:', err.message);
      });
      
    } catch (error) {
      console.log('Error caching initial data:', error.message);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Add a small delay to ensure navigation is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Direct check of AsyncStorage
      const user = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      const authenticated = !!(user && token);
      
      setIsAuthenticated(authenticated);

      // If authenticated, pre-cache essential data for offline use
      if (authenticated) {
        cacheInitialData();
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
    <SafeAreaProvider>
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
    </SafeAreaProvider>
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
  modalBackgroundTouchable: {
    flex: 1,
  },
});
