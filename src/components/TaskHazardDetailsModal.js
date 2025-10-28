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
import { getRiskScoreLabel, getRiskColor } from '../utils/riskUtils';

const { width, height } = Dimensions.get('window');

const TaskHazardDetailsModal = ({ 
  visible, 
  onClose, 
  taskHazard,
  getRiskColor,
  getStatusColor 
}) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!taskHazard) return null;

  const riskCount = taskHazard.risks?.length || 0;
  const individualCount = (() => {
    if (Array.isArray(taskHazard.individual)) {
      return taskHazard.individual.length;
    } else if (typeof taskHazard.individual === 'string' && taskHazard.individual.trim()) {
      return taskHazard.individual.split(',').length;
    }
    return 0;
  })();
  
  const individuals = (() => {
    if (Array.isArray(taskHazard.individual)) {
      return taskHazard.individual;
    } else if (typeof taskHazard.individual === 'string' && taskHazard.individual.trim()) {
      return taskHazard.individual.split(',').map(name => name.trim());
    }
    return [];
  })();

  // Calculate highest risk score and get the risk details
  const highestRiskData = taskHazard.risks && taskHazard.risks.length > 0
    ? taskHazard.risks.reduce((highest, risk) => {
        const currentScore = risk.asIsLikelihood * risk.asIsConsequence;
        const highestScore = highest.asIsLikelihood * highest.asIsConsequence;
        return currentScore > highestScore ? risk : highest;
      })
    : { asIsLikelihood: 1, asIsConsequence: 1 };

  const highestRisk = highestRiskData.asIsLikelihood * highestRiskData.asIsConsequence;

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

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{taskHazard.scopeOfWork || 'Task Hazard'}</Text>
            <Text style={styles.headerSubtitle}>ID: {taskHazard.id}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor ? getStatusColor(taskHazard.status) : '#6b7280' }
          ]}>
            <Text style={styles.statusText}>{taskHazard.status || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.riskIndicator}>
          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Risk Level:</Text>
          </View>
          <View style={styles.riskDetailsRow}>
            <Text style={styles.riskDetailsText}>
              Likelihood: {highestRiskData.asIsLikelihood || 'Not specified'} | Consequence: {highestRiskData.asIsConsequence || 'Not specified'}
            </Text>
          </View>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>
                {taskHazard.date} {taskHazard.time}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{taskHazard.location || 'Not specified'}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Supervisor</Text>
              <Text style={styles.infoValue}>{taskHazard.supervisor || 'Not assigned'}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="build-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Asset System</Text>
              <Text style={styles.infoValue}>{taskHazard.assetSystem || 'Not specified'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Safety Requirements */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Safety Requirements</Text>
        <View style={styles.requirementsList}>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={taskHazard.systemLockoutRequired ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={taskHazard.systemLockoutRequired ? "#22c55e" : "#ef4444"} 
            />
            <Text style={styles.requirementText}>System Lockout Required</Text>
          </View>
          
          <View style={styles.requirementItem}>
            <Ionicons 
              name={taskHazard.trainedWorkforce ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={taskHazard.trainedWorkforce ? "#22c55e" : "#ef4444"} 
            />
            <Text style={styles.requirementText}>Trained Workforce</Text>
          </View>
        </View>
      </View>

      {/* Individuals */}
      {individuals.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assigned Personnel ({individualCount})</Text>
          <View style={styles.individualsList}>
            {individuals.map((individual, index) => (
              <View key={index} style={styles.individualItem}>
                <Ionicons name="person" size={16} color="#64748b" />
                <Text style={styles.individualName}>{individual}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Metadata</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDateTime(taskHazard.createdAt)}</Text>
            </View>
          </View>
          
          {taskHazard.updatedAt && (
            <View style={styles.infoItem}>
              <Ionicons name="refresh-outline" size={20} color="#64748b" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{formatDateTime(taskHazard.updatedAt)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderRisksTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {taskHazard.risks && taskHazard.risks.length > 0 ? (
        <View>
          <View style={styles.risksHeader}>
            <Text style={styles.risksTitle}>Identified Risks ({riskCount})</Text>
            <Text style={styles.risksSubtitle}>Highest Risk: {getRiskScoreLabel(highestRisk)}</Text>
          </View>
          
          {taskHazard.risks.map((risk, index) => {
            const riskScore = risk.asIsLikelihood * risk.asIsConsequence;
            return (
              <View key={index} style={styles.riskCard}>
                <View style={styles.riskHeader}>
                  <Text style={styles.riskTitle}>{risk.hazard || `Risk ${index + 1}`}</Text>
                  <View style={[
                    styles.riskScoreBadge,
                    { backgroundColor: getRiskColor ? getRiskColor(riskScore) : '#6b7280' }
                  ]}>
                    <Text style={styles.riskDetailsText}>
                      {risk.asIsLikelihood || 'Not specified'} and {risk.asIsConsequence || 'Not specified'}
                    </Text>
                    <Text style={styles.riskScoreText}>Score {riskScore}</Text>
                  </View>
                </View>
                
                {risk.description && (
                  <Text style={styles.riskDescription}>{risk.description}</Text>
                )}
                
                <View style={styles.riskMetrics}>
                  <View style={styles.riskMetric}>
                    <Text style={styles.riskMetricLabel}>Likelihood</Text>
                    <Text style={styles.riskMetricValue}>{risk.asIsLikelihood}</Text>
                  </View>
                  <View style={styles.riskMetric}>
                    <Text style={styles.riskMetricLabel}>Consequence</Text>
                    <Text style={styles.riskMetricValue}>{risk.asIsConsequence}</Text>
                  </View>
                </View>
                
                {risk.controls && (
                  <View style={styles.controlsSection}>
                    <Text style={styles.controlsTitle}>Controls:</Text>
                    <Text style={styles.controlsText}>{risk.controls}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.noRisksContainer}>
          <Ionicons name="shield-checkmark-outline" size={64} color="#94a3b8" />
          <Text style={styles.noRisksTitle}>No Risks Identified</Text>
          <Text style={styles.noRisksText}>No risks have been identified for this task hazard.</Text>
        </View>
      )}
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
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Hazard Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={20} 
              color={activeTab === 'details' ? '#3b82f6' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'risks' && styles.activeTab]}
            onPress={() => setActiveTab('risks')}
          >
            <Ionicons 
              name="warning-outline" 
              size={20} 
              color={activeTab === 'risks' ? '#3b82f6' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'risks' && styles.activeTabText]}>
              Risks ({riskCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'details' ? renderDetailsTab() : renderRisksTab()}
        </View>
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
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  riskIndicator: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  riskScore: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  riskDetailsRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  riskDetailsText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 16,
    color: '#374151',
  },
  individualsList: {
    gap: 8,
  },
  individualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  individualName: {
    fontSize: 14,
    color: '#374151',
  },
  risksHeader: {
    marginBottom: 20,
  },
  risksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  risksSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  riskScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  riskScoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  riskDetailsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  riskDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  riskMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  riskMetric: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  riskMetricLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  riskMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  controlsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  controlsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  noRisksContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noRisksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noRisksText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TaskHazardDetailsModal;
