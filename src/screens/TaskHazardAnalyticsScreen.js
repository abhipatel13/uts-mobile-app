import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskHazardApi } from '../services';
import SimpleMapView from '../components/SimpleMapView';

const { width, height } = Dimensions.get('window');

const TaskHazardAnalyticsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [taskHazards, setTaskHazards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    total: 0,
    highRisk: 0,
    locations: 0,
    byStatus: {},
    byRiskLevel: {},
    locationData: []
  });
  const [mapType, setMapType] = useState('standard');
  const [region, setRegion] = useState({
    latitude: 45.4215, // Center of North America
    longitude: -75.6919,
    latitudeDelta: 60,
    longitudeDelta: 60,
  });

  const statusOptions = ['All', 'Active', 'Inactive', 'Pending', 'Completed', 'Rejected'];

  // Load data on component mount
  useEffect(() => {
    fetchTaskHazards();
  }, []);

  // Recalculate analytics when data or filters change
  useEffect(() => {
    calculateAnalytics();
  }, [taskHazards, selectedStatus]);

  const fetchTaskHazards = async () => {
    try {
      setIsLoading(true);
      const response = await TaskHazardApi.getAll();
      const data = response.data || [];
      setTaskHazards(data);
    } catch (error) {
      console.error('Error fetching task hazards:', error);
      Alert.alert('Error', 'Failed to load task hazard data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const filteredData = selectedStatus === 'All' 
      ? taskHazards 
      : taskHazards.filter(th => th.status === selectedStatus);

    const statusCounts = {};
    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    const locationMap = new Map();
    let highRiskCount = 0;

    filteredData.forEach(hazard => {
      // Status counts
      statusCounts[hazard.status] = (statusCounts[hazard.status] || 0) + 1;

      // Calculate highest risk score
      const highestRisk = hazard.risks && hazard.risks.length > 0
        ? Math.max(...hazard.risks.map(risk => risk.asIsLikelihood * risk.asIsConsequence))
        : 1;

      // Risk level counts
      if (highestRisk <= 4) riskCounts.low++;
      else if (highestRisk <= 9) riskCounts.medium++;
      else if (highestRisk <= 16) riskCounts.high++;
      else riskCounts.critical++;

      if (highestRisk > 9) highRiskCount++; // High and Critical

      // Location data with coordinates
      if (hazard.location) {
        const key = hazard.location;
        if (locationMap.has(key)) {
          const existing = locationMap.get(key);
          locationMap.set(key, {
            ...existing,
            count: existing.count + 1,
            riskScore: Math.max(existing.riskScore, highestRisk)
          });
        } else {
          // Generate realistic coordinates based on location string
          const coords = generateCoordinatesFromLocation(hazard.location);
          locationMap.set(key, {
            location: hazard.location,
            count: 1,
            riskScore: highestRisk,
            id: hazard.id,
            latitude: coords.latitude,
            longitude: coords.longitude
          });
        }
      }
    });

    setAnalytics({
      total: filteredData.length,
      highRisk: highRiskCount,
      locations: locationMap.size,
      byStatus: statusCounts,
      byRiskLevel: riskCounts,
      locationData: Array.from(locationMap.values())
    });
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setShowStatusDropdown(false);
  };

  const renderStatusDropdown = () => {
    if (!showStatusDropdown) return null;

    return (
      <View style={styles.dropdownContainer}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.dropdownItem,
              selectedStatus === status && styles.selectedDropdownItem,
            ]}
            onPress={() => handleStatusSelect(status)}
          >
            <Text style={[
              styles.dropdownText,
              selectedStatus === status && styles.selectedDropdownText,
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRiskColor = (riskScore) => {
    if (riskScore <= 4) return '#22c55e'; // green - low
    if (riskScore <= 9) return '#f59e0b'; // orange - medium
    if (riskScore <= 16) return '#ef4444'; // red - high
    return '#991b1b'; // dark red - critical
  };

  // Generate realistic coordinates based on location string
  const generateCoordinatesFromLocation = (location) => {
    // Common locations with approximate coordinates
    const locationCoords = {
      'toronto': { latitude: 43.6532, longitude: -79.3832 },
      'montreal': { latitude: 45.5017, longitude: -73.5673 },
      'vancouver': { latitude: 49.2827, longitude: -123.1207 },
      'calgary': { latitude: 51.0447, longitude: -114.0719 },
      'edmonton': { latitude: 53.5461, longitude: -113.4938 },
      'ottawa': { latitude: 45.4215, longitude: -75.6919 },
      'winnipeg': { latitude: 49.8951, longitude: -97.1384 },
      'quebec city': { latitude: 46.8139, longitude: -71.2080 },
      'halifax': { latitude: 44.6488, longitude: -63.5752 },
      'new york': { latitude: 40.7128, longitude: -74.0060 },
      'los angeles': { latitude: 34.0522, longitude: -118.2437 },
      'chicago': { latitude: 41.8781, longitude: -87.6298 },
      'houston': { latitude: 29.7604, longitude: -95.3698 },
      'phoenix': { latitude: 33.4484, longitude: -112.0740 },
      'philadelphia': { latitude: 39.9526, longitude: -75.1652 },
      'san antonio': { latitude: 29.4241, longitude: -98.4936 },
      'san diego': { latitude: 32.7157, longitude: -117.1611 },
      'dallas': { latitude: 32.7767, longitude: -96.7970 },
      'san jose': { latitude: 37.3382, longitude: -121.8863 },
      'austin': { latitude: 30.2672, longitude: -97.7431 }
    };

    const locationKey = location.toLowerCase();
    
    // Check if we have predefined coordinates
    if (locationCoords[locationKey]) {
      return locationCoords[locationKey];
    }

    // Generate pseudo-random coordinates based on location string hash
    const hash = location.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    // Generate coordinates within North America bounds
    const latitude = 25 + (Math.abs(hash) % 40); // 25° to 65° N
    const longitude = -130 + (Math.abs(hash >> 8) % 60); // -130° to -70° W

    return { latitude, longitude };
  };

  const renderMapPlaceholder = () => {
    if (isLoading) {
      return (
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Task Hazard Locations</Text>
          </View>
          <View style={[styles.mapPlaceholder, styles.mapLoading]}>
            <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
            <Text style={styles.mapLoadingText}>Loading locations...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Task Hazard Locations</Text>
          <View style={styles.mapControls}>
            <TouchableOpacity style={[styles.mapButton, styles.activeMapButton]}>
              <Text style={styles.activeMapButtonText}>Risk View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton}>
              <Text style={styles.mapButtonText}>Count View</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.fullscreenButton}>
            <Ionicons name="expand-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        {/* Enhanced Map with Real Data */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapBackground}>
            {/* World map base - realistic continent shapes */}
            <View style={styles.worldMapBase}>
              {/* North America - More realistic shape */}
              <View style={[styles.northAmerica, {
                top: '18%', left: '12%',
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
              }]} />
              
              {/* Greenland */}
              <View style={[styles.greenland, {
                top: '8%', left: '28%',
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
              }]} />
              
              {/* South America - Narrower, elongated */}
              <View style={[styles.southAmerica, {
                top: '45%', left: '22%',
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
              }]} />
              
              {/* Europe - Small, irregular */}
              <View style={[styles.europe, {
                top: '20%', left: '42%',
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
              }]} />
              
              {/* Africa - Distinctive shape */}
              <View style={[styles.africa, {
                top: '28%', left: '44%',
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
              }]} />
              
              {/* Asia - Large, complex */}
              <View style={[styles.asia, {
                top: '12%', left: '52%',
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
              }]} />
              
              {/* Australia - Small island */}
              <View style={[styles.australia, {
                top: '62%', left: '72%',
                backgroundColor: 'rgba(156, 163, 175, 0.4)',
              }]} />
              
              {/* Antarctica - Bottom strip */}
              <View style={[styles.antarctica, {
                top: '85%', left: '15%',
                backgroundColor: 'rgba(156, 163, 175, 0.3)',
              }]} />
            </View>
            
            {/* Dynamic Location Markers based on real data */}
            {analytics.locationData.map((location, index) => {
              // Generate pseudo-coordinates based on location string hash
              const hash = location.location.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0);
              
              const top = 20 + (Math.abs(hash) % 60); // 20% to 80%
              const left = 15 + (Math.abs(hash >> 8) % 70); // 15% to 85%
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.locationMarker, { 
                    top: `${top}%`, 
                    left: `${left}%` 
                  }]}
                  onPress={() => showLocationDetails(location)}
                >
                  <View style={[
                    styles.markerDot,
                    { backgroundColor: getRiskColor(location.riskScore) }
                  ]}>
                    <Text style={styles.markerText}>{location.count}</Text>
                  </View>
                  <View style={[
                    styles.markerPulse,
                    { borderColor: getRiskColor(location.riskScore) }
                  ]} />
                </TouchableOpacity>
              );
            })}
            
            {/* Legend */}
            <View style={styles.mapLegend}>
              <Text style={styles.legendTitle}>Risk Levels</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.legendText}>Low (1-4)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.legendText}>Medium (5-9)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>High (10-16)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#991b1b' }]} />
                  <Text style={styles.legendText}>Critical (17+)</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Map Info */}
          <View style={styles.mapInfo}>
            <Text style={styles.mapInfoText}>
              {analytics.locations} locations • {analytics.total} task hazards
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const showLocationDetails = (location) => {
    Alert.alert(
      'Location Details',
      `Location: ${location.location}\nTask Hazards: ${location.count}\nHighest Risk Score: ${location.riskScore}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Task Hazard Analytics</Text>
      </View>

      {/* Search and Filter Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search hazards..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.statusDropdownButton}
            onPress={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <Text style={styles.statusDropdownText}>{selectedStatus}</Text>
            <Ionicons 
              name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#64748b" 
            />
          </TouchableOpacity>
          {renderStatusDropdown()}
        </View>
      </View>

      {/* Map Section */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SimpleMapView
          locationData={analytics.locationData}
          region={region}
          mapType={mapType}
          onRegionChange={setRegion}
          onMapTypeChange={setMapType}
          onMarkerPress={showLocationDetails}
          getRiskColor={getRiskColor}
          isLoading={isLoading}
        />
        
        {/* Real-time Analytics Cards */}
        <View style={styles.analyticsCards}>
          <View style={styles.analyticsCard}>
            <Ionicons name="document-text-outline" size={24} color="rgb(52, 73, 94)" />
            <Text style={styles.cardTitle}>Total Hazards</Text>
            <Text style={styles.cardValue}>{analytics.total}</Text>
            <Text style={styles.cardSubtext}>
              {selectedStatus === 'All' ? 'All assessments' : `${selectedStatus} assessments`}
            </Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Ionicons name="warning-outline" size={24} color="#ef4444" />
            <Text style={styles.cardTitle}>High Risk</Text>
            <Text style={[styles.cardValue, { color: '#ef4444' }]}>{analytics.highRisk}</Text>
            <Text style={styles.cardSubtext}>Require attention</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Ionicons name="location-outline" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>Locations</Text>
            <Text style={[styles.cardValue, { color: '#3b82f6' }]}>{analytics.locations}</Text>
            <Text style={styles.cardSubtext}>Different sites</Text>
          </View>
        </View>

        {/* Risk Distribution Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Risk Distribution</Text>
          <View style={styles.riskDistribution}>
            <View style={styles.riskBar}>
              <View style={styles.riskBarLabels}>
                <Text style={styles.riskBarLabel}>Low</Text>
                <Text style={styles.riskBarValue}>{analytics.byRiskLevel.low || 0}</Text>
              </View>
              <View style={styles.riskBarContainer}>
                <View style={[
                  styles.riskBarFill,
                  { 
                    backgroundColor: '#22c55e',
                    width: analytics.total > 0 ? `${(analytics.byRiskLevel.low || 0) / analytics.total * 100}%` : '0%'
                  }
                ]} />
              </View>
            </View>

            <View style={styles.riskBar}>
              <View style={styles.riskBarLabels}>
                <Text style={styles.riskBarLabel}>Medium</Text>
                <Text style={styles.riskBarValue}>{analytics.byRiskLevel.medium || 0}</Text>
              </View>
              <View style={styles.riskBarContainer}>
                <View style={[
                  styles.riskBarFill,
                  { 
                    backgroundColor: '#f59e0b',
                    width: analytics.total > 0 ? `${(analytics.byRiskLevel.medium || 0) / analytics.total * 100}%` : '0%'
                  }
                ]} />
              </View>
            </View>

            <View style={styles.riskBar}>
              <View style={styles.riskBarLabels}>
                <Text style={styles.riskBarLabel}>High</Text>
                <Text style={styles.riskBarValue}>{analytics.byRiskLevel.high || 0}</Text>
              </View>
              <View style={styles.riskBarContainer}>
                <View style={[
                  styles.riskBarFill,
                  { 
                    backgroundColor: '#ef4444',
                    width: analytics.total > 0 ? `${(analytics.byRiskLevel.high || 0) / analytics.total * 100}%` : '0%'
                  }
                ]} />
              </View>
            </View>

            <View style={styles.riskBar}>
              <View style={styles.riskBarLabels}>
                <Text style={styles.riskBarLabel}>Critical</Text>
                <Text style={styles.riskBarValue}>{analytics.byRiskLevel.critical || 0}</Text>
              </View>
              <View style={styles.riskBarContainer}>
                <View style={[
                  styles.riskBarFill,
                  { 
                    backgroundColor: '#991b1b',
                    width: analytics.total > 0 ? `${(analytics.byRiskLevel.critical || 0) / analytics.total * 100}%` : '0%'
                  }
                ]} />
              </View>
            </View>
          </View>
        </View>

        {/* Status Overview */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Status Overview</Text>
          <View style={styles.statusGrid}>
            {Object.entries(analytics.byStatus).map(([status, count]) => (
              <View key={status} style={styles.statusItem}>
                <Text style={styles.statusCount}>{count}</Text>
                <Text style={styles.statusLabel}>{status}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  controlsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 0,
  },
  filterContainer: {
    position: 'relative',
    minWidth: 120,
  },
  statusDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
  },
  statusDropdownText: {
    fontSize: 16,
    color: '#1e293b',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedDropdownItem: {
    backgroundColor: '#f1f5f9',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1e293b',
  },
  selectedDropdownText: {
    fontWeight: '500',
    color: 'rgb(52, 73, 94)',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  mapControls: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 2,
  },
  mapButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  activeMapButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mapButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  activeMapButtonText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  fullscreenButton: {
    padding: 8,
  },
  mapPlaceholder: {
    height: 350,
    position: 'relative',
  },
  mapLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    position: 'relative',
  },
  worldMapBase: {
    flex: 1,
    position: 'relative',
  },
  continent: {
    position: 'absolute',
    borderRadius: 8,
    opacity: 0.6,
  },
  locationMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    opacity: 0.3,
    zIndex: 1,
  },
  markerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mapLegend: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
    color: '#64748b',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapInfoText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  analyticsCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    marginTop: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  chartContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  riskDistribution: {
    gap: 12,
  },
  riskBar: {
    gap: 8,
  },
  riskBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskBarLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  riskBarValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  riskBarContainer: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  statusContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statusItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default TaskHazardAnalyticsScreen;
