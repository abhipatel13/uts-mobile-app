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
  const [locationStatus, setLocationStatus] = useState(null);
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    role: '',
    company: '',
  });

  console.log('userInfo', userInfo);
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
        // Ensure we only extract string values, not objects
        setUserInfo({
          name: typeof parsedUser.name === 'string' ? parsedUser.name : 'User',
          email: typeof parsedUser.email === 'string' ? parsedUser.email : '',
          role: typeof parsedUser.role === 'string' ? parsedUser.role : 'User',
          company: typeof parsedUser.company === 'string' ? parsedUser.company : 'Utah Technical Services LLC',
        });
      }
      
      // Get location status
      const location = LocationService.getLocationStatus();
      setLocationStatus(location);
    } catch (error) {
      console.error('DashboardScreen: initializeDashboard - Error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    try {
      switch (action.action) {
        case 'createTaskHazard':
          navigation.navigate('Safety', { 
            screen: 'TaskHazard',
            params: { showAddModal: true }
          });
          break;
        case 'createRiskAssessment':
          navigation.navigate('Safety', { 
            screen: 'RiskAssessment',
            params: { showAddModal: true }
          });
          break;
        case 'viewAssets':
          navigation.navigate('AssetHierarchy');
          break;
        case 'viewAnalytics':
          navigation.navigate('Analytics');
          break;
        default:
          // Fallback to route navigation
          navigation.navigate(action.route);
          break;
      }
    } catch (error) {
      console.error('DashboardScreen: handleQuickAction - Navigation error:', error.message);
      Alert.alert('Navigation Error', 'Unable to navigate to the requested screen. Please try again.');
    }
  };


  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 360;

  const dashboardCards = [
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
      route: 'Safety',
    },
    {
      title: 'Risk Assessment',
      description: 'Create and manage risk assessments',
      icon: 'shield-checkmark-outline',
      color: '#22c55e',
      route: 'Safety',
    },
    {
      title: 'Analytics',
      description: 'View analytics and reports',
      icon: 'bar-chart-outline',
      color: '#f97316',
      route: 'Analytics',
    },
  ];

  const quickActions = [
    {
      title: 'Create Task Hazard',
      subtitle: 'Start a new assessment',
      color: '#fef3c7',
      textColor: '#92400e',
      icon: 'add-circle-outline',
      route: 'Safety',
      action: 'createTaskHazard',
    },
    {
      title: 'Risk Assessment',
      subtitle: 'Evaluate risks',
      color: '#dbeafe',
      textColor: '#1e40af',
      icon: 'shield-checkmark-outline',
      route: 'Safety',
      action: 'createRiskAssessment',
    },
    {
      title: 'View Assets',
      subtitle: 'Browse hierarchy',
      color: '#d1fae5',
      textColor: '#065f46',
      icon: 'git-network-outline',
      route: 'AssetHierarchy',
      action: 'viewAssets',
    },
    {
      title: 'Analytics',
      subtitle: 'View reports',
      color: '#ede9fe',
      textColor: '#6b21a8',
      icon: 'bar-chart-outline',
      route: 'Analytics',
      action: 'viewAnalytics',
    },
  ];

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
              Hello, {String(userInfo.fullName || 'User')}!
            </Text>
            <Text style={styles.subtitleText} numberOfLines={2}>
              {String(userInfo.role || 'User')} Dashboard - Manage your work efficiently
            </Text>
          </View>
        </View>
      </View>

      {/* User Info Cards */}
      <View style={[styles.infoCardsContainer, dynamicStyles.infoCardsContainer]}>
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="person-circle-outline" size={24} color="#7c3aed" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Role</Text>
            <Text style={styles.infoCardValue}>{String(userInfo.role || '')}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="mail-outline" size={24} color="#059669" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Email</Text>
            <Text style={styles.infoCardValue} numberOfLines={1}>{String(userInfo.email || '')}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="business-outline" size={24} color="#7c3aed" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Company</Text>
            <Text style={styles.infoCardValue}>{String(userInfo.company || '')}</Text>
          </View>
        </View>
      </View>


      {/* Location Status */}
      {locationStatus && (
        <View style={styles.offlineStatusContainer}>
          <Text style={styles.sectionTitle}>Location Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <Ionicons 
                name={locationStatus.hasPermission ? "location-outline" : "location-off-outline"} 
                size={20} 
                color={locationStatus.hasPermission ? "#22c55e" : "#ef4444"} 
              />
              <Text style={styles.statusCardTitle}>
                {locationStatus.hasPermission ? "GPS Active" : "GPS Disabled"}
              </Text>
            </View>
            <Text style={styles.statusCardSubtitle}>
              {locationStatus.hasPermission ? "Location tracking enabled" : "Location permission required"}
            </Text>
          </View>
        </View>
      )}

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

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={[styles.quickActionsGrid, dynamicStyles.quickActionsGrid]}>
          {quickActions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.quickActionCard, dynamicStyles.quickActionCard, { backgroundColor: action.color }]}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionHeader}>
                <Ionicons name={action.icon} size={20} color={action.textColor} />
                <Text style={[styles.quickActionTitle, { color: action.textColor }]}>
                  {action.title}
                </Text>
              </View>
              <Text style={[styles.quickActionSubtitle, { color: action.textColor }]}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
    infoCardsContainer: {
      paddingHorizontal: padding,
      gap: cardGap,
    },
    quickActionsGrid: {
      gap: cardGap,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickActionCard: {
      width: isTablet ? '22%' : isSmallScreen ? '48%' : '48%',
      minHeight: isTablet ? 100 : isSmallScreen ? 85 : 90,
      marginBottom: cardGap,
      padding: isSmallScreen ? 12 : 16,
    },
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
  infoCardsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexShrink: 0,
  },
  infoCardIcon: {
    marginRight: 16,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 20,
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
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    minHeight: 90,
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  quickActionSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.8,
  },
  offlineStatusContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  statusCardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});

export default DashboardScreen;
