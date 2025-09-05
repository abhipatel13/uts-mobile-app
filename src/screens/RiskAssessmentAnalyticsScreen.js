import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const RiskAssessmentAnalyticsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusOptions = ['Active', 'Inactive', 'Pending', 'Completed'];

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
        
        {/* Map Placeholder - Matching the Risk Assessment Analytics layout */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapBackground}>
            {/* Simulate North America map regions */}
            <View style={[styles.mapRegion, { top: '15%', left: '10%', backgroundColor: '#22c55e', width: 100, height: 80 }]} />
            <View style={[styles.mapRegion, { top: '25%', left: '25%', backgroundColor: '#34d399', width: 120, height: 90 }]} />
            <View style={[styles.mapRegion, { top: '35%', left: '15%', backgroundColor: '#10b981', width: 90, height: 70 }]} />
            <View style={[styles.mapRegion, { top: '50%', left: '20%', backgroundColor: '#059669', width: 110, height: 60 }]} />
            
            {/* Mexico region */}
            <View style={[styles.mapRegion, { top: '70%', left: '15%', backgroundColor: '#065f46', width: 80, height: 50 }]} />
            
            {/* Sample risk assessment locations - no visible markers in the screenshot */}
            {/* The map appears clean without visible location markers */}
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
        <Text style={styles.title}>Risk Assessment Analytics</Text>
      </View>

      {/* Search and Filter Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assessments..."
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
            <Text style={styles.cardTitle}>Total Assessments</Text>
            <Text style={styles.cardValue}>18</Text>
            <Text style={styles.cardSubtext}>Active reviews</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Critical Risk</Text>
            <Text style={[styles.cardValue, { color: '#ef4444' }]}>5</Text>
            <Text style={styles.cardSubtext}>Need immediate action</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Locations</Text>
            <Text style={[styles.cardValue, { color: '#3b82f6' }]}>12</Text>
            <Text style={styles.cardSubtext}>Assessment sites</Text>
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
    borderRadius: 8,
    opacity: 0.7,
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

export default RiskAssessmentAnalyticsScreen;
