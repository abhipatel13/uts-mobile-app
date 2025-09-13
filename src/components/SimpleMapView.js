import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SimpleMapView = ({
  locationData = [],
  region,
  mapType = 'standard',
  onMapTypeChange,
  onMarkerPress,
  getRiskColor,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Task Hazard Locations</Text>
        </View>
        <View style={[styles.mapPlaceholder, styles.mapLoading]}>
          <Text style={styles.mapLoadingText}>Loading locations...</Text>
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
            onPress={() => onMapTypeChange('standard')}
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
            onPress={() => onMapTypeChange('satellite')}
          >
            <Text style={[
              styles.mapButtonText, 
              mapType === 'satellite' && styles.activeMapButtonText
            ]}>
              Satellite
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.fullscreenButton}>
          <Ionicons name="expand-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
      
      {/* Styled Map View */}
      <View style={styles.mapWrapper}>
        <View style={[styles.mapBackground, mapType === 'satellite' && styles.satelliteBackground]}>
          {/* North America continent shape */}
          <View style={styles.continentContainer}>
            {/* Canada */}
            <View style={[styles.continent, styles.canada]} />
            
            {/* United States */}
            <View style={[styles.continent, styles.usa]} />
            
            {/* Mexico */}
            <View style={[styles.continent, styles.mexico]} />
            
            {/* Great Lakes */}
            <View style={[styles.waterBody, styles.greatLakes]} />
            <View style={[styles.waterBody, styles.hudsonBay]} />
          </View>

          {/* Location Markers */}
          {locationData.map((location, index) => {
            // Generate position based on coordinates
            const normalizedLat = (location.latitude - 25) / 40; // 25-65 range to 0-1
            const normalizedLng = (location.longitude + 130) / 60; // -130 to -70 range to 0-1
            
            const top = Math.max(5, Math.min(85, 15 + (1 - normalizedLat) * 70)); // 15% to 85%
            const left = Math.max(5, Math.min(90, 5 + normalizedLng * 85)); // 5% to 90%

            return (
              <TouchableOpacity
                key={index}
                style={[styles.locationMarker, { 
                  top: `${top}%`, 
                  left: `${left}%` 
                }]}
                onPress={() => onMarkerPress(location)}
              >
                <View style={[
                  styles.markerDot,
                  { backgroundColor: getRiskColor(location.riskScore) }
                ]}>
                  <Text style={styles.markerText}>{location.count}</Text>
                </View>
                <View style={[
                  styles.markerPulse,
                  { borderColor: getRiskColor(location.riskScore) }
                ]} />
              </TouchableOpacity>
            );
          })}

          {/* Grid lines for map-like appearance */}
          <View style={styles.gridLines}>
            {[...Array(8)].map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: `${12.5 * (i + 1)}%` }]} />
            ))}
            {[...Array(10)].map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: `${10 * (i + 1)}%` }]} />
            ))}
          </View>
        </View>

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
            {locationData.length} locations • {locationData.reduce((sum, loc) => sum + loc.count, 0)} hazards
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
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
  fullscreenButton: {
    padding: 8,
  },
  mapWrapper: {
    height: 350,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#dbeafe', // Light blue ocean
    position: 'relative',
  },
  satelliteBackground: {
    backgroundColor: '#1e293b', // Dark background for satellite view
  },
  continentContainer: {
    flex: 1,
    position: 'relative',
  },
  continent: {
    position: 'absolute',
    backgroundColor: '#10b981', // Land color
    opacity: 0.8,
  },
  canada: {
    top: '10%',
    left: '15%',
    width: '70%',
    height: '35%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 20,
  },
  usa: {
    top: '35%',
    left: '20%',
    width: '60%',
    height: '30%',
    borderRadius: 15,
  },
  mexico: {
    top: '60%',
    left: '25%',
    width: '35%',
    height: '25%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 15,
  },
  waterBody: {
    position: 'absolute',
    backgroundColor: '#3b82f6', // Water color
    borderRadius: 8,
  },
  greatLakes: {
    top: '40%',
    left: '50%',
    width: '15%',
    height: '12%',
    borderRadius: 12,
  },
  hudsonBay: {
    top: '20%',
    left: '45%',
    width: '12%',
    height: '15%',
    borderRadius: 15,
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
    left: 0,
    right: 0,
    height: 0.5,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 0.5,
  },
  locationMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    opacity: 0.3,
    zIndex: 1,
  },
  markerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    height: 350,
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
});

export default SimpleMapView;
