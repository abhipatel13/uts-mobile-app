import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssetHierarchyApi } from '../services/AssetHierarchyApi';

const AssetSelector = ({ 
  value, 
  onValueChange, 
  error, 
  title = 'Asset or System being worked on',
  placeholder = 'Select asset or system' 
}) => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedAssets, setExpandedAssets] = useState(new Set());

  // Fetch assets from API
  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const response = await AssetHierarchyApi.getAll();
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }

      // Add level property for hierarchy display
      const assetsWithLevels = addLevelsToAssets(response.data);
      setAssets(assetsWithLevels);
      setFilteredAssets(assetsWithLevels);
    } catch (error) {
      console.error('AssetSelector: fetchAssets failed:', error.message);
      // Check if it's an authentication error
      if (error.code === 'AUTH_EXPIRED' || error.message?.includes('Authentication expired')) {
        console.log('AssetSelector: Authentication expired, user will be redirected to login');
        // Don't show alert for auth errors - global logout will handle navigation
      } else {
        Alert.alert('Error', 'Failed to load assets. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add level property to assets for hierarchy display
  const addLevelsToAssets = (assets) => {
    const assetMap = new Map();
    assets.forEach(asset => {
      assetMap.set(asset.id, { ...asset, level: 0 });
    });

    // Calculate levels
    const calculateLevel = (asset, visited = new Set()) => {
      if (visited.has(asset.id)) return 0; // Prevent infinite loops
      visited.add(asset.id);

      if (!asset.parent) {
        asset.level = 0;
        return 0;
      }

      const parent = assetMap.get(asset.parent);
      if (parent) {
        const parentLevel = calculateLevel(parent, visited);
        asset.level = parentLevel + 1;
        return asset.level;
      }

      return 0;
    };

    assets.forEach(asset => {
      const assetWithLevel = assetMap.get(asset.id);
      calculateLevel(assetWithLevel);
    });

    return Array.from(assetMap.values());
  };

  // Filter assets based on search
  const filterAssets = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredAssets(assets);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const directMatches = assets.filter(asset => 
      (asset.name && asset.name.toLowerCase().includes(searchLower)) ||
      (asset.description && asset.description.toLowerCase().includes(searchLower)) ||
      (asset.id && asset.id.toLowerCase().includes(searchLower)) ||
      (asset.cmmsInternalId && asset.cmmsInternalId.toLowerCase().includes(searchLower)) ||
      (asset.functionalLocation && asset.functionalLocation.toLowerCase().includes(searchLower))
    );

    // Include parent assets to maintain hierarchy
    const assetsToInclude = new Set();
    directMatches.forEach(asset => {
      assetsToInclude.add(asset.id);
      
      // Add all parent assets up the chain
      let currentParent = asset.parent;
      while (currentParent) {
        assetsToInclude.add(currentParent);
        const parentAsset = assets.find(a => a.id === currentParent);
        currentParent = parentAsset?.parent || null;
      }
    });

    const filtered = assets.filter(asset => assetsToInclude.has(asset.id));
    setFilteredAssets(filtered);

    // Auto-expand parents with matching children
    const parentsToExpand = new Set();
    directMatches.forEach(asset => {
      if (asset.parent) {
        let currentParent = asset.parent;
        while (currentParent) {
          parentsToExpand.add(currentParent);
          const parentAsset = assets.find(a => a.id === currentParent);
          currentParent = parentAsset?.parent || null;
        }
      }
    });
    setExpandedAssets(parentsToExpand);
  };

  // Get top-level assets (no parent)
  const getTopLevelAssets = () => {
    return filteredAssets.filter(asset => asset.parent === null);
  };

  // Get child assets for a parent
  const getChildAssets = (parentId) => {
    return filteredAssets.filter(asset => asset.parent === parentId);
  };

  // Toggle expanded state
  const toggleExpanded = (assetId) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedAssets(newExpanded);
  };

  // Handle asset selection
  const handleAssetSelection = (asset) => {
    onValueChange(asset.id);
    setIsModalVisible(false);
    setSearchText('');
  };

  // Always show the full modal with hierarchy for better UX
  const showAssetSelector = () => {
    setIsModalVisible(true);
  };

  // Get display text for selected asset (matching web interface)
  const getDisplayText = () => {
    if (!value) return placeholder;
    const selectedAsset = assets.find(asset => asset.id === value);
    if (!selectedAsset) return 'Unknown Asset';
    
    // Format like web interface: ID on left, name and description on right
    const name = selectedAsset.name || 'Unnamed Asset';
    const description = selectedAsset.description ? ` - ${selectedAsset.description}` : '';
    return `${selectedAsset.id}    ${name}${description}`;
  };

  // Render asset hierarchy recursively
  const renderAssetHierarchy = (assetList) => {
    return assetList.map(asset => {
      const children = getChildAssets(asset.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedAssets.has(asset.id);
      const isSelected = value === asset.id;

      return (
        <View key={asset.id} style={styles.assetItem}>
          <TouchableOpacity
            style={[
              styles.assetRow,
              { paddingLeft: asset.level * 24 + 16 },
              isSelected && styles.selectedAssetRow
            ]}
            onPress={() => handleAssetSelection(asset)}
          >
            <View style={styles.assetContent}>
              {hasChildren ? (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => toggleExpanded(asset.id)}
                >
                  <Ionicons 
                    name={isExpanded ? "caret-down" : "caret-forward"} 
                    size={14} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.expandButtonSpacer} />
              )}
              
              <View style={styles.assetInfoContainer}>
                <View style={styles.assetMainInfo}>
                  <Text style={[styles.assetId, isSelected && styles.selectedText]}>
                    {asset.id}
                  </Text>
                  <Text style={[styles.assetName, isSelected && styles.selectedText]}>
                    {asset.name || 'Unnamed Asset'}
                  </Text>
                </View>
                {asset.description && (
                  <Text style={[styles.assetDescription, isSelected && styles.selectedText]}>
                    {asset.description}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          
          {hasChildren && isExpanded && (
            <View style={styles.childrenContainer}>
              {renderAssetHierarchy(children)}
            </View>
          )}
        </View>
      );
    });
  };

  // Load assets when component mounts
  useEffect(() => {
    fetchAssets();
  }, []);

  // Auto-expand top-level assets to show hierarchy by default
  useEffect(() => {
    if (assets.length > 0 && expandedAssets.size === 0 && !searchText) {
      const topLevelAssets = assets.filter(asset => asset.parent === null);
      const assetsWithChildren = topLevelAssets.filter(asset => 
        assets.some(child => child.parent === asset.id)
      );
      
      // Expand first few top-level assets that have children
      const toExpand = assetsWithChildren.slice(0, 3).map(asset => asset.id);
      if (toExpand.length > 0) {
        setExpandedAssets(new Set(toExpand));
      }
    }
  }, [assets, searchText]);

  // Filter assets when search text changes
  useEffect(() => {
    filterAssets(searchText);
  }, [searchText, assets]);

  // Expand parent assets when value is set (for edit mode)
  useEffect(() => {
    if (value && assets.length > 0) {
      const selectedAsset = assets.find(a => a.id === value);
      if (selectedAsset) {
        const parentsToExpand = new Set();
        let currentParent = selectedAsset.parent;
        
        while (currentParent) {
          parentsToExpand.add(currentParent);
          const parentAsset = assets.find(a => a.id === currentParent);
          currentParent = parentAsset?.parent || null;
        }
        
        setExpandedAssets(parentsToExpand);
      }
    }
  }, [value, assets]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>
      
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={showAssetSelector}
      >
        <Text style={[styles.selectorText, !value && styles.placeholderText]}>
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Full Modal for Android and fallback */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Asset or System</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, ID, description..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Asset List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#374151" />
              <Text style={styles.loadingText}>Loading assets...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.assetList} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.assetListContent}
            >
              {filteredAssets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No assets found</Text>
                </View>
              ) : (
                <View style={styles.hierarchyContainer}>
                  {renderAssetHierarchy(getTopLevelAssets())}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  selector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  selectorError: {
    borderColor: '#ef4444',
  },
  selectorText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  assetList: {
    flex: 1,
  },
  assetListContent: {
    paddingBottom: 20,
  },
  hierarchyContainer: {
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
  assetItem: {
    // No border - cleaner hierarchy look
  },
  assetRow: {
    paddingVertical: 8,
    paddingRight: 16,
    minHeight: 44, // Ensure touch target size
  },
  selectedAssetRow: {
    backgroundColor: '#e0f2fe',
  },
  assetContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  expandButton: {
    padding: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  expandButtonSpacer: {
    width: 24,
    marginRight: 4,
  },
  assetInfoContainer: {
    flex: 1,
    paddingTop: 2,
  },
  assetMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  assetId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    minWidth: 60,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  assetDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectedText: {
    color: '#0369a1',
  },
  childrenContainer: {
    // Removed border for cleaner look, indentation provides hierarchy
  },
});

export default AssetSelector;
