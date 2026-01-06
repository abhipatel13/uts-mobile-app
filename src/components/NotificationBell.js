import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  AppState,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '../services/NotificationService';
import notificationEvents, { NOTIFICATION_EVENTS } from '../utils/notificationEvents';

const NotificationBell = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await NotificationService.getMyNotifications();
      const unreadNotifications = response.filter(n => !n.isRead);
      
      // Check if we have new notifications (compare with previous count)
      const previousCount = unreadCount;
      const newCount = unreadNotifications.length;
      
      setNotifications(unreadNotifications);
      setUnreadCount(newCount);
      
      // Popup alerts removed - notifications will only show in bell icon and notification list
    } catch (error) {
      console.error('NotificationBell: fetchNotifications error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const appState = useRef(AppState.currentState);
  const previousUnreadCount = useRef(0);

  useEffect(() => {
    fetchNotifications();
    // Fetch notifications every 5 seconds for real-time updates
    const interval = setInterval(() => fetchNotifications(), 5000);
    
    // Listen for new notifications from push service
    const refreshListener = notificationEvents.on(
      NOTIFICATION_EVENTS.REFRESH_NOTIFICATIONS,
      () => {
        fetchNotifications();
      }
    );

    // Listen for new notification events
    const newNotificationListener = notificationEvents.on(
      NOTIFICATION_EVENTS.NEW_NOTIFICATION,
      (notification) => {
        // Immediately update badge count
        fetchNotifications();
      }
    );

    // Listen for app state changes (when app comes to foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, refresh notifications
        fetchNotifications();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(interval);
      notificationEvents.removeListener(NOTIFICATION_EVENTS.REFRESH_NOTIFICATIONS, refreshListener);
      notificationEvents.removeListener(NOTIFICATION_EVENTS.NEW_NOTIFICATION, newNotificationListener);
      subscription?.remove();
    };
  }, []);

  // Popup alerts removed - notifications will only show in bell icon and notification list
  useEffect(() => {
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await NotificationService.markAsRead(notification.id);
        fetchNotifications();
      } catch (error) {
        console.error('NotificationBell: markAsRead error:', error.message);
      }
    }

    // Close modal
    setModalVisible(false);

    // Navigate based on notification type
    if (!notification.type || !navigation) return;
    
    switch (notification.type) {
      case 'approval':
        navigation.navigate('ApprovalRequests');
        break;
      case 'risk':
        navigation.navigate('RiskAssessment');
        break;
      case 'task':
      case 'hazard': // Backward compatibility
        navigation.navigate('TaskHazard');
        break;
      default:
        break;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'approval':
        return 'checkmark-circle-outline';
      case 'risk':
        return 'warning-outline';
      case 'task':
        return 'shield-checkmark-outline';
      case 'payment':
        return 'card-outline';
      case 'system':
        return 'settings-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'approval':
        return '#f59e0b';
      case 'risk':
        return '#ef4444';
      case 'task':
        return '#22c55e';
      case 'payment':
        return '#3b82f6';
      case 'system':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationClick(item)}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <Ionicons
            name={getTypeIcon(item.type)}
            size={20}
            color={getTypeColor(item.type)}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        {!item.isRead && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => {
          setModalVisible(true);
          fetchNotifications();
        }}
      >
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            {loading && notifications.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchNotifications(true)}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>No unread notifications</Text>
                  </View>
                }
                contentContainerStyle={styles.listContent}
              />
            )}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                setModalVisible(false);
                if (navigation) {
                  navigation.navigate('Notifications');
                }
              }}
            >
              <Text style={styles.viewAllText}>View All Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellButton: {
    marginRight: 10,
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unreadNotification: {
    backgroundColor: '#f8fafc',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
  },
});

export default NotificationBell;

