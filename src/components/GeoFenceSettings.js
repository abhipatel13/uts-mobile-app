import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const GeoFenceSettings = ({ 
  visible, 
  onClose, 
  value, 
  onValueChange,
  title = 'Geo Fence Settings'
}) => {
  const [sliderValue, setSliderValue] = useState(value || 200);
  const [manualValue, setManualValue] = useState((value || 200).toString());
  const [tempValue, setTempValue] = useState(value || 200);

  // Update internal state when prop value changes
  useEffect(() => {
    if (value !== undefined) {
      setSliderValue(value);
      setManualValue(value.toString());
      setTempValue(value);
    }
  }, [value]);

  // Handle slider change
  const handleSliderChange = (newValue) => {
    const roundedValue = Math.round(newValue);
    setSliderValue(roundedValue);
    setManualValue(roundedValue.toString());
    setTempValue(roundedValue);
  };

  // Handle manual input change
  const handleManualChange = (text) => {
    setManualValue(text);
    
    // Parse the number and update slider if valid
    const numValue = parseInt(text);
    if (!isNaN(numValue) && numValue >= 50 && numValue <= 1000) {
      setSliderValue(numValue);
      setTempValue(numValue);
    }
  };

  // Handle manual input blur (when user finishes typing)
  const handleManualBlur = () => {
    const numValue = parseInt(manualValue);
    if (isNaN(numValue) || numValue < 50) {
      // Reset to minimum value
      setManualValue('50');
      setSliderValue(50);
      setTempValue(50);
    } else if (numValue > 1000) {
      // Reset to maximum value
      setManualValue('1000');
      setSliderValue(1000);
      setTempValue(1000);
    } else {
      // Ensure slider is in sync
      setSliderValue(numValue);
      setTempValue(numValue);
    }
  };

  // Handle save
  const handleSave = () => {
    onValueChange(tempValue);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset to original value
    setSliderValue(value || 200);
    setManualValue((value || 200).toString());
    setTempValue(value || 200);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Current Setting Display */}
          <View style={styles.currentSettingContainer}>
            <TouchableOpacity style={styles.currentSetting}>
              <Text style={styles.currentSettingLabel}>Configure Geo Fence Limit</Text>
              <Text style={styles.currentSettingValue}>Current: {tempValue} Feet</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Panel */}
          <View style={styles.settingsPanel}>
            {/* Slider Section */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>Geo Fence Limit: {tempValue} feet</Text>
              
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={50}
                  maximumValue={1000}
                  value={sliderValue}
                  onValueChange={handleSliderChange}
                  minimumTrackTintColor="#3b82f6"
                  maximumTrackTintColor="#d1d5db"
                  thumbTintColor="#3b82f6"
                  step={10}
                />
              </View>

              {/* Slider Range Labels */}
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>50</Text>
                <Text style={styles.rangeLabel}>1000</Text>
              </View>
            </View>

            {/* Manual Entry Section */}
            <View style={styles.manualSection}>
              <Text style={styles.manualLabel}>Manual Entry:</Text>
              <View style={styles.manualInputContainer}>
                <TextInput
                  style={styles.manualInput}
                  value={manualValue}
                  onChangeText={handleManualChange}
                  onBlur={handleManualBlur}
                  keyboardType="numeric"
                  placeholder="200"
                />
                <Text style={styles.unitLabel}>feet</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
    padding: 16,
  },
  currentSettingContainer: {
    marginBottom: 20,
  },
  currentSetting: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentSettingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  currentSettingValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsPanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  sliderContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  manualSection: {
    marginBottom: 32,
  },
  manualLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
    width: 100,
    textAlign: 'center',
    marginRight: 12,
  },
  unitLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GeoFenceSettings;
