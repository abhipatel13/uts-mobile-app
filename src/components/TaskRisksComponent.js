import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const TaskRisksComponent = ({ risks = [], onRisksChange }) => {
  const [expandedRisks, setExpandedRisks] = useState(new Set());

  const defaultRisk = {
    riskDescription: '',
    riskType: 'Safety',
    asIsLikelihood: 1,
    asIsConsequence: 1,
    mitigatingAction: '',
    mitigatingActionType: 'PPE',
    mitigatedLikelihood: 1,
    mitigatedConsequence: 1,
    requiresSupervisorSignature: false,
  };

  const riskTypes = [
    'Safety', 'Environmental', 'Quality', 'Security', 'Operational'
  ];

  const mitigatingActionTypes = [
    'PPE', 'Training', 'Procedure', 'Engineering Control', 'Administrative Control'
  ];

  const likelihoodOptions = [
    { label: 'Very Unlikely (1)', value: 1 },
    { label: 'Slight Chance (2)', value: 2 },
    { label: 'Feasible (3)', value: 3 },
    { label: 'Likely (4)', value: 4 },
    { label: 'Very Likely (5)', value: 5 },
  ];

  const consequenceOptions = [
    { label: 'Minor (1)', value: 1 },
    { label: 'Significant (2)', value: 2 },
    { label: 'Serious (3)', value: 3 },
    { label: 'Major (4)', value: 4 },
    { label: 'Catastrophic (5)', value: 5 },
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
    onRisksChange(newRisks);
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

  const calculateRiskScore = (likelihood, consequence) => {
    return likelihood * consequence;
  };

  const getRiskScoreColor = (score) => {
    if (score <= 4) return '#22c55e'; // green - low
    if (score <= 9) return '#f59e0b'; // orange - medium
    if (score <= 16) return '#ef4444'; // red - high
    return '#991b1b'; // dark red - critical
  };

  const getRiskScoreLabel = (score) => {
    if (score <= 4) return 'Low';
    if (score <= 9) return 'Medium';
    if (score <= 16) return 'High';
    return 'Critical';
  };

  const renderRiskItem = (risk, index) => {
    const isExpanded = expandedRisks.has(index);
    const asIsScore = calculateRiskScore(risk.asIsLikelihood, risk.asIsConsequence);
    const mitigatedScore = calculateRiskScore(risk.mitigatedLikelihood, risk.mitigatedConsequence);

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
            <View style={[styles.riskScoreBadge, { backgroundColor: getRiskScoreColor(asIsScore) }]}>
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
              <Text style={styles.fieldLabel}>Risk Description *</Text>
              <TextInput
                style={styles.textInput}
                value={risk.riskDescription}
                onChangeText={(value) => updateRisk(index, 'riskDescription', value)}
                placeholder="Describe the potential risk"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Risk Type and Mitigating Action Type */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.fieldLabel}>Risk Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={risk.riskType}
                    onValueChange={(value) => updateRisk(index, 'riskType', value)}
                    style={styles.picker}
                  >
                    {riskTypes.map(type => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.fieldLabel}>Mitigation Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={risk.mitigatingActionType}
                    onValueChange={(value) => updateRisk(index, 'mitigatingActionType', value)}
                    style={styles.picker}
                  >
                    {mitigatingActionTypes.map(type => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* As-Is Risk Assessment */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Current Risk Assessment</Text>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.fieldLabel}>Likelihood</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={risk.asIsLikelihood}
                      onValueChange={(value) => updateRisk(index, 'asIsLikelihood', value)}
                      style={styles.picker}
                    >
                      {likelihoodOptions.map(option => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.fieldLabel}>Consequence</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={risk.asIsConsequence}
                      onValueChange={(value) => updateRisk(index, 'asIsConsequence', value)}
                      style={styles.picker}
                    >
                      {consequenceOptions.map(option => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              <View style={styles.riskScoreContainer}>
                <Text style={styles.riskScoreLabel}>Current Risk Score: </Text>
                <View style={[styles.riskScoreBadge, { backgroundColor: getRiskScoreColor(asIsScore) }]}>
                  <Text style={styles.riskScoreText}>{asIsScore} - {getRiskScoreLabel(asIsScore)}</Text>
                </View>
              </View>
            </View>

            {/* Mitigating Action */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Mitigating Action *</Text>
              <TextInput
                style={styles.textInput}
                value={risk.mitigatingAction}
                onChangeText={(value) => updateRisk(index, 'mitigatingAction', value)}
                placeholder="Describe the action to mitigate this risk"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Mitigated Risk Assessment */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Mitigated Risk Assessment</Text>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.fieldLabel}>Likelihood</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={risk.mitigatedLikelihood}
                      onValueChange={(value) => updateRisk(index, 'mitigatedLikelihood', value)}
                      style={styles.picker}
                    >
                      {likelihoodOptions.map(option => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.fieldLabel}>Consequence</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={risk.mitigatedConsequence}
                      onValueChange={(value) => updateRisk(index, 'mitigatedConsequence', value)}
                      style={styles.picker}
                    >
                      {consequenceOptions.map(option => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              <View style={styles.riskScoreContainer}>
                <Text style={styles.riskScoreLabel}>Mitigated Risk Score: </Text>
                <View style={[styles.riskScoreBadge, { backgroundColor: getRiskScoreColor(mitigatedScore) }]}>
                  <Text style={styles.riskScoreText}>{mitigatedScore} - {getRiskScoreLabel(mitigatedScore)}</Text>
                </View>
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
});

export default TaskRisksComponent;
