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

const { width, height } = Dimensions.get('window');

const TaskHazardAnalyticsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusOptions = ['Active', 'Inactive', 'Pending', 'Completed'];

  // Sample map markers data
  const mapMarkers = [
    { id: 1, latitude: 40.7128, longitude: -74.0060, count: 2, city: 'New York' },
    { id: 2, latitude: 34.0522, longitude: -118.2437, count: 1, city: 'Los Angeles' },
    { id: 3, latitude: 45.5017, longitude: -73.5673, count: 3, city: 'Montreal' },
  ];

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

  const renderMapPlaceholder = () => {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Location Map</Text>
          <View style={styles.mapControls}>
            <TouchableOpacity style={[styles.mapButton, styles.activeMapButton]}>
              <Text style={styles.activeMapButtonText}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton}>
              <Text style={styles.mapButtonText}>Satellite</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.fullscreenButton}>
            <Ionicons name="expand-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapBackground}>
            {/* Simulate map regions */}
            <View style={[styles.mapRegion, { top: '20%', left: '15%', backgroundColor: '#22c55e' }]} />
            <View style={[styles.mapRegion, { top: '40%', left: '60%', backgroundColor: '#3b82f6' }]} />
            <View style={[styles.mapRegion, { top: '60%', left: '25%', backgroundColor: '#ef4444' }]} />
            
            {/* Sample markers */}
            <View style={[styles.marker, { top: '35%', left: '75%' }]}>
              <View style={styles.markerDot}>
                <Text style={styles.markerText}>2</Text>
              </View>
            </View>
            <View style={[styles.marker, { top: '65%', left: '20%' }]}>
              <View style={styles.markerDot}>
                <Text style={styles.markerText}>3</Text>
              </View>
            </View>
            <View style={[styles.marker, { top: '25%', left: '85%' }]}>
              <View style={[styles.markerDot, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.markerText}>1</Text>
              </View>
            </View>
          </View>
          
          {/* Map attribution */}
          <View style={styles.mapAttribution}>
            <TouchableOpacity style={styles.attributionButton}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
        {renderMapPlaceholder()}
        
        {/* Additional Analytics Cards */}
        <View style={styles.analyticsCards}>
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Total Hazards</Text>
            <Text style={styles.cardValue}>24</Text>
            <Text style={styles.cardSubtext}>Active assessments</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>High Risk</Text>
            <Text style={[styles.cardValue, { color: '#ef4444' }]}>3</Text>
            <Text style={styles.cardSubtext}>Require attention</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Locations</Text>
            <Text style={[styles.cardValue, { color: '#3b82f6' }]}>8</Text>
            <Text style={styles.cardSubtext}>Different sites</Text>
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
    height: 300,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#7dd3fc',
    position: 'relative',
  },
  mapRegion: {
    position: 'absolute',
    width: 80,
    height: 60,
    borderRadius: 8,
    opacity: 0.3,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapAttribution: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  attributionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 6,
  },
  analyticsCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
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
});

export default TaskHazardAnalyticsScreen;
