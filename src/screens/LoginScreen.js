import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      const { status, roles } = response.data;

      if (status === 'OTP_SENT') {
        setSelectedRole(roles[0]);
        setShowOTP(true);
      } else if (status === 'ROLE_SELECTION_REQUIRED') {
        setAvailableRoles(roles);
        setShowRoleSelect(true);
      }
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    try {
      await api.post('/auth/select-role', {
        email: email.trim().toLowerCase(),
        role: role,
      });
      setShowRoleSelect(false);
      setShowOTP(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to select role');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      await signIn({
        email: email.trim().toLowerCase(),
        otp,
        role: selectedRole,
      });
      // Navigation will be handled by AuthContext (isAuthenticated state change)
    } catch (error) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Parkify</Text>
            <Text style={styles.subtitle}>Smart Parking for Smart Cities</Text>
          </View>

          <View style={styles.formCard}>
            {!showOTP && !showRoleSelect ? (
              <>
                <Text style={styles.formTitle}>Welcome Back</Text>
                <CustomInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <CustomInput
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <CustomButton
                  title="Send OTP"
                  onPress={handleLogin}
                  loading={loading}
                />
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerText}>
                    Don't have an account? <Text style={styles.linkText}>Register</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : showRoleSelect ? (
              <View style={styles.roleSelectionContainer}>
                <Text style={styles.formTitle}>Choose Account</Text>
                <Text style={styles.instructionText}>
                  Your email is linked to multiple accounts. Select which one to log in as:
                </Text>
                
                <View style={styles.roleBtnGroup}>
                  {availableRoles.map((role) => (
                    <TouchableOpacity 
                      key={role}
                      style={styles.roleBtn}
                      onPress={() => handleRoleSelection(role)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.roleIconBox}>
                        <MaterialCommunityIcons 
                          name={role === 'DRIVER' ? 'steering' : 'home-city'} 
                          size={24} 
                          color="#FFF" 
                        />
                      </View>
                      <Text style={styles.roleBtnText}>
                        {role === 'DRIVER' ? 'Driver' : 'Parking Owner'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity onPress={() => setShowRoleSelect(false)} style={styles.backBtn}>
                  <Text style={styles.linkText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.formTitle}>Verify OTP</Text>
                <Text style={styles.instructionText}>
                  Enter the 6-digit code sent to {email}
                </Text>
                <CustomInput
                  label="OTP Code"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                />
                <CustomButton
                  title="Verify & Login"
                  onPress={handleVerifyOTP}
                  loading={loading}
                />
                <TouchableOpacity onPress={() => setShowOTP(false)}>
                  <Text style={styles.linkText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.primaryCoral,
    fontSize: 40,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.navyDeep,
    marginTop: 5,
  },
  formCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  formTitle: {
    ...FONTS.h2,
    color: COLORS.navyDeep,
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionText: {
    ...FONTS.body,
    color: COLORS.textMuted,
    marginBottom: 20,
    textAlign: 'center',
  },
  footerText: {
    ...FONTS.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
  linkText: {
    color: COLORS.primaryCoral,
    fontWeight: '700',
  },
  
  // Role Selection Styles
  roleSelectionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  roleBtnGroup: {
    width: '100%',
    gap: 15,
    marginVertical: 10,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D4057', // Navy Deep
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roleIconBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  roleBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // Offset the icon box width to keep text centered
  },
  backBtn: {
    marginTop: 20,
    padding: 10,
  },
});

export default LoginScreen;
