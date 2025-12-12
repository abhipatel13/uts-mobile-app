import { api } from '../lib/api-client';

export const NotificationService = {
  // Get user's notifications
  getMyNotifications: async () => {
    try {
      const response = await api.get('/api/notifications/my-notifications');
      // Handle both ApiResponse format and direct data format
      return response?.data || response || [];
    } catch (error) {
      console.error('NotificationService.getMyNotifications error:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/mark-read`);
      return true;
    } catch (error) {
      console.error('NotificationService.markAsRead error:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const notifications = await NotificationService.getMyNotifications();
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          NotificationService.markAsRead(notification.id)
        )
      );
      return true;
    } catch (error) {
      console.error('NotificationService.markAllAsRead error:', error);
      throw error;
    }
  },
};

