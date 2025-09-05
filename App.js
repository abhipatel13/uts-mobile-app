import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

// Import screens
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

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="rgb(52, 73, 94)" />
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
    </NavigationContainer>
  );
}
