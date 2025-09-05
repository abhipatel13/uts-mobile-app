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

const RiskAssessmentScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [assessments, setAssessments] = useState([]); // Empty to show "No assessments found"

  const tableHeaders = [
    { key: 'id', title: 'ID', flex: 0.5 },
    { key: 'scopeOfWork', title: 'Scope of Work', flex: 1.5 },
    { key: 'dateTime', title: 'Date & Time', flex: 1.2 },
    { key: 'location', title: 'Location', flex: 1.5 },
    { key: 'status', title: 'Status', flex: 1 },
    { key: 'actions', title: 'Actions', flex: 0.8 },
  ];

  const renderAssessmentItem = ({ item }) => {
    return (
      <View style={styles.assessmentRow}>
        <Text style={[styles.cellText, { flex: 0.5 }]}>{item.id}</Text>
        <Text style={[styles.cellText, { flex: 1.5 }]} numberOfLines={1}>
          {item.scopeOfWork}
        </Text>
        <Text style={[styles.cellText, { flex: 1.2, fontSize: 12 }]} numberOfLines={2}>
          {item.dateTime}
        </Text>
        <Text style={[styles.cellText, { flex: 1.5, fontSize: 11 }]} numberOfLines={2}>
          {item.location}
        </Text>
        <View style={[styles.statusContainer, { flex: 1 }]}>
          <Text style={[styles.statusText, { color: '#22c55e' }]}>
            {item.status}
          </Text>
        </View>
        <View style={[styles.actionsContainer, { flex: 0.8 }]}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No assessments found</Text>
        <Text style={styles.emptySubtitle}>Create a new assessment to get started.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Add Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Risk Assessment Dashboard</Text>
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
            placeholder="Search assessments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Table Headers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            {tableHeaders.map((header) => (
              <Text key={header.key} style={[styles.headerText, { flex: header.flex }]}>
                {header.title}
              </Text>
            ))}
          </View>

          {/* Risk Assessment List or Empty State */}
          {assessments.length > 0 ? (
            <FlatList
              data={assessments}
              renderItem={renderAssessmentItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>
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
  tableContainer: {
    minWidth: 700, // Ensure table is wide enough for all columns
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
  assessmentRow: {
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
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
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

export default RiskAssessmentScreen;
