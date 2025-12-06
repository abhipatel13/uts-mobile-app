import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService from '../services/LocationService';

const DashboardScreen = ({ navigation }) => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [userInfo, setUserInfo] = useState({
    name: '',
    role: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Get user info from AsyncStorage
      const userData = await AsyncStorage.getItem('user');

      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Extract name and role
        setUserInfo({
          name: typeof parsedUser.name === 'string' ? parsedUser.name : 'User',
          role: parsedUser.role || null,
        });
      }
      
    } catch (error) {
      console.error('DashboardScreen: initializeDashboard - Error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };



  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 360;

  const allDashboardCards = [
    {
      title: 'Asset Hierarchy',
      description: 'Manage and view your asset hierarchy structure',
      icon: 'git-network-outline',
      color: '#06b6d4',
      route: 'AssetHierarchy',
    },
    {
      title: 'Task Hazard',
      description: 'Create and manage task hazard assessments',
      icon: 'shield-checkmark-outline',
      color: '#22c55e',
      route: 'TaskHazard',
    },
    {
      title: 'Risk Assessment',
      description: 'Create and manage risk assessments',
      icon: 'shield-checkmark-outline',
      color: '#22c55e',
      route: 'RiskAssessment',
    },
    {
      title: 'Analytics',
      description: 'View analytics and reports',
      icon: 'bar-chart-outline',
      color: '#f97316',
      route: 'Analytics',
    },
  ];

  // Filter dashboard cards based on user role
  const getFilteredDashboardCards = () => {
    const userRole = userInfo.role;

    // If user role is 'user', show only Asset Hierarchy and Task Hazard
    // Matches sidebar: Asset Hierarchy, Safety > Task Hazard
    if (userRole === 'user') {
      return allDashboardCards.filter(card => 
        card.title === 'Asset Hierarchy' || card.title === 'Task Hazard'
      );
    }

    // If user role is 'supervisor', show Asset Hierarchy, Task Hazard, Risk Assessment, and Analytics
    // Matches sidebar: Asset Hierarchy, Safety (all sub-items), Analytics (Task Hazard, Risk Assessment)
    if (userRole === 'supervisor') {
      return allDashboardCards; // Supervisor can see all dashboard cards
    }

    // For admin and superuser roles - show ALL cards
    // Matches sidebar: All menu items with full access
    if (userRole === 'admin' || userRole === 'superuser') {
      return allDashboardCards;
    }

    // Default fallback - show all cards (for any other roles or if role is not set)
    return allDashboardCards;
  };

  const dashboardCards = getFilteredDashboardCards();

  const dynamicStyles = createDynamicStyles(width, isTablet, isSmallScreen);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Welcome Header */}
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="person-circle" size={48} color="rgb(52, 73, 94)" />
          </View>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText} numberOfLines={1}>
              Hello, {String(userInfo.name || 'User')}!
            </Text>
            <Text style={styles.subtitleText} numberOfLines={2}>
              Dashboard - Manage your work efficiently
            </Text>
          </View>
        </View>
      </View>




      {/* Main Dashboard Cards */}
      <View style={styles.cardsContainer}>
        {dashboardCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => {
              navigation.navigate(card.route);
            }}
          >
            <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
              <Ionicons name={card.icon} size={24} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>{card.description}</Text>
              <Text style={styles.cardAction}>Click to access →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// Dynamic styles function for responsive design
const createDynamicStyles = (width, isTablet, isSmallScreen) => {
  const padding = isSmallScreen ? 12 : isTablet ? 32 : 20;
  const cardGap = isSmallScreen ? 8 : isTablet ? 16 : 12;

  return StyleSheet.create({
  });
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 0,
  },
  welcomeContainer: {
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIcon: {
    marginRight: 16,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 32,
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardAction: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default DashboardScreen;
