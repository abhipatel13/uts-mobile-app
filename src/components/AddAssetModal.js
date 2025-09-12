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

const AddAssetModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  assets = [],
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    cmmsInternalId: '',
    name: '',
    description: '',
    functionalLocation: '',
    functionalLocationDesc: '',
    functionalLocationLongDesc: '',
    parent: null,
    maintenancePlant: '',
    cmmsSystem: '',
    objectType: '',
    systemStatus: 'Active',
    make: '',
    manufacturer: '',
    serialNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [showParentPicker, setShowParentPicker] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      cmmsInternalId: '',
      name: '',
      description: '',
      functionalLocation: '',
      functionalLocationDesc: '',
      functionalLocationLongDesc: '',
      parent: null,
      maintenancePlant: '',
      cmmsSystem: '',
      objectType: '',
      systemStatus: 'Active',
      make: '',
      manufacturer: '',
      serialNumber: ''
    });
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

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.cmmsInternalId.trim()) {
      newErrors.cmmsInternalId = 'CMMS Internal ID is required';
    }
    if (!formData.functionalLocationDesc.trim()) {
      newErrors.functionalLocationDesc = 'Functional Location Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const assetToCreate = {
      assets: [{
        ...formData,
        parent: formData.parent === '' ? null : formData.parent,
        name: formData.name.trim(),
        description: formData.description.trim(),
        functionalLocation: formData.functionalLocation?.trim() || '',
        functionalLocationDesc: formData.functionalLocationDesc?.trim(),
        functionalLocationLongDesc: formData.functionalLocationLongDesc?.trim() || '',
        cmmsInternalId: formData.cmmsInternalId.trim(),
        maintenancePlant: formData.maintenancePlant?.trim() || '',
        cmmsSystem: formData.cmmsSystem?.trim() || '',
        objectType: formData.objectType?.trim() || '',
        systemStatus: formData.systemStatus || 'Active',
        make: formData.make?.trim() || '',
        manufacturer: formData.manufacturer?.trim() || '',
        serialNumber: formData.serialNumber?.trim() || ''
      }]
    };

    try {
      await onSubmit(assetToCreate);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create asset');
    }
  };

  const getParentAssetName = (parentId) => {
    if (!parentId) return 'None (Root Asset)';
    const parent = assets.find(asset => asset.id === parentId);
    return parent ? `${parent.name} (${parent.cmmsInternalId || parent.id})` : 'Unknown Asset';
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
          <Text style={styles.title}>Add New Asset</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Row 1 */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderFormField('Name', 'name', 'e.g., Main Pump', true)}
              </View>
              <View style={styles.halfWidth}>
                {renderFormField('Description', 'description', 'e.g., Primary water pump', true)}
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderFormField('Functional Location', 'functionalLocation', 'e.g., Main Pump')}
              </View>
              <View style={styles.halfWidth}>
                {renderFormField('Functional Location Description', 'functionalLocationDesc', 'e.g., Primary water pump', true)}
              </View>
            </View>

            {/* Row 3 */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderFormField('Maintenance Plant', 'maintenancePlant', 'e.g., Off-Site Support')}
              </View>
              <View style={styles.halfWidth}>
                {renderFormField('CMMS Internal ID', 'cmmsInternalId', 'e.g., IID001', true)}
              </View>
            </View>

            {/* Row 4 */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderFormField('CMMS System', 'cmmsSystem', 'e.g., Salt Lake City')}
              </View>
              <View style={styles.halfWidth}>
                {/* Parent Asset Selector */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Parent Asset</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowParentPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {getParentAssetName(formData.parent)}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Row 5 */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderFormField('Object Type', 'objectType', 'e.g., Equipment')}
              </View>
              <View style={styles.halfWidth}>
                {/* System Status */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>System Status</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.systemStatus}
                      onValueChange={(value) => handleInputChange('systemStatus', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Active" value="Active" />
                      <Picker.Item label="Inactive" value="Inactive" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            {/* Row 6 */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderFormField('Make', 'make', 'Make')}
              </View>
              <View style={styles.halfWidth}>
                {renderFormField('Manufacturer', 'manufacturer', 'Manufacturer')}
              </View>
            </View>

            {/* Row 7 */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderFormField('Serial Number', 'serialNumber', 'Serial Number')}
              </View>
              <View style={styles.halfWidth}>
                {/* Functional Location Long Description */}
                {renderFormField('Functional Location Long Description', 'functionalLocationLongDesc', 'Long description', false, true)}
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
              <Text style={styles.submitButtonText}>Add Asset</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Parent Asset Picker Modal */}
        <Modal
          visible={showParentPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowParentPicker(false)}
        >
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Parent Asset</Text>
                <TouchableOpacity onPress={() => setShowParentPicker(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList}>
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    handleInputChange('parent', null);
                    setShowParentPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, !formData.parent && styles.pickerItemSelected]}>
                    None (Root Asset)
                  </Text>
                </TouchableOpacity>
                {assets.map((asset) => (
                  <TouchableOpacity
                    key={asset.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      handleInputChange('parent', asset.id);
                      setShowParentPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, formData.parent === asset.id && styles.pickerItemSelected]}>
                      {asset.name} ({asset.cmmsInternalId || asset.id})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  required: {
    color: '#ef4444',
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
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
  // Parent Picker Modal Styles
  pickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemSelected: {
    color: 'rgb(52, 73, 94)',
    fontWeight: '600',
  },
});

export default AddAssetModal;
