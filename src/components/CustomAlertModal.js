import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomAlertModal = ({
  visible,
  onClose,
  title,
  message,
  buttons = [],
  type = 'info', // 'info', 'success', 'warning', 'error'
  showCloseButton = true,
}) => {
  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return 'rgb(52, 73, 94)';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return 'rgb(52, 73, 94)';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={getIconName()} 
                size={32} 
                color={getIconColor()} 
              />
            </View>
            {showCloseButton && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: getTitleColor() }]}>
              {title}
            </Text>
            <Text style={styles.message}>
              {message}
            </Text>
          </View>

          {/* Buttons */}
          {buttons.length > 0 && (
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.primary && styles.primaryButton,
                    buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => {
                    if (button.onPress) {
                      button.onPress();
                    }
                    if (button.autoClose !== false) {
                      onClose();
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                      button.primary && styles.primaryButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  singleButton: {
    maxWidth: 160,
    alignSelf: 'center',
  },
  primaryButton: {
    backgroundColor: 'rgb(52, 73, 94)',
    borderColor: 'rgb(52, 73, 94)',
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  destructiveButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButtonText: {
    color: '#fff',
  },
  cancelButtonText: {
    color: '#6b7280',
  },
  destructiveButtonText: {
    color: '#dc2626',
  },
});

export default CustomAlertModal;
