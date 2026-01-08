import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AssetDetailsModal = ({ 
  visible, 
  onClose, 
  asset
}) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!asset) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'operational':
        return '#10b981';
      case 'inactive':
      case 'maintenance':
        return '#f59e0b';
      case 'offline':
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Helper function to render info item only if value exists
  const renderInfoItem = (icon, label, value) => {
    if (!value || value === 'N/A' || value === '') return null;
    return (
      <View style={styles.infoItem}>
        <Ionicons name={icon} size={20} color="#64748b" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  // Helper function to render multiple info items with proper keys
  const renderInfoItems = (items) => {
    return items
      .filter(item => item && item.value && item.value !== 'N/A' && item.value !== '')
      .map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.infoItem}>
          <Ionicons name={item.icon} size={20} color="#64748b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        </View>
      ));
  };

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{asset.name || 'Asset'}</Text>
            <Text style={styles.headerSubtitle}>ID: {asset.externalId || asset.id}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(asset.systemStatus) }
          ]}>
            <Text style={styles.statusText}>{asset.systemStatus || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.typeIndicator}>
          <View style={styles.typeRow}>
            <Text style={styles.typeLabel}>Type:</Text>
            <Text style={styles.typeValue}>{asset.objectType || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Asset Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Asset Details</Text>
        <View style={styles.infoGrid}>
          {renderInfoItems([
            { icon: "finger-print-outline", label: "Asset ID", value: asset.externalId || asset.id },
            { icon: "cube-outline", label: "Name", value: asset.name },
            { icon: "document-text-outline", label: "Description", value: asset.description },
            { icon: "layers-outline", label: "Object Type", value: asset.objectType },
            { icon: "checkmark-circle-outline", label: "System Status", value: asset.systemStatus },
            { icon: "git-branch-outline", label: "Level", value: asset.level !== undefined && asset.level !== null ? asset.level.toString() : null }
          ])}
        </View>
      </View>

      {/* CMMS Information */}
      {(asset.cmmsInternalId || asset.cmmsSystem || asset.maintenancePlant) && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CMMS Information</Text>
          <View style={styles.infoGrid}>
            {renderInfoItems([
              { icon: "barcode-outline", label: "CMMS Internal ID", value: asset.cmmsInternalId },
              { icon: "server-outline", label: "CMMS System", value: asset.cmmsSystem },
              { icon: "business-outline", label: "Maintenance Plant", value: asset.maintenancePlant }
            ])}
          </View>
        </View>
      )}

      {/* Location Information */}
      {(asset.functionalLocation || asset.functionalLocationDesc) && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          <View style={styles.infoGrid}>
            {renderInfoItems([
              { icon: "location-outline", label: "Functional Location", value: asset.functionalLocation },
              { icon: "location-outline", label: "Functional Location Description", value: asset.functionalLocationDesc }
            ])}
          </View>
        </View>
      )}



      {/* Asset Specifications */}
      {(asset.make || asset.manufacturer || asset.serialNumber) && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Asset Specifications</Text>
          <View style={styles.infoGrid}>
            {renderInfoItems([
              { icon: "construct-outline", label: "Make", value: asset.make },
              { icon: "factory-outline", label: "Manufacturer", value: asset.manufacturer },
              { icon: "barcode-outline", label: "Serial Number", value: asset.serialNumber }
            ])}
          </View>
        </View>
      )}


      {/* Timestamps */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Timestamps</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(asset.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDateTime(asset.updatedAt)}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Asset Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={20} 
              color={activeTab === 'details' ? '#3b82f6' : '#9ca3af'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'details' && styles.activeTabText
            ]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'details' && renderDetailsTab()}
      </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  typeIndicator: {
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  typeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 22,
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});

export default AssetDetailsModal;
