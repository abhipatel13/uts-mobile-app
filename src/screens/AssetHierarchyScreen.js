import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssetHierarchyApi } from '../services';
import { buildAssetHierarchy, flattenAssetHierarchy } from '../utils/assetUtils';
import AssetDetailsModal from '../components/AssetDetailsModal';

const AssetHierarchyScreen = () => {
  const [expandedItems, setExpandedItems] = useState({});
  const [assets, setAssets] = useState([]);
  const [flattenedAssets, setFlattenedAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  // Update flattened assets when assets or expanded items change
  useEffect(() => {
    updateFlattenedAssets();
  }, [assets, expandedItems]);

  const fetchAssets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await AssetHierarchyApi.getAll();
      const apiAssets = response.data || [];

      if (!Array.isArray(apiAssets)) {
        throw new Error('Invalid response format from server');
      }

      setAssets(apiAssets);

      // Auto-expand root assets on initial load
      if (!isRefresh && apiAssets.length > 0) {
        const rootAssets = apiAssets.filter(asset => !asset.parent);
        const expandedState = {};
        rootAssets.forEach(asset => {
          expandedState[asset.id] = true;
        });
        setExpandedItems(expandedState);
      }

    } catch (error) {
      console.error('AssetHierarchyScreen: fetchAssets - Error occurred:', error.message);
      setError(error.message || 'Failed to load assets. Please try again.');
      
      // Show alert for errors
      Alert.alert(
        'Error',
        error.message || 'Failed to load assets. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateFlattenedAssets = () => {
    if (assets.length === 0) {
      setFlattenedAssets([]);
      return;
    }

    // Build hierarchy
    const hierarchicalAssets = buildAssetHierarchy(assets);
    
    // Flatten with respect to expanded state
    const flattened = flattenHierarchyWithExpansion(hierarchicalAssets, 0);
    setFlattenedAssets(flattened);
  };

  const flattenHierarchyWithExpansion = (hierarchicalAssets, level = 0) => {
    let flattened = [];

    hierarchicalAssets.forEach(asset => {
      // Add current asset with level
      flattened.push({
        ...asset,
        level,
        hasChildren: asset.children && asset.children.length > 0
      });

      // Add children if expanded
      if (asset.children && asset.children.length > 0 && expandedItems[asset.id]) {
        flattened = flattened.concat(
          flattenHierarchyWithExpansion(asset.children, level + 1)
        );
      }
    });

    return flattened;
  };

  const handleRefresh = () => {
    fetchAssets(true);
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const renderAssetItem = ({ item }) => {
    const isExpanded = expandedItems[item.id];
    const indentWidth = item.level * 20; // 20px per level
    

    return (
      <View style={styles.assetItem}>
        <TouchableOpacity 
          style={[styles.assetRow, { paddingLeft: 20 + indentWidth }]}
          onPress={() => item.hasChildren && toggleExpand(item.id)}
        >
          <View style={styles.assetInfo}>
            <View style={styles.expandContainer}>
              {item.hasChildren ? (
                <Ionicons 
                  name={isExpanded ? "chevron-down" : "chevron-forward"} 
                  size={16} 
                  color="#64748b" 

                />
              ) : (
                <View style={{ width: 16 }} />
              )}
              <Text style={styles.assetId}>
                {item.cmmsInternalId || item.id}
              </Text>
            </View>
            <View style={styles.assetDetails}>
              <Text style={styles.assetName}>{item.name}</Text>
              <Text style={styles.assetType}>
                {item.objectType || (item.parent ? 'Child Asset' : 'Root Asset')}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => handleAssetInfo(item)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  const handleAssetInfo = (asset) => {
    console.log('AssetHierarchyScreen: handleAssetInfo - Showing details for asset:', asset.name);
    setSelectedAsset(asset);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAsset(null);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyStateTitle}>No Assets Found</Text>
      <Text style={styles.emptyStateText}>
        {error ? 'Unable to load assets. Please try again.' : 'No asset hierarchy data available.'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchAssets()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
      <Text style={styles.loadingText}>Loading assets...</Text>
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
      {/* Table Header */}
      {flattenedAssets.length > 0 && (
        <View style={styles.tableHeader}>
          <Text style={styles.columnHeader}>ID</Text>
          <Text style={styles.columnHeader}>NAME</Text>
        </View>
      )}

      {/* Asset List */}
      {flattenedAssets.length > 0 ? (
        <FlatList
          data={flattenedAssets}
          renderItem={renderAssetItem}
          keyExtractor={(item) => item.id}
          style={styles.assetList}
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

      {/* Asset Details Modal */}
      <AssetDetailsModal
        visible={showDetailsModal}
        onClose={handleCloseDetailsModal}
        asset={selectedAsset}
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
  assetList: {
    flex: 1,
  },
  assetItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  assetInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 20,
  },
  assetId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 8,
  },
  assetDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  assetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  assetType: {
    fontSize: 12,
    color: '#64748b',
  },
  infoButton: {
    padding: 4,
    marginLeft: 12,
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

export default AssetHierarchyScreen;