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

const UserManagementScreen = () => {
  // Sample user data matching your screenshot
  const users = [
    {
      id: 1,
      name: 'Test',
      email: 'hello1@utahtechnicalservicesllc.com',
      role: 'Superuser',
      department: 'Engineering1',
      phone: '6233012035',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 2,
      name: '-',
      email: 'hello2@utahtechnicalservicesllc.com',
      role: 'Supervisor',
      department: '-',
      phone: '-',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 3,
      name: 'ABHI0000',
      email: 'hello3@utahtechnicalservicesllc.com',
      role: 'Superuser',
      department: 'Engineering',
      phone: '6233012035',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 4,
      name: '-',
      email: 'hello4@utahtechnicalservicesllc.com',
      role: 'User',
      department: '-',
      phone: '-',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 5,
      name: '-',
      email: 'abhi00@utahtechnicalllc.com',
      role: 'Admin',
      department: '-',
      phone: '-',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 6,
      name: '1111111',
      email: 'test@test1.com',
      role: 'Superuser',
      department: '-',
      phone: '-',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 7,
      name: '111',
      email: 'test22@gmail.com',
      role: 'Superuser',
      department: 'Engineering',
      phone: '-',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 8,
      name: '111',
      email: 'test@tessst.com',
      role: 'Superuser',
      department: 'Engineering',
      phone: '-',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 9,
      name: 'Abhi1111111111',
      email: 'abhi@test11.com',
      role: 'Admin',
      department: 'Engineering',
      phone: '6233012035',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 10,
      name: 'Abhi111',
      email: 'abhi@ttt.com',
      role: 'Admin',
      department: 'Engineering',
      phone: '6233012034',
      company: 'Utah Technical Services LLC',
    },
    {
      id: 11,
      name: 'Abhi',
      email: 'apate337@gmail.com',
      role: 'Superuser',
      department: 'TEST',
      phone: '123',
      company: 'Utah Technical Services LLC',
    },
  ];

  const tableHeaders = [
    { key: 'name', title: 'NAME', flex: 1 },
    { key: 'email', title: 'EMAIL', flex: 1.5 },
    { key: 'role', title: 'ROLE', flex: 0.8 },
    { key: 'department', title: 'DEPARTMENT', flex: 1 },
    { key: 'phone', title: 'PHONE', flex: 1 },
    { key: 'company', title: 'COMPANY', flex: 1.2 },
    { key: 'actions', title: 'ACTIONS', flex: 1.5 },
  ];

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'superuser':
        return '#3b82f6';
      case 'admin':
        return '#10b981';
      case 'supervisor':
        return '#f59e0b';
      case 'user':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  const renderUserItem = ({ item }) => {
    return (
      <View style={styles.userRow}>
        <Text style={[styles.cellText, { flex: 1 }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.cellText, { flex: 1.5, fontSize: 12 }]} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={[styles.roleContainer, { flex: 0.8 }]}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>
        <Text style={[styles.cellText, { flex: 1 }]} numberOfLines={1}>
          {item.department}
        </Text>
        <Text style={[styles.cellText, { flex: 1 }]} numberOfLines={1}>
          {item.phone}
        </Text>
        <Text style={[styles.cellText, { flex: 1.2, fontSize: 11 }]} numberOfLines={1}>
          {item.company}
        </Text>
        <View style={[styles.actionsContainer, { flex: 1.5 }]}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.actionButtonText}>Reset Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>Manage users for Utah Technical Services LLC</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: '#3b82f6' }]}>
            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
            <Text style={styles.headerButtonText}>Bulk Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { backgroundColor: 'rgb(52, 73, 94)' }]}>
            <Text style={styles.headerButtonText}>Create New User</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* Table Headers */}
          <View style={styles.tableHeader}>
            {tableHeaders.map((header) => (
              <Text key={header.key} style={[styles.headerText, { flex: header.flex }]}>
                {header.title}
              </Text>
            ))}
          </View>

          {/* User List */}
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            style={styles.userList}
          />
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
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  tableContainer: {
    minWidth: 1000, // Ensure table is wide enough for all columns
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
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userList: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  cellText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '400',
  },
  roleContainer: {
    alignItems: 'flex-start',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default UserManagementScreen;
