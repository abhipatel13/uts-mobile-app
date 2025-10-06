import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SafetyScreen = ({ navigation }) => {
  const safetyItems = [
    {
      title: 'Task Hazard',
      description: 'Create and manage task hazard assessments',
      icon: 'warning-outline',
      color: '#f59e0b',
      route: 'TaskHazard',
    },
    {
      title: 'Risk Assessment',
      description: 'Evaluate and manage risk assessments',
      icon: 'shield-checkmark-outline',
      color: '#22c55e',
      route: 'RiskAssessment',
    },
  ];

  const handleSafetyItemPress = (item) => {
    try {
      navigation.navigate(item.route);
    } catch (error) {
      console.error('SafetyScreen: handleSafetyItemPress - Navigation error:', error.message);
    }
  };

  const handleCreateAssessment = () => {
    // For now, navigate to TaskHazard as default
    navigation.navigate('TaskHazard');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety Overview</Text>
        <Text style={styles.subtitle}>Manage safety assessments and protocols</Text>
      </View>

      <View style={styles.cardsContainer}>
        {safetyItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card}
            onPress={() => handleSafetyItemPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={24} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <Text style={styles.cardAction}>Click to access →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={handleCreateAssessment}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={32} color="#22c55e" />
          <Text style={styles.quickActionText}>Create New Assessment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardAction: {
    fontSize: 12,
    color: '#64748b',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 8,
  },
});

export default SafetyScreen;
