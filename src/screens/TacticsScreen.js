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
import { TacticsApi } from '../services';
import AddTacticModal from '../components/AddTacticModal';

const TacticsScreen = () => {
  const [tactics, setTactics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreatingTactic, setIsCreatingTactic] = useState(false);

  // Load tactics on component mount
  useEffect(() => {
    fetchTactics();
  }, []);

  const fetchTactics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await TacticsApi.getAll();
      const apiTactics = response.data || [];

      if (!Array.isArray(apiTactics)) {
        throw new Error('Invalid response format from server');
      }

      setTactics(apiTactics);

    } catch (error) {
      console.error('Error fetching tactics:', error);
      setError(error.message || 'Failed to load tactics. Please try again.');
      
      // Show alert for errors
      Alert.alert(
        'Error',
        error.message || 'Failed to load tactics. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTactics(true);
  };

  const handleCreateTactic = async (tacticData) => {
    try {
      setIsCreatingTactic(true);
      
      await TacticsApi.create(tacticData);
      
      // Refresh the tactics list
      await fetchTactics();
      
      Alert.alert('Success', 'Tactic created successfully!');
      
    } catch (error) {
      console.error('Error creating tactic:', error);
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsCreatingTactic(false);
    }
  };

  const handleDeleteTactic = async (tacticId) => {
    Alert.alert(
      'Delete Tactic',
      'Are you sure you want to delete this tactic?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TacticsApi.delete(tacticId);
              await fetchTactics();
              Alert.alert('Success', 'Tactic deleted successfully!');
            } catch (error) {
              console.error('Error deleting tactic:', error);
              Alert.alert('Error', error.message || 'Failed to delete tactic');
            }
          }
        }
      ]
    );
  };

  const renderTacticItem = ({ item }) => {
    return (
      <View style={styles.tacticItem}>
        <TouchableOpacity 
          style={styles.tacticRow}
          onPress={() => handleTacticInfo(item)}
        >
          <View style={styles.tacticInfo}>
            <View style={styles.tacticHeader}>
              <Text style={styles.tacticName}>{item.analysisName || 'Unnamed Analysis'}</Text>
              <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
                <Text style={[styles.statusText, styles[`statusText${item.status}`]]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.tacticLocation}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              {' '}{item.location}
            </Text>
            <Text style={styles.tacticId}>ID: {item.id}</Text>
            {item.assetDetails?.description && (
              <Text style={styles.tacticDescription} numberOfLines={2}>
                {item.assetDetails.description}
              </Text>
            )}
            {item.assetDetails?.equipment && (
              <Text style={styles.tacticEquipment}>
                Equipment: {item.assetDetails.equipment}
              </Text>
            )}
            {item.assetDetails?.riskLevel && (
              <View style={styles.riskContainer}>
                <Text style={styles.riskLabel}>Risk Level: </Text>
                <View style={[styles.riskBadge, styles[`risk${item.assetDetails.riskLevel}`]]}>
                  <Text style={[styles.riskText, styles[`riskText${item.assetDetails.riskLevel}`]]}>
                    {item.assetDetails.riskLevel}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleTacticInfo(item)}
            >
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteTactic(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleTacticInfo = (tactic) => {
    const assetDetails = tactic.assetDetails || {};
    const detailsText = [
      `Analysis Name: ${tactic.analysisName || 'N/A'}`,
      `Location: ${tactic.location || 'N/A'}`,
      `Status: ${tactic.status || 'N/A'}`,
      `Description: ${assetDetails.description || 'N/A'}`,
      `Equipment: ${assetDetails.equipment || 'N/A'}`,
      `Risk Level: ${assetDetails.riskLevel || 'N/A'}`,
      `Created: ${new Date(tactic.created_at).toLocaleDateString() || 'N/A'}`
    ].join('\n');

    Alert.alert(
      'Tactic Details',
      detailsText,
      [{ text: 'OK' }]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyStateTitle}>No Tactics Found</Text>
      <Text style={styles.emptyStateText}>
        {error ? 'Unable to load tactics. Please try again.' : 'No tactics have been created yet.'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchTactics()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
      <Text style={styles.loadingText}>Loading tactics...</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tactics</Text>
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Add Tactic Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Tactics</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Tactic</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      {tactics.length > 0 && (
        <View style={styles.tableHeader}>
          <Text style={styles.columnHeader}>ANALYSIS NAME</Text>
          <Text style={styles.columnHeader}>LOCATION</Text>
          <Text style={styles.columnHeader}>STATUS</Text>
        </View>
      )}

      {/* Tactics List */}
      {tactics.length > 0 ? (
        <FlatList
          data={tactics}
          renderItem={renderTacticItem}
          keyExtractor={(item) => item.id}
          style={styles.tacticsList}
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

      {/* Add Tactic Modal */}
      <AddTacticModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateTactic}
        isLoading={isCreatingTactic}
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
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  columnHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tacticsList: {
    flex: 1,
  },
  tacticItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tacticRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tacticInfo: {
    flex: 1,
    marginRight: 16,
  },
  tacticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tacticName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  tacticLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tacticId: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  tacticDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  tacticEquipment: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskLow: {
    backgroundColor: '#dcfce7',
  },
  riskMedium: {
    backgroundColor: '#fef3c7',
  },
  riskHigh: {
    backgroundColor: '#fed7d7',
  },
  riskCritical: {
    backgroundColor: '#fecaca',
  },
  riskText: {
    fontSize: 11,
    fontWeight: '500',
  },
  riskTextLow: {
    color: '#166534',
  },
  riskTextMedium: {
    color: '#92400e',
  },
  riskTextHigh: {
    color: '#dc2626',
  },
  riskTextCritical: {
    color: '#991b1b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#f3f4f6',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextInactive: {
    color: '#6b7280',
  },
  statusTextPending: {
    color: '#92400e',
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

export default TacticsScreen;