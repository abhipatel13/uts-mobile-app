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

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{asset.name || 'Asset'}</Text>
            <Text style={styles.headerSubtitle}>ID: {asset.cmmsInternalId || asset.id}</Text>
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

      {/* Basic Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="cube-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Asset Name</Text>
              <Text style={styles.infoValue}>{asset.name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="finger-print-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Internal ID</Text>
              <Text style={styles.infoValue}>{asset.cmmsInternalId || asset.id || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="layers-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Object Type</Text>
              <Text style={styles.infoValue}>{asset.objectType || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>System Status</Text>
              <Text style={styles.infoValue}>{asset.systemStatus || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      {asset.description && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{asset.description}</Text>
        </View>
      )}

      {/* Hierarchy Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Hierarchy Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="git-branch-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Parent Asset</Text>
              <Text style={styles.infoValue}>{asset.parent ? 'Yes' : 'Root Asset'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="business-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Company</Text>
              <Text style={styles.infoValue}>{asset.companyName || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#64748b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{asset.location || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

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
