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

const RiskAssessmentDetailsModal = ({ 
  visible, 
  onClose, 
  riskAssessment,
  getRiskColor,
  getStatusColor 
}) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!riskAssessment) return null;

  const riskCount = riskAssessment.risks?.length || 0;
  const individualCount = riskAssessment.individuals ? riskAssessment.individuals.split(',').length : 0;
  const individuals = riskAssessment.individuals ? riskAssessment.individuals.split(',').map(name => name.trim()) : [];

  // Calculate highest risk score
  const calculateHighestRiskScore = (risks) => {
    if (!risks || risks.length === 0) return 1;
    
    return Math.max(...risks.map(risk => {
      // Handle different risk score calculation methods
      if (risk.asIsScore) return risk.asIsScore;
      if (risk.asIsLikelihood && risk.asIsConsequence) {
        // Convert likelihood and consequence to numeric values if they're strings
        const likelihoodScore = getLikelihoodScore(risk.asIsLikelihood);
        const consequenceScore = getConsequenceScore(risk.asIsConsequence);
        return likelihoodScore * consequenceScore;
      }
      return 1;
    }));
  };

  const getLikelihoodScore = (likelihood) => {
    const scores = {
      'Very Unlikely': 1,
      'Slight Chance': 2,
      'Feasible': 3,
      'Likely': 4,
      'Very Likely': 5
    };
    return scores[likelihood] || parseInt(likelihood) || 1;
  };

  const getConsequenceScore = (consequence) => {
    const scores = {
      'Minor': 1,
      'Moderate': 2,
      'Major': 3,
      'Significant': 4,
      'Severe': 5
    };
    return scores[consequence] || parseInt(consequence) || 1;
  };

  const highestRisk = calculateHighestRiskScore(riskAssessment.risks);

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

  const getRiskCategoryIcon = (riskType) => {
    const icons = {
      'Personnel': 'person-outline',
      'Maintenance': 'build-outline',
      'Revenue': 'cash-outline',
      'Process': 'cog-outline',
      'Environmental': 'leaf-outline'
    };
    return icons[riskType] || 'alert-circle-outline';
  };

  const getMitigationTypeColor = (type) => {
    const colors = {
      'Elimination': '#22c55e',
      'Control': '#f59e0b',
      'Administrative': '#3b82f6'
    };
    return colors[type] || '#6b7280';
  };

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{riskAssessment.scopeOfWork || 'Risk Assessment'}</Text>
            <Text style={styles.headerSubtitle}>ID: {riskAssessment.id}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor ? getStatusColor(riskAssessment.status) : '#6b7280' }
          ]}>
            <Text style={styles.statusText}>{riskAssessment.status || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.riskIndicator}>
          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Highest Risk Score:</Text>
            <View style={[
              styles.riskBadge,
              { backgroundColor: getRiskColor ? getRiskColor(highestRisk) : '#6b7280' }
            ]}>
              <Text style={styles.riskScore}>{highestRisk}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Assessment Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>
                {riskAssessment.date} {riskAssessment.time}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{riskAssessment.location || 'Not specified'}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Assessment Lead</Text>
              <Text style={styles.infoValue}>{riskAssessment.supervisor || 'Not assigned'}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="build-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Asset System</Text>
              <Text style={styles.infoValue}>{riskAssessment.assetSystem || 'Not specified'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Assessment Team */}
      {individuals.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assessment Team ({individualCount})</Text>
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

      {/* Risk Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Risk Summary</Text>
        <View style={styles.riskSummaryGrid}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons name="warning-outline" size={24} color="#ef4444" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryValue}>{riskCount}</Text>
              <Text style={styles.summaryLabel}>Total Risks</Text>
            </View>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons name="speedometer-outline" size={24} color={getRiskColor ? getRiskColor(highestRisk) : '#6b7280'} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryValue}>{highestRisk}</Text>
              <Text style={styles.summaryLabel}>Highest Score</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Metadata */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Metadata</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#64748b" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDateTime(riskAssessment.createdAt)}</Text>
            </View>
          </View>
          
          {riskAssessment.updatedAt && (
            <View style={styles.infoItem}>
              <Ionicons name="refresh-outline" size={20} color="#64748b" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{formatDateTime(riskAssessment.updatedAt)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderRisksTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {riskAssessment.risks && riskAssessment.risks.length > 0 ? (
        <View>
          <View style={styles.risksHeader}>
            <Text style={styles.risksTitle}>Risk Analysis ({riskCount})</Text>
            <Text style={styles.risksSubtitle}>Highest Risk Score: {highestRisk}</Text>
          </View>
          
          {riskAssessment.risks.map((risk, index) => {
            const asIsScore = risk.asIsScore || (getLikelihoodScore(risk.asIsLikelihood) * getConsequenceScore(risk.asIsConsequence));
            const mitigatedScore = risk.mitigatedScore || (getLikelihoodScore(risk.mitigatedLikelihood) * getConsequenceScore(risk.mitigatedConsequence));
            
            return (
              <View key={index} style={styles.riskCard}>
                <View style={styles.riskHeader}>
                  <View style={styles.riskTitleRow}>
                    <Ionicons 
                      name={getRiskCategoryIcon(risk.riskType)} 
                      size={20} 
                      color="#64748b" 
                    />
                    <Text style={styles.riskTitle}>
                      {risk.riskDescription || `Risk ${index + 1}`}
                    </Text>
                  </View>
                  <View style={styles.riskScores}>
                    <View style={[
                      styles.riskScoreBadge,
                      { backgroundColor: getRiskColor ? getRiskColor(asIsScore) : '#6b7280' }
                    ]}>
                      <Text style={styles.riskScoreText}>{asIsScore}</Text>
                    </View>
                  </View>
                </View>
                
                {risk.riskType && (
                  <View style={styles.riskTypeContainer}>
                    <Text style={styles.riskTypeLabel}>Category: </Text>
                    <Text style={styles.riskTypeValue}>{risk.riskType}</Text>
                  </View>
                )}
                
                {/* As-Is Risk Assessment */}
                <View style={styles.riskSection}>
                  <Text style={styles.riskSectionTitle}>Current Risk (As-Is)</Text>
                  <View style={styles.riskMetrics}>
                    <View style={styles.riskMetric}>
                      <Text style={styles.riskMetricLabel}>Likelihood</Text>
                      <Text style={styles.riskMetricValue}>
                        {risk.asIsLikelihood || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.riskMetric}>
                      <Text style={styles.riskMetricLabel}>Consequence</Text>
                      <Text style={styles.riskMetricValue}>
                        {risk.asIsConsequence || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.riskMetric}>
                      <Text style={styles.riskMetricLabel}>Score</Text>
                      <Text style={[
                        styles.riskMetricValue,
                        { color: getRiskColor ? getRiskColor(asIsScore) : '#1e293b' }
                      ]}>
                        {asIsScore}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Mitigation */}
                {risk.mitigatingAction && (
                  <View style={styles.riskSection}>
                    <Text style={styles.riskSectionTitle}>Mitigation Strategy</Text>
                    <View style={styles.mitigationContainer}>
                      {risk.mitigatingActionType && (
                        <View style={styles.mitigationTypeRow}>
                          <View style={[
                            styles.mitigationTypeBadge,
                            { backgroundColor: getMitigationTypeColor(risk.mitigatingActionType) }
                          ]}>
                            <Text style={styles.mitigationTypeText}>{risk.mitigatingActionType}</Text>
                          </View>
                        </View>
                      )}
                      <Text style={styles.mitigationText}>{risk.mitigatingAction}</Text>
                    </View>
                  </View>
                )}

                {/* Mitigated Risk Assessment */}
                {(risk.mitigatedLikelihood || risk.mitigatedConsequence) && (
                  <View style={styles.riskSection}>
                    <Text style={styles.riskSectionTitle}>Residual Risk (After Mitigation)</Text>
                    <View style={styles.riskMetrics}>
                      <View style={styles.riskMetric}>
                        <Text style={styles.riskMetricLabel}>Likelihood</Text>
                        <Text style={styles.riskMetricValue}>
                          {risk.mitigatedLikelihood || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.riskMetric}>
                        <Text style={styles.riskMetricLabel}>Consequence</Text>
                        <Text style={styles.riskMetricValue}>
                          {risk.mitigatedConsequence || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.riskMetric}>
                        <Text style={styles.riskMetricLabel}>Score</Text>
                        <Text style={[
                          styles.riskMetricValue,
                          { color: getRiskColor ? getRiskColor(mitigatedScore) : '#1e293b' }
                        ]}>
                          {mitigatedScore}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Supervisor Signature Required */}
                {risk.requiresSupervisorSignature && (
                  <View style={styles.signatureRequiredContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#f59e0b" />
                    <Text style={styles.signatureRequiredText}>Supervisor signature required</Text>
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
          <Text style={styles.noRisksText}>No risks have been identified for this assessment.</Text>
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
          <Text style={styles.headerTitle}>Risk Assessment Details</Text>
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
  riskSummaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  riskScores: {
    flexDirection: 'row',
    gap: 8,
  },
  riskScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  riskScoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  riskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskTypeLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  riskTypeValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  riskSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  riskSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  riskMetrics: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  mitigationContainer: {
    gap: 8,
  },
  mitigationTypeRow: {
    flexDirection: 'row',
  },
  mitigationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mitigationTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mitigationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  signatureRequiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  signatureRequiredText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
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

export default RiskAssessmentDetailsModal;
