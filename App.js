import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { AuthService } from './src/services/AuthService';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AssetHierarchyScreen from './src/screens/AssetHierarchyScreen';
import TacticsScreen from './src/screens/TacticsScreen';
import SafetyScreen from './src/screens/SafetyScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ConfigurationsScreen from './src/screens/ConfigurationsScreen';
import TaskHazardScreen from './src/screens/TaskHazardScreen';
import RiskAssessmentScreen from './src/screens/RiskAssessmentScreen';
import TaskHazardAnalyticsScreen from './src/screens/TaskHazardAnalyticsScreen';
import RiskAssessmentAnalyticsScreen from './src/screens/RiskAssessmentAnalyticsScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';

// Import custom drawer
import CustomDrawerContent from './src/components/CustomDrawerContent';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Main App Navigator (Drawer Navigation)
function MainAppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: 'rgb(52, 73, 94)',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: 'rgb(52, 73, 94)',
          width: 280,
        },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#94a3b8',
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Utah Technical Services LLC',
        }}
      />
      <Drawer.Screen 
        name="AssetHierarchy" 
        component={AssetHierarchyScreen}
        options={{
          title: 'Asset Hierarchy',
        }}
      />
      <Drawer.Screen 
        name="Tactics" 
        component={TacticsScreen}
        options={{
          title: 'Tactics',
        }}
      />
      <Drawer.Screen 
        name="Safety" 
        component={SafetyScreen}
        options={{
          title: 'Safety',
        }}
      />
      <Drawer.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      <Drawer.Screen 
        name="Configurations" 
        component={ConfigurationsScreen}
        options={{
          title: 'Configurations',
        }}
      />
      <Drawer.Screen 
        name="TaskHazard" 
        component={TaskHazardScreen}
        options={{
          title: 'Task Hazard Assessment',
        }}
      />
      <Drawer.Screen 
        name="RiskAssessment" 
        component={RiskAssessmentScreen}
        options={{
          title: 'Risk Assessment Dashboard',
        }}
      />
      <Drawer.Screen 
        name="AnalyticsTaskHazard" 
        component={TaskHazardAnalyticsScreen}
        options={{
          title: 'Task Hazard Analytics',
        }}
      />
      <Drawer.Screen 
        name="AnalyticsRiskAssessment" 
        component={RiskAssessmentAnalyticsScreen}
        options={{
          title: 'Risk Assessment Analytics',
        }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{
          title: 'User Management',
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
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
    <NavigationContainer>
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
});
