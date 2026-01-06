import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskHazardService } from '../services/TaskHazardService';
import { AssetHierarchyService } from '../services/AssetHierarchyService';
import AddTaskHazardModal from '../components/AddTaskHazardModal';
import EditTaskHazardModal from '../components/EditTaskHazardModal';
import TaskHazardDetailsModal from '../components/TaskHazardDetailsModal';
import TaskHazardMapView from '../components/TaskHazardMapView';

const TaskHazardScreen = () => {
  const [taskHazards, setTaskHazards] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreatingTaskHazard, setIsCreatingTaskHazard] = useState(false);
  const [selectedTaskHazard, setSelectedTaskHazard] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingTaskHazard, setIsUpdatingTaskHazard] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [dataSource, setDataSource] = useState('api'); // 'api' or 'cache'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'active', 'completed', 'draft'

  // Load task hazards and assets on component mount
  useEffect(() => {
    fetchTaskHazards();
    fetchAssets();
  }, []);

  // Fetch assets for display purposes (to show externalId instead of UUID)
  const fetchAssets = async () => {
    try {
      const response = await AssetHierarchyService.getAll();
      if (response.data && Array.isArray(response.data)) {
        setAssets(response.data);
      }
    } catch (error) {
      // Silently fail - assets are only needed for display enhancement
      console.warn('Failed to load assets for display:', error.message);
    }
  };

  const fetchTaskHazards = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Use hybrid service that handles online/offline
      const response = await TaskHazardService.getAll();
      const apiTaskHazards = response.data || [];

      if (!Array.isArray(apiTaskHazards)) {
        throw new Error('Invalid response format');
      }

      // Filter out deleted items from display
      const activeTaskHazards = apiTaskHazards.filter(item => {
        const status = item.status?.toLowerCase();
        return status !== 'deleted' && status !== 'removed';
      });


      setTaskHazards(activeTaskHazards);
      setDataSource(response.source); // 'api' or 'cache'
    } catch (error) {
      console.error('Error fetching task hazards:', error);
      setError(error.message || 'Failed to load task hazards.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchTaskHazards(true);
  };

  const handleCreateTaskHazard = async (taskHazardData) => {
    try {
      setIsCreatingTaskHazard(true);      
      const response = await TaskHazardService.create(taskHazardData);
      
      // Show appropriate message based on whether it was saved offline or online
      if (response.data?._offline || response.data?._pendingSync) {
        Alert.alert(
          'Saved Offline',
          'Task Hazard saved locally. It will be synced to the server when you\'re back online.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', 'Task Hazard created successfully!');
      }

      // Refresh UI in the background (don't await to avoid blocking)
      fetchTaskHazards().catch(err => console.error('Error refreshing list:', err.message));
      
    } catch (error) {
      console.error('Error creating task hazard:', error);
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsCreatingTaskHazard(false);
    }
  };

  const handleUpdateTaskHazard = async (taskHazardData) => {
    try {
      setIsUpdatingTaskHazard(true);
      const response = await TaskHazardService.update(taskHazardData.id, taskHazardData);
      
      // Close modal first
      setShowEditModal(false);
      setSelectedTaskHazard(null);
      
      // Show appropriate message based on whether it was saved offline or online
      if (response.data?._offline || response.data?._pendingSync) {
        Alert.alert(
          'Updated Offline',
          'Task Hazard updated locally. It will be synced to the server when you\'re back online.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', 'Task Hazard updated successfully!');
      }
      
      // Refresh the list after a short delay
      setTimeout(async () => {
        await fetchTaskHazards();
      }, 500);
      
    } catch (error) {
      console.error('Error updating task hazard:', error);
      Alert.alert('Error', error.message || 'Failed to update task hazard');
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsUpdatingTaskHazard(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedTaskHazard(null);
  };

  const handleDeleteTaskHazard = async (taskHazardId) => {
    Alert.alert(
      'Delete Task Hazard',
      'Are you sure you want to delete this task hazard?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically remove from UI immediately
              setTaskHazards(prev => prev.filter(item => item.id !== taskHazardId));
              
              const response = await TaskHazardService.delete(taskHazardId);
              
              // Refresh the UI to ensure consistency
              await fetchTaskHazards();
              
              // Show appropriate message based on whether it was deleted offline or online
              if (response.source === 'offline') {
                Alert.alert(
                  'Deleted Offline',
                  'Task Hazard deleted locally. It will be synced to the server when you\'re back online.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Success', 'Task Hazard deleted successfully!');
              }
            } catch (error) {
              console.error('Error deleting task hazard:', error);
              // If error, refresh to restore the item
              await fetchTaskHazards();
              Alert.alert('Error', error.message || 'Failed to delete task hazard');
            }
          }
        }
      ]
    );
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

  // Filter task hazards based on status
  const getFilteredTaskHazards = () => {
    if (statusFilter === 'all') {
      return taskHazards;
    }
    return taskHazards.filter(taskHazard => 
      taskHazard.status?.toLowerCase() === statusFilter.toLowerCase()
    );
  };

  const filteredTaskHazards = getFilteredTaskHazards();

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

  const renderTaskHazardItem = ({ item }) => {
    const dateTime = `${item.date} ${item.time}`;

    return (
      <View style={styles.taskHazardItem}>
        <TouchableOpacity 
          style={styles.taskHazardRow}
          onPress={() => handleTaskHazardInfo(item)}
        >
          <View style={styles.taskHazardInfo}>
            <View style={styles.taskHazardHeader}>
              <Text style={styles.taskHazardId}>#{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            
            <View style={styles.scopeOfWorkContainer}>
              <Text style={styles.scopeOfWork} numberOfLines={2}>
                {item.scopeOfWork}
              </Text>
            </View>
            
            <View style={styles.taskHazardDetails}>
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
              {item.individual && (
                <Text style={styles.individualsText}>
                  {(() => {
                    if (Array.isArray(item.individual)) {
                      return `${item.individual.length} individual${item.individual.length !== 1 ? 's' : ''}`;
                    } else if (typeof item.individual === 'string' && item.individual.trim()) {
                      return `${item.individual.split(',').length} individual${item.individual.split(',').length !== 1 ? 's' : ''}`;
                    }
                    return '0 individuals';
                  })()}
                </Text>
              )}
            </View>

            {/* Rejection Reason - Show for rejected items */}
            {item.status === 'Rejected' && (() => {
              const latestApproval = item.approvals?.find(approval => approval.isLatest) || item.approvals?.[0];
              if (latestApproval?.comments || latestApproval?.status === 'rejected') {
                return (
                  <View style={styles.rejectionSection}>
                    <View style={styles.rejectionHeader}>
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                      <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                    </View>
                    <Text style={styles.rejectionText} numberOfLines={2}>
                      {latestApproval?.comments || 'No reason provided for rejection.'}
                    </Text>
                  </View>
                );
              }
              return null;
            })()}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleTaskHazardInfo(item)}
            >
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedTaskHazard(item);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteTaskHazard(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleTaskHazardInfo = (taskHazard) => {
    setSelectedTaskHazard(taskHazard);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTaskHazard(null);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="warning-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyStateTitle}>No Task Hazards Found</Text>
      <Text style={styles.emptyStateText}>
        {error ? 'Unable to load task hazards. Please try again.' : 'No task hazards have been created yet.'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchTaskHazards()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
      <Text style={styles.loadingText}>Loading task hazards...</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Task Hazard Assessment</Text>
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline Mode Indicator */}
      {dataSource === 'cache' && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#f59e0b" />
          <Text style={styles.offlineBannerText}>
            Offline Mode - Showing cached data
          </Text>
        </View>
      )}

      {/* Header with View Toggle, Filter, and Add Button */}
      <View style={styles.header}>
        {/* View Toggle - Left side */}
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
        
        {/* Add Button - Right side */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Task Hazard</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area - List or Map View */}
      {taskHazards.length > 0 ? (
        viewMode === 'list' ? (
          <FlatList
            data={filteredTaskHazards}
            renderItem={renderTaskHazardItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.taskHazardsList}
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
          <ScrollView 
            style={styles.mapViewContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['rgb(52, 73, 94)']}
                tintColor="rgb(52, 73, 94)"
              />
            }
          >
            <TaskHazardMapView
              taskHazards={filteredTaskHazards}
              onMarkerPress={handleTaskHazardInfo}
              getRiskColor={getRiskColor}
              getStatusColor={getStatusColor}
              isLoading={isLoading}
            />
          </ScrollView>
        )
      ) : (
        renderEmptyState()
      )}

      {/* Add Task Hazard Modal */}
      <AddTaskHazardModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateTaskHazard}
        isLoading={isCreatingTaskHazard}
      />

      {/* Edit Task Hazard Modal */}
      <EditTaskHazardModal
        visible={showEditModal}
        onClose={closeEditModal}
        onSubmit={handleUpdateTaskHazard}
        isLoading={isUpdatingTaskHazard}
        taskHazard={selectedTaskHazard}
      />

      {/* Task Hazard Details Modal */}
      <TaskHazardDetailsModal
        visible={showDetailsModal}
        onClose={closeDetailsModal}
        taskHazard={selectedTaskHazard}
        getRiskColor={getRiskColor}
        getStatusColor={getStatusColor}
        assets={assets}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggleButton: {
    backgroundColor: 'rgb(52, 73, 94)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
  taskHazardsList: {
    flex: 1,
  },
  taskHazardItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  taskHazardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  taskHazardInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskHazardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskHazardId: {
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
  scopeOfWorkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  scopeOfWork: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 22,
  },
  taskHazardDetails: {
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
  mapViewContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

export default TaskHazardScreen;
