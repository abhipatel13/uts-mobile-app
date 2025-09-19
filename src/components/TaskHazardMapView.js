import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Conditionally import react-native-maps only for mobile platforms
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (error) {
    console.log('react-native-maps not available');
  }
}

const { width, height } = Dimensions.get('window');

const TaskHazardMapView = ({
  taskHazards = [],
  onMarkerPress,
  getRiskColor,
  getStatusColor,
  isLoading = false
}) => {
  const [mapType, setMapType] = useState('standard');
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Process task hazards to create location data
  const processLocationData = () => {
    const locationMap = new Map();
    
    taskHazards.forEach(hazard => {
      if (!hazard.location) return;
      
      // Create a unique key for each location
      const locationKey = hazard.location.toLowerCase().trim();
      
      if (locationMap.has(locationKey)) {
        // Add to existing location
        const existing = locationMap.get(locationKey);
        existing.hazards.push(hazard);
        existing.count++;
        // Update highest risk score
        const hazardRisk = calculateHighestRiskScore(hazard.risks);
        if (hazardRisk > existing.highestRisk) {
          existing.highestRisk = hazardRisk;
        }
      } else {
        // Create new location entry
        locationMap.set(locationKey, {
          location: hazard.location,
          latitude: parseLocationCoordinates(hazard.location).latitude,
          longitude: parseLocationCoordinates(hazard.location).longitude,
          count: 1,
          hazards: [hazard],
          highestRisk: calculateHighestRiskScore(hazard.risks)
        });
      }
    });
    
    return Array.from(locationMap.values());
  };

  const calculateHighestRiskScore = (risks) => {
    if (!risks || !Array.isArray(risks) || risks.length === 0) return 1;
    
    return Math.max(...risks.map(risk => {
      const likelihood = parseInt(risk.asIsLikelihood) || 1;
      const consequence = parseInt(risk.asIsConsequence) || 1;
      return likelihood * consequence;
    }));
  };

  const parseLocationCoordinates = (location) => {
    // Try to parse coordinates from location string
    const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2])
      };
    }
    
    // Enhanced location defaults with more cities and better coordinates
    const locationDefaults = {
      'new york': { latitude: 40.7128, longitude: -74.0060 },
      'los angeles': { latitude: 34.0522, longitude: -118.2437 },
      'chicago': { latitude: 41.8781, longitude: -87.6298 },
      'houston': { latitude: 29.7604, longitude: -95.3698 },
      'phoenix': { latitude: 33.4484, longitude: -112.0740 },
      'philadelphia': { latitude: 39.9526, longitude: -75.1652 },
      'san antonio': { latitude: 29.4241, longitude: -98.4936 },
      'san diego': { latitude: 32.7157, longitude: -117.1611 },
      'dallas': { latitude: 32.7767, longitude: -96.7970 },
      'san jose': { latitude: 37.3382, longitude: -121.8863 },
      'austin': { latitude: 30.2672, longitude: -97.7431 },
      'jacksonville': { latitude: 30.3322, longitude: -81.6557 },
      'san francisco': { latitude: 37.7749, longitude: -122.4194 },
      'columbus': { latitude: 39.9612, longitude: -82.9988 },
      'fort worth': { latitude: 32.7555, longitude: -97.3308 },
      'charlotte': { latitude: 35.2271, longitude: -80.8431 },
      'seattle': { latitude: 47.6062, longitude: -122.3321 },
      'denver': { latitude: 39.7392, longitude: -104.9903 },
      'washington': { latitude: 38.9072, longitude: -77.0369 },
      'boston': { latitude: 42.3601, longitude: -71.0589 },
      'el paso': { latitude: 31.7619, longitude: -106.4850 },
      'detroit': { latitude: 42.3314, longitude: -83.0458 },
      'nashville': { latitude: 36.1627, longitude: -86.7816 },
      'memphis': { latitude: 35.1495, longitude: -90.0490 },
      'portland': { latitude: 45.5152, longitude: -122.6784 },
      'oklahoma city': { latitude: 35.4676, longitude: -97.5164 },
      'las vegas': { latitude: 36.1699, longitude: -115.1398 },
      'louisville': { latitude: 38.2527, longitude: -85.7585 },
      'baltimore': { latitude: 39.2904, longitude: -76.6122 },
      'milwaukee': { latitude: 43.0389, longitude: -87.9065 },
      'albuquerque': { latitude: 35.0844, longitude: -106.6504 },
      'tucson': { latitude: 32.2226, longitude: -110.9747 },
      'fresno': { latitude: 36.7378, longitude: -119.7871 },
      'sacramento': { latitude: 38.5816, longitude: -121.4944 },
      'mesa': { latitude: 33.4152, longitude: -111.8315 },
      'kansas city': { latitude: 39.0997, longitude: -94.5786 },
      'atlanta': { latitude: 33.7490, longitude: -84.3880 },
      'long beach': { latitude: 33.7701, longitude: -118.1937 },
      'colorado springs': { latitude: 38.8339, longitude: -104.8214 },
      'raleigh': { latitude: 35.7796, longitude: -78.6382 },
      'miami': { latitude: 25.7617, longitude: -80.1918 },
      'virginia beach': { latitude: 36.8529, longitude: -75.9780 },
      'omaha': { latitude: 41.2565, longitude: -95.9345 },
      'oakland': { latitude: 37.8044, longitude: -122.2712 },
      'minneapolis': { latitude: 44.9778, longitude: -93.2650 },
      'tulsa': { latitude: 36.1539, longitude: -95.9928 },
      'arlington': { latitude: 32.7357, longitude: -97.1081 },
      'tampa': { latitude: 27.9506, longitude: -82.4572 },
      'new orleans': { latitude: 29.9511, longitude: -90.0715 },
      'wichita': { latitude: 37.6872, longitude: -97.3301 },
      'cleveland': { latitude: 41.4993, longitude: -81.6944 },
      'bakersfield': { latitude: 35.3733, longitude: -119.0187 },
      'aurora': { latitude: 39.7294, longitude: -104.8319 },
      'anaheim': { latitude: 33.8366, longitude: -117.9143 },
      'honolulu': { latitude: 21.3099, longitude: -157.8581 },
      'santa ana': { latitude: 33.7455, longitude: -117.8677 },
      'corpus christi': { latitude: 27.8006, longitude: -97.3964 },
      'riverside': { latitude: 33.9533, longitude: -117.3962 },
      'lexington': { latitude: 38.0406, longitude: -84.5037 },
      'stockton': { latitude: 37.9577, longitude: -121.2908 },
      'henderson': { latitude: 36.0397, longitude: -114.9817 },
      'saint paul': { latitude: 44.9537, longitude: -93.0900 },
      'st. louis': { latitude: 38.6270, longitude: -90.1994 },
      'cincinnati': { latitude: 39.1031, longitude: -84.5120 },
      'pittsburgh': { latitude: 40.4406, longitude: -79.9959 },
      // International locations
      'toronto': { latitude: 43.6532, longitude: -79.3832 },
      'vancouver': { latitude: 49.2827, longitude: -123.1207 },
      'montreal': { latitude: 45.5017, longitude: -73.5673 },
      'calgary': { latitude: 51.0447, longitude: -114.0719 },
      'ottawa': { latitude: 45.4215, longitude: -75.6972 },
      'edmonton': { latitude: 53.5461, longitude: -113.4938 },
    };
    
    const locationKey = location.toLowerCase().trim();
    return locationDefaults[locationKey] || { 
      latitude: 39.8283 + (Math.random() - 0.5) * 10, // Add some randomness for unknown locations
      longitude: -98.5795 + (Math.random() - 0.5) * 20 
    };
  };

  // Function to fit map to show all markers
  const fitMapToMarkers = (locations) => {
    if (locations.length === 0) return;

    if (locations.length === 1) {
      setRegion({
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
      return;
    }

    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach(location => {
      minLat = Math.min(minLat, location.latitude);
      maxLat = Math.max(maxLat, location.latitude);
      minLng = Math.min(minLng, location.longitude);
      maxLng = Math.max(maxLng, location.longitude);
    });

    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lngDelta = (maxLng - minLng) * 1.5;

    setRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.05), // Minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.05),
    });
  };

  const handleMarkerPress = (locationData) => {
    const hazardsList = locationData.hazards.map(h => 
      `• ${h.scopeOfWork} (${h.status})`
    ).join('\n');
    
    Alert.alert(
      `Location: ${locationData.location}`,
      `Task Hazards: ${locationData.count}\nHighest Risk Score: ${locationData.highestRisk}\n\nHazards:\n${hazardsList}`,
      [
        { text: 'View Details', onPress: () => onMarkerPress && onMarkerPress(locationData.hazards[0]) },
        { text: 'OK' }
      ]
    );
  };

  const locationData = processLocationData();

  // Auto-fit map to show all markers when data changes
  useEffect(() => {
    if (locationData.length > 0) {
      fitMapToMarkers(locationData);
    }
  }, [taskHazards]);

  if (isLoading) {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Task Hazard Locations</Text>
        </View>
        <View style={[styles.mapPlaceholder, styles.mapLoading]}>
          <Ionicons name="map-outline" size={48} color="#94a3b8" />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Task Hazard Locations</Text>
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={[styles.mapButton, mapType === 'standard' && styles.activeMapButton]}
            onPress={() => setMapType('standard')}
          >
            <Text style={[
              styles.mapButtonText, 
              mapType === 'standard' && styles.activeMapButtonText
            ]}>
              Map
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mapButton, mapType === 'satellite' && styles.activeMapButton]}
            onPress={() => setMapType('satellite')}
          >
            <Text style={[
              styles.mapButtonText, 
              mapType === 'satellite' && styles.activeMapButtonText
            ]}>
              Satellite
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mapActions}>
          <TouchableOpacity 
            style={styles.mapActionButton}
            onPress={() => fitMapToMarkers(locationData)}
          >
            <Ionicons name="locate-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="expand-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Map View - Google Maps on Mobile, Stylized on Web */}
      <View style={styles.mapWrapper}>
        {Platform.OS !== 'web' && MapView ? (
          // Google Maps for Mobile (iOS/Android)
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            mapType={mapType === 'satellite' ? 'satellite' : 'standard'}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            toolbarEnabled={true}
          >
            {/* Location Markers */}
            {locationData.map((location, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.location}
                description={`${location.count} hazard${location.count !== 1 ? 's' : ''} • Risk: ${location.highestRisk}`}
                onPress={() => handleMarkerPress(location)}
                pinColor={getRiskColor(location.highestRisk)}
              >
                <View style={[
                  styles.customMarker,
                  { backgroundColor: getRiskColor(location.highestRisk) }
                ]}>
                  <Text style={styles.markerText}>{location.count}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          // Stylized Map for Web
          <View style={[styles.mapBackground, mapType === 'satellite' && styles.satelliteBackground]}>
            {/* Map Background Elements */}
            <View style={styles.mapContent}>
              {/* Continent shapes for map-like appearance */}
              <View style={styles.continentContainer}>
                {/* North America */}
                <View style={[styles.continent, styles.northAmerica]} />
                
                {/* Grid lines for map appearance */}
                <View style={styles.gridLines}>
                  {[...Array(8)].map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: `${12.5 * (i + 1)}%` }]} />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: `${10 * (i + 1)}%` }]} />
                  ))}
                </View>
              </View>

              {/* Location Markers */}
              {locationData.map((location, index) => {
                // Normalize coordinates to map position
                const normalizedLat = (location.latitude - 25) / 40; // 25-65 range to 0-1
                const normalizedLng = (location.longitude + 130) / 60; // -130 to -70 range to 0-1
                
                const top = Math.max(5, Math.min(85, 15 + (1 - normalizedLat) * 70));
                const left = Math.max(5, Math.min(90, 5 + normalizedLng * 85));

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.locationMarker, { 
                      top: `${top}%`, 
                      left: `${left}%` 
                    }]}
                    onPress={() => handleMarkerPress(location)}
                  >
                    <View style={[
                      styles.markerDot,
                      { backgroundColor: getRiskColor(location.highestRisk) }
                    ]}>
                      <Text style={styles.markerText}>{location.count}</Text>
                    </View>
                    <View style={[
                      styles.markerPulse,
                      { borderColor: getRiskColor(location.highestRisk) }
                    ]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Legend overlay */}
        <View style={styles.mapLegend}>
          <Text style={styles.legendTitle}>Risk Levels</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Low (1-4)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Medium (5-9)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>High (10-16)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#991b1b' }]} />
              <Text style={styles.legendText}>Critical (17+)</Text>
            </View>
          </View>
        </View>

        {/* Map info overlay */}
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            {locationData.length} locations • {taskHazards.length} task hazards
          </Text>
        </View>

        {/* Location List */}
        {locationData.length > 0 && (
          <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.locationsTitle}>Locations ({locationData.length})</Text>
            {locationData.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.locationItem}
                onPress={() => handleMarkerPress(location)}
              >
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName} numberOfLines={1}>
                    {location.location}
                  </Text>
                  <Text style={styles.locationDetails}>
                    {location.count} hazard{location.count !== 1 ? 's' : ''} • Risk: {location.highestRisk}
                  </Text>
                </View>
                <View style={[
                  styles.locationRiskBadge,
                  { backgroundColor: getRiskColor(location.highestRisk) }
                ]}>
                  <Text style={styles.locationRiskText}>{location.highestRisk}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  mapControls: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 2,
  },
  mapButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  activeMapButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mapButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  activeMapButtonText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  mapActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mapActionButton: {
    padding: 8,
  },
  mapWrapper: {
    height: 400,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoading: {
    backgroundColor: '#f8fafc',
  },
  mapLoadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  mapLegend: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
    color: '#64748b',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapInfoText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  locationsList: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 200,
    maxHeight: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 9,
    color: '#64748b',
  },
  locationRiskBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  locationRiskText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default TaskHazardMapView;
