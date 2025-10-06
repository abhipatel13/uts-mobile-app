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
import AssetHierarchyApi from '../services/AssetHierarchyApi';
import { buildAssetHierarchy, flattenAssetHierarchy } from '../utils/assetUtils';

const AssetHierarchyScreen = () => {
  const [expandedItems, setExpandedItems] = useState({});
  const [assets, setAssets] = useState([]);
  const [flattenedAssets, setFlattenedAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

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
      
      setAssets(apiAssets);
      const flattened = flattenAssetHierarchy(apiAssets);
      setFlattenedAssets(flattened);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setError('Failed to load assets. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchAssets(true);
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleAssetInfo = (asset) => {
    Alert.alert(
      'Asset Information',
      `Name: ${asset.name || 'N/A'}\nType: ${asset.objectType || 'N/A'}\nDescription: ${asset.description || 'N/A'}\nStatus: ${asset.status || 'N/A'}`,
      [{ text: 'OK' }]
    );
  };

  const renderAssetItem = ({ item, level = 0 }) => {
    const isExpanded = expandedItems[item.id];
    const hasChildren = item.children && item.children.length > 0;
    const indentStyle = { marginLeft: level * 20 };

    return (
      <View>
        <TouchableOpacity
          style={[styles.assetItem, indentStyle]}
          onPress={() => hasChildren ? toggleExpanded(item.id) : handleAssetInfo(item)}
        >
          <View style={styles.assetContent}>
            <View style={styles.assetInfo}>
              {hasChildren && (
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={16}
                  color="#666"
                  style={styles.expandIcon}
                />
              )}
              <Text style={styles.assetName}>{item.name}</Text>
            </View>
            <View style={styles.assetActions}>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => handleAssetInfo(item)}
              >
                <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {hasChildren && isExpanded && (
          <View>
            {item.children.map(child => (
              <React.Fragment key={child.id}>
                {renderAssetItem({ item: child, level: level + 1 })}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading assets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchAssets()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Asset Hierarchy</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Assets List */}
      <FlatList
        data={flattenedAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
          />
        }
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  refreshButton: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  assetItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  assetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandIcon: {
    marginRight: 8,
  },
  assetName: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  assetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 8,
  },
});

export default AssetHierarchyScreen;