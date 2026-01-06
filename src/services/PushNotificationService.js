import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { api } from '../lib/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationEvents, { NOTIFICATION_EVENTS } from '../utils/notificationEvents';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Notification handler called:', notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.navigation = null;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications() {
    try {
      // Check if we're in Expo Go (push notifications don't work in Expo Go)
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check if getExpoPushTokenAsync is available (not in Expo Go)
      if (!Notifications.getExpoPushTokenAsync) {
        console.log('Push notifications not available in Expo Go. Use development build for push notifications.');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '96f1f544-38c2-44c7-88a1-823dbbeeb79c', // From app.json extra.eas.projectId
      });

      this.expoPushToken = tokenData.data;
      
      // Store token locally
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);

      // Register token with backend
      await this.registerTokenWithBackend(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      // Silently handle - this is expected in Expo Go
      if (error.message && (error.message.includes('not available') || error.message.includes('Expo Go'))) {
        console.log('Push notifications not available in Expo Go. Use development build for push notifications.');
      } else {
        console.error('Error registering for push notifications:', error);
      }
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerTokenWithBackend(token) {
    try {
      const user = await AsyncStorage.getItem('user');
      if (!user) {
        console.warn('No user found, cannot register push token');
        return;
      }

      const userData = JSON.parse(user);
      const platform = Platform.OS;
      const deviceId = Device.modelName || Device.modelId || 'unknown';

      const response = await api.post('/api/notifications/register-device', {
        expoPushToken: token,
        platform: platform,
        deviceId: deviceId,
      });

      console.log('Push token registered with backend');
    } catch (error) {
      // Only log if it's not a 404 or auth error (might be expected in some cases)
      if (error.status !== 404 && error.code !== 'AUTH_EXPIRED') {
        console.error('Error registering token with backend:', error.message || error);
      }
    }
  }

  /**
   * Get stored Expo push token
   */
  async getStoredToken() {
    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      return token;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Handle notification navigation
   */
  handleNotificationNavigation(navigation, data) {
    if (!navigation || !data?.type) return;

    // Small delay to ensure navigation is ready
    setTimeout(() => {
      try {
        switch (data.type) {
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
            // Navigate to notifications screen
            navigation.navigate('Notifications');
            break;
        }
      } catch (error) {
        console.error('Error navigating from notification:', error);
      }
    }, 500);
  }

  /**
   * Check for notification that opened the app (when app was closed)
   */
  async checkInitialNotification(navigation) {
    try {
      // This method is not available in Expo Go, skip gracefully
      if (!Notifications.getLastNotificationResponseAsync) {
        return;
      }
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        console.log('App opened from notification:', response);
        const data = response.notification.request.content.data;
        this.handleNotificationNavigation(navigation, data);
      }
    } catch (error) {
      // Silently handle - this is expected in Expo Go
      if (error.message && error.message.includes('not available')) {
        console.log('Push notification methods not available in Expo Go');
      } else {
        console.error('Error checking initial notification:', error);
      }
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(navigation) {
    try {
      // Store navigation reference for use in alert callbacks
      this.navigation = navigation;
      
      // Check if app was opened from a notification (when app was closed)
      // This will fail gracefully in Expo Go
      this.checkInitialNotification(navigation);

      // Check if notification listeners are available (not in Expo Go)
      if (!Notifications.addNotificationReceivedListener) {
        console.log('Push notification listeners not available in Expo Go');
        return;
      }

      // Listener for notifications received while app is in foreground
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
        
        // Popup alerts removed - notifications will only show in bell icon and notification list
        // Trigger refresh of all notification components
        notificationEvents.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, notification);
        notificationEvents.emit(NOTIFICATION_EVENTS.REFRESH_NOTIFICATIONS);
      });

      // Listener for when user taps on a notification (works for foreground, background, and killed app)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
        
        const data = response.notification.request.content.data;
        this.handleNotificationNavigation(navigation, data);
      });
    } catch (error) {
      // Silently handle - this is expected in Expo Go
      if (error.message && error.message.includes('not available')) {
        console.log('Push notification listeners not available in Expo Go');
      } else {
        console.error('Error setting up notification listeners:', error);
      }
    }
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }
}

// Export singleton instance
export default new PushNotificationService();

