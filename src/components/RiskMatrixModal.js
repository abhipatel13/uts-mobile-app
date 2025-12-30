import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';

const RiskMatrixModal = ({ 
  visible, 
  onClose, 
  onSelect,
  riskType = 'Personnel',
  title = 'Risk Assessment',
  isPostMitigation = false,
  selectedLikelihood,
  selectedConsequence,
  requiresSupervisorSignature = false
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  const likelihoodLabels = [
    { value: "Very Unlikely", label: "Very Unlikely", description: "Once in lifetime (>75 years)", score: 1 },
    { value: "Slight Chance", label: "Slight Chance", description: "Once in 10-75 years", score: 2 },
    { value: "Feasible", label: "Feasible", description: "Once in 10 years", score: 3 },
    { value: "Likely", label: "Likely", description: "Once in 2-10 years", score: 4 },
    { value: "Very Likely", label: "Very Likely", description: "Multiple times in 2 years", score: 5 },
  ];

  const getConsequenceLabels = (riskType) => {
    switch (riskType) {
      case "Personnel":
        return [
          { value: "Minor", label: "Minor", description: "No lost time", score: 1 },
          { value: "Significant", label: "Significant", description: "Lost time", score: 2 },
          { value: "Serious", label: "Serious", description: "Short-term disability", score: 3 },
          { value: "Major", label: "Major", description: "Long-term disability", score: 4 },
          { value: "Catastrophic", label: "Catastrophic", description: "Fatality", score: 5 },
        ];
      case "Maintenance":
        return [
          { value: "Minor", label: "Minor", description: "<5% impact to maintenance budget", score: 1 },
          { value: "Significant", label: "Significant", description: "5-10% impact to maintenance budget", score: 2 },
          { value: "Serious", label: "Serious", description: "20-30% impact to maintenance budget", score: 3 },
          { value: "Major", label: "Major", description: "30-40% impact to maintenance budget", score: 4 },
          { value: "Catastrophic", label: "Catastrophic", description: ">41% impact to maintenance budget", score: 5 },
        ];
      case "Revenue":
        return [
          { value: "Minor", label: "Minor", description: "<2% impact to revenue", score: 1 },
          { value: "Significant", label: "Significant", description: "2-6% impact to revenue", score: 2 },
          { value: "Serious", label: "Serious", description: "6-12% impact to revenue", score: 3 },
          { value: "Major", label: "Major", description: "12-24% impact to revenue", score: 4 },
          { value: "Catastrophic", label: "Catastrophic", description: ">25% impact to revenue", score: 5 },
        ];
      case "Process":
        return [
          { value: "Minor", label: "Minor", description: "Production loss <10 days", score: 1 },
          { value: "Significant", label: "Significant", description: "Production loss 10-20 days", score: 2 },
          { value: "Serious", label: "Serious", description: "Production loss 20-40 days", score: 3 },
          { value: "Major", label: "Major", description: "Production loss 40-80 days", score: 4 },
          { value: "Catastrophic", label: "Catastrophic", description: "Production loss >81 days", score: 5 },
        ];
      case "Environmental":
        return [
          { value: "Minor", label: "Minor", description: "Near source - non-reportable - cleanup <1 shift", score: 1 },
          { value: "Significant", label: "Significant", description: "Near source - reportable - cleanup <1 shift", score: 2 },
          { value: "Serious", label: "Serious", description: "Near source - reportable - cleanup <4 weeks", score: 3 },
          { value: "Major", label: "Major", description: "Near source - reportable - cleanup <52 weeks", score: 4 },
          { value: "Catastrophic", label: "Catastrophic", description: "Near source - reportable - cleanup <1 week", score: 5 },
        ];
      default:
        return getConsequenceLabels("Personnel");
    }
  };

  const consequenceLabels = getConsequenceLabels(riskType);

  // Risk matrix scores
  const riskMatrix = [
    [1, 2, 3, 4, 5],    // Very Unlikely (1)
    [2, 4, 6, 8, 10],   // Slight Chance (2)
    [3, 6, 9, 12, 15],  // Feasible (3)
    [4, 8, 12, 16, 20], // Likely (4)
    [5, 10, 15, 20, 25] // Very Likely (5)
  ];

  const getRiskScore = (likelihoodIndex, consequenceIndex) => {
    return riskMatrix[likelihoodIndex][consequenceIndex];
  };


  const getRiskColor = (score) => {
    if (score <= 2) return '#8DC63F'; // Low Risk - Green
    if (score <= 9) return '#FFFF00'; // Medium Risk - Yellow
    if (score <= 15) return '#F7941D'; // High Risk - Orange
    return '#ED1C24'; // Critical Risk - Red
  };

  const getRiskColorCategory = (score) => {
    if (score <= 2) return 'Low Risk (1-2)';
    if (score <= 9) return 'Medium Risk (3-9)';
    if (score <= 15) return 'High Risk (10-15)';
    return 'Critical Risk (16-25)';
  };

  const handleCellPress = (likelihoodIndex, consequenceIndex) => {
    const likelihood = likelihoodLabels[likelihoodIndex];
    const consequence = consequenceLabels[consequenceIndex];
    const score = getRiskScore(likelihoodIndex, consequenceIndex);
    
    setSelectedCell({ 
      likelihood, 
      consequence, 
      score, 
      likelihoodIndex, 
      consequenceIndex 
    });
  };

  const handleDone = () => {
    if (selectedCell) {
      onSelect(selectedCell.likelihood.value, selectedCell.consequence.value, selectedCell.score);
    }
    onClose();
  };

  // Set initial selection if provided
  useEffect(() => {
    if (selectedLikelihood && selectedConsequence) {
      const likelihoodIndex = likelihoodLabels.findIndex(l => l.value === selectedLikelihood);
      const consequenceIndex = consequenceLabels.findIndex(c => c.value === selectedConsequence);
      
      if (likelihoodIndex !== -1 && consequenceIndex !== -1) {
        const likelihood = likelihoodLabels[likelihoodIndex];
        const consequence = consequenceLabels[consequenceIndex];
        const score = getRiskScore(likelihoodIndex, consequenceIndex);
        
        setSelectedCell({ 
          likelihood, 
          consequence, 
          score, 
          likelihoodIndex, 
          consequenceIndex 
        });
      }
    }
  }, [selectedLikelihood, selectedConsequence, riskType]);

  const renderMatrixCell = (likelihoodIndex, consequenceIndex) => {
    const score = getRiskScore(likelihoodIndex, consequenceIndex);
    const isSelected = selectedCell && 
      selectedCell.likelihoodIndex === likelihoodIndex && 
      selectedCell.consequenceIndex === consequenceIndex;
    
    return (
      <TouchableOpacity
        key={`${likelihoodIndex}-${consequenceIndex}`}
        style={[
          styles.matrixCell,
          { backgroundColor: getRiskColor(score) },
          isSelected && styles.selectedCell
        ]}
        onPress={() => handleCellPress(likelihoodIndex, consequenceIndex)}
      >
        <Text style={styles.matrixCellText}>{score}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {title} - {riskType} Assessment
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Risk Type Badge */}
          <View style={styles.riskTypeBadge}>
            <Text style={styles.riskTypeText}>Risk Type: </Text>
            <View style={styles.riskTypeLabel}>
              <Text style={styles.riskTypeLabelText}>{riskType}</Text>
            </View>
          </View>

          {/* Risk Matrix */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.matrixScrollContainer}
            contentContainerStyle={styles.matrixScrollContent}
          >
            <View style={styles.matrixContainer}>
              {/* Headers */}
              <View style={styles.matrixHeader}>
                <View style={styles.probabilityHeader}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.headerTextScroll}>
                    <Text style={styles.headerText}>Probability</Text>
                  </ScrollView>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.headerSubtextScroll}>
                    <Text style={styles.headerSubtext}>Severity →</Text>
                  </ScrollView>
                </View>
                
                {/* Consequence Headers */}
                {consequenceLabels.map((consequence, index) => (
                  <View key={consequence.value} style={styles.consequenceHeader}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.consequenceHeaderTextScroll}>
                      <Text style={styles.consequenceHeaderText}>{consequence.label}</Text>
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.consequenceHeaderSubtextScroll}>
                      <Text style={styles.consequenceHeaderSubtext}>{consequence.description}</Text>
                    </ScrollView>
                    <Text style={styles.consequenceScore}>{consequence.score}</Text>
                  </View>
                ))}
              </View>

              {/* Matrix Rows */}
              {likelihoodLabels.map((likelihood, likelihoodIndex) => (
                <View key={likelihood.value} style={styles.matrixRow}>
                  {/* Likelihood Header */}
                  <View style={styles.likelihoodHeader}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.likelihoodHeaderTextScroll}>
                      <Text style={styles.likelihoodHeaderText}>{likelihood.label}</Text>
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.likelihoodHeaderSubtextScroll}>
                      <Text style={styles.likelihoodHeaderSubtext}>{likelihood.description}</Text>
                    </ScrollView>
                    <Text style={styles.likelihoodScore}>{likelihood.score}</Text>
                  </View>
                  
                  {/* Matrix Cells */}
                  {consequenceLabels.map((_, consequenceIndex) => 
                    renderMatrixCell(likelihoodIndex, consequenceIndex)
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Risk Legend */}
          <View style={styles.riskLegend}>
            {[
              { label: 'Low Risk (1-2)', color: '#8DC63F' },
              { label: 'Medium Risk (3-9)', color: '#FFFF00' },
              { label: 'High Risk (10-15)', color: '#F7941D' },
              { label: 'Critical Risk (16-25)', color: '#ED1C24' },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Selection Summary */}
          {selectedCell && (
            <View style={styles.selectionSummary}>
              <Text style={styles.selectionTitle}>Selected Risk Assessment:</Text>
              <Text 
                style={styles.selectionText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {selectedCell.likelihood.label} and {selectedCell.consequence.label}
              </Text>
              <View style={styles.selectionScore}>
                <Text style={styles.selectionScoreLabel}>Score: </Text>
                <View style={[styles.scoreBadge, { backgroundColor: getRiskColor(selectedCell.score) }]}>
                  <Text style={styles.scoreBadgeText}>{selectedCell.score}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.doneButton, !selectedCell && styles.doneButtonDisabled]}
            onPress={handleDone}
            disabled={!selectedCell}
          >
            <Text style={[styles.doneButtonText, !selectedCell && styles.doneButtonTextDisabled]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  supervisorWarning: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  supervisorWarningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supervisorWarningText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  riskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskTypeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  riskTypeLabel: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskTypeLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  matrixScrollContainer: {
    marginBottom: 20,
  },
  matrixScrollContent: {
    flexGrow: 0,
  },
  matrixContainer: {
    minWidth: SCREEN_WIDTH - 32, // Minimum width to fit screen
  },
  matrixHeader: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  probabilityHeader: {
    minWidth: 80, // Minimum width to fit text
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 0,
    borderWidth: 0,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    flexShrink: 0,
  },
  headerSubtext: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
    flexShrink: 0,
  },
  headerTextScroll: {
    flexShrink: 1,
  },
  headerSubtextScroll: {
    flexShrink: 1,
  },
  consequenceHeader: {
    minWidth: 70, // Minimum width to fit text
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 0,
    borderWidth: 0,
  },
  consequenceHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    flexShrink: 0,
  },
  consequenceHeaderSubtext: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  consequenceHeaderTextScroll: {
    flexShrink: 1,
  },
  consequenceHeaderSubtextScroll: {
    flexShrink: 1,
  },
  consequenceScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 1,
  },
  matrixRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  likelihoodHeader: {
    minWidth: 80, // Minimum width to fit text
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 0,
    borderWidth: 0,
  },
  likelihoodHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    flexShrink: 0,
  },
  likelihoodHeaderSubtext: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  likelihoodHeaderTextScroll: {
    flexShrink: 1,
  },
  likelihoodHeaderSubtextScroll: {
    flexShrink: 1,
  },
  likelihoodScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 1,
  },
  matrixCell: {
    minWidth: 70, // Match consequence header width
    width: 70,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  selectedCell: {
    borderWidth: 3,
    borderColor: '#1d4ed8',
    margin: 0,
  },
  matrixCellText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  riskLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  selectionSummary: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  selectionText: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 8,
    lineHeight: 18,
  },
  selectionScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionScoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  doneButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default RiskMatrixModal;
