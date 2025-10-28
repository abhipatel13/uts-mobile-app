import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiskAssessmentService } from '../services';
import AddRiskAssessmentModal from '../components/AddRiskAssessmentModal';
import EditRiskAssessmentModal from '../components/EditRiskAssessmentModal';
import RiskAssessmentDetailsModal from '../components/RiskAssessmentDetailsModal';

const RiskAssessmentScreen = () => {
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreatingRiskAssessment, setIsCreatingRiskAssessment] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingRiskAssessment, setIsUpdatingRiskAssessment] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedRiskAssessment, setSelectedRiskAssessment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dataSource, setDataSource] = useState('api');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'active', 'completed', 'draft'
  const [pendingCount, setPendingCount] = useState(0);

  // Load risk assessments on component mount
  useEffect(() => {
    fetchRiskAssessments();
    checkPendingSync();
  }, []);

  const checkPendingSync = async () => {
    try {
      const count = await RiskAssessmentService.getPendingCount();
      setPendingCount(count);
      if (count > 0) {
        await syncPendingItems();
      }
    } catch (error) {
      console.error('Error checking pending sync:', error);
    }
  };

  const syncPendingItems = async () => {
    try {
      const result = await RiskAssessmentService.syncPendingRiskAssessments();
      if (result.synced > 0) {
        await fetchRiskAssessments();
      }
    } catch (error) {
      console.error('Error syncing pending items:', error);
    }
  };

  // // Manual sync function
  // const handleManualSync = async () => {
  //   try {
  //     setIsSyncing(true);
  //     const result = await RiskAssessmentService.checkAndSync();
  //     if (result.synced > 0) {
  //       Alert.alert('Sync Complete', `Successfully synced ${result.synced} risk assessments to server.`);
  //       // Refresh the data and check pending count
  //       await fetchRiskAssessments();
  //       await checkPendingSync();
  //     } else {
  //       Alert.alert('Sync Complete', 'No pending items to sync.');
  //     }
  //   } catch (error) {
  //     console.error('Manual sync error:', error);
  //     Alert.alert('Sync Error', 'Failed to sync risk assessments. Please try again.');
  //   } finally {
  //     setIsSyncing(false);
  //   }
  // };

  const fetchRiskAssessments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await RiskAssessmentService.getAll();
      const apiRiskAssessments = response.data || [];
      setDataSource(response.source || 'api');

      if (!Array.isArray(apiRiskAssessments)) {
        throw new Error('Invalid response format from server');
      }

      setRiskAssessments(apiRiskAssessments);

    } catch (error) {
      console.error("Error loading risk assessments:", error.message);
      setError(error.message || 'Failed to load risk assessments. Please try again.');
      
      // Don't show alert if we successfully loaded from cache
      if (error.message && !error.message.includes('cache')) {
        console.error("Error loading risk assessments:", error.message);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRiskAssessments(true);
  };

  const handleCreateRiskAssessment = async (riskAssessmentData) => {
    try {
      setIsCreatingRiskAssessment(true);
      
      const response = await RiskAssessmentService.create(riskAssessmentData);
      
      setShowAddModal(false);

      await fetchRiskAssessments(true);
      
    } catch (error) {
      console.error("Error creating risk assessment:", error.message);
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsCreatingRiskAssessment(false);
    }
  };

  const handleUpdateRiskAssessment = async (riskAssessmentData) => {
    try {
      setIsUpdatingRiskAssessment(true);
      const response = await RiskAssessmentService.update(riskAssessmentData.id, riskAssessmentData);
      
      // Close modal first
      setShowEditModal(false);
      setSelectedRiskAssessment(null);
      
      // Show success message
      Alert.alert('Success', 'Risk Assessment updated successfully!');
      
      // Refresh the list after a short delay
      setTimeout(async () => {
        await fetchRiskAssessments();
        await checkPendingSync();
      }, 500);
      
    } catch (error) {
      console.error('Error updating risk assessment:', error);
      Alert.alert('Error', error.message || 'Failed to update risk assessment');
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsUpdatingRiskAssessment(false);
    }
  };

  const handleDeleteRiskAssessment = async (riskAssessmentId) => {
    Alert.alert(
      'Delete Risk Assessment',
      'Are you sure you want to delete this risk assessment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await RiskAssessmentService.delete(riskAssessmentId);
              await fetchRiskAssessments();
              
              // Show appropriate message based on whether it was deleted offline or online
              if (response.source === 'offline') {
                Alert.alert(
                  'Deleted Offline',
                  'Risk Assessment deleted locally. It will be synced to the server when you\'re back online.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Success', 'Risk Assessment deleted successfully!');
              }
            } catch (error) {
              console.error('Error deleting risk assessment:', error);
              Alert.alert('Error', error.message || 'Failed to delete risk assessment');
            }
          }
        }
      ]
    );
  };

  const calculateHighestRiskScore = (risks) => {
    if (!risks || risks.length === 0) return 1;
    return Math.max(...risks.map(risk => risk.asIsLikelihood * risk.asIsConsequence));
  };

  const getRiskColor = (risk) => {
    if (risk <= 4) return '#22c55e'; // green - low
    if (risk <= 9) return '#f59e0b'; // orange - medium
    if (risk <= 16) return '#ef4444'; // red - high
    return '#991b1b'; // dark red - critical
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#22c55e';
      case 'Pending': return '#f59e0b';
      case 'Inactive': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Filter risk assessments based on status
  const getFilteredRiskAssessments = () => {
    if (statusFilter === 'all') {
      return riskAssessments;
    }
    return riskAssessments.filter(assessment => 
      assessment.status?.toLowerCase() === statusFilter.toLowerCase()
    );
  };

  const filteredRiskAssessments = getFilteredRiskAssessments();

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const showFilterPicker = () => {
    if (Platform.OS === 'ios') {
      const options = ['Cancel', ...filterOptions.map(option => option.label)];
      const cancelButtonIndex = 0;
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Filter by Status',
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            const selectedOption = filterOptions[buttonIndex - 1];
            setStatusFilter(selectedOption.value);
          }
        }
      );
    } else {
      // Android - use Alert with buttons
      const buttons = filterOptions.map(option => ({
        text: option.label,
        onPress: () => setStatusFilter(option.value),
      }));
      buttons.push({ text: 'Cancel', style: 'cancel' });
      
      Alert.alert('Filter by Status', '', buttons);
    }
  };

  const getFilterLabel = () => {
    const option = filterOptions.find(opt => opt.value === statusFilter);
    return option ? option.label : 'All';
  };

  const renderRiskAssessmentItem = ({ item }) => {
    const highestRisk = calculateHighestRiskScore(item.risks);
    const dateTime = `${item.date} ${item.time}`;

    return (
      <View style={styles.riskAssessmentItem}>
        <TouchableOpacity 
          style={styles.riskAssessmentRow}
          onPress={() => handleRiskAssessmentInfo(item)}
        >
          <View style={styles.riskAssessmentInfo}>
            <View style={styles.riskAssessmentHeader}>
              <Text style={styles.riskAssessmentId}>#{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            
            <Text style={styles.scopeOfWork} numberOfLines={2}>
              {item.scopeOfWork}
            </Text>
            
            <View style={styles.riskAssessmentDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={14} color="#64748b" />
                <Text style={styles.detailText}>{dateTime}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
              </View>
              {item.supervisor && (
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={14} color="#64748b" />
                  <Text style={styles.detailText}>{item.supervisor}</Text>
                </View>
              )}
            </View>

            <View style={styles.riskAndIndividuals}>
              <View style={styles.riskContainer}>
                <Text style={styles.riskLabel}>Risk Score: </Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(highestRisk) }]}>
                  <Text style={styles.riskText}>{highestRisk}</Text>
                </View>
              </View>
              
              {(item.individuals || item.assessmentTeam) && (
                <Text style={styles.individualsText}>
                  {(() => {
                    const team = item.assessmentTeam || item.individuals;
                    if (Array.isArray(team)) {
                      return `${team.length} team member${team.length !== 1 ? 's' : ''}`;
                    } else if (typeof team === 'string' && team.trim()) {
                      const members = team.split(',').filter(m => m.trim());
                      return `${members.length} team member${members.length !== 1 ? 's' : ''}`;
                    }
                    return '0 team members';
                  })()}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleRiskAssessmentInfo(item)}
            >
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedRiskAssessment(item);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteRiskAssessment(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleRiskAssessmentInfo = (riskAssessment) => {
    setSelectedRiskAssessment(riskAssessment);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRiskAssessment(null);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="shield-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyStateTitle}>No Risk Assessments Found</Text>
      <Text style={styles.emptyStateText}>
        {error ? 'Unable to load risk assessments. Please try again.' : 'No risk assessments have been created yet.'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchRiskAssessments()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
      <Text style={styles.loadingText}>Loading risk assessments...</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed-height Banner Container to prevent layout jump */}
      <View style={styles.bannerContainer}>
        {pendingCount > 0 ? (
          <View style={styles.pendingBanner}>
            <Ionicons name="sync-outline" size={16} color="#3b82f6" />
            <Text style={styles.pendingText}>
              {pendingCount} risk assessment{pendingCount > 1 ? 's' : ''} pending sync
            </Text>
          </View>
        ) : dataSource === 'cache' ? (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#f59e0b" />
            <Text style={styles.offlineText}>Offline Mode - Showing cached data</Text>
          </View>
        ) : null}
      </View>

      {/* Header with Actions */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'list' && styles.activeToggleButton]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons 
                name="list-outline" 
                size={18} 
                color={viewMode === 'list' ? '#fff' : '#64748b'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'map' && styles.activeToggleButton]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons 
                name="map-outline" 
                size={18} 
                color={viewMode === 'map' ? '#fff' : '#64748b'} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Filter Button */}
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={showFilterPicker}
          >
            <Ionicons name="filter-outline" size={18} color="#64748b" />
            <Text style={styles.filterButtonText}>{getFilterLabel()}</Text>
          </TouchableOpacity>
                    
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Assessment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Risk Assessments List */}
      {riskAssessments.length > 0 ? (
        <FlatList
          data={filteredRiskAssessments}
          renderItem={renderRiskAssessmentItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.riskAssessmentsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['rgb(52, 73, 94)']}
              tintColor="rgb(52, 73, 94)"
            />
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* Add Risk Assessment Modal */}
      <AddRiskAssessmentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateRiskAssessment}
        isLoading={isCreatingRiskAssessment}
      />

      {/* Edit Risk Assessment Modal */}
      <EditRiskAssessmentModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateRiskAssessment}
        isLoading={isUpdatingRiskAssessment}
        riskAssessment={selectedRiskAssessment}
      />

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  activeToggleButton: {
    backgroundColor: 'rgb(52, 73, 94)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(52, 73, 94)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  filterButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  riskAssessmentsList: {
    flex: 1,
  },
  riskAssessmentItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  riskAssessmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  riskAssessmentInfo: {
    flex: 1,
    marginRight: 16,
  },
  riskAssessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskAssessmentId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  scopeOfWork: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 22,
  },
  riskAssessmentDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    flex: 1,
  },
  riskAndIndividuals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  individualsText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgb(52, 73, 94)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
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
  // Reserve space so banners don't shift layout
  bannerContainer: {
    height: 10,
    justifyContent: 'center',
  },
  bannerSpacer: {
    height: 40,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
  },
  pendingText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default RiskAssessmentScreen;
