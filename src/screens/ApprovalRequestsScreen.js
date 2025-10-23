import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApprovalService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignatureModal from '../components/SignatureModal';
import NetInfo from '@react-native-community/netinfo';

const ApprovalRequestsScreen = () => {
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve'); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [dataSource, setDataSource] = useState('api');

  const statusOptions = [
    { value: 'pending', label: 'Pending Approval', color: '#f59e0b' },
    { value: 'approved', label: 'Approved', color: '#22c55e' },
    { value: 'rejected', label: 'Rejected', color: '#ef4444' },
    { value: 'all', label: 'All Requests', color: '#6b7280' }
  ];

  useEffect(() => {
    loadCurrentUser();
    setupNetworkListener();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchApprovalRequests();
    }
  }, [selectedStatus, currentUser]);

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  };

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const fetchApprovalRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = { includeInvalidated: true };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      
      // Add timestamp to prevent caching issues
      if (isRefresh) {
        params._t = Date.now();
      }

      let allRequests = [];
      let source = 'api';
      
      try {
        // Use ApprovalService which handles offline mode automatically
        const response = await ApprovalService.getApprovals(params);
        allRequests = response.data || [];
        source = response.source || 'api';
        
        setDataSource(source);
        
        if (source === 'cache') {
          // Show info that we're in offline mode
          if (isRefresh && allRequests.length > 0) {
            // Don't show alert on refresh if we have cached data
            console.log('Using cached approval data (offline mode)');
          }
        }
      } catch (approvalError) {
        console.error('Error fetching approvals:', approvalError);
        throw approvalError;
      }
    
      // Filter requests where current user is the supervisor and approval is required
      const filteredRequests = allRequests.filter(request => {
        // Extract supervisor information from the nested structure
        let supervisorEmail = null;
        let supervisorId = null;
        
        // Check if supervisor info is in the approvals array
        if (request.approvals && request.approvals.length > 0) {
          const latestApproval = request.approvals.find(approval => approval.isLatest) || request.approvals[0];
          if (latestApproval && latestApproval.supervisor) {
            supervisorEmail = latestApproval.supervisor.email || latestApproval.supervisor;
            supervisorId = latestApproval.supervisor.id || latestApproval.supervisor._id;
          }
        }
        
        // Fallback to direct supervisor fields
        if (!supervisorEmail) {
          supervisorEmail = request.supervisor || request.supervisorEmail || request.assignedSupervisor;
        }
        if (!supervisorId) {
          supervisorId = request.supervisorId || request.assignedSupervisorId;
        }
        
        // Additional fallback: check if supervisor info is in metadata
        if (!supervisorEmail && request.metadata) {
          try {
            const metadata = typeof request.metadata === 'string' ? JSON.parse(request.metadata) : request.metadata;
            supervisorEmail = metadata.supervisor || metadata.supervisorEmail;
            supervisorId = metadata.supervisorId;
          } catch (e) {
            // Error parsing metadata
          }
        }
        
        // Check if supervisor info is in taskHazardData within approvals
        if (!supervisorEmail && request.approvals && request.approvals.length > 0) {
          const latestApproval = request.approvals.find(approval => approval.isLatest) || request.approvals[0];
          if (latestApproval && latestApproval.taskHazardData) {
            supervisorEmail = latestApproval.taskHazardData.supervisor || latestApproval.taskHazardData.supervisorEmail;
            supervisorId = latestApproval.taskHazardData.supervisorId;
          }
        }
        
        // Only show requests where current user is the assigned supervisor
        const isAssignedSupervisor = supervisorEmail === currentUser.email || 
                                   supervisorEmail === currentUser.id ||
                                   supervisorId === currentUser.id ||
                                   supervisorId === currentUser.email;
        
        // Only show requests that require approval
        const requiresApproval = request.requiresApproval || 
                                request.approvalStatus === 'pending' ||
                                request.status === 'Pending' ||
                                request.approvalRequired ||
                                (request.approvals && request.approvals.some(approval => approval.status === 'pending'));
        
        return isAssignedSupervisor && requiresApproval;
      });
    
      setApprovalRequests(filteredRequests);

    } catch (error) {
      console.error('Error fetching approval requests:', error);
      setError(error.message || 'Failed to load approval requests. Please try again.');
      setDataSource('error');
      
      // Don't show alert for network errors if we tried to refresh
      if (!isRefresh || !error.message?.includes('offline')) {
        Alert.alert(
          'Error',
          error.message || 'Failed to load approval requests. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchApprovalRequests(true);
  };

  const handleApprovalAction = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setComments('');
    setShowApprovalModal(true);
  };

  const handleApproveWithSignature = async (signature) => {
    if (!selectedRequest?.id && !selectedRequest?._id) {
      throw new Error('Task hazard ID is missing');
    }
    
    setIsProcessing(true);
    
    try {
      // Use either id or _id, whichever is available
      const taskHazardId = selectedRequest.id || selectedRequest._id;
      
      // Validate taskHazardId
      if (!taskHazardId || taskHazardId === 'undefined' || taskHazardId === 'null') {
        throw new Error('Invalid task hazard ID: ' + taskHazardId);
      }
      
      // Ensure it's a string
      const safeTaskHazardId = String(taskHazardId);
      
      const approvalData = {
        status: 'Approved',
        comments: comments.trim(),
        signature: signature,
        approvedBy: currentUser.email,
        approvedAt: new Date().toISOString()
      };
      
      const response = await ApprovalService.processApproval(safeTaskHazardId, approvalData);

      // Check if it was saved offline
      const savedOffline = response.source === 'offline';
      
      Alert.alert(
        'Success',
        savedOffline 
          ? 'Task hazard approved and saved offline. Will sync when online.' 
          : 'Task hazard approved successfully!',
        [{ text: 'OK' }]
      );

      // Refresh the list
      await fetchApprovalRequests();
      
      // Close modal
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setComments('');
    } catch (error) {
      console.error('Error approving task hazard:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message?.toLowerCase().includes('network') || 
                            error.message?.toLowerCase().includes('fetch') ||
                            error.code === 'NETWORK_ERROR';
      
      if (isNetworkError) {
        Alert.alert(
          'Network Error',
          'Unable to process approval. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to approve task hazard. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectWithSignature = async (signature) => {
    if (!selectedRequest?.id && !selectedRequest?._id) {
      throw new Error('Task hazard ID is missing');
    }
    
    setIsProcessing(true);
    
    try {
      // Use either id or _id, whichever is available
      const taskHazardId = selectedRequest.id || selectedRequest._id;
      
      // Validate taskHazardId
      if (!taskHazardId || taskHazardId === 'undefined' || taskHazardId === 'null') {
        throw new Error('Invalid task hazard ID: ' + taskHazardId);
      }
      
      // Ensure it's a string
      const safeTaskHazardId = String(taskHazardId);
      
      const rejectionData = {
        status: 'Rejected',
        comments: comments.trim(),
        signature: signature,
        rejectedBy: currentUser.email,
        rejectedAt: new Date().toISOString()
      };
      
      const response = await ApprovalService.processApproval(safeTaskHazardId, rejectionData);

      // Check if it was saved offline
      const savedOffline = response.source === 'offline';
      
      Alert.alert(
        'Success',
        savedOffline 
          ? 'Task hazard rejected and saved offline. Will sync when online.' 
          : 'Task hazard rejected successfully!',
        [{ text: 'OK' }]
      );

      // Refresh the list
      await fetchApprovalRequests();
      
      // Close modal
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setComments('');
    } catch (error) {
      console.error('Error rejecting task hazard:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message?.toLowerCase().includes('network') || 
                            error.message?.toLowerCase().includes('fetch') ||
                            error.code === 'NETWORK_ERROR';
      
      if (isNetworkError) {
        Alert.alert(
          'Network Error',
          'Unable to process rejection. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to reject task hazard. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const processApproval = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      
      const status = approvalAction === 'approve' ? 'Approved' : 'Rejected';
      
      if (!selectedRequest.id) {
        throw new Error('Task hazard ID is missing');
      }
      
      // Use safe ID handling for the old processApproval function too
      const taskHazardId = selectedRequest.id || selectedRequest._id;
      const safeTaskHazardId = String(taskHazardId);
      
      await TaskHazardApi.processApproval(safeTaskHazardId, {
        status,
        comments: comments.trim()
      });

      Alert.alert(
        'Success',
        `Task hazard ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`,
        [{ text: 'OK' }]
      );

      // Refresh the list
      await fetchApprovalRequests();
      
      // Close modal
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setComments('');

    } catch (error) {
      console.error(`Error ${appxrovalAction}ing task hazard:`, error);
      Alert.alert(
        'Error',
        error.message || `Failed to ${approvalAction} task hazard. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': '#f59e0b',
      'approved': '#22c55e',
      'rejected': '#ef4444',
      'active': '#22c55e',
      'inactive': '#6b7280'
    };
    return statusMap[status?.toLowerCase()] || '#6b7280';
  };

  const getRiskColor = (riskScore) => {
    if (riskScore <= 4) return '#22c55e'; // green - low
    if (riskScore <= 9) return '#f59e0b'; // orange - medium
    if (riskScore <= 16) return '#ef4444'; // red - high
    return '#991b1b'; // dark red - critical
  };

  const calculateHighestRiskScore = (risks) => {
    if (!risks || risks.length === 0) return 1;
    
    return Math.max(...risks.map(risk => {
      const likelihoodMap = {
        'Very Unlikely': 1, 'Slight Chance': 2, 'Feasible': 3, 'Likely': 4, 'Very Likely': 5
      };
      const consequenceMap = {
        'Minor': 1, 'Significant': 2, 'Serious': 3, 'Major': 4, 'Catastrophic': 5
      };
      
      const likelihood = likelihoodMap[risk.asIsLikelihood] || parseInt(risk.asIsLikelihood) || 1;
      const consequence = consequenceMap[risk.asIsConsequence] || parseInt(risk.asIsConsequence) || 1;
      
      return likelihood * consequence;
    }));
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const renderStatusDropdown = () => {
    if (!showStatusDropdown) return null;

    return (
      <View style={styles.dropdownContainer}>
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.dropdownItem,
              selectedStatus === option.value && styles.selectedDropdownItem,
            ]}
            onPress={() => {
              setSelectedStatus(option.value);
              setShowStatusDropdown(false);
            }}
          >
            <View style={styles.dropdownItemContent}>
              <View style={[styles.statusDot, { backgroundColor: option.color }]} />
              <Text style={[
                styles.dropdownText,
                selectedStatus === option.value && styles.selectedDropdownText,
              ]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderApprovalRequest = ({ item }) => {
    const latestApproval = item.approvals?.find(approval => approval.isLatest) || item.approvals?.[0];
    const highestRisk = calculateHighestRiskScore(item.risks);
    const individualCount = item.individuals?.length || 0;

    return (
      <View style={styles.requestCard}>
        {/* Header */}
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestTitle} numberOfLines={2}>
              {item.scopeOfWork}
            </Text>
            <Text style={styles.requestSubtitle}>ID: {item.id}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(latestApproval?.status || 'pending') }
          ]}>
            <Text style={styles.statusText}>
              {latestApproval?.status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.date} {item.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>{individualCount} team member{individualCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Risk Summary */}
        <View style={styles.riskSummary}>
          <View style={styles.riskInfo}>
            <Text style={styles.riskLabel}>Risks: {item.risks?.length || 0}</Text>
            <View style={styles.riskScoreContainer}>
              <Text style={styles.riskScoreLabel}>Highest: </Text>
              <View style={[
                styles.riskScoreBadge,
                { backgroundColor: getRiskColor(highestRisk) }
              ]}>
                <Text style={styles.riskScoreText}>{highestRisk}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {latestApproval?.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleApprovalAction(item, 'reject')}
            >
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprovalAction(item, 'approve')}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comments if processed */}
        {latestApproval?.comments && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentsLabel}>Comments:</Text>
            <Text style={styles.commentsText}>{latestApproval.comments}</Text>
            <Text style={styles.processedDate}>
              Processed: {formatDate(latestApproval.processedAt)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderApprovalModal = () => (
    <SignatureModal
      visible={showApprovalModal}
      onClose={() => setShowApprovalModal(false)}
      onApprove={handleApproveWithSignature}
      onReject={handleRejectWithSignature}
      taskHazard={selectedRequest}
      isLoading={isProcessing}
    />
  );

  const renderEmptyState = () => {
    const currentStatusOption = statusOptions.find(opt => opt.value === selectedStatus);
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="clipboard-outline" size={64} color="#94a3b8" />
        <Text style={styles.emptyStateTitle}>No {currentStatusOption?.label}</Text>
        <Text style={styles.emptyStateText}>
          {selectedStatus === 'pending' 
            ? 'There are no pending approval requests at this time.'
            : `No ${currentStatusOption?.label.toLowerCase()} found.`}
        </Text>
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchApprovalRequests()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="rgb(52, 73, 94)" />
      <Text style={styles.loadingText}>Loading approval requests...</Text>
    </View>
  );

  const currentStatusOption = statusOptions.find(opt => opt.value === selectedStatus);
  const pendingCount = approvalRequests.filter(req => {
    const latestApproval = req.approvals?.find(approval => approval.isLatest) || req.approvals?.[0];
    return latestApproval?.status === 'pending';
  }).length;

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Approval Requests</Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[
              styles.refreshButton,
              isRefreshing && styles.refreshButtonActive
            ]}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Ionicons 
                name="refresh" 
                size={20} 
                color="#64748b" 
              />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Offline Indicator */}
        {(isOffline || dataSource === 'cache') && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline-outline" size={16} color="#f59e0b" />
            <Text style={styles.offlineText}>
              {isOffline ? 'Offline Mode - ' : ''}Showing cached data
            </Text>
          </View>
        )}
        
        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.statusDropdownButton}
            onPress={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <View style={styles.statusButtonContent}>
              <View style={[styles.statusDot, { backgroundColor: currentStatusOption?.color }]} />
              <Text style={styles.statusDropdownText}>{currentStatusOption?.label}</Text>
            </View>
            <Ionicons 
              name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#64748b" 
            />
          </TouchableOpacity>
          {renderStatusDropdown()}
        </View>
      </View>

      {/* Content */}
      {approvalRequests.length > 0 ? (
        <FlatList
          data={approvalRequests}
          renderItem={renderApprovalRequest}
          keyExtractor={(item) => item.id.toString()}
          style={styles.requestsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['rgb(52, 73, 94)']}
              tintColor="rgb(52, 73, 94)"
            />
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* Approval Modal */}
      {renderApprovalModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    position: 'relative',
  },
  statusDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 44,
  },
  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDropdownText: {
    fontSize: 16,
    color: '#1e293b',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedDropdownItem: {
    backgroundColor: '#f1f5f9',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1e293b',
  },
  selectedDropdownText: {
    fontWeight: '500',
    color: 'rgb(52, 73, 94)',
  },
  requestsList: {
    flex: 1,
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  requestSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  requestDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  riskSummary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 12,
  },
  riskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  riskScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  riskScoreLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  riskScoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  riskScoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  commentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  processedDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgb(52, 73, 94)',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    gap: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  taskSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  taskSummarySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  taskSummaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  commentsInputSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  commentsInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#fff',
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveConfirmButton: {
    backgroundColor: '#22c55e',
  },
  rejectConfirmButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ApprovalRequestsScreen;
