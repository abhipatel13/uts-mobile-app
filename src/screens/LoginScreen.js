import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { triggerAuthRefresh } from '../utils/globalHandlers';
import CustomAlertModal from '../components/CustomAlertModal';
import { useCustomAlert } from '../hooks/useCustomAlert';

export default function LoginScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { alertState, showAlert, hideAlert, showSuccessAlert, showErrorAlert } = useCustomAlert();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Call your backend API here
      const response = await fetch('https://18.188.112.65.nip.io/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          company: formData.company,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.status) {
        throw new Error('Invalid response from server');
      }

      const { user, token } = data.data;


      // Fetch complete user information using UserService
      try {
        const userResponse = await UserService.getOne(user._id);
        
        if (userResponse && userResponse.data) {
          const userData = userResponse.data;
          
          // Store complete user data
          await AsyncStorage.setItem('user', JSON.stringify({
            id: userData._id || userData.id,
            email: userData.email,
            name: userData.name || userData.fullName,
            fullName: userData.fullName || userData.name,
            role: userData.role,
            company: userData.company?.name || userData.company?.id || user.company.name || user.company.id,
            isAuthenticated: true,
            ...userData // Store all additional user data
          }));
        } else {
          throw new Error('No user data received');
        }
      } catch (userFetchError) {
        console.warn('Error fetching complete user data:', userFetchError);
        // Fallback to basic user data
        await AsyncStorage.setItem('user', JSON.stringify({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company.name || user.company.id,
          isAuthenticated: true,
        }));
      }

      await AsyncStorage.setItem('authToken', token);
      // Trigger immediate auth refresh to navigate to dashboard
      triggerAuthRefresh();

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Clear any existing errors
    setError('');
    
    // Validate email
    if (!formData.email) {
      setError('Please enter your email to reset your password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await AuthService.forgotPassword(formData.email);
      
      if (!response || !response.status) {
        throw new Error(response?.message || 'Failed to send reset email');
      }

      // Show success message
      showSuccessAlert(
        'Password Reset Email Sent',
        `If an account exists for ${formData.email}, we have sent a password reset link. Please check your inbox and spam folder.`
      );
    } catch (apiError) {
      console.error('Forgot password error:', apiError);
      setError(apiError.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactAdmin = () => {
    showAlert({
      title: 'Contact Administrator',
      message: 'For technical support, account issues, or login problems, please contact your system administrator.\n\nYou can reach them through your organization\'s IT department or the contact information provided by your company.',
      buttons: [
        {
          text: 'Copy Support Email',
          primary: true,
          onPress: () => {
            const supportEmail = 'info@utahtechnicalservicesllc.com';
            showAlert({
              title: 'Support Email',
              message: `Contact: ${supportEmail}`,
              type: 'info',
              buttons: [{ text: 'OK', primary: true }],
            });
          }
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ],
      type: 'info'
    });
  };

  const { width } = Dimensions.get('window');

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginCard}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/uts-logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
                fadeDuration={0}
                backgroundColor="transparent"
              />
            </View>
            <Text style={styles.subtitle}>Welcome</Text>
            <Text style={styles.description}>Sign in to your account to continue</Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.company}
                  onChangeText={(value) => handleInputChange('company', value)}
                  placeholder="Enter your company name (optional)"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loadingText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerSection}>
            <TouchableOpacity 
              style={styles.contactAdminButton}
              onPress={handleContactAdmin}
              disabled={isLoading}
            >
              <Text style={styles.contactAdminText}>Contact your Administrator</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>
              Need technical support or account assistance?
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertState.visible}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        type={alertState.type}
        showCloseButton={alertState.showCloseButton}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    minHeight: 120,
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: 'rgb(52, 73, 94)',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: 'rgb(44, 62, 80)',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 22,
  },
  // Error Message
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  // Form Section
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
    letterSpacing: 0.2,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Forgot Password
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: 'rgb(52, 73, 94)',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Login Button
  loginButton: {
    backgroundColor: 'rgb(52, 73, 94)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: 'rgb(52, 73, 94)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  // Footer Section
  footerSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  contactAdminButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAdminText: {
    color: 'rgb(52, 73, 94)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
