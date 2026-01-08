import React, { useState, useEffect, createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Modal, Animated, Alert, Text } from 'react-native';
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
import { ApprovalService } from './src/services/ApprovalService';
import PushNotificationService from './src/services/PushNotificationService';
import CustomDrawerContent from './src/components/CustomDrawerContent';
import { setGlobalLogoutHandler, setGlobalAuthRefreshHandler } from './src/utils/globalHandlers';

// Create navigation reference
const navigationRef = createRef();

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AssetHierarchyScreen from './src/screens/AssetHierarchyScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import TaskHazardScreen from './src/screens/TaskHazardScreen';
import RiskAssessmentScreen from './src/screens/RiskAssessmentScreen';
import TaskHazardAnalyticsScreen from './src/screens/TaskHazardAnalyticsScreen';
import RiskAssessmentAnalyticsScreen from './src/screens/RiskAssessmentAnalyticsScreen';
import ApprovalRequestsScreen from './src/screens/ApprovalRequestsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationBell from './src/components/NotificationBell';

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

// Custom GPS Header Button Component
function HeaderGPSButton({ locationStatus, onPress }) {
  const isLocationActive = locationStatus?.hasPermission;
  const iconName = isLocationActive ? "location-outline" : "close-circle-outline";
  const iconColor = isLocationActive ? "#22c55e" : "#ef4444";
  
  return (
    <TouchableOpacity
      style={{ marginRight: 10, padding: 8 }}
      onPress={onPress}
    >
      <Ionicons name={iconName} size={24} color={iconColor} />
    </TouchableOpacity>
  );
}

// Sidebar Modal Component
function SidebarModal({ visible, onClose, navigation, currentRoute, currentUserRole }) {
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
            currentUserRole={currentUserRole}
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
function MainAppNavigator({ currentUserRole }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Dashboard');
  const [locationStatus, setLocationStatus] = useState(null);

  useEffect(() => {
    // Get initial location status
    const location = LocationService.getLocationStatus();
    setLocationStatus(location);

    // Setup push notification listeners
    // Use a small delay to ensure navigation is ready
    const setupNotifications = setTimeout(() => {
      const navigation = navigationRef.current;
      if (navigation) {
        PushNotificationService.setupNotificationListeners(navigation);
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(setupNotifications);
      PushNotificationService.removeNotificationListeners();
    };
  }, []);

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
          headerRight: ({ navigation }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <NotificationBell navigation={navigation} />
            <HeaderGPSButton 
              locationStatus={locationStatus}
              onPress={() => console.log('GPS pressed')} 
            />
            </View>
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
        options={({ navigation }) => ({
          title: 'Utah Technical Services LLC',
          headerTitle: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Dashboard')}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                Utah Technical Services LLC
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="AssetHierarchy" 
        component={AssetHierarchyScreen}
        options={{
          title: 'Asset Hierarchy',
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
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
    </Stack.Navigator>

    {/* Custom Sidebar Modal */}
    <SidebarModal
      visible={sidebarVisible}
      onClose={() => setSidebarVisible(false)}
      navigation={navigationRef.current}
      currentRoute={currentRoute}
      currentUserRole={currentUserRole}
    />
  </View>
  );
}

// Global functions are now handled in src/utils/globalHandlers.js

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database first
      await DatabaseService.initialize();
      
      // Wait for database to be fully ready
      await DatabaseService.waitForDatabaseReady();
      
      // Initialize location service
      await LocationService.initialize();
      
      // Start auto-sync for risk assessments
      RiskAssessmentService.startAutoSync();
      
      // Start auto-sync for task hazards
      TaskHazardService.startAutoSync();
      
      // Start auto-sync for approvals
      ApprovalService.startAutoSync();
      
      // Initialize push notifications
      await PushNotificationService.registerForPushNotifications();
      
      // Set global logout handler
      setGlobalLogoutHandler(() => {
        setIsAuthenticated(false);
        // Clean up push notification listeners on logout
        PushNotificationService.removeNotificationListeners();
      });
      
      // Set global auth refresh handler
      setGlobalAuthRefreshHandler(() => {
        checkAuthStatus();
      });
      
      // Check authentication status
      await checkAuthStatus();
      
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
        // Could not cache users
      });
      
      // Cache assets in background
      AssetHierarchyService.getAll().catch(err => {
        // Could not cache assets
      });
      
      // Cache risk assessments in background
      RiskAssessmentService.getAll().catch(err => {
        // Could not cache risk assessments
      });
      
    } catch (error) {
      // Error caching initial data
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Add a small delay to ensure navigation is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Direct check of AsyncStorage
     const userString = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      const authenticated = !!(userString && token);
      
      setIsAuthenticated(authenticated);

      // Extract and set user role if authenticated
      if (authenticated && userString) {
        try {
          const user = JSON.parse(userString);
          const userRole = user.role || null;
          setCurrentUserRole(userRole);
          
          // You can add role-based logic here
          // For example, restrict certain features based on role
          if (userRole) {
            handleRoleBasedInitialization(userRole);
          }

          // Check for notification that opened the app (after authentication)
          setTimeout(() => {
            const navigation = navigationRef.current;
            if (navigation) {
              PushNotificationService.checkInitialNotification(navigation);
            }
          }, 2000);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      } else {
        setCurrentUserRole(null);
      }

      // If authenticated, pre-cache essential data for offline use
      if (authenticated) {
        cacheInitialData();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setCurrentUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role-based initialization logic
  const handleRoleBasedInitialization = (role) => {
    // Add any role-specific initialization logic here
    switch (role) {
      case 'superuser':
        console.log('Superuser detected - Full access enabled');
        // Add superuser-specific initialization
        break;
      case 'admin':
        console.log('Admin detected - Administrative access enabled');
        // Add admin-specific initialization
        break;
      case 'supervisor':
        console.log('Supervisor detected - Approval access enabled');
        // Add supervisor-specific initialization
        break;
      case 'user':
        console.log('Standard user detected - Basic access enabled');
        // Add user-specific initialization
        break;
      default:
        console.log('Unknown role:', role);
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
            <Stack.Screen name="MainApp">
              {(props) => <MainAppNavigator {...props} currentUserRole={currentUserRole} />}
            </Stack.Screen>
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
