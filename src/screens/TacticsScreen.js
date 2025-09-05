import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TacticsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tactics, setTactics] = useState([]); // Empty for now to show "No tactics found"

  const tableHeaders = [
    { key: 'id', title: 'ID', flex: 0.5 },
    { key: 'analysisName', title: 'Analysis Name', flex: 1.5 },
    { key: 'location', title: 'Location', flex: 1.2 },
    { key: 'status', title: 'Status', flex: 1 },
    { key: 'created', title: 'Created', flex: 1 },
    { key: 'actions', title: 'Actions', flex: 1 },
  ];

  const renderTacticItem = ({ item }) => {
    return (
      <View style={styles.tacticRow}>
        <Text style={[styles.cellText, { flex: 0.5 }]}>{item.id}</Text>
        <Text style={[styles.cellText, { flex: 1.5 }]}>{item.analysisName}</Text>
        <Text style={[styles.cellText, { flex: 1.2 }]}>{item.location}</Text>
        <View style={[styles.statusContainer, { flex: 1 }]}>
          <Text style={[styles.statusText, { color: item.statusColor }]}>
            {item.status}
          </Text>
        </View>
        <Text style={[styles.cellText, { flex: 1 }]}>{item.created}</Text>
        <View style={[styles.actionsContainer, { flex: 1 }]}>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No tactics found</Text>
        <Text style={styles.emptySubtitle}>Create a new tactic to get started.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Search and Add Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Tactics</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>ADD NEW</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tactics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Table Headers */}
      <View style={styles.tableHeader}>
        {tableHeaders.map((header) => (
          <Text key={header.key} style={[styles.headerText, { flex: header.flex }]}>
            {header.title}
          </Text>
        ))}
      </View>

      {/* Tactics List or Empty State */}
      {tactics.length > 0 ? (
        <FlatList
          data={tactics}
          renderItem={renderTacticItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.tacticsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
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
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tacticsList: {
    flex: 1,
  },
  tacticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  cellText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '400',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  actionsContainer: {
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TacticsScreen;
