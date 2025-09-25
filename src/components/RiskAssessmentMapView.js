import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import react-native-maps with error handling
let MapView, Marker, PROVIDER_GOOGLE;
const Maps = require('react-native-maps');
MapView = Maps.default;
Marker = Maps.Marker;
PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;


const { width, height } = Dimensions.get('window');

const RiskAssessmentMapView = ({
  riskAssessments = [],
  onMarkerPress,
  getRiskColor,
  getStatusColor,
  isLoading = false
}) => {
  const [mapType, setMapType] = useState('standard');
  const [mapError, setMapError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState({
    latitude: 39.8283, // Center of US
    longitude: -98.5795,
    latitudeDelta: 5.0, // Wider initial view
    longitudeDelta: 5.0,
  });
  const [regionUpdateTimeout, setRegionUpdateTimeout] = useState(null);

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
      'nashville': { latitude: 36.1627, longitude: -86.7816 },
      'detroit': { latitude: 42.3314, longitude: -83.0458 },
      'oklahoma city': { latitude: 35.4676, longitude: -97.5164 },
      'portland': { latitude: 45.5152, longitude: -122.6784 },
      'las vegas': { latitude: 36.1699, longitude: -115.1398 },
      'memphis': { latitude: 35.1495, longitude: -90.0490 },
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
      'tulsa': { latitude: 36.1540, longitude: -95.9928 },
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
      'toledo': { latitude: 41.6528, longitude: -83.5379 },
      'st. paul': { latitude: 44.9537, longitude: -93.0900 },
      'newark': { latitude: 40.7357, longitude: -74.1724 },
      'greensboro': { latitude: 36.0726, longitude: -79.7920 },
      'plano': { latitude: 33.0198, longitude: -96.6989 },
      'henderson': { latitude: 36.0395, longitude: -114.9817 },
      'lincoln': { latitude: 40.8136, longitude: -96.7026 },
      'buffalo': { latitude: 42.8864, longitude: -78.8784 },
      'jersey city': { latitude: 40.7178, longitude: -74.0431 },
      'chula vista': { latitude: 32.6401, longitude: -117.0842 },
      'fort wayne': { latitude: 41.0793, longitude: -85.1394 },
      'orlando': { latitude: 28.5383, longitude: -81.3792 },
      'st. petersburg': { latitude: 27.7676, longitude: -82.6403 },
      'chandler': { latitude: 33.3062, longitude: -111.8412 },
      'laredo': { latitude: 27.5306, longitude: -99.4803 },
      'norfolk': { latitude: 36.8468, longitude: -76.2852 },
      'durham': { latitude: 35.9940, longitude: -78.8986 },
      'madison': { latitude: 43.0731, longitude: -89.4012 },
      'lubbock': { latitude: 33.5779, longitude: -101.8552 },
      'irvine': { latitude: 33.6846, longitude: -117.8265 },
      'winston salem': { latitude: 36.0999, longitude: -80.2442 },
      'glendale': { latitude: 33.5387, longitude: -112.1860 },
      'garland': { latitude: 32.9126, longitude: -96.6389 },
      'hialeah': { latitude: 25.8576, longitude: -80.2781 },
      'reno': { latitude: 39.5296, longitude: -119.8138 },
      'chesapeake': { latitude: 36.7682, longitude: -76.2875 },
      'gilbert': { latitude: 33.3528, longitude: -111.7890 },
      'baton rouge': { latitude: 30.4515, longitude: -91.1871 },
      'irving': { latitude: 32.8140, longitude: -96.9489 },
      'scottsdale': { latitude: 33.4942, longitude: -111.9211 },
      'north las vegas': { latitude: 36.1989, longitude: -115.1175 },
      'fremont': { latitude: 37.5483, longitude: -121.9886 },
      'boise': { latitude: 43.6150, longitude: -116.2023 },
      'richmond': { latitude: 37.5407, longitude: -77.4360 },
      'san bernardino': { latitude: 34.1083, longitude: -117.2898 },
      'birmingham': { latitude: 33.5207, longitude: -86.8025 },
      'spokane': { latitude: 47.6588, longitude: -117.4260 },
      'rochester': { latitude: 43.1566, longitude: -77.6088 },
      'des moines': { latitude: 41.5868, longitude: -93.6250 },
      'modesto': { latitude: 37.6391, longitude: -120.9969 },
      'fayetteville': { latitude: 35.0527, longitude: -78.8784 },
      'tacoma': { latitude: 47.2529, longitude: -122.4443 },
      'oxnard': { latitude: 34.1975, longitude: -119.1771 },
      'fontana': { latitude: 34.0922, longitude: -117.4350 },
      'columbus': { latitude: 32.4610, longitude: -84.9877 },
      'montgomery': { latitude: 32.3668, longitude: -86.3000 },
      'moreno valley': { latitude: 33.9425, longitude: -117.2297 },
      'shreveport': { latitude: 32.5252, longitude: -93.7502 },
      'aurora': { latitude: 39.7294, longitude: -104.8319 },
      'yonkers': { latitude: 40.9312, longitude: -73.8987 },
      'akron': { latitude: 41.0814, longitude: -81.5190 },
      'huntington beach': { latitude: 33.6595, longitude: -117.9988 },
      'glendale': { latitude: 34.1425, longitude: -118.2551 },
      'salt lake city': { latitude: 40.7608, longitude: -111.8910 },
      'little rock': { latitude: 34.7465, longitude: -92.2896 },
      'amarillo': { latitude: 35.2220, longitude: -101.8313 },
      'grand rapids': { latitude: 42.9634, longitude: -85.6681 },
      'mobile': { latitude: 30.6954, longitude: -88.0399 },
      'knoxville': { latitude: 35.9606, longitude: -83.9207 },
      'worcester': { latitude: 42.2626, longitude: -71.8023 },
      'newport news': { latitude: 37.0871, longitude: -76.4730 },
      'brownsville': { latitude: 25.9018, longitude: -97.4975 },
      'overland park': { latitude: 38.9822, longitude: -94.6708 },
      'santa clarita': { latitude: 34.3917, longitude: -118.5426 },
      'providence': { latitude: 41.8240, longitude: -71.4128 },
      'garden grove': { latitude: 33.7739, longitude: -117.9414 },
      'chattanooga': { latitude: 35.0456, longitude: -85.3097 },
      'oceanside': { latitude: 33.1959, longitude: -117.3795 },
      'jackson': { latitude: 32.2988, longitude: -90.1848 },
      'fort lauderdale': { latitude: 26.1224, longitude: -80.1373 },
      'santa rosa': { latitude: 38.4404, longitude: -122.7141 },
      'rancho cucamonga': { latitude: 34.1064, longitude: -117.5931 },
      'port st. lucie': { latitude: 27.2730, longitude: -80.3582 },
      'tempe': { latitude: 33.4255, longitude: -111.9400 },
      'ontario': { latitude: 34.0633, longitude: -117.6509 },
      'vancouver': { latitude: 45.6387, longitude: -122.6615 },
      'sioux falls': { latitude: 43.5446, longitude: -96.7311 },
      'springfield': { latitude: 37.2083, longitude: -93.2923 },
      'peoria': { latitude: 33.5806, longitude: -112.2374 },
      'pembroke pines': { latitude: 26.0078, longitude: -80.2963 },
      'elk grove': { latitude: 38.4088, longitude: -121.3716 },
      'salem': { latitude: 44.9429, longitude: -123.0351 },
      'lancaster': { latitude: 34.6868, longitude: -118.1542 },
      'corona': { latitude: 33.8753, longitude: -117.5664 },
      'eugene': { latitude: 44.0521, longitude: -123.0868 },
      'palmdale': { latitude: 34.5794, longitude: -118.1165 },
      'salinas': { latitude: 36.6777, longitude: -121.6555 },
      'springfield': { latitude: 42.1015, longitude: -72.5898 },
      'pasadena': { latitude: 34.1478, longitude: -118.1445 },
      'fort collins': { latitude: 40.5853, longitude: -105.0844 },
      'hayward': { latitude: 37.6688, longitude: -122.0808 },
      'pomona': { latitude: 34.0553, longitude: -117.7503 },
      'cary': { latitude: 35.7915, longitude: -78.7811 },
      'rockford': { latitude: 42.2711, longitude: -89.0940 },
      'alexandria': { latitude: 38.8048, longitude: -77.0469 },
      'escondido': { latitude: 33.1192, longitude: -117.0864 },
      'mckinney': { latitude: 33.1972, longitude: -96.6397 },
      'kansas city': { latitude: 39.0997, longitude: -94.5786 },
      'joliet': { latitude: 41.5250, longitude: -88.0817 },
      'sunnyvale': { latitude: 37.3688, longitude: -122.0363 },
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

  // Process risk assessments to create location data - memoized to prevent unnecessary recalculations
  const locationData = useMemo(() => {
    const locationMap = new Map();
    
    riskAssessments.forEach(assessment => {
      if (!assessment.location) return;
      
      // Create a unique key for each location
      const locationKey = assessment.location.toLowerCase().trim();
      
      if (locationMap.has(locationKey)) {
        // Add to existing location
        const existing = locationMap.get(locationKey);
        existing.assessments.push(assessment);
        existing.count++;
        // Update highest risk score
        const assessmentRisk = calculateHighestRiskScore(assessment.risks);
        if (assessmentRisk > existing.highestRisk) {
          existing.highestRisk = assessmentRisk;
        }
      } else {
        // Create new location entry
        locationMap.set(locationKey, {
          location: assessment.location,
          latitude: parseLocationCoordinates(assessment.location).latitude,
          longitude: parseLocationCoordinates(assessment.location).longitude,
          count: 1,
          assessments: [assessment],
          highestRisk: calculateHighestRiskScore(assessment.risks)
        });
      }
    });
    
    return Array.from(locationMap.values());
  }, [riskAssessments]);

  // Function to fit map to show all markers
  const fitMapToMarkers = useCallback((locations) => {
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
  }, []);

  const handleMarkerPress = useCallback((locationData) => {
    const assessmentsList = locationData.assessments.map(a => 
      `• ${a.scopeOfWork} (${a.status})`
    ).join('\n');
    
    Alert.alert(
      `Location: ${locationData.location}`,
      `Risk Assessments: ${locationData.count}\nHighest Risk Score: ${locationData.highestRisk}\n\nAssessments:\n${assessmentsList}`,
      [
        { text: 'View Details', onPress: () => onMarkerPress && onMarkerPress(locationData.assessments[0]) },
        { text: 'OK' }
      ]
    );
  }, [onMarkerPress]);

  // Auto-fit map to show all markers when data changes - only if map is ready
  useEffect(() => {
    if (locationData.length > 0 && mapReady) {
      fitMapToMarkers(locationData);
    }
  }, [riskAssessments, mapReady, fitMapToMarkers]);

  // Also fit to markers when locationData changes, even if map isn't ready yet
  useEffect(() => {
    if (locationData.length > 0) {
      // Small delay to ensure map is rendered
      const timeout = setTimeout(() => {
        fitMapToMarkers(locationData);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [locationData, fitMapToMarkers]);

  // Immediate fit to markers on component mount if data is available
  useEffect(() => {
    if (locationData.length > 0) {
      // Try immediately
      fitMapToMarkers(locationData);
      // Also try after a short delay
      const timeout = setTimeout(() => {
        fitMapToMarkers(locationData);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, []); // Run once on mount

  // Fallback timeout for Google Maps - only set once and reset when map becomes ready
  useEffect(() => {
    if (Platform.OS !== 'web' && MapView && !mapError && !mapReady) {
      const timeout = setTimeout(() => {
        if (!mapReady) {
          setMapError(true);
        }
      }, 15000); // Increased to 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [mapReady, mapError]); // Reset timeout when map becomes ready

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (regionUpdateTimeout) {
        clearTimeout(regionUpdateTimeout);
      }
    };
  }, [regionUpdateTimeout]);

  if (isLoading) {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Risk Assessment Locations</Text>
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
        {!mapReady && Platform.OS !== 'web' && MapView && !mapError && (
          <View style={styles.mapLoadingOverlay}>
            <Ionicons name="map-outline" size={48} color="#94a3b8" />
            <Text style={styles.mapLoadingText}>Loading Google Maps...</Text>
          </View>
        )}
        {Platform.OS !== 'web' && MapView && !mapError ? (
          // Google Maps for Mobile (iOS/Android)
          (() => {
            return (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={(newRegion) => {
              // Only update if the region has actually changed significantly and map is ready
              if (mapReady) {
                const latDiff = Math.abs(newRegion.latitude - region.latitude);
                const lngDiff = Math.abs(newRegion.longitude - region.longitude);
                if (latDiff > 0.01 || lngDiff > 0.01) { // Increased threshold to prevent micro-updates
                  // Clear existing timeout
                  if (regionUpdateTimeout) {
                    clearTimeout(regionUpdateTimeout);
                  }
                  
                  // Set new timeout to debounce region updates
                  const timeout = setTimeout(() => {
                    setRegion(newRegion);
                  }, 1000); // Increased to 1 second debounce
                  
                  setRegionUpdateTimeout(timeout);
                }
              }
            }}
            mapType={mapType === 'satellite' ? 'satellite' : 'standard'}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            toolbarEnabled={false}
            onError={(error) => {
              setMapError(true);
            }}
            onMapReady={() => {
              setMapReady(true);
            }}
            moveOnMarkerPress={false}
            loadingEnabled={true}
            loadingIndicatorColor="#34495e"
            loadingBackgroundColor="#ffffff"
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
                description={`${location.count} assessment${location.count !== 1 ? 's' : ''} • Risk: ${location.highestRisk}`}
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
            );
          })()
        ) : (
          // Fallback for Web, when react-native-maps is not available, or when map fails
          <View style={[styles.mapBackground, mapType === 'satellite' && styles.satelliteBackground]}>
            {mapError && (
              <View style={styles.mapErrorOverlay}>
                <Text style={styles.mapErrorText}>
                  Google Maps unavailable. Showing simplified view.
                </Text>
                {retryCount < 3 && (
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                      setMapError(false);
                      setRetryCount(prev => prev + 1);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Retry Google Maps</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
                const normalizedLat = (location.latitude - 25) / 40; // 25° to 65° N
                const normalizedLng = (location.longitude + 130) / 60; // -130° to -70° W
                
                const markerX = Math.max(0, Math.min(1, normalizedLng)) * width;
                const markerY = Math.max(0, Math.min(1, 1 - normalizedLat)) * 300;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.fallbackMarker,
                      { 
                        left: markerX - 15, 
                        top: markerY - 15,
                        backgroundColor: getRiskColor(location.highestRisk)
                      }
                    ]}
                    onPress={() => handleMarkerPress(location)}
                  >
                    <Text style={styles.fallbackMarkerText}>{location.count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  mapWrapper: {
    height: 300,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoading: {
    backgroundColor: '#f3f4f6',
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#e5f3ff',
    position: 'relative',
  },
  satelliteBackground: {
    backgroundColor: '#2d5016',
  },
  mapContent: {
    flex: 1,
    position: 'relative',
  },
  continentContainer: {
    flex: 1,
    position: 'relative',
  },
  continent: {
    position: 'absolute',
    backgroundColor: '#d1d5db',
    borderRadius: 20,
  },
  northAmerica: {
    width: '60%',
    height: '40%',
    top: '20%',
    left: '10%',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  horizontalLine: {
    width: '100%',
    height: 1,
  },
  verticalLine: {
    height: '100%',
    width: 1,
  },
  customMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
  fallbackMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fallbackMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 12,
    zIndex: 1000,
  },
  mapErrorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});

export default RiskAssessmentMapView;
