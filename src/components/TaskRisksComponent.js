import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import RiskMatrixModal from './RiskMatrixModal';

const TaskRisksComponent = ({ risks = [], onRisksChange }) => {
  console.log('TaskRisksComponent rendered with enhanced risk matrix functionality');
  const [expandedRisks, setExpandedRisks] = useState(new Set());
  const [showAsIsMatrix, setShowAsIsMatrix] = useState(false);
  const [showMitigatedMatrix, setShowMitigatedMatrix] = useState(false);
  const [activeRiskIndex, setActiveRiskIndex] = useState(0);

  const defaultRisk = {
    riskDescription: '',
    riskType: 'Personnel',
    asIsLikelihood: 'Very Unlikely',
    asIsConsequence: 'Minor',
    mitigatingAction: '',
    mitigatingActionType: 'Elimination',
    mitigatedLikelihood: 'Very Unlikely',
    mitigatedConsequence: 'Minor',
    requiresSupervisorSignature: false,
  };

  const riskCategories = [
    { id: "Personnel", label: "Personnel" },
    { id: "Maintenance", label: "Maintenance" },
    { id: "Revenue", label: "Revenue" },
    { id: "Process", label: "Process" },
    { id: "Environmental", label: "Environmental" },
  ];

  const mitigatingActionTypes = [
    'Elimination',
    'Control', 
    'Administrative'
  ];

  const likelihoodLabels = [
    { value: "Very Unlikely", label: "Very Unlikely", description: "Once in Lifetime >75 Years", score: 1 },
    { value: "Slight Chance", label: "Slight Chance", description: "Once in 10 to 75 Years", score: 2 },
    { value: "Feasible", label: "Feasible", description: "Once in 10 Years", score: 3 },
    { value: "Likely", label: "Likely", description: "Once in 2 to 10 Years", score: 4 },
    { value: "Very Likely", label: "Very Likely", description: "Multiple times in 2 Years", score: 5 },
  ];

  const personnelConsequenceLabels = [
    { value: "Minor", label: "Minor", description: "No Lost Time", score: 1 },
    { value: "Significant", label: "Significant", description: "Lost Time", score: 2 },
    { value: "Serious", label: "Serious", description: "Short Term Disability", score: 3 },
    { value: "Major", label: "Major", description: "Long Term Disability", score: 4 },
    { value: "Catastrophic", label: "Catastrophic", description: "Fatality", score: 5 },
  ];

  const maintenanceConsequenceLabels = [
    { value: "Minor", label: "Minor", description: "<5% Impact to Maintenance Budget", score: 1 },
    { value: "Significant", label: "Significant", description: "5-10% Impact to Maintenance Budget", score: 2 },
    { value: "Serious", label: "Serious", description: "20-30% Impact to Maintenance Budget", score: 3 },
    { value: "Major", label: "Major", description: "30-40% Impact to Maintenance Budget", score: 4 },
    { value: "Catastrophic", label: "Catastrophic", description: ">41% Impact to Maintenance Budget", score: 5 },
  ];

  const revenueConsequenceLabels = [
    { value: "Minor", label: "Minor", description: "<2% Impact to Revenue", score: 1 },
    { value: "Significant", label: "Significant", description: "2-6% Impact to Revenue", score: 2 },
    { value: "Serious", label: "Serious", description: "6-12% Impact to Revenue", score: 3 },
    { value: "Major", label: "Major", description: "12-24% Impact to Revenue", score: 4 },
    { value: "Catastrophic", label: "Catastrophic", description: ">25% Impact to Revenue", score: 5 },
  ];

  const processConsequenceLabels = [
    { value: "Minor", label: "Minor", description: "Production Loss < 10 Days", score: 1 },
    { value: "Significant", label: "Significant", description: "Production Loss 10 - 20 Days", score: 2 },
    { value: "Serious", label: "Serious", description: "Production Loss 20 - 40 Days", score: 3 },
    { value: "Major", label: "Major", description: "Production Loss 40 - 80 Days", score: 4 },
    { value: "Catastrophic", label: "Catastrophic", description: "Production Loss >81 Days", score: 5 },
  ];

  const environmentalConsequenceLabels = [
    { value: "Minor", label: "Minor", description: "Near Source - Non Reportable - Cleanup <1Shift", score: 1 },
    { value: "Significant", label: "Significant", description: "Near Source - Reportable - Cleanup <1Shift", score: 2 },
    { value: "Serious", label: "Serious", description: "Near Source - Reportable - Cleanup <4WKS", score: 3 },
    { value: "Major", label: "Major", description: "Near Source - Reportable - Cleanup <52WKS", score: 4 },
    { value: "Catastrophic", label: "Catastrophic", description: "Near Source - Reportable - Cleanup <1WK", score: 5 },
  ];

  // Risk matrix scores
  const riskMatrix = [
    [1, 2, 3, 4, 5],    // Very Unlikely (1)
    [2, 4, 6, 8, 10],   // Slight Chance (2)
    [3, 6, 9, 12, 15],  // Feasible (3)
    [4, 8, 12, 16, 20], // Likely (4)
    [5, 10, 15, 20, 25] // Very Likely (5)
  ];

  const addRisk = () => {
    const newRisks = [...risks, { ...defaultRisk, id: Date.now() }];
    onRisksChange(newRisks);
    
    // Auto-expand the new risk
    const newExpandedRisks = new Set(expandedRisks);
    newExpandedRisks.add(newRisks.length - 1);
    setExpandedRisks(newExpandedRisks);
  };

  const removeRisk = (index) => {
    Alert.alert(
      'Remove Risk',
      'Are you sure you want to remove this risk?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newRisks = risks.filter((_, i) => i !== index);
            onRisksChange(newRisks);
            
            // Update expanded risks indices
            const newExpandedRisks = new Set();
            expandedRisks.forEach(expandedIndex => {
              if (expandedIndex < index) {
                newExpandedRisks.add(expandedIndex);
              } else if (expandedIndex > index) {
                newExpandedRisks.add(expandedIndex - 1);
              }
            });
            setExpandedRisks(newExpandedRisks);
          }
        }
      ]
    );
  };

  const updateRisk = (index, field, value) => {
    const newRisks = [...risks];
    newRisks[index] = { ...newRisks[index], [field]: value };
    
    // Auto-enable supervisor signature for high risk post-mitigation scores
    if (field === 'mitigatedLikelihood' || field === 'mitigatedConsequence') {
      const updatedRisk = newRisks[index];
      const mitigatedScore = calculateRiskScore(
        updatedRisk.mitigatedLikelihood, 
        updatedRisk.mitigatedConsequence, 
        updatedRisk.riskType
      );
      if (mitigatedScore > 9) {
        newRisks[index].requiresSupervisorSignature = true;
      }
    }
    
    onRisksChange(newRisks);
  };

  // Handle risk matrix selection for as-is risk
  const handleAsIsRiskSelection = (likelihood, consequence, score) => {
    updateRisk(activeRiskIndex, 'asIsLikelihood', likelihood);
    updateRisk(activeRiskIndex, 'asIsConsequence', consequence);
  };

  // Handle risk matrix selection for mitigated risk
  const handleMitigatedRiskSelection = (likelihood, consequence, score) => {
    updateRisk(activeRiskIndex, 'mitigatedLikelihood', likelihood);
    updateRisk(activeRiskIndex, 'mitigatedConsequence', consequence);
    
    // Auto-enable supervisor signature for high risk scores
    if (score > 9) {
      updateRisk(activeRiskIndex, 'requiresSupervisorSignature', true);
    }
  };

  // Cross-platform picker handlers
  const showRiskTypePicker = (riskIndex) => {
    if (Platform.OS === 'ios') {
      const options = ['Cancel', ...riskCategories.map(category => category.label)];
      const cancelButtonIndex = 0;
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Select Risk Type',
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            const selectedCategory = riskCategories[buttonIndex - 1];
            updateRisk(riskIndex, 'riskType', selectedCategory.id);
          }
        }
      );
    } else {
      // Android - use Alert with buttons
      const buttons = riskCategories.map(category => ({
        text: category.label,
        onPress: () => updateRisk(riskIndex, 'riskType', category.id),
      }));
      buttons.push({ text: 'Cancel', style: 'cancel' });
      
      Alert.alert('Select Risk Type', '', buttons);
    }
  };

  const showMitigatingActionTypePicker = (riskIndex) => {
    if (Platform.OS === 'ios') {
      const options = ['Cancel', ...mitigatingActionTypes];
      const cancelButtonIndex = 0;
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Select Mitigating Action Type',
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            const selectedType = mitigatingActionTypes[buttonIndex - 1];
            updateRisk(riskIndex, 'mitigatingActionType', selectedType);
          }
        }
      );
    } else {
      // Android - use Alert with buttons
      const buttons = mitigatingActionTypes.map(type => ({
        text: type,
        onPress: () => updateRisk(riskIndex, 'mitigatingActionType', type),
      }));
      buttons.push({ text: 'Cancel', style: 'cancel' });
      
      Alert.alert('Select Mitigating Action Type', '', buttons);
    }
  };

  // Helper to get display text for risk type
  const getRiskTypeDisplayText = (riskType) => {
    if (!riskType) return 'Select risk type';
    const category = riskCategories.find(cat => cat.id === riskType);
    return category ? category.label : riskType;
  };

  // Helper to get display text for mitigating action type
  const getMitigatingActionTypeDisplayText = (actionType) => {
    if (!actionType) return 'Select type';
    return actionType;
  };

  const toggleExpanded = (index) => {
    const newExpandedRisks = new Set(expandedRisks);
    if (newExpandedRisks.has(index)) {
      newExpandedRisks.delete(index);
    } else {
      newExpandedRisks.add(index);
    }
    setExpandedRisks(newExpandedRisks);
  };

  // Get consequence labels for a specific risk type
  const getConsequenceLabels = (riskType) => {
    switch (riskType) {
      case "Maintenance": return maintenanceConsequenceLabels;
      case "Personnel": return personnelConsequenceLabels;
      case "Revenue": return revenueConsequenceLabels;
      case "Process": return processConsequenceLabels;
      case "Environmental": return environmentalConsequenceLabels;
      default: return personnelConsequenceLabels;
    }
  };

  const getRiskScore = (likelihood, consequence, consequenceLabels) => {
    const likelihoodScore = likelihoodLabels.find(l => l.value === likelihood)?.score || 0;
    const consequenceScore = consequenceLabels.find(c => c.value === consequence)?.score || 0;
    
    if (likelihoodScore === 0 || consequenceScore === 0) return 0;
    
    return riskMatrix[likelihoodScore - 1][consequenceScore - 1];
  };

  const calculateRiskScore = (likelihood, consequence, riskType) => {
    const consequenceLabels = getConsequenceLabels(riskType);
    return getRiskScore(likelihood, consequence, consequenceLabels);
  };

  const getRiskScoreColor = (score, riskType) => {
    if (riskType === "" || score === 0) return "#9ca3af";
    
    // For Maintenance Risk
    if (riskType === "Maintenance") {
      if (score <= 2) return "#8DC63F";
      if (score <= 9) return "#FFFF00";
      if (score <= 15) return "#F7941D";
      return "#ED1C24";
    }

    if (riskType === "Personnel") {
      if (score <= 2) return "#8DC63F";
      if (score <= 9) return "#FFFF00";
      if (score <= 15) return "#F7941D";
      return "#ED1C24";
    }

    if (riskType === "Revenue") {
      if (score <= 2) return "#8DC63F";
      if (score <= 9) return "#FFFF00";
      if (score <= 15) return "#F7941D";
      return "#ED1C24";
    }

    if (riskType === "Process") {
      if (score <= 2) return "#8DC63F";
      if (score <= 9) return "#FFFF00";
      if (score <= 15) return "#F7941D";
      return "#ED1C24";
    }

    if (riskType === "Environmental") {
      if (score <= 2) return "#8DC63F";
      if (score <= 9) return "#FFFF00";
      if (score <= 15) return "#F7941D";
      return "#ED1C24";
    }
    
    // Default
    if (score <= 2) return "#8DC63F";
    if (score <= 4) return "#FFFF00";
    if (score <= 10) return "#F7941D";
    return "#ED1C24";
  };

  const getRiskScoreLabel = (score, riskType) => {
    if (riskType === "" || score === 0) return 'Not Assessed';
    
    if (score <= 2) return 'Low Risk';
    if (score <= 9) return 'Medium Risk';
    if (score <= 15) return 'High Risk';
    return 'Critical Risk';
  };

  const renderRiskItem = (risk, index) => {
    const isExpanded = expandedRisks.has(index);
    const asIsScore = calculateRiskScore(risk.asIsLikelihood, risk.asIsConsequence, risk.riskType);
    const mitigatedScore = calculateRiskScore(risk.mitigatedLikelihood, risk.mitigatedConsequence, risk.riskType);
    const consequenceLabels = getConsequenceLabels(risk.riskType);

    return (
      <View key={risk.id || index} style={styles.riskItem}>
        {/* Risk Header */}
        <TouchableOpacity
          style={styles.riskHeader}
          onPress={() => toggleExpanded(index)}
        >
          <View style={styles.riskHeaderLeft}>
            <Ionicons 
              name={isExpanded ? "chevron-down" : "chevron-forward"} 
              size={20} 
              color="#64748b" 
            />
            <Text style={styles.riskTitle}>
              Risk {index + 1}: {risk.riskDescription || 'Untitled Risk'}
            </Text>
          </View>
          <View style={styles.riskHeaderRight}>
            <View style={[styles.riskScoreBadge, { backgroundColor: getRiskScoreColor(asIsScore, risk.riskType) }]}>
              <Text style={styles.riskScoreText}>{asIsScore}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeRiskButton}
              onPress={() => removeRisk(index)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Expanded Risk Details */}
        {isExpanded && (
          <View style={styles.riskDetails}>
            {/* Risk Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Risk Description</Text>
              <TextInput
                style={[styles.textInput, styles.riskDescriptionInput]}
                value={risk.riskDescription}
                onChangeText={(value) => updateRisk(index, 'riskDescription', value)}
                placeholder="E.g., Risk of pinch point"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Risk Type and Associated Risks */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.fieldLabel}>Risk Type</Text>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={() => showRiskTypePicker(index)}
                >
                  <Text style={[
                    styles.iosPickerText, 
                    !risk.riskType && styles.iosPickerPlaceholder
                  ]}>
                    {getRiskTypeDisplayText(risk.riskType)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.fieldLabel}>Associated Risks</Text>
                <TouchableOpacity
                  style={styles.associatedRisksButton}
                  onPress={() => {
                    if (risk.riskType) {
                      setActiveRiskIndex(index);
                      setShowAsIsMatrix(true);
                    }
                  }}
                  disabled={!risk.riskType}
                >
                  {risk.riskType && asIsScore > 0 ? (
                    <View style={styles.associatedRisksSelected}>
                      <View style={[styles.riskScoreBadge, { backgroundColor: getRiskScoreColor(asIsScore, risk.riskType) }]}>
                        <Text style={styles.riskScoreText}>Score {asIsScore}</Text>
                      </View>
                      <View style={styles.associatedRisksInfo}>
                        <Text style={styles.associatedRisksTitle}>
                          {risk.asIsLikelihood} and {risk.asIsConsequence}
                        </Text>
                        <Text style={styles.associatedRisksSubtitle}>
                          {getRiskScoreLabel(asIsScore, risk.riskType)}
                        </Text>
                      </View>
                    </View>
                  ) : risk.riskType ? (
                    <View style={styles.associatedRisksPlaceholder}>
                      <Text style={styles.associatedRisksPlaceholderText}>
                        Tap to assess risk
                      </Text>
                      <Text style={styles.associatedRisksSubtext}>
                        Open risk matrix to assess {risk.riskType} risks
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.associatedRisksPlaceholder}>
                      <Text style={styles.associatedRisksPlaceholderText}>
                        Not assessed
                      </Text>
                      <Text style={styles.associatedRisksSubtext}>
                        Please select a risk type before assessing risks
                      </Text>
                    </View>
                  )}
                  {risk.riskType && (
                    <Ionicons name="chevron-forward" size={16} color="#6b7280" style={styles.chevronIcon} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Mitigating Action */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Mitigating Action</Text>
              <TextInput
                style={[styles.textInput, styles.mitigatingActionInput]}
                value={risk.mitigatingAction}
                onChangeText={(value) => updateRisk(index, 'mitigatingAction', value)}
                placeholder="E.g., Wear gloves"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Mitigating Action Type and Post-Mitigation Risk Assessment */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.fieldLabel}>Mitigating Action Type</Text>
                <TouchableOpacity
                  style={styles.iosPickerButton}
                  onPress={() => showMitigatingActionTypePicker(index)}
                >
                  <Text style={[
                    styles.iosPickerText, 
                    !risk.mitigatingActionType && styles.iosPickerPlaceholder
                  ]}>
                    {getMitigatingActionTypeDisplayText(risk.mitigatingActionType)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.fieldLabel}>Post-Mitigation Risk Assessment</Text>
                <TouchableOpacity
                  style={styles.postMitigationButton}
                  onPress={() => {
                    if (risk.mitigatingActionType) {
                      setActiveRiskIndex(index);
                      setShowMitigatedMatrix(true);
                    }
                  }}
                  disabled={!risk.mitigatingActionType}
                >
                  {risk.mitigatingActionType && mitigatedScore > 0 ? (
                    <View style={styles.postMitigationSelected}>
                      {mitigatedScore > 9 && (
                        <View style={styles.supervisorSignatureWarning}>
                          <Ionicons name="warning" size={16} color="#f59e0b" />
                          <Text style={styles.supervisorSignatureText}>
                            Supervisor Signature Required
                          </Text>
                        </View>
                      )}
                      <View style={styles.postMitigationInfo}>
                        <View style={[styles.riskScoreBadge, { backgroundColor: getRiskScoreColor(mitigatedScore, risk.riskType) }]}>
                          <Text style={styles.riskScoreText}>Score {mitigatedScore}</Text>
                        </View>
                        <View style={styles.mitigatedRiskDetails}>
                          <Text style={styles.mitigatedRiskTitle}>
                            {risk.mitigatedLikelihood} and {risk.mitigatedConsequence}
                          </Text>
                          <Text style={styles.mitigatedRiskSubtitle}>
                            {getRiskScoreLabel(mitigatedScore, risk.riskType)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : risk.mitigatingActionType ? (
                    <View style={styles.postMitigationPlaceholder}>
                      <Text style={styles.postMitigationPlaceholderText}>
                        Tap to assess post-mitigation risk
                      </Text>
                      <Text style={styles.postMitigationSubtext}>
                        Open risk matrix to assess risks after mitigation
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.postMitigationPlaceholder}>
                      <Text style={styles.postMitigationPlaceholderText}>
                        Select mitigating action type first
                      </Text>
                      <Text style={styles.postMitigationSubtext}>
                        Please select a mitigating action type before assessing post-mitigation risks
                      </Text>
                    </View>
                  )}
                  {risk.mitigatingActionType && (
                    <Ionicons name="chevron-forward" size={16} color="#6b7280" style={styles.chevronIcon} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Supervisor Signature Required */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => updateRisk(index, 'requiresSupervisorSignature', !risk.requiresSupervisorSignature)}
            >
              <View style={[styles.checkbox, risk.requiresSupervisorSignature && styles.checkboxChecked]}>
                {risk.requiresSupervisorSignature && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Requires Supervisor Signature</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Risk Assessment</Text>
        <TouchableOpacity style={styles.addButton} onPress={addRisk}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Risk</Text>
        </TouchableOpacity>
      </View>

      {risks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyStateText}>No risks added yet</Text>
          <Text style={styles.emptyStateSubtext}>Add at least one risk to continue</Text>
        </View>
      ) : (
        <ScrollView style={styles.risksList} showsVerticalScrollIndicator={false}>
          {risks.map((risk, index) => renderRiskItem(risk, index))}
        </ScrollView>
      )}

      {/* Risk Matrix Modals */}
      <RiskMatrixModal
        visible={showAsIsMatrix}
        onClose={() => setShowAsIsMatrix(false)}
        onSelect={handleAsIsRiskSelection}
        riskType={risks[activeRiskIndex]?.riskType || 'Personnel'}
        title="Associated Risks"
        selectedLikelihood={risks[activeRiskIndex]?.asIsLikelihood}
        selectedConsequence={risks[activeRiskIndex]?.asIsConsequence}
      />

      <RiskMatrixModal
        visible={showMitigatedMatrix}
        onClose={() => setShowMitigatedMatrix(false)}
        onSelect={handleMitigatedRiskSelection}
        riskType={risks[activeRiskIndex]?.riskType || 'Personnel'}
        title="Post-Mitigation Risk Assessment"
        isPostMitigation={true}
        requiresSupervisorSignature={risks[activeRiskIndex]?.requiresSupervisorSignature}
        selectedLikelihood={risks[activeRiskIndex]?.mitigatedLikelihood}
        selectedConsequence={risks[activeRiskIndex]?.mitigatedConsequence}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(52, 73, 94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  risksList: {
    flex: 1,
  },
  riskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  riskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  riskHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskScoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeRiskButton: {
    padding: 4,
  },
  riskDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sectionContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#111827',
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  picker: {
    height: 40,
  },
  iosPickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  iosPickerText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  iosPickerPlaceholder: {
    color: '#9ca3af',
  },
  riskScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  riskScoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgb(52, 73, 94)',
    borderColor: 'rgb(52, 73, 94)',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  riskDescriptionInput: {
    minHeight: 80,
    borderColor: '#000',
    borderWidth: 2,
  },
  mitigatingActionInput: {
    minHeight: 80,
    borderColor: '#000',
    borderWidth: 2,
  },
  associatedRisksButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
    minHeight: 80,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  associatedRisksSelected: {
    flex: 1,
  },
  associatedRisksInfo: {
    marginLeft: 8,
  },
  associatedRisksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  associatedRisksSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  associatedRisksPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  associatedRisksPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
  associatedRisksSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  postMitigationButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
    minHeight: 120,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postMitigationSelected: {
    flex: 1,
  },
  supervisorSignatureWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  supervisorSignatureText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    marginLeft: 4,
  },
  postMitigationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mitigatedRiskDetails: {
    marginLeft: 8,
  },
  mitigatedRiskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  mitigatedRiskSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  postMitigationPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMitigationPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
  postMitigationSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  mitigatedAssessmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  assessmentItem: {
    flex: 1,
  },
  assessmentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  smallPickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  smallPicker: {
    height: 35,
  },
  currentRiskSection: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
});

export default TaskRisksComponent;
