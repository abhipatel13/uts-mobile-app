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

const EditRiskAssessmentModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  isLoading = false,
  riskAssessment = null
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
      console.error('EditRiskAssessmentModal: fetchUsers failed:', error.message);
      if (!error.message?.includes('connect to the internet')) {
        console.error("Error loading users:", error.message);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Initialize form data when modal opens or riskAssessment changes
  useEffect(() => {
    if (visible && riskAssessment) {
      setFormData({
        date: riskAssessment.date || '',
        time: riskAssessment.time || '',
        scopeOfWork: riskAssessment.scopeOfWork || '',
        assetSystem: riskAssessment.assetSystem || '',
        assessmentTeam: (() => {
          // Handle both array and string formats
          if (Array.isArray(riskAssessment.assessmentTeam)) {
            return riskAssessment.assessmentTeam;
          } else if (Array.isArray(riskAssessment.individuals)) {
            return riskAssessment.individuals;
          } else if (typeof riskAssessment.individuals === 'string' && riskAssessment.individuals && riskAssessment.individuals.trim()) {
            return riskAssessment.individuals.split(',').map(email => email.trim()).filter(email => email);
          }
          return [];
        })(),
        lead: riskAssessment.lead || riskAssessment.supervisor || '',
        location: riskAssessment.location || '',
        status: riskAssessment.status || 'Pending',
        risks: riskAssessment.risks || []
      });
      setCurrentStep(1);
      setErrors({});
      
      // Fetch users when modal opens
      fetchUsers();
    } else if (!visible) {
      resetForm();
    }
  }, [visible, riskAssessment]);

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

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Basic Information validation
      if (!formData.scopeOfWork.trim()) {
        newErrors.scopeOfWork = 'Scope of Work is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
    } else if (step === 2) {
      // Team validation
      if (!formData.lead.trim()) {
        newErrors.lead = 'Lead assessor is required';
      }
      if (formData.assessmentTeam.length === 0) {
        newErrors.assessmentTeam = 'At least one team member is required';
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

  // iOS-friendly picker handlers
  const showLeadPicker = (leads) => {
    if (Platform.OS === 'ios' && leads.length > 0) {
      const options = ['Cancel', ...leads.map(user => `${user.name || 'No Name'} (${user.email})`)];
      const cancelButtonIndex = 0;
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Select Lead Assessor',
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            const selectedLead = leads[buttonIndex - 1];
            handleInputChange('lead', selectedLead.email);
          }
        }
      );
    }
  };

  const showStatusPicker = () => {
    if (Platform.OS === 'ios') {
      const options = ['Cancel', 'Pending', 'Active', 'Inactive', 'Completed', 'Rejected'];
      const cancelButtonIndex = 0;
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Select Status',
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            const selectedStatus = options[buttonIndex];
            handleInputChange('status', selectedStatus);
          }
        }
      );
    }
  };

  // Helper to get display text for selected values
  const getLeadDisplayText = (leads) => {
    if (!formData.lead) return 'Select lead assessor...';
    const lead = leads.find(user => user.email === formData.lead);
    return lead ? `${lead.name || 'No Name'} (${lead.email})` : 'Select lead assessor...';
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

    const riskAssessmentToUpdate = {
      id: riskAssessment.id,
      date: formData.date,
      time: formData.time,
      scopeOfWork: formData.scopeOfWork.trim(),
      assetSystem: formData.assetSystem.trim() || null,
      assessmentTeam: formData.assessmentTeam,
      individuals: formData.assessmentTeam, // Also store as individuals for compatibility
      lead: formData.lead.trim(),
      supervisor: formData.lead.trim(), // Map lead to supervisor for API
      location: formData.location.trim(),
      status: formData.status,
      risks: formData.risks
    };

    try {
      await onSubmit(riskAssessmentToUpdate);
      // Modal closing is handled by parent component
    } catch (error) {
      console.error('EditRiskAssessmentModal: handleSubmit failed:', error.message);
    }
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
    } else if (selectedUsers.length === 2) {
      return `${selectedUsers[0].name} and ${selectedUsers[1].name}`;
    } else if (selectedUsers.length > 2) {
      return `${selectedUsers[0].name} and ${selectedUsers.length - 1} others`;
    }
    
    return `${formData.assessmentTeam.length} team member${formData.assessmentTeam.length !== 1 ? 's' : ''}`;
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
    <ScrollView 
      style={styles.stepContent} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Date and Time - Read Only */}
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Date</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{formData.date}</Text>
          </View>
          <Text style={styles.helpText}>Original creation date (not editable)</Text>
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Time</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>{formData.time}</Text>
          </View>
          <Text style={styles.helpText}>Original creation time (not editable)</Text>
        </View>
      </View>

      {/* Scope of Work */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Scope of Work *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.scopeOfWork && styles.inputError]}
          value={formData.scopeOfWork}
          onChangeText={(value) => handleInputChange('scopeOfWork', value)}
          placeholder="Describe the scope of work for this risk assessment"
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
      <AssetSelector
        value={formData.assetSystem}
        onValueChange={(value) => handleInputChange('assetSystem', value)}
        error={errors.assetSystem}
        title="Asset or System being assessed"
        placeholder="Select asset or system"
      />
    </ScrollView>
  );

  const renderTeam = () => {
    // Filter leads (supervisor, admin, superuser roles)
    const leads = users.filter(user => 
      ['supervisor', 'admin', 'superuser'].includes(user.role)
    );

    return (
      <ScrollView 
        style={styles.stepContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Lead Assessor */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Lead Assessor *</Text>
          {isLoadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#374151" />
              <Text style={styles.loadingText}>Loading assessors...</Text>
            </View>
          ) : Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={styles.iosPickerButton}
              onPress={() => showLeadPicker(leads)}
            >
              <Text style={[
                styles.iosPickerText, 
                !formData.lead && styles.iosPickerPlaceholder
              ]}>
                {getLeadDisplayText(leads)}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.lead}
                onValueChange={(value) => handleInputChange('lead', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select lead assessor..." value="" />
                {leads.map((user) => (
                  <Picker.Item 
                    key={user.id} 
                    label={`${user.name || 'No Name'} (${user.email}) - ${user.role}`} 
                    value={user.email} 
                  />
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
  };

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

  const renderStatus = () => (
    <ScrollView 
      style={styles.stepContent} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Status */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Assessment Status</Text>
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
              selectedValue={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="Pending" />
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Inactive" value="Inactive" />
              <Picker.Item label="Completed" value="Completed" />
              <Picker.Item label="Rejected" value="Rejected" />
            </Picker>
          </View>
        )}
        {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
      </View>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderTeam();
      case 3:
        return renderRiskAssessment();
      case 4:
        return renderStatus();
      default:
        return renderBasicInformation();
    }
  };

  if (!riskAssessment) {
    return null;
  }

  return (
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
          <Text style={styles.title}>Edit Risk Assessment</Text>
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
                  <Text style={styles.submitButtonText}>Update Assessment</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
  scrollContentContainer: {
    paddingBottom: 20,
    flexGrow: 1,
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
  readOnlyInput: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6b7280',
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
  iosPickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  iosPickerText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  iosPickerPlaceholder: {
    color: '#9ca3af',
  },
  teamContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    minHeight: 50,
    justifyContent: 'center',
  },
  teamText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
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
    minWidth: 140,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
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
  placeholderText: {
    color: '#9ca3af',
  },
});

export default EditRiskAssessmentModal;
