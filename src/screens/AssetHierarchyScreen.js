import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AssetHierarchyScreen = () => {
  const [expandedItems, setExpandedItems] = useState({});

  const assetData = [
    {
      id: '333-1753806400301',
      name: 'ewrewr',
      type: 'Root Asset',
      hasChildren: true,
      children: []
    },
    {
      id: '222-1753806380318',
      name: 'rrrr',
      type: 'Root Asset',
      hasChildren: false,
      children: []
    },
    {
      id: '3434-1753806278794',
      name: 'rrrrr',
      type: 'Root Asset',
      hasChildren: false,
      children: []
    },
    {
      id: '001-1752711626749',
      name: 'TESTING',
      type: 'Root Asset',
      hasChildren: true,
      children: []
    },
    {
      id: '11-1753806182435',
      name: 'wwww',
      type: 'Root Asset',
      hasChildren: false,
      children: []
    }
  ];

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const renderAssetItem = ({ item }) => {
    const isExpanded = expandedItems[item.id];
    
    return (
      <View style={styles.assetItem}>
        <TouchableOpacity 
          style={styles.assetRow}
          onPress={() => item.hasChildren && toggleExpand(item.id)}
        >
          <View style={styles.assetInfo}>
            <View style={styles.expandContainer}>
              {item.hasChildren && (
                <Ionicons 
                  name={isExpanded ? "chevron-down" : "chevron-forward"} 
                  size={16} 
                  color="#64748b" 
                />
              )}
              <Text style={styles.assetId}>{item.id}</Text>
            </View>
            <View style={styles.assetDetails}>
              <Text style={styles.assetName}>{item.name}</Text>
              <Text style={styles.assetType}>{item.type}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Add Asset Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Asset Hierarchy</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Asset</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.columnHeader}>ID</Text>
        <Text style={styles.columnHeader}>NAME</Text>
      </View>

      {/* Asset List */}
      <FlatList
        data={assetData}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        style={styles.assetList}
        showsVerticalScrollIndicator={false}
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
});

export default AssetHierarchyScreen;
