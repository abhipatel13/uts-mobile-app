import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConfigurationsScreen = () => {
  const configItems = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: 'people-outline',
      color: '#3b82f6',
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: 'settings-outline',
      color: '#6b7280',
    },
    {
      title: 'Licensing',
      description: 'Manage licenses and allocations',
      icon: 'key-outline',
      color: '#8b5cf6',
    },
    {
      title: 'Notifications',
      description: 'Configure notification settings',
      icon: 'notifications-outline',
      color: '#f59e0b',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurations</Text>
        <Text style={styles.subtitle}>Manage system configurations and settings</Text>
      </View>

      <View style={styles.cardsContainer}>
        {configItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.card}>
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

      <View style={styles.adminSection}>
        <Text style={styles.sectionTitle}>Admin Tools</Text>
        <TouchableOpacity style={styles.adminCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#ef4444" />
          <Text style={styles.adminText}>Admin Panel</Text>
          <Text style={styles.adminDescription}>Access administrative functions</Text>
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
  adminSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  adminCard: {
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
  adminText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  adminDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default ConfigurationsScreen;
