import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserApi } from '../services';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  
  // Current user info (you might want to get this from context/auth)
  const [currentUser] = useState({ role: 'superuser' }); // This should come from auth context

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await UserApi.getAll();
      const apiUsers = response.data || [];

      if (!Array.isArray(apiUsers)) {
        throw new Error('Invalid response format from server');
      }

      setUsers(apiUsers);

    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to load users. Please try again.');
      
      Alert.alert(
        'Error',
        error.message || 'Failed to load users. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers(true);
  };

  const handleCreateUser = async (userData) => {
    try {
      setIsCreatingUser(true);
      
      await UserApi.create(userData);
      
      // Refresh users list
      await fetchUsers();
      
      Alert.alert('Success', 'User created successfully!');
      
    } catch (error) {
      console.error('Error creating user:', error);
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      setIsUpdatingUser(true);
      
      await UserApi.update(userId, userData);
      
      // Refresh users list
      await fetchUsers();
      
      Alert.alert('Success', 'User updated successfully!');
      
    } catch (error) {
      console.error('Error updating user:', error);
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name || user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserApi.delete(user.id);
              await fetchUsers();
              Alert.alert('Success', 'User deleted successfully!');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', error.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleResetPassword = async (user) => {
    Alert.prompt(
      'Reset Password',
      `Enter new password for ${user.name || user.email}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async (newPassword) => {
            if (!newPassword || newPassword.length < 6) {
              Alert.alert('Error', 'Password must be at least 6 characters long');
              return;
            }
            
            try {
              await UserApi.resetPassword(user.id, newPassword);
              Alert.alert('Success', 'Password reset successfully!');
            } catch (error) {
              console.error('Error resetting password:', error);
              Alert.alert('Error', error.message || 'Failed to reset password');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'universal_user': return '#8b5cf6';
      case 'superuser': return '#3b82f6';
      case 'admin': return '#10b981';
      case 'supervisor': return '#f59e0b';
      case 'user': return '#64748b';
      default: return '#64748b';
    }
  };

  const renderUserItem = ({ item }) => {
    return (
      <View style={styles.userCard}>
        <TouchableOpacity 
          style={styles.userCardContent}
          onPress={() => handleEditUser(item)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(item.name || item.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.name || 'No Name'}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
              <Text style={styles.roleText}>
                {item.role?.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ') || 'User'}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.userMetadata}>
            {item.department && item.department !== '-' && (
              <View style={styles.metadataItem}>
                <Ionicons name="business-outline" size={14} color="#64748b" />
                <Text style={styles.metadataText}>{item.department}</Text>
              </View>
            )}
            {item.phone && item.phone !== '-' && (
              <View style={styles.metadataItem}>
                <Ionicons name="call-outline" size={14} color="#64748b" />
                <Text style={styles.metadataText}>{item.phone}</Text>
              </View>
            )}
            {item.company && (
              <View style={styles.metadataItem}>
                <Ionicons name="building-outline" size={14} color="#64748b" />
                <Text style={styles.metadataText}>{item.company.name || item.company}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditUser(item)}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.resetButton]}
              onPress={() => handleResetPassword(item)}
            >
              <Ionicons name="key-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteUser(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  // Error state
  if (error && !users.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to load users</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchUsers()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              {searchQuery ? ` found` : ` total`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, email, role..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.userList}
        contentContainerStyle={styles.userListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['rgb(52, 73, 94)']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No users found' : 'No users yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first user to get started'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Add First User</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Modals */}
      <AddUserModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateUser}
        isLoading={isCreatingUser}
        currentUserRole={currentUser.role}
      />

      <EditUserModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateUser}
        user={selectedUser}
        isLoading={isUpdatingUser}
        currentUserRole={currentUser.role}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgb(52, 73, 94)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  addButton: {
    backgroundColor: 'rgb(52, 73, 94)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  clearButton: {
    marginLeft: 8,
  },
  userList: {
    flex: 1,
  },
  userListContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userCardContent: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgb(52, 73, 94)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    color: '#64748b',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  resetButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  emptyStateButton: {
    backgroundColor: 'rgb(52, 73, 94)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserManagementScreen;
