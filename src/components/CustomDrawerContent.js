import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/AuthService';

const menuItems = [
  {
    name: 'Dashboard',
    icon: 'home-outline',
    route: 'Dashboard',
    color: '#3b82f6',
    hasSubItems: false,
  },
  {
    name: 'Asset Hierarchy',
    icon: 'git-network-outline',
    route: 'AssetHierarchy',
    color: '#06b6d4',
    hasSubItems: false,
  },
  {
    name: 'Tactics',
    icon: 'settings-outline',
    route: 'Tactics',
    color: '#ef4444',
    hasSubItems: false,
  },
  {
    name: 'Safety',
    icon: 'shield-checkmark-outline',
    route: 'Safety',
    color: '#22c55e',
    hasSubItems: true,
    subItems: [
      { name: 'Task Hazard', route: 'TaskHazard' },
      { name: 'Risk Assessment', route: 'RiskAssessment' },
      { name: 'Approval Requests', route: 'ApprovalRequests' },
    ],
  },
  {
    name: 'Analytics',
    icon: 'bar-chart-outline',
    route: 'Analytics',
    color: '#f97316',
    hasSubItems: true,
    subItems: [
      { name: 'Task Hazard', route: 'AnalyticsTaskHazard' },
      { name: 'Risk Assessment', route: 'AnalyticsRiskAssessment' },
    ],
  },
  {
    name: 'Configurations',
    icon: 'cog-outline',
    route: 'Configurations',
    color: '#a855f7',
    hasSubItems: true,
    subItems: [
      { 
        name: 'Admin', 
        route: 'ConfigAdmin',
        hasSubItems: true,
        subItems: [
          { name: 'User Management', route: 'UserManagement' },
          { name: 'Data Loader', route: 'DataLoader' },
          { name: 'Licensing', route: 'Licensing' },
        ]
      },
    ],
  },
];

export default function CustomDrawerContent(props) {
  const { navigation, state } = props;
  const currentRoute = state.routeNames[state.index];
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const toggleMenu = (index) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMenus(newExpanded);
  };

  const handleMenuPress = (item, index) => {
    if (item.hasSubItems) {
      toggleMenu(index);
    } else {
      navigation.navigate(item.route);
    }
  };

  const handleSubItemPress = (subItem, parentIndex, subIndex) => {
    if (subItem.hasSubItems) {
      // Toggle nested sub-items
      const nestedKey = `${parentIndex}-${subIndex}`;
      const newExpanded = new Set(expandedMenus);
      if (newExpanded.has(nestedKey)) {
        newExpanded.delete(nestedKey);
      } else {
        newExpanded.add(nestedKey);
      }
      setExpandedMenus(newExpanded);
    } else {
      // Navigate to the route
      navigation.navigate(subItem.route);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              // Navigation will be handled by the auth state change in App.js
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="business-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.logoText}>UTAH TECH</Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = currentRoute === item.route;
          const isExpanded = expandedMenus.has(index);
          
          return (
            <View key={index}>
              {/* Main Menu Item */}
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  isActive && styles.activeMenuItem,
                ]}
                onPress={() => handleMenuPress(item, index)}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={20} color="#fff" />
                  </View>
                  <Text style={[
                    styles.menuText,
                    isActive && styles.activeMenuText,
                  ]}>
                    {item.name}
                  </Text>
                </View>
                {item.hasSubItems && (
                  <Ionicons 
                    name={isExpanded ? "chevron-down" : "chevron-forward"} 
                    size={16} 
                    color="#94a3b8" 
                  />
                )}
              </TouchableOpacity>

              {/* Sub Items */}
              {item.hasSubItems && isExpanded && (
                <View style={styles.subItemsContainer}>
                  {item.subItems.map((subItem, subIndex) => {
                    const nestedKey = `${index}-${subIndex}`;
                    const isNestedExpanded = expandedMenus.has(nestedKey);
                    
                    return (
                      <View key={subIndex}>
                        <TouchableOpacity
                          style={[
                            styles.subMenuItem,
                            subItem.hasSubItems && styles.subMenuItemWithChildren
                          ]}
                          onPress={() => handleSubItemPress(subItem, index, subIndex)}
                        >
                          <Text style={styles.subMenuText}>{subItem.name}</Text>
                          {subItem.hasSubItems && (
                            <Ionicons 
                              name={isNestedExpanded ? "chevron-down" : "chevron-forward"} 
                              size={14} 
                              color="#94a3b8" 
                            />
                          )}
                        </TouchableOpacity>
                        
                        {/* Nested Sub Items */}
                        {subItem.hasSubItems && isNestedExpanded && (
                          <View style={styles.nestedSubItemsContainer}>
                            {subItem.subItems.map((nestedSubItem, nestedIndex) => (
                              <TouchableOpacity
                                key={nestedIndex}
                                style={styles.nestedSubMenuItem}
                                onPress={() => navigation.navigate(nestedSubItem.route)}
                              >
                                <Text style={styles.nestedSubMenuText}>{nestedSubItem.name}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <View>
            <Text style={styles.userName}>
              {currentUser?.name || currentUser?.email || 'User'}
            </Text>
            <Text style={styles.userRole}>
              {currentUser?.role || 'User'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(52, 73, 94)',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 73, 94, 0.8)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(52, 73, 94, 0.7)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#fff',
  },
  subItemsContainer: {
    marginLeft: 20,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(148, 163, 184, 0.3)',
  },
  subMenuItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 10,
    borderRadius: 6,
  },
  subMenuItemWithChildren: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subMenuText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '400',
  },
  nestedSubItemsContainer: {
    marginLeft: 40,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(148, 163, 184, 0.2)',
  },
  nestedSubMenuItem: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginHorizontal: 10,
    borderRadius: 6,
  },
  nestedSubMenuText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '400',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 73, 94, 0.8)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userRole: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 6,
  },
});
