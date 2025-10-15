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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskHazardService } from '../services/TaskHazardService';
import AddTaskHazardModal from '../components/AddTaskHazardModal';
import TaskHazardDetailsModal from '../components/TaskHazardDetailsModal';
import TaskHazardMapView from '../components/TaskHazardMapView';

const TaskHazardScreen = () => {
  const [taskHazards, setTaskHazards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreatingTaskHazard, setIsCreatingTaskHazard] = useState(false);
  const [selectedTaskHazard, setSelectedTaskHazard] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [dataSource, setDataSource] = useState('api'); // 'api' or 'cache'

  // Load task hazards on component mount
  useEffect(() => {
    fetchTaskHazards();
  }, []);

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

      setTaskHazards(apiTaskHazards);
      setDataSource(response.source); // 'api' or 'cache'
    } catch (error) {
      console.error('Error fetching task hazards:', error);
      setError(error.message || 'Failed to load task hazards.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTaskHazards(true);
  };

  const handleCreateTaskHazard = async (taskHazardData) => {
    try {
      setIsCreatingTaskHazard(true);

      console.log('taskHazardData', taskHazardData);
      
      await TaskHazardService.create(taskHazardData);
      
      // Refresh the task hazards list
      await fetchTaskHazards();
      
      Alert.alert('Success', 'Task Hazard created successfully!');
      
    } catch (error) {
      console.error('Error creating task hazard:', error);
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsCreatingTaskHazard(false);
    }
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
              await TaskHazardService.delete(taskHazardId);
              await fetchTaskHazards();
              Alert.alert('Success', 'Task Hazard deleted successfully!');
            } catch (error) {
              console.error('Error deleting task hazard:', error);
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
      case 'Rejected': return '#ef4444';
      case 'Completed': return '#3b82f6';
      case 'Inactive': return '#6b7280';
      default: return '#6b7280';
    }
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
            
            <Text style={styles.scopeOfWork} numberOfLines={2}>
              {item.scopeOfWork}
            </Text>
            
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
                  {item.individual.split(',').length} individual(s)
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleTaskHazardInfo(item)}
            >
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
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
          
          {/* Add Button */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area - List or Map View */}
      {taskHazards.length > 0 ? (
        viewMode === 'list' ? (
          <FlatList
            data={taskHazards}
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
              taskHazards={taskHazards}
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

      {/* Task Hazard Details Modal */}
      <TaskHazardDetailsModal
        visible={showDetailsModal}
        onClose={closeDetailsModal}
        taskHazard={selectedTaskHazard}
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
  scopeOfWork: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
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
