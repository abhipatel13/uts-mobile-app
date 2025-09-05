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

const TaskHazardScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Sample data matching your screenshot
  const taskHazards = [
    {
      id: 363,
      scopeOfWork: 'Testing',
      dateTime: '2025-08-29 13:59:15',
      location: '33.41217628821304, -111.88909990128468',
      risk: 9,
      status: 'Active',
      riskColor: '#fbbf24', // yellow
    },
    {
      id: 362,
      scopeOfWork: 'Test',
      dateTime: '2025-08-29 13:57:14',
      location: '33.41216606938553, -111.88907074898039',
      risk: 2,
      status: 'Active',
      riskColor: '#22c55e', // green
    },
    {
      id: 157,
      scopeOfWork: 'Testing',
      dateTime: '2025-07-17 20:20:00',
      location: '43.81667658952818, -79.30446724702082',
      risk: 4,
      status: 'Active',
      riskColor: '#f59e0b', // orange
    },
  ];

  const tableHeaders = [
    { key: 'id', title: 'ID', flex: 0.5 },
    { key: 'scopeOfWork', title: 'Scope of Work', flex: 1.2 },
    { key: 'dateTime', title: 'Date & Time', flex: 1.2 },
    { key: 'location', title: 'Location', flex: 1.8 },
    { key: 'risk', title: 'Risk', flex: 0.6 },
    { key: 'status', title: 'Status', flex: 0.8 },
    { key: 'actions', title: 'Actions', flex: 0.6 },
  ];

  const getRiskColor = (risk) => {
    if (risk <= 3) return '#22c55e'; // green
    if (risk <= 6) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const renderTaskHazardItem = ({ item }) => {
    return (
      <View style={styles.taskHazardRow}>
        <Text style={[styles.cellText, { flex: 0.5 }]}>{item.id}</Text>
        <Text style={[styles.cellText, { flex: 1.2 }]} numberOfLines={1}>
          {item.scopeOfWork}
        </Text>
        <Text style={[styles.cellText, { flex: 1.2, fontSize: 12 }]} numberOfLines={2}>
          {item.dateTime}
        </Text>
        <Text style={[styles.cellText, { flex: 1.8, fontSize: 11 }]} numberOfLines={2}>
          {item.location}
        </Text>
        <View style={[styles.riskContainer, { flex: 0.6 }]}>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk) }]}>
            <Text style={styles.riskText}>{item.risk}</Text>
          </View>
        </View>
        <View style={[styles.statusContainer, { flex: 0.8 }]}>
          <Text style={[styles.statusText, { color: '#22c55e' }]}>
            {item.status}
          </Text>
        </View>
        <View style={[styles.actionsContainer, { flex: 0.6 }]}>
          <TouchableOpacity style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalPages = Math.ceil(taskHazards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = taskHazards.slice(startIndex, endIndex);

  return (
    <View style={styles.container}>
      {/* Header with Title and Add Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Task Hazard Assessment</Text>
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
            placeholder="Search tasks..."
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

          {/* Task Hazard List */}
          <FlatList
            data={currentItems}
            renderItem={renderTaskHazardItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages} • Showing {currentItems.length} of {taskHazards.length} items
        </Text>
        <View style={styles.paginationButtons}>
          <TouchableOpacity 
            style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <Text style={[styles.paginationButtonText, currentPage === 1 && styles.disabledText]}>
              Previous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.disabledText]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    minWidth: 800, // Ensure table is wide enough for all columns
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
  taskHazardRow: {
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
  riskContainer: {
    alignItems: 'center',
  },
  riskBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  deleteButton: {
    padding: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  paginationText: {
    fontSize: 14,
    color: '#64748b',
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
  },
  disabledText: {
    color: '#9ca3af',
  },
});

export default TaskHazardScreen;
