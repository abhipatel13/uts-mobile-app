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
import TaskRisksComponent from './TaskRisksComponent';

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
    supervisor: '',
    individuals: '',
    location: '',
    status: 'Pending',
    risks: []
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      date: '',
      time: '',
      scopeOfWork: '',
      assetSystem: '',
      supervisor: '',
      individuals: '',
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
      if (!formData.date) {
        newErrors.date = 'Date is required';
      }
      if (!formData.time) {
        newErrors.time = 'Time is required';
      }
      if (!formData.scopeOfWork.trim()) {
        newErrors.scopeOfWork = 'Scope of Work is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
    } else if (step === 2) {
      // Personnel validation
      if (!formData.supervisor.trim()) {
        newErrors.supervisor = 'Supervisor email is required';
      } else if (!isValidEmail(formData.supervisor.trim())) {
        newErrors.supervisor = 'Please enter a valid supervisor email';
      }
      if (!formData.individuals.trim()) {
        newErrors.individuals = 'At least one individual email is required';
      } else {
        // Validate individual emails (comma-separated)
        const emails = formData.individuals.split(',').map(email => email.trim());
        const invalidEmails = emails.filter(email => !isValidEmail(email));
        if (invalidEmails.length > 0) {
          newErrors.individuals = `Invalid email(s): ${invalidEmails.join(', ')}`;
        }
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
      assetSystem: formData.assetSystem.trim() || null,
      supervisor: formData.supervisor.trim(),
      individuals: formData.individuals.trim(),
      location: formData.location.trim(),
      status: formData.status,
      risks: formData.risks
    };

    try {
      await onSubmit(riskAssessmentToCreate);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create risk assessment');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
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
            {step === 1 ? 'Basic Info' : step === 2 ? 'Personnel' : 'Risks'}
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
            placeholder="HH:MM"
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
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={[styles.input, errors.location && styles.inputError]}
          value={formData.location}
          onChangeText={(value) => handleInputChange('location', value)}
          placeholder="Assessment location or coordinates"
        />
        {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      </View>

      {/* Asset System */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Asset System</Text>
        <TextInput
          style={styles.input}
          value={formData.assetSystem}
          onChangeText={(value) => handleInputChange('assetSystem', value)}
          placeholder="Related asset or system ID"
        />
      </View>
    </ScrollView>
  );

  const renderPersonnel = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Supervisor */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Supervisor Email *</Text>
        <TextInput
          style={[styles.input, errors.supervisor && styles.inputError]}
          value={formData.supervisor}
          onChangeText={(value) => handleInputChange('supervisor', value)}
          placeholder="supervisor@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.supervisor && <Text style={styles.errorText}>{errors.supervisor}</Text>}
      </View>

      {/* Individuals */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Individual Emails *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.individuals && styles.inputError]}
          value={formData.individuals}
          onChangeText={(value) => handleInputChange('individuals', value)}
          placeholder="user1@company.com, user2@company.com"
          multiline
          numberOfLines={3}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>
          Enter multiple emails separated by commas
        </Text>
        {errors.individuals && <Text style={styles.errorText}>{errors.individuals}</Text>}
      </View>

      {/* Status */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Status</Text>
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
          </Picker>
        </View>
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderPersonnel();
      case 3:
        return renderRiskAssessment();
      default:
        return renderBasicInformation();
    }
  };

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
});

export default AddRiskAssessmentModal;
