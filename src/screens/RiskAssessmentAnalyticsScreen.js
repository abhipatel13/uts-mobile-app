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
import { RiskAssessmentService } from '../services';
import RiskAssessmentMapView from '../components/RiskAssessmentMapView';
import RiskAssessmentDetailsModal from '../components/RiskAssessmentDetailsModal';

const { width, height } = Dimensions.get('window');

const RiskAssessmentAnalyticsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    total: 0,
    criticalRisk: 0,
    locations: 0,
    byStatus: {},
    byRiskLevel: {},
    locationData: []
  });
  const [selectedRiskAssessment, setSelectedRiskAssessment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dataSource, setDataSource] = useState('api');

  const statusOptions = ['All', 'Active', 'Inactive', 'Pending', 'Completed'];

  // Load data on component mount
  useEffect(() => {
    fetchRiskAssessments();
  }, []);

  // Recalculate analytics when data or filters change
  useEffect(() => {
    calculateAnalytics();
  }, [riskAssessments, selectedStatus]);

  const fetchRiskAssessments = async () => {
    try {
      setIsLoading(true);
      const response = await RiskAssessmentService.getAll();
      const data = response.data || [];
      setRiskAssessments(data);
      setDataSource(response.source || 'api');
    } catch (error) {
      console.error('Error fetching risk assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const filteredData = selectedStatus === 'All' 
      ? riskAssessments 
      : riskAssessments.filter(ra => ra.status === selectedStatus);

    const statusCounts = {};
    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    const locationMap = new Map();
    let criticalRiskCount = 0;

    filteredData.forEach(assessment => {
      // Status counts
      statusCounts[assessment.status] = (statusCounts[assessment.status] || 0) + 1;

      // Calculate highest risk score
      const highestRisk = assessment.risks && assessment.risks.length > 0
        ? Math.max(...assessment.risks.map(risk => risk.asIsLikelihood * risk.asIsConsequence))
        : 1;

      // Risk level counts
      if (highestRisk <= 4) riskCounts.low++;
      else if (highestRisk <= 9) riskCounts.medium++;
      else if (highestRisk <= 16) riskCounts.high++;
      else riskCounts.critical++;

      if (highestRisk > 16) criticalRiskCount++; // Critical only

      // Location data with coordinates
      if (assessment.location) {
        const key = assessment.location;
        if (locationMap.has(key)) {
          const existing = locationMap.get(key);
          locationMap.set(key, {
            ...existing,
            count: existing.count + 1,
            riskScore: Math.max(existing.riskScore, highestRisk)
          });
        } else {
          locationMap.set(key, {
            location: assessment.location,
            count: 1,
            riskScore: highestRisk,
            id: assessment.id
          });
        }
      }
    });

    setAnalytics({
      total: filteredData.length,
      criticalRisk: criticalRiskCount,
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

  const getRiskColor = (riskScore) => {
    if (riskScore <= 4) return '#22c55e'; // green - low
    if (riskScore <= 9) return '#f59e0b'; // orange - medium
    if (riskScore <= 16) return '#ef4444'; // red - high
    return '#991b1b'; // dark red - critical
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#22c55e'; // green
      case 'completed': return '#3b82f6'; // blue
      case 'pending': return '#f59e0b'; // orange
      case 'inactive': return '#6b7280'; // gray
      case 'rejected': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };


  const showLocationDetails = (location) => {
    Alert.alert(
      'Location Details',
      `Location: ${location.location}\nRisk Assessments: ${location.count}\nHighest Risk Score: ${location.riskScore}`,
      [{ text: 'OK' }]
    );
  };

  const showRiskAssessmentDetails = (riskAssessment) => {
    setSelectedRiskAssessment(riskAssessment);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRiskAssessment(null);
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


  return (
    <View style={styles.container}>

      {/* Offline Mode Banner */}
      {dataSource === 'cache' && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#f59e0b" />
          <Text style={styles.offlineText}>Offline Mode - Showing cached data</Text>
        </View>
      )}

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
        <RiskAssessmentMapView
          riskAssessments={riskAssessments}
          onMarkerPress={showRiskAssessmentDetails}
          getRiskColor={getRiskColor}
          getStatusColor={getStatusColor}
          isLoading={isLoading}
        />
        
        {/* Real-time Analytics Cards */}
        <View style={styles.analyticsCards}>
          <View style={styles.analyticsCard}>
            <Ionicons name="document-text-outline" size={24} color="rgb(52, 73, 94)" />
            <Text style={styles.cardTitle}>Total Assessments</Text>
            <Text style={styles.cardValue}>{analytics.total}</Text>
            <Text style={styles.cardSubtext}>
              {selectedStatus === 'All' ? 'All assessments' : `${selectedStatus} assessments`}
            </Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Ionicons name="warning-outline" size={24} color="#ef4444" />
            <Text style={styles.cardTitle}>High Risk</Text>
            <Text style={[styles.cardValue, { color: '#ef4444' }]}>{analytics.criticalRisk}</Text>
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

      {/* Risk Assessment Details Modal */}
      <RiskAssessmentDetailsModal
        visible={showDetailsModal}
        onClose={closeDetailsModal}
        riskAssessment={selectedRiskAssessment}
        getRiskColor={getRiskColor}
        getStatusColor={getStatusColor}
      />
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
  },
  offlineText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
});

export default RiskAssessmentAnalyticsScreen;
