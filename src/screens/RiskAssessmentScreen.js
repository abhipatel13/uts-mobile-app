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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiskAssessmentApi } from '../services';
import AddRiskAssessmentModal from '../components/AddRiskAssessmentModal';
import RiskAssessmentDetailsModal from '../components/RiskAssessmentDetailsModal';

const RiskAssessmentScreen = () => {
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreatingRiskAssessment, setIsCreatingRiskAssessment] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedRiskAssessment, setSelectedRiskAssessment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load risk assessments on component mount
  useEffect(() => {
    fetchRiskAssessments();
  }, []);

  const fetchRiskAssessments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await RiskAssessmentApi.getAll();
      const apiRiskAssessments = response.data || [];

      if (!Array.isArray(apiRiskAssessments)) {
        throw new Error('Invalid response format from server');
      }

      setRiskAssessments(apiRiskAssessments);

    } catch (error) {
      console.error('Error fetching risk assessments:', error);
      setError(error.message || 'Failed to load risk assessments. Please try again.');
      
      // Show alert for errors
      Alert.alert(
        'Error',
        error.message || 'Failed to load risk assessments. Please try again.',
        [{ text: 'OK' }]
      );
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

      console.log('riskAssessmentData', riskAssessmentData);
      
      await RiskAssessmentApi.create(riskAssessmentData);
      
      // Refresh the risk assessments list
      await fetchRiskAssessments();
      
      Alert.alert('Success', 'Risk Assessment created successfully!');
      
    } catch (error) {
      console.error('Error creating risk assessment:', error);
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsCreatingRiskAssessment(false);
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
              await RiskAssessmentApi.delete(riskAssessmentId);
              await fetchRiskAssessments();
              Alert.alert('Success', 'Risk Assessment deleted successfully!');
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
      case 'Rejected': return '#ef4444';
      case 'Completed': return '#3b82f6';
      case 'Inactive': return '#6b7280';
      default: return '#6b7280';
    }
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
              
              {item.individuals && (
                <Text style={styles.individualsText}>
                  {item.individuals.split(',').length} individual(s)
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Risk Assessment Dashboard</Text>
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with View Toggle and Add Button */}
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
          data={riskAssessments}
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
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'center',
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
});

export default RiskAssessmentScreen;
