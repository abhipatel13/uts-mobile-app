import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Import react-native-maps with error handling
let MapView, Marker, PROVIDER_GOOGLE;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (error) {
}

const { width, height } = Dimensions.get('window');

const LocationSelector = ({
  value,
  onChange,
  error,
  label = "Location",
  placeholder = "Enter location or click on map",
  required = false,
  showMapByDefault = false,
  style
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(showMapByDefault);
  const [selectedMapLocation, setSelectedMapLocation] = useState({ 
    latitude: 40.760780, 
    longitude: -111.891045 
  }); // Default to Salt Lake City, Utah
  const [mapReady, setMapReady] = useState(false);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get your current location. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      onChange(coords);
      
      // Update map location
      setSelectedMapLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

    } catch (error) {
      console.error('LocationSelector: getCurrentLocation failed:', error.message);
      Alert.alert(
        'Error',
        'Failed to get your current location. Please try again or enter manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle map press to set location
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = { latitude, longitude };
    setSelectedMapLocation(newLocation);
    
    // Update the location field with coordinates
    const coords = `${latitude}, ${longitude}`;
    onChange(coords);
  };

  // Update map location when location value changes (for manual entry or GPS)
  useEffect(() => {
    if (value && typeof value === 'string') {
      const [lat, lng] = value.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedMapLocation({ latitude: lat, longitude: lng });
      }
    }
  }, [value]);

  const renderMapModal = () => (
    <Modal
      visible={showMap}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMap(false)}
    >
      <View style={styles.mapModalContainer}>
        <View style={styles.mapModalHeader}>
          <Text style={styles.mapModalTitle}>Select Location on Map</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowMap(false)}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mapContainer}>
          {Platform.OS !== 'web' && MapView ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: selectedMapLocation.latitude,
                longitude: selectedMapLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={handleMapPress}
              onMapReady={() => setMapReady(true)}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={false}
              showsScale={false}
              toolbarEnabled={false}
            >
              <Marker
                coordinate={selectedMapLocation}
                title="Selected Location"
                description={`${selectedMapLocation.latitude.toFixed(6)}, ${selectedMapLocation.longitude.toFixed(6)}`}
              />
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={48} color="#94a3b8" />
              <Text style={styles.mapFallbackText}>Map not available</Text>
              <Text style={styles.mapFallbackSubtext}>
                Please use GPS or enter coordinates manually
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.mapModalFooter}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => setShowMap(false)}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError
          ]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.gpsButton]}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="locate" size={16} color="#fff" />
            )}
            <Text style={styles.buttonText}>GPS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => setShowMap(true)}
          >
            <Ionicons name="map" size={16} color="#374151" />
            <Text style={[styles.buttonText, styles.mapButtonText]}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {renderMapModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
  },
  gpsButton: {
    backgroundColor: '#ef4444',
  },
  mapButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#fff',
  },
  mapButtonText: {
    color: '#374151',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  mapFallbackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 8,
  },
  mapFallbackSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  mapModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationSelector;
