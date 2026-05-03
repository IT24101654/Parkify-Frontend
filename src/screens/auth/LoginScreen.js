import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const { login } = useAuth();

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password
      });

      const { status, roles } = response.data;

      if (status === 'OTP_SENT') {
        navigation.navigate('OTPVerification', { 
          email: email.trim().toLowerCase(), 
          password, 
          role: roles[0], 
          type: 'LOGIN' 
        });
      } else if (status === 'ROLE_SELECTION_REQUIRED') {
        setAvailableRoles(roles);
        setShowRoleSelect(true);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid email or password.';
      Alert.alert('Login Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    setIsLoading(true);
    try {
      await api.post('/auth/select-role', {
        email: email.trim().toLowerCase(),
        role: role
      });
      setShowRoleSelect(false);
      navigation.navigate('OTPVerification', { 
        email: email.trim().toLowerCase(), 
        password, 
        role, 
        type: 'LOGIN' 
      });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to select role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/Parkify.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Parkify</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          <View style={styles.formContainer}>
            {showRoleSelect ? (
              <View style={styles.roleSelectionContainer}>
                <Text style={styles.titleSmall}>Choose Account</Text>
                <Text style={styles.roleSubtitle}>
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
                  <Text style={styles.signUpText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#7A868E" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#7A868E" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={true}
                      textContentType="password"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.primaryButton, SHADOWS.medium]}
                  onPress={handleLoginSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <View style={styles.btnContent}>
                      <Text style={styles.primaryButtonText}>Continue</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>


          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Parkify? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: COLORS.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  signUpText: {
    color: COLORS.secondary,
    fontWeight: '800',
    fontSize: 15,
  },

  // Role Selection
  roleSelectionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  titleSmall: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  roleSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  roleBtnGroup: {
    width: '100%',
    gap: 15,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D4057',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: '100%',
  },
  roleIconBox: {
    width: 32,
    alignItems: 'center',
  },
  roleBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  backBtn: {
    marginTop: 25,
    padding: 10,
  },
});

export default LoginScreen;
