import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OfflineApiService from '../services/OfflineApiService';
import NetworkService from '../services/NetworkService';
import LocationService from '../services/LocationService';
import MockOfflineService from '../services/MockOfflineService';

const DashboardScreen = ({ navigation }) => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [networkStatus, setNetworkStatus] = useState(null);
  const [databaseStats, setDatabaseStats] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [mockOfflineMode, setMockOfflineMode] = useState(false);

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
      // Get network status
      const network = NetworkService.getNetworkStatus();
      setNetworkStatus(network);

      // Get database statistics
      const stats = await OfflineApiService.getDatabaseStats();
      setDatabaseStats(stats);

      // Get location status
      const location = LocationService.getLocationStatus();
      setLocationStatus(location);

      // Set up network monitoring
      const removeListener = NetworkService.addListener((status) => {
        setNetworkStatus(status);
      });

      return () => removeListener();
    } catch (error) {
      console.error('Dashboard initialization error:', error);
    }
  };

  const handleSyncData = async () => {
    try {
      if (!networkStatus?.isOnline) {
        Alert.alert('Offline', 'No internet connection available for sync');
        return;
      }

      Alert.alert(
        'Sync Data',
        'This will sync all offline data with the server. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sync',
            onPress: async () => {
              try {
                await OfflineApiService.syncAllData();
                Alert.alert('Success', 'Data synchronized successfully');
                // Refresh database stats
                const stats = await OfflineApiService.getDatabaseStats();
                setDatabaseStats(stats);
              } catch (error) {
                Alert.alert('Sync Failed', error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  const handleCreateSampleData = async () => {
    try {
      Alert.alert(
        'Create Sample Data',
        'This will create sample mining data for testing offline functionality. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: async () => {
              try {
                // Create sample equipment
                await OfflineApiService.createEquipment({
                  name: 'Excavator #001',
                  type: 'excavator',
                  location: 'Surface Level',
                  status: 'operational',
                  lastInspection: new Date().toISOString()
                });

                await OfflineApiService.createEquipment({
                  name: 'Haul Truck #002',
                  type: 'truck',
                  location: 'Underground Level 1',
                  status: 'maintenance',
                  lastInspection: new Date().toISOString()
                });

                // Create sample hazards
                await OfflineApiService.createHazard({
                  title: 'Rock Fall Risk',
                  description: 'Potential rock fall in tunnel section A',
                  hazardType: 'geological',
                  riskLevel: 'high',
                  location: 'Tunnel A',
                  reportedBy: 'Safety Inspector',
                  status: 'open'
                });

                await OfflineApiService.createHazard({
                  title: 'Equipment Malfunction',
                  description: 'Hydraulic leak in excavator',
                  hazardType: 'equipment',
                  riskLevel: 'medium',
                  location: 'Equipment Zone B',
                  reportedBy: 'Equipment Operator',
                  status: 'investigating'
                });

                // Create sample risk assessment
                await OfflineApiService.createRiskAssessment({
                  title: 'Underground Safety Assessment',
                  location: 'Underground Level 1',
                  mineSection: 'Level 1',
                  riskLevel: 'medium',
                  probability: 3,
                  impact: 4,
                  mitigationMeasures: 'Install additional support beams',
                  assessedBy: 'Safety Manager',
                  status: 'draft'
                });

                // Create sample task hazard
                await OfflineApiService.createTaskHazard({
                  taskName: 'Equipment Maintenance',
                  description: 'Routine maintenance of excavator',
                  location: 'Equipment Zone A',
                  mineSection: 'Surface',
                  hazardIdentification: 'Potential hydraulic leaks',
                  riskControls: 'Wear protective equipment',
                  assignedTo: 'Maintenance Team',
                  supervisor: 'Maintenance Supervisor',
                  status: 'pending'
                });

                // Save sample location
                await OfflineApiService.saveLocation({
                  name: 'Mine Entrance',
                  type: 'surface',
                  coordinates: '40.7128,-74.0060',
                  description: 'Main mine entrance'
                });

                Alert.alert('Success', 'Sample data created successfully!');
                
                // Refresh database stats
                const stats = await OfflineApiService.getDatabaseStats();
                setDatabaseStats(stats);
              } catch (error) {
                Alert.alert('Error', 'Failed to create sample data: ' + error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create sample data');
    }
  };

  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 360;
  const userInfo = {
    email: 'hello1@utahtechnicalservicesllc.com',
    role: 'Superuser',
    accessLevel: 'Licensed',
    company: 'Utah Technical Services LLC',
  };

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
    },
    {
      title: 'Risk Assessment',
      subtitle: 'Evaluate risks',
      color: '#dbeafe',
      textColor: '#1e40af',
    },
    {
      title: 'View Assets',
      subtitle: 'Browse hierarchy',
      color: '#d1fae5',
      textColor: '#065f46',
    },
    {
      title: 'Analytics',
      subtitle: 'View reports',
      color: '#ede9fe',
      textColor: '#6b21a8',
    },
  ];

  const dynamicStyles = createDynamicStyles(width, isTablet, isSmallScreen);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Welcome Header */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText} numberOfLines={2} adjustsFontSizeToFit={true}>
          Welcome back,{'\n'}{userInfo.email}!
        </Text>
        <Text style={styles.subtitleText} numberOfLines={2}>
          Superuser Dashboard - Access your tools and manage your work
        </Text>
      </View>

      {/* User Info Cards */}
      <View style={[styles.infoCardsContainer, dynamicStyles.infoCardsContainer]}>
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="person-circle-outline" size={24} color="#7c3aed" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Role</Text>
            <Text style={styles.infoCardValue}>{userInfo.role}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Access Level</Text>
            <Text style={styles.infoCardValue}>{userInfo.accessLevel}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="business-outline" size={24} color="#7c3aed" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Company</Text>
            <Text style={styles.infoCardValue}>{userInfo.company}</Text>
          </View>
        </View>
      </View>

      {/* Offline Status Cards */}
      <View style={styles.offlineStatusContainer}>
        <Text style={styles.sectionTitle}>Mine Operations Status</Text>
        
        {/* Network Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <Ionicons 
              name={networkStatus?.isOnline ? "wifi-outline" : "cloud-offline-outline"} 
              size={20} 
              color={networkStatus?.isOnline ? "#22c55e" : "#ef4444"} 
            />
            <Text style={styles.statusCardTitle}>
              {networkStatus?.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
          <Text style={styles.statusCardSubtitle}>
            {networkStatus?.isOnline ? "Connected to server" : "Working offline - data saved locally"}
          </Text>
        </View>

        {/* Database Status */}
        {databaseStats && (
          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <Ionicons name="server-outline" size={20} color="#3b82f6" />
              <Text style={styles.statusCardTitle}>Local Database</Text>
            </View>
            <Text style={styles.statusCardSubtitle}>
              {databaseStats.equipment} Equipment • {databaseStats.hazards} Hazards • {databaseStats.riskAssessments} Risk Assessments
            </Text>
          </View>
        )}

        {/* Location Status */}
        {locationStatus && (
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
        )}

        {/* Sync Button */}
        <TouchableOpacity 
          style={[
            styles.syncButton, 
            { backgroundColor: networkStatus?.isOnline ? "#22c55e" : "#6b7280" }
          ]}
          onPress={handleSyncData}
          disabled={!networkStatus?.isOnline}
        >
          <Ionicons name="sync-outline" size={20} color="#fff" />
          <Text style={styles.syncButtonText}>
            {networkStatus?.isOnline ? "Sync Data" : "Offline Mode"}
          </Text>
        </TouchableOpacity>

        {/* Mock Offline Testing Button */}
        <TouchableOpacity 
          style={[
            styles.mockOfflineButton,
            { backgroundColor: mockOfflineMode ? "#ef4444" : "#3b82f6" }
          ]}
          onPress={() => {
            const newMode = MockOfflineService.toggleOfflineMode();
            setMockOfflineMode(newMode);
            Alert.alert(
              'Mock Offline Mode',
              newMode ? 'Simulating offline conditions' : 'Back to online mode',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name={mockOfflineMode ? "wifi-off-outline" : "wifi-outline"} size={20} color="#fff" />
          <Text style={styles.mockOfflineButtonText}>
            {mockOfflineMode ? "Exit Mock Offline" : "Test Offline Mode"}
          </Text>
        </TouchableOpacity>

        {/* Create Sample Data Button */}
        <TouchableOpacity 
          style={styles.sampleDataButton}
          onPress={handleCreateSampleData}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.sampleDataButtonText}>
            Create Sample Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Dashboard Cards */}
      <View style={styles.cardsContainer}>
        {dashboardCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(card.route)}
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
            <TouchableOpacity key={index} style={[styles.quickActionCard, dynamicStyles.quickActionCard, { backgroundColor: action.color }]}>
              <Text style={[styles.quickActionTitle, { color: action.textColor }]}>
                {action.title}
              </Text>
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
  const quickActionWidth = isTablet 
    ? (width - (padding * 2) - (cardGap * 3)) / 4 
    : (width - (padding * 2) - cardGap) / 2;

  return StyleSheet.create({
    infoCardsContainer: {
      paddingHorizontal: padding,
      gap: cardGap,
    },
    quickActionsGrid: {
      gap: cardGap,
      justifyContent: isTablet ? 'flex-start' : 'space-between',
    },
    quickActionCard: {
      width: quickActionWidth,
      minHeight: isTablet ? 100 : 80,
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
  },
  welcomeContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748b',
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
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 70,
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
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    minHeight: 80,
    justifyContent: 'center',
    maxWidth: '48%',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
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
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mockOfflineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  mockOfflineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sampleDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#8b5cf6',
  },
  sampleDataButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DashboardScreen;
