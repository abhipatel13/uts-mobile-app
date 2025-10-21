import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SignatureModal = ({ 
  visible, 
  onClose, 
  onApprove, 
  onReject, 
  taskHazard, 
  isLoading = false 
}) => {
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const handleApprove = async () => {
    if (!signature.trim()) {
      Alert.alert('Signature Required', 'Please provide your signature before approving.');
      return;
    }

    setIsSigning(true);
    try {
      await onApprove(signature.trim());
      setSignature('');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve task hazard. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleReject = async () => {
    if (!signature.trim()) {
      Alert.alert('Signature Required', 'Please provide your signature before rejecting.');
      return;
    }

    setIsSigning(true);
    try {
      await onReject(signature.trim());
      setSignature('');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject task hazard. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleClose = () => {
    setSignature('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Task Hazard Approval</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {taskHazard && (
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{taskHazard.scopeOfWork || taskHazard.taskName}</Text>
              <Text style={styles.taskDetails}>
                Location: {taskHazard.location}
              </Text>
              <Text style={styles.taskDetails}>
                Date: {taskHazard.date}
              </Text>
              <Text style={styles.taskDetails}>
                Risk Level: {taskHazard.riskLevel || 'Not specified'}
              </Text>
            </View>
          )}

          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Digital Signature *</Text>
            <Text style={styles.signatureHint}>
              Type your full name to digitally sign this approval
            </Text>
            
            <View style={styles.signatureInput}>
              <TextInput
                style={styles.signatureText}
                value={signature}
                onChangeText={setSignature}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
              disabled={isSigning || isLoading}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={handleApprove}
              disabled={isSigning || isLoading}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  taskInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  taskDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  signatureSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  signatureHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  signatureInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  signatureText: {
    fontSize: 16,
    color: '#111827',
    minHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignatureModal;
