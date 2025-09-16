import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const userInfo = {
    email: 'hello1@utahtechnicalservicesllc.com',
    role: 'Superuser',
    accessLevel: 'Licensed',
    company: 'Utah Technical Services LLC',
  };

  const dashboardCards = [
    {
      title: 'Asset Hierarchy',
      description: 'Manage and view your asset hierarchy structure',
      icon: 'git-network-outline',
      color: '#06b6d4',
      route: 'AssetHierarchy',
    },
    {
      title: 'Task Hazard',
      description: 'Create and manage task hazard assessments',
      icon: 'shield-checkmark-outline',
      color: '#22c55e',
      route: 'Safety',
    },
    {
      title: 'Risk Assessment',
      description: 'Create and manage risk assessments',
      icon: 'shield-checkmark-outline',
      color: '#22c55e',
      route: 'Safety',
    },
    {
      title: 'Analytics',
      description: 'View analytics and reports',
      icon: 'bar-chart-outline',
      color: '#f97316',
      route: 'Analytics',
    },
  ];

  const quickActions = [
    {
      title: 'Create Task Hazard',
      subtitle: 'Start a new assessment',
      color: '#fef3c7',
      textColor: '#92400e',
    },
    {
      title: 'Risk Assessment',
      subtitle: 'Evaluate risks',
      color: '#dbeafe',
      textColor: '#1e40af',
    },
    {
      title: 'View Assets',
      subtitle: 'Browse hierarchy',
      color: '#d1fae5',
      textColor: '#065f46',
    },
    {
      title: 'Analytics',
      subtitle: 'View reports',
      color: '#ede9fe',
      textColor: '#6b21a8',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          Welcome back, {userInfo.email}!
        </Text>
        <Text style={styles.subtitleText}>
          Superuser Dashboard - Access your tools and manage your work
        </Text>
      </View>

      {/* User Info Cards */}
      <View style={styles.infoCardsContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="person-circle-outline" size={24} color="#7c3aed" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Role</Text>
            <Text style={styles.infoCardValue}>{userInfo.role}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Access Level</Text>
            <Text style={styles.infoCardValue}>{userInfo.accessLevel}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="business-outline" size={24} color="#7c3aed" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Company</Text>
            <Text style={styles.infoCardValue}>{userInfo.company}</Text>
          </View>
        </View>
      </View>

      {/* Main Dashboard Cards */}
      <View style={styles.cardsContainer}>
        {dashboardCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(card.route)}
          >
            <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
              <Ionicons name={card.icon} size={24} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
              <Text style={styles.cardAction}>Click to access →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={[styles.quickActionCard, { backgroundColor: action.color }]}>
              <Text style={[styles.quickActionTitle, { color: action.textColor }]}>
                {action.title}
              </Text>
              <Text style={[styles.quickActionSubtitle, { color: action.textColor }]}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  welcomeContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748b',
  },
  infoCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCardIcon: {
    marginRight: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
  },
});

export default DashboardScreen;
