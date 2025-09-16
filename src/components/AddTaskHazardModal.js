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
import SimpleMapView from './SimpleMapView';

const AddTaskHazardModal = ({ 
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
    systemLockoutRequired: false,
    trainedWorkforce: false,
    supervisor: '',
    individual: '',
    location: '',
    status: 'Pending',
    geoFenceLimit: '200',
    risks: []
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [mapType, setMapType] = useState('standard');
  const [isMapLoading, setIsMapLoading] = useState(false);

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
      systemLockoutRequired: false,
      trainedWorkforce: false,
      supervisor: '',
      individual: '',
      location: '',
      status: 'Pending',
      geoFenceLimit: '200',
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

  // Map related functions
  const handleMapTypeChange = (type) => {
    setMapType(type);
  };

  const handleMarkerPress = (location) => {
    Alert.alert(
      'Location Details',
      `Location: ${location.name}\nStatus: ${formData.status}\nRisks: ${formData.risks.length}`,
      [{ text: 'OK' }]
    );
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 17) return '#991b1b'; // Critical - Dark red
    if (riskScore >= 10) return '#ef4444'; // High - Red
    if (riskScore >= 5) return '#f59e0b';  // Medium - Orange
    return '#22c55e'; // Low - Green
  };

  // Create location data based on form location
  const getLocationData = () => {
    if (!formData.location) return [];
    
    // Parse coordinates from location string or use default
    const defaultCoords = { latitude: 40.7128, longitude: -74.0060 }; // NYC default
    let coords = defaultCoords;
    
    // Try to parse if location contains coordinates
    const coordMatch = formData.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      coords = {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2])
      };
    }

    // Calculate average risk score from form risks
    const avgRiskScore = formData.risks.length > 0 
      ? formData.risks.reduce((sum, risk) => {
          const asIsScore = (parseInt(risk.asIsLikelihood) || 1) * (parseInt(risk.asIsConsequence) || 1);
          return sum + asIsScore;
        }, 0) / formData.risks.length
      : 1;

    return [{
      latitude: coords.latitude,
      longitude: coords.longitude,
      name: formData.location,
      count: formData.risks.length,
      riskScore: Math.round(avgRiskScore),
      status: formData.status
    }];
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
      if (!formData.individual.trim()) {
        newErrors.individual = 'At least one individual email is required';
      } else {
        // Validate individual emails (comma-separated)
        const emails = formData.individual.split(',').map(email => email.trim());
        const invalidEmails = emails.filter(email => !isValidEmail(email));
        if (invalidEmails.length > 0) {
          newErrors.individual = `Invalid email(s): ${invalidEmails.join(', ')}`;
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

    const taskHazardToCreate = {
      date: formData.date,
      time: formData.time,
      scopeOfWork: formData.scopeOfWork.trim(),
      assetSystem: formData.assetSystem.trim() || null,
      systemLockoutRequired: formData.systemLockoutRequired,
      trainedWorkforce: formData.trainedWorkforce,
      supervisor: formData.supervisor.trim(),
      individual: formData.individual.trim(),
      location: formData.location.trim(),
      status: formData.status,
      geoFenceLimit: parseInt(formData.geoFenceLimit) || 200,
      risks: formData.risks
    };

    try {
      await onSubmit(taskHazardToCreate);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create task hazard');
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
            {step === 1 ? 'Basic Info' : step === 2 ? 'Personnel' : step === 3 ? 'Risks' : 'Risk Status'}
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
          placeholder="Describe the work to be performed"
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
          placeholder="Work location or coordinates"
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

      {/* Geofence Limit */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Geofence Limit (meters)</Text>
        <TextInput
          style={styles.input}
          value={formData.geoFenceLimit}
          onChangeText={(value) => handleInputChange('geoFenceLimit', value)}
          placeholder="200"
          keyboardType="numeric"
        />
      </View>

      {/* Checkboxes */}
      <View style={styles.checkboxSection}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleInputChange('systemLockoutRequired', !formData.systemLockoutRequired)}
        >
          <View style={[styles.checkbox, formData.systemLockoutRequired && styles.checkboxChecked]}>
            {formData.systemLockoutRequired && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>System Lockout Required</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleInputChange('trainedWorkforce', !formData.trainedWorkforce)}
        >
          <View style={[styles.checkbox, formData.trainedWorkforce && styles.checkboxChecked]}>
            {formData.trainedWorkforce && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Trained Workforce</Text>
        </TouchableOpacity>
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
          style={[styles.input, styles.textArea, errors.individual && styles.inputError]}
          value={formData.individual}
          onChangeText={(value) => handleInputChange('individual', value)}
          placeholder="user1@company.com, user2@company.com"
          multiline
          numberOfLines={3}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>
          Enter multiple emails separated by commas
        </Text>
        {errors.individual && <Text style={styles.errorText}>{errors.individual}</Text>}
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
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Status */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Risk Status</Text>
        <Text style={styles.helpText}>
          Select the current status of this task hazard assessment
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.status}
            onValueChange={(value) => handleInputChange('status', value)}
            style={styles.picker}
          >
            <Picker.Item label="Pending" value="Pending" />
            <Picker.Item label="Active" value="Active" />
            <Picker.Item label="Inactive" value="Inactive" />
          </Picker>
        </View>
        {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
      </View>

      {/* Risk Location Map */}
      <View style={styles.mapSection}>
        <Text style={styles.label}>Risk Location Overview</Text>
        <Text style={styles.helpText}>
          Visual overview of the task hazard location and risk assessment
        </Text>
        <SimpleMapView
          locationData={getLocationData()}
          mapType={mapType}
          onMapTypeChange={handleMapTypeChange}
          onMarkerPress={handleMarkerPress}
          getRiskColor={getRiskColor}
          isLoading={isMapLoading}
        />
      </View>
    </ScrollView>
  );

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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Task Hazard Assessment</Text>
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
                  <Text style={styles.submitButtonText}>Create Task Hazard</Text>
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
  checkboxSection: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgb(52, 73, 94)',
    borderColor: 'rgb(52, 73, 94)',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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
  mapSection: {
    marginTop: 20,
  },
});

export default AddTaskHazardModal;
