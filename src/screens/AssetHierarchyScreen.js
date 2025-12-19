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
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssetHierarchyService } from '../services/AssetHierarchyService';
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
  const [dataSource, setDataSource] = useState('api'); // 'api' or 'cache'

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

      // Use hybrid service that handles online/offline
      const response = await AssetHierarchyService.getAll();
      const apiAssets = response.data || [];

      if (!Array.isArray(apiAssets)) {
        throw new Error('Invalid response format');
      }

      setAssets(apiAssets);
      setDataSource(response.source);

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
      setError(error.message || 'Failed to load assets.');
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
    const indentWidth = item.level * 24; // 24px per level, matching AssetSelector

    return (
      <View style={styles.assetItem}>
        <TouchableOpacity 
          style={[styles.assetRow, { paddingLeft: 16 + indentWidth }]}
          onPress={() => item.hasChildren && toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.assetContent}>
            {item.hasChildren ? (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleExpand(item.id)}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-down" : "chevron-forward"} 
                  size={18} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.expandButtonSpacer} />
            )}
            
            <View style={styles.assetInfoContainer}>
              <View style={styles.assetMainInfo}>
                <Text style={styles.assetId} numberOfLines={1}>
                  {item.externalId || item.id}
                </Text>
                <Text style={styles.assetName} numberOfLines={1}>
                  {item.name || 'Unnamed Asset'}
                </Text>
              </View>
              {item.description && (
                <Text style={styles.assetDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
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
      {/* Offline Mode Indicator */}
      {dataSource === 'cache' && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#f59e0b" />
          <Text style={styles.offlineBannerText}>
            Offline Mode - Showing cached data
          </Text>
        </View>
      )}

      {/* Horizontal Scrollable Content */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.pageScrollView}
        contentContainerStyle={styles.pageScrollContent}
        nestedScrollEnabled={true}
        bounces={false}
        scrollEventThrottle={16}
      >
        <View style={styles.contentWrapper}>
          {/* Asset List */}
          {flattenedAssets.length > 0 ? (
            <FlatList
              data={flattenedAssets}
              renderItem={renderAssetItem}
              keyExtractor={(item) => item.id}
              style={styles.assetList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              nestedScrollEnabled={true}
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
        </View>
      </ScrollView>

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
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
    fontFamily: 'System',
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
  pageScrollView: {
    flex: 1,
  },
  pageScrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    minWidth: '100%',
  },
  assetList: {
    flex: 1,
  },
  assetItem: {
    // No border - cleaner hierarchy look
  },
  assetRow: {
    paddingVertical: 8,
    paddingRight: 16,
    minHeight: 44, // Ensure touch target size
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assetContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 0,
    flex: 1,
  },
  expandButton: {
    padding: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  expandButtonSpacer: {
    width: 32,
    marginRight: 4,
  },
  assetInfoContainer: {
    flex: 1,
    paddingTop: 2,
    flexShrink: 0,
    minWidth: 0,
  },
  assetMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  assetId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    fontFamily: 'System',
    marginRight: 8,
    flexShrink: 0,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flexShrink: 0,
    fontFamily: 'System',
  },
  assetDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 4,
    fontFamily: 'System',
    flexShrink: 0,
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
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    fontFamily: 'System',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: 'System',
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
    fontFamily: 'System',
  },
});

export default AssetHierarchyScreen;