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
import { triggerGlobalLogout } from '../utils/globalHandlers';

const allMenuItems = [
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
    name: 'Notifications',
    icon: 'notifications-outline',
    route: 'Notifications',
    color: '#8b5cf6',
    hasSubItems: false,
  },
];

export default function CustomDrawerContent(props) {
  const { navigation, state, currentUserRole } = props;
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
      console.error('CustomDrawerContent: loadCurrentUser failed:', error.message);
    }
  };

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    const userRole = currentUserRole || currentUser?.role;
    
    // If user role is 'user', show limited menu
    if (userRole === 'user') {
      return allMenuItems
        .filter(item => {
          // Remove Dashboard
          if (item.name === 'Dashboard') return false;
          // Remove Analytics
          if (item.name === 'Analytics') return false;
          // Keep Asset Hierarchy, Safety, and Notifications
          return item.name === 'Asset Hierarchy' || item.name === 'Safety' || item.name === 'Notifications';
        })
        .map(item => {
          // Filter Safety subItems to only show Task Hazard
          if (item.name === 'Safety' && item.hasSubItems) {
            return {
              ...item,
              subItems: item.subItems.filter(subItem => subItem.name === 'Task Hazard')
            };
          }
          return item;
        });
    }
    
    // If user role is 'supervisor', show specific menu items
    if (userRole === 'supervisor') {
      return allMenuItems
        .filter(item => {
          // Remove Dashboard
          if (item.name === 'Dashboard') return false;
          // Keep Asset Hierarchy, Safety, Analytics, and Notifications
          return item.name === 'Asset Hierarchy' || item.name === 'Safety' || item.name === 'Analytics' || item.name === 'Notifications';
        })
        .map(item => {
          // Filter Safety subItems - show all (Task Hazard, Risk Assessment, Approval Requests)
          if (item.name === 'Safety' && item.hasSubItems) {
            // Keep all Safety subItems for supervisor
            return item;
          }
          // Filter Analytics subItems - show Task Hazard and Risk Assessment (remove Approval Requests if it exists)
          if (item.name === 'Analytics' && item.hasSubItems) {
            return {
              ...item,
              subItems: item.subItems.filter(subItem => 
                subItem.name === 'Task Hazard' || subItem.name === 'Risk Assessment'
              )
            };
          }
          return item;
        });
    }
    
    // For admin and superuser roles - show ALL menu items with full access
    // This includes: Dashboard, Asset Hierarchy, Safety (all sub-items), Analytics (all sub-items)
    if (userRole === 'admin' || userRole === 'superuser') {
      return allMenuItems;
    }
    
    // Default fallback - show all menu items (for any other roles)
    return allMenuItems;
  };

  const menuItems = getFilteredMenuItems();

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
              // Trigger global logout to update auth state in App.js
              triggerGlobalLogout();
            } catch (error) {
              console.error('CustomDrawerContent: handleLogout failed:', error.message);
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
        <TouchableOpacity 
          style={styles.logoContainer}
          onPress={() => {
            navigation.navigate('Dashboard');
            props.onClose?.(); // Close sidebar if onClose is available
          }}
          activeOpacity={0.7}
        >
          <Image 
            source={require('../../assets/uts-logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
            fadeDuration={0}
            backgroundColor="transparent"
          />
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 10,
    minHeight: 80,
  },
  logoImage: {
    width: 160,
    height: 60,
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
