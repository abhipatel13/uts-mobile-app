import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const EditUserModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  user,
  isLoading = false,
  currentUserRole = 'user' 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    phone: '',
    businessUnit: '',
    plant: ''
  });

  const [errors, setErrors] = useState({});

  // Available roles based on current user's role
  const getAvailableRoles = () => {
    switch (currentUserRole) {
      case 'universal_user':
        return ['universal_user', 'superuser'];
      case 'superuser':
        return ['superuser', 'admin', 'supervisor', 'user'];
      case 'admin':
        return ['admin', 'supervisor', 'user'];
      default:
        return ['user'];
    }
  };

  const availableRoles = getAvailableRoles();

  // Initialize form when user data changes
  useEffect(() => {
    if (user && visible) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        department: user.department || '',
        phone: user.phone || user.phone_no || '',
        businessUnit: user.business_unit || '',
        plant: user.plant || ''
      });
      setErrors({});
    }
  }, [user, visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setErrors({});
    }
  }, [visible]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone.trim() && !isValidPhone(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    const userToUpdate = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      department: formData.department.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      business_unit: formData.businessUnit.trim() || undefined,
      plant: formData.plant.trim() || undefined
    };

    try {
      await onSubmit(user.id, userToUpdate);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update user');
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'universal_user': return '#8b5cf6';
      case 'superuser': return '#3b82f6';
      case 'admin': return '#10b981';
      case 'supervisor': return '#f59e0b';
      case 'user': return '#64748b';
      default: return '#64748b';
    }
  };

  const getRoleDescription = (role) => {
    switch (role.toLowerCase()) {
      case 'universal_user': return 'Universal access across all companies';
      case 'superuser': return 'Full system access and user management';
      case 'admin': return 'Administrative access with user management';
      case 'supervisor': return 'Supervisory access with approval rights';
      case 'user': return 'Standard user access';
      default: return '';
    }
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Edit User</Text>
            <Text style={styles.subtitle}>{user.email}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {/* Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter full name"
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
          </View>

          {/* Role & Permissions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Role & Permissions</Text>
            
            {/* Role */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>User Role *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  style={styles.picker}
                >
                  {availableRoles.map((role) => (
                    <Picker.Item 
                      key={role} 
                      label={role.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')} 
                      value={role} 
                    />
                  ))}
                </Picker>
              </View>
              
              {/* Role Description */}
              <View style={styles.roleInfo}>
                <View style={[styles.roleIndicator, { backgroundColor: getRoleColor(formData.role) }]} />
                <Text style={styles.roleDescription}>{getRoleDescription(formData.role)}</Text>
              </View>
              
              {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
            </View>
          </View>

          {/* Organization */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organization</Text>
            
            {/* Department */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                value={formData.department}
                onChangeText={(value) => handleInputChange('department', value)}
                placeholder="Enter department"
                autoCapitalize="words"
              />
            </View>

            {/* Business Unit */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Business Unit</Text>
              <TextInput
                style={styles.input}
                value={formData.businessUnit}
                onChangeText={(value) => handleInputChange('businessUnit', value)}
                placeholder="Enter business unit"
                autoCapitalize="words"
              />
            </View>

            {/* Plant */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Plant</Text>
              <TextInput
                style={styles.input}
                value={formData.plant}
                onChangeText={(value) => handleInputChange('plant', value)}
                placeholder="Enter plant location"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User ID:</Text>
                <Text style={styles.infoValue}>{user.id}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Updated:</Text>
                <Text style={styles.infoValue}>
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              
              {user.company && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Company:</Text>
                  <Text style={styles.infoValue}>{user.company.name}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.submitButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  roleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  roleDescription: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgb(52, 73, 94)',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditUserModal;
