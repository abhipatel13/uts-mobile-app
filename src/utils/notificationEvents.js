/**
 * Global notification event emitter (React Native compatible)
 * Used to notify all notification components when new notifications arrive
 */
class NotificationEventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return callback; // Return callback for removal
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in notification event listener for ${event}:`, error);
        }
      });
    }
  }

  removeListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      if (this.listeners[event].length === 0) {
        delete this.listeners[event];
      }
    }
  }

  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

const notificationEvents = new NotificationEventEmitter();

// Event names
export const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',
  REFRESH_NOTIFICATIONS: 'refresh-notifications',
};

export default notificationEvents;

