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

const AddTacticModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    analysis_name: '',
    location: '',
    status: 'Active',
    assetDetails: {
      description: '',
      equipment: '',
      hazards: [],
      riskLevel: 'Low',
      mitigationSteps: []
    }
  });

  const [errors, setErrors] = useState({});
  const [assetDetailsText, setAssetDetailsText] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      analysis_name: '',
      location: '',
      status: 'Active',
      assetDetails: {
        description: '',
        equipment: '',
        hazards: [],
        riskLevel: 'Low',
        mitigationSteps: []
      }
    });
    setAssetDetailsText('');
    setErrors({});
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

  const handleAssetDetailsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      assetDetails: {
        ...prev.assetDetails,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.analysis_name.trim()) {
      newErrors.analysis_name = 'Analysis Name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.assetDetails.description.trim()) {
      newErrors.assetDescription = 'Asset Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    // Parse asset details text if provided
    let finalAssetDetails = { ...formData.assetDetails };
    if (assetDetailsText.trim()) {
      try {
        finalAssetDetails = JSON.parse(assetDetailsText);
      } catch (error) {
        // If JSON parsing fails, use the structured form data
        finalAssetDetails = formData.assetDetails;
      }
    }

    const tacticToCreate = {
      analysis_name: formData.analysis_name.trim(),
      location: formData.location.trim(),
      status: formData.status,
      assetDetails: finalAssetDetails
    };

    try {
      await onSubmit(tacticToCreate);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create tactic');
    }
  };

  const renderFormField = (label, field, placeholder, required = false, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input, 
          multiline && styles.textArea,
          errors[field] && styles.inputError
        ]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholderTextColor="#9ca3af"
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderAssetDetailsField = (label, field, placeholder, required = false, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input, 
          multiline && styles.textArea,
          errors[`asset${field.charAt(0).toUpperCase() + field.slice(1)}`] && styles.inputError
        ]}
        value={formData.assetDetails[field]}
        onChangeText={(value) => handleAssetDetailsChange(field, value)}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholderTextColor="#9ca3af"
      />
      {errors[`asset${field.charAt(0).toUpperCase() + field.slice(1)}`] && (
        <Text style={styles.errorText}>{errors[`asset${field.charAt(0).toUpperCase() + field.slice(1)}`]}</Text>
      )}
    </View>
  );

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
          <Text style={styles.title}>Add New Tactic</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Basic Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              {/* Row 1 */}
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {renderFormField('Analysis Name', 'analysis_name', 'e.g., Safety Analysis 001', true)}
                </View>
                <View style={styles.halfWidth}>
                  {renderFormField('Location', 'location', 'e.g., Building A - Floor 2', true)}
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {/* Status */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Status</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Active" value="Active" />
                        <Picker.Item label="Inactive" value="Inactive" />
                        <Picker.Item label="Pending" value="Pending" />
                      </Picker>
                    </View>
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  {/* Empty space for alignment */}
                </View>
              </View>
            </View>

            {/* Asset Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Asset Details</Text>
              
              {/* Row 3 */}
              <View style={styles.row}>
                <View style={styles.fullWidth}>
                  {renderAssetDetailsField('Description', 'description', 'Describe the asset or equipment being analyzed', true, true)}
                </View>
              </View>

              {/* Row 4 */}
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {renderAssetDetailsField('Equipment', 'equipment', 'e.g., Pump, Motor, Valve')}
                </View>
                <View style={styles.halfWidth}>
                  {/* Risk Level */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Risk Level</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.assetDetails.riskLevel}
                        onValueChange={(value) => handleAssetDetailsChange('riskLevel', value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Low" value="Low" />
                        <Picker.Item label="Medium" value="Medium" />
                        <Picker.Item label="High" value="High" />
                        <Picker.Item label="Critical" value="Critical" />
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>

              {/* Advanced Asset Details (JSON) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Advanced Asset Details (JSON) 
                  <Text style={styles.optional}> - Optional</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={assetDetailsText}
                  onChangeText={setAssetDetailsText}
                  placeholder='{"hazards": ["Chemical exposure", "Heat"], "mitigationSteps": ["Use PPE", "Regular maintenance"]}'
                  multiline={true}
                  numberOfLines={4}
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.helpText}>
                  Optional: Enter additional asset details as JSON. This will override the structured fields above.
                </Text>
              </View>
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
              <Text style={styles.submitButtonText}>Add Tactic</Text>
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
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
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
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#6b7280',
    fontWeight: '400',
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: 'rgb(52, 73, 94)',
    minWidth: 100,
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

export default AddTacticModal;
