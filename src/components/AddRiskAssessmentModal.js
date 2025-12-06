import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import TaskRisksComponent from './TaskRisksComponent';
import AssetSelector from './AssetSelector';
import LocationSelector from './LocationSelector';
import { UserService } from '../services/UserService';

const AddRiskAssessmentModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    scopeOfWork: '',
    assetSystem: '',
    assessmentTeam: [],
    lead: '',
    location: '',
    status: 'Pending',
    risks: []
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);


  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await UserService.getAll();
      if (response && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('AddRiskAssessmentModal: fetchUsers failed:', error.message);
      // Check if it's an authentication error
      if (error.code === 'AUTH_EXPIRED' || error.message?.includes('Authentication expired')) {
        // Don't show alert for auth errors - global logout will handle navigation
      } else if (!error.message?.includes('connect to the internet')) {
        console.error("Error loading users:", error.message);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      resetForm();
    } else {
      // Set default date and time when modal opens
      const now = new Date();
      const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const timeString = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
      
      setFormData(prev => ({
        ...prev,
        date: dateString,
        time: timeString
      }));
      
      // Fetch users when modal opens
      fetchUsers();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      date: '',
      time: '',
      scopeOfWork: '',
      assetSystem: '',
      assessmentTeam: [],
      lead: '',
      location: '',
      status: 'Pending',
      risks: []
    });
    setErrors({});
    setCurrentStep(1);
  };

  // Format time input to HH:MM format
  const formatTimeInput = useCallback((value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Limit to 4 digits (HHMM)
    const limited = numbers.slice(0, 4);
    
    // Format as HH:MM
    if (limited.length === 0) {
      return '';
    } else if (limited.length <= 2) {
      return limited;
    } else {
      return `${limited.slice(0, 2)}:${limited.slice(2, 4)}`;
    }
  }, []);

  // Validate time format and values
  const isValidTime = useCallback((timeString) => {
    if (!timeString || timeString.trim() === '') {
      return false;
    }
    
    // Check format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(timeString)) {
      return false;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Validate hours (0-23) and minutes (0-59)
    if (hours < 0 || hours > 23) {
      return false;
    }
    if (minutes < 0 || minutes > 59) {
      return false;
    }
    
    return true;
  }, []);

  const handleInputChange = useCallback((field, value) => {
    // Format time input automatically
    if (field === 'time') {
      value = formatTimeInput(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        return {
          ...prev,
          [field]: null
        };
      }
      return prev;
    });
  }, [formatTimeInput]);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Basic Information validation
      if (!formData.date) {
        newErrors.date = 'Date is required';
      }
      if (!formData.time) {
        newErrors.time = 'Time is required';
      } else if (!isValidTime(formData.time)) {
        newErrors.time = 'Please enter a valid time (HH:MM format, hours 0-23, minutes 0-59)';
      }
      if (!formData.scopeOfWork.trim()) {
        newErrors.scopeOfWork = 'Scope of Work is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
      if (!formData.assetSystem.trim()) {
        newErrors.assetSystem = 'Asset system is required';
      }
    } else if (step === 2) {
      // Personnel validation
      if (!formData.lead.trim()) {
        newErrors.lead = 'Assessment Lead is required';
      }
      if (formData.assessmentTeam.length === 0) {
        newErrors.assessmentTeam = 'Assessment Team is required';
      }
    } else if (step === 3) {
      // Risk Assessment validation
      if (formData.risks.length === 0) {
        newErrors.risks = 'At least one risk must be added';
      } else {
        // Validate each risk
        const riskErrors = [];
        formData.risks.forEach((risk, index) => {
          if (!risk.riskDescription.trim()) {
            riskErrors.push(`Risk ${index + 1}: Description is required`);
          }
          if (!risk.mitigatingAction.trim()) {
            riskErrors.push(`Risk ${index + 1}: Mitigating action is required`);
          }
        });
        if (riskErrors.length > 0) {
          newErrors.risks = riskErrors.join('\n');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      Alert.alert('Validation Error', 'Please fix the errors before continuing.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting.');
      return;
    }

    const riskAssessmentToCreate = {
      date: formData.date,
      time: formData.time,
      scopeOfWork: formData.scopeOfWork.trim(),
      assetSystem: formData.assetSystem.trim(),
      supervisor: formData.lead.trim(),
      individuals: formData.assessmentTeam, // Keep as array
      assessmentTeam: formData.assessmentTeam, // Also store as assessmentTeam
      location: formData.location.trim(),
      status: formData.status,
      risks: formData.risks
    };

    try {
      await onSubmit(riskAssessmentToCreate);
      onClose();
    } catch (error) {
      console.error('AddRiskAssessmentModal: handleSubmit failed:', error.message);
      // Check if it's an authentication error
      if (error.code === 'AUTH_EXPIRED' || error.message?.includes('Authentication expired')) {
        // Don't show alert for auth errors - global logout will handle navigation
        onClose(); // Close modal since user will be logged out
      } else {
        Alert.alert('Error', error.message || 'Failed to create risk assessment');
      }
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View style={[
            styles.stepCircle, 
            currentStep >= step && styles.stepCircleActive,
            currentStep === step && styles.stepCircleCurrent
          ]}>
            <Text style={[
              styles.stepNumber, 
              currentStep >= step && styles.stepNumberActive
            ]}>
              {step}
            </Text>
          </View>
          <Text style={[styles.stepLabel, currentStep === step && styles.stepLabelActive]}>
            {step === 1 ? 'Basic Info' : step === 2 ? 'Team' : step === 3 ? 'Risks' : 'Status'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBasicInformation = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Date and Time */}
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            value={formData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            placeholder="YYYY-MM-DD"
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Time *</Text>
          <TextInput
            style={[styles.input, errors.time && styles.inputError]}
            value={formData.time}
            onChangeText={(value) => handleInputChange('time', value)}
            onBlur={() => {
              // Validate time when field loses focus
              if (formData.time && !isValidTime(formData.time)) {
                setErrors(prev => ({
                  ...prev,
                  time: 'Please enter a valid time (HH:MM format, hours 0-23, minutes 0-59)'
                }));
              }
            }}
            placeholder="HH:MM"
            keyboardType="numeric"
            maxLength={5}
          />
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
        </View>
      </View>

      {/* Scope of Work */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Scope of Work *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.scopeOfWork && styles.inputError]}
          value={formData.scopeOfWork}
          onChangeText={(value) => handleInputChange('scopeOfWork', value)}
          placeholder="Describe the work to be assessed"
          multiline
          numberOfLines={3}
        />
        {errors.scopeOfWork && <Text style={styles.errorText}>{errors.scopeOfWork}</Text>}
      </View>

      {/* Location */}
      <LocationSelector
        value={formData.location}
        onChange={(value) => handleInputChange('location', value)}
        error={errors.location}
        label="Location"
        placeholder="Assessment location or coordinates"
        required={true}
      />

      {/* Asset System */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Asset</Text>
        <Text style={styles.helpText}>
          Select or search for the asset related to this risk assessment
        </Text>
        <AssetSelector
          value={formData.assetSystem}
          onValueChange={(assetId) => handleInputChange('assetSystem', assetId)}
          error={errors.assetSystem}
          placeholder="Search and select asset..."
        />
      </View>
    </ScrollView>
  );

  const renderPersonnel = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Assessment Lead */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Assessment Lead *</Text>
        <Text style={styles.helpText}>
          Select the person responsible for leading this risk assessment
        </Text>
        {Platform.OS === 'ios' ? (
          <TouchableOpacity
            style={[styles.iosPickerButton, errors.lead && styles.inputError]}
            onPress={() => showUserPicker('lead')}
          >
            <Text style={[styles.iosPickerText, !formData.lead && styles.placeholderText]}>
              {formData.lead || 'Select Assessment Lead'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.pickerContainer, errors.lead && styles.inputError]}>
            <Picker
              selectedValue={formData.lead || ""}
              onValueChange={(value) => handleInputChange('lead', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Assessment Lead" value="" />
              {users.map((user) => (
                <Picker.Item key={user.id} label={`${user.name} (${user.email})`} value={user.email} />
              ))}
            </Picker>
          </View>
        )}
        {errors.lead && <Text style={styles.errorText}>{errors.lead}</Text>}
      </View>

      {/* Assessment Team */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Assessment Team *</Text>
        <Text style={styles.helpText}>
          Select multiple team members for this risk assessment
        </Text>
        {Platform.OS === 'ios' ? (
          <TouchableOpacity
            style={[styles.iosPickerButton, errors.assessmentTeam && styles.inputError]}
            onPress={() => showTeamPicker()}
          >
            <Text style={[styles.iosPickerText, formData.assessmentTeam.length === 0 && styles.placeholderText]}>
              {getTeamDisplayText()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.iosPickerButton, errors.assessmentTeam && styles.inputError]}
            onPress={() => showTeamPicker()}
          >
            <Text style={[styles.iosPickerText, formData.assessmentTeam.length === 0 && styles.placeholderText]}>
              {getTeamDisplayText()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
        {errors.assessmentTeam && <Text style={styles.errorText}>{errors.assessmentTeam}</Text>}
      </View>
    </ScrollView>
  );

  const renderRiskAssessment = () => (
    <View style={styles.stepContent}>
      <TaskRisksComponent
        risks={formData.risks}
        onRisksChange={(risks) => handleInputChange('risks', risks)}
      />
      {errors.risks && (
        <Text style={[styles.errorText, styles.riskErrorText]}>{errors.risks}</Text>
      )}
    </View>
  );

  const renderRiskStatus = () => (
    <ScrollView 
      style={styles.stepContent} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Status */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Risk Status</Text>
        <Text style={styles.helpText}>
          Select the current status of this risk assessment
        </Text>
        {Platform.OS === 'ios' ? (
          <TouchableOpacity
            style={styles.iosPickerButton}
            onPress={showStatusPicker}
          >
            <Text style={styles.iosPickerText}>
              {formData.status}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status || "Pending"}
              onValueChange={(value) => handleInputChange('status', value)}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="Pending" />
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Inactive" value="Inactive" />
            </Picker>
          </View>
        )}
        {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
      </View>

    </ScrollView>
  );

  // Helper functions
  const showUserPicker = (field) => {
    const userOptions = ['Cancel', ...users.map(user => `${user.name} (${user.email})`)];
    const cancelButtonIndex = 0;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: userOptions,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex !== cancelButtonIndex) {
          const selectedUser = users[buttonIndex - 1];
          handleInputChange(field, selectedUser.email);
        }
      }
    );
  };

  // Show team picker for multiple selection
  const showTeamPicker = () => {
    if (users.length === 0) {
      Alert.alert('No Users', 'No users available for selection.');
      return;
    }

    // Create a simple alert with options to select/deselect users
    const currentTeam = formData.assessmentTeam;
    const userOptions = users.map(user => {
      const isSelected = currentTeam.includes(user.email);
      return `${isSelected ? '✓' : '○'} ${user.name} (${user.email})`;
    });
    
    const options = ['Done', ...userOptions];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          title: 'Select Assessment Team Members',
          message: 'Tap to toggle selection',
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const selectedUser = users[buttonIndex - 1];
            toggleTeamMember(selectedUser.email);
            // Show the picker again for multiple selections
            setTimeout(() => showTeamPicker(), 100);
          }
        }
      );
    } else {
      // For Android, show a simple alert with the current selection
      Alert.alert(
        'Select Assessment Team',
        'Current selection: ' + getTeamDisplayText(),
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Modify Selection', onPress: () => showAndroidTeamSelector() }
        ]
      );
    }
  };

  // Android team selector (simplified)
  const showAndroidTeamSelector = () => {
    const currentTeam = formData.assessmentTeam;
    const userButtons = users.map((user, index) => {
      const isSelected = currentTeam.includes(user.email);
      return {
        text: `${isSelected ? '✓' : '○'} ${user.name}`,
        onPress: () => {
          toggleTeamMember(user.email);
          setTimeout(() => showAndroidTeamSelector(), 100);
        }
      };
    });

    Alert.alert(
      'Select Team Members',
      'Tap to toggle selection',
      [
        ...userButtons,
        { text: 'Done', style: 'default' }
      ]
    );
  };

  // Toggle team member selection
  const toggleTeamMember = (userEmail) => {
    const currentTeam = formData.assessmentTeam;
    const isSelected = currentTeam.includes(userEmail);
    
    let newTeam;
    if (isSelected) {
      // Remove user from team
      newTeam = currentTeam.filter(email => email !== userEmail);
    } else {
      // Add user to team
      newTeam = [...currentTeam, userEmail];
    }
    
    handleInputChange('assessmentTeam', newTeam);
  };

  // Get display text for selected team members
  const getTeamDisplayText = () => {
    if (formData.assessmentTeam.length === 0) {
      return 'Select Assessment Team';
    }
    
    const selectedUsers = users.filter(user => 
      formData.assessmentTeam.includes(user.email)
    );
    
    if (selectedUsers.length === 1) {
      return `${selectedUsers[0].name}`;
    } else if (selectedUsers.length <= 2) {
      return selectedUsers.map(user => user.name).join(', ');
    } else {
      return `${selectedUsers[0].name} +${selectedUsers.length - 1} others`;
    }
  };

  const showStatusPicker = () => {
    const options = ['Cancel', 'Pending', 'Active', 'Inactive'];
    const cancelButtonIndex = 0;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex !== cancelButtonIndex) {
          const selectedStatus = options[buttonIndex];
          handleInputChange('status', selectedStatus);
        }
      }
    );
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderPersonnel();
      case 3:
        return renderRiskAssessment();
      case 4:
        return renderRiskStatus();
      default:
        return renderBasicInformation();
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Risk Assessment</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {renderStepContent()}

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={prevStep}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < totalSteps ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={nextStep}
                disabled={isLoading}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Risk Assessment</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    </>
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
  closeButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: 'rgb(52, 73, 94)',
  },
  stepCircleCurrent: {
    backgroundColor: 'rgb(52, 73, 94)',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: 'rgb(52, 73, 94)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: 'rgb(52, 73, 94)',
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
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
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  riskErrorText: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  helpText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: 'rgb(52, 73, 94)',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: 'rgb(52, 73, 94)',
    minWidth: 160,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  iosPickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iosPickerText: {
    fontSize: 16,
    color: '#374151',
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  placeholderText: {
    color: '#9ca3af',
  },
});

export default AddRiskAssessmentModal;
