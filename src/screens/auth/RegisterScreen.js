import React, { useState, useEffect } from 'react';
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
import api from '../../services/api';

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null); // 'DRIVER' or 'PARKING_OWNER'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [strength, setStrength] = useState({ label: '', color: '#ddd', width: '0%' });

  useEffect(() => {
    validatePassword(password);
  }, [password]);

  const validatePassword = (pass) => {
    if (!pass) {
      setStrength({ label: '', color: '#ddd', width: '0%' });
      return;
    }
    
    let score = 0;
    if (pass.length > 5) score++;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) {
      setStrength({ label: 'Low', color: '#E74C3C', width: '33%' });
    } else if (score <= 4) {
      setStrength({ label: 'Medium', color: '#F1C40F', width: '66%' });
    } else {
      setStrength({ label: 'High', color: '#2ECC71', width: '100%' });
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !role || !address) {
      Alert.alert('Error', 'Please fill in all required fields including your address.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register-otp', {
        name,
        email: email.trim().toLowerCase(),
        password,
        role,
        phoneNumber,
        address
      });
      
      navigation.navigate('OTPVerification', { 
        email: email.trim().toLowerCase(), 
        role, 
        password,
        type: 'REGISTER' 
      });
    } catch (error) {
      Alert.alert('Registration Error', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => navigation.goBack()} />

          <View style={styles.header}>
            <Image 
              source={require('../../../assets/Parkify.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Join Parkify</Text>
            <Text style={styles.subtitle}>Select your role to get started</Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleCard, SHADOWS.medium]}
              onPress={() => { setRole('DRIVER'); setStep(2); }}
            >
              <View style={[styles.roleIconCircle, { backgroundColor: '#F9F4EE' }]}>
                <MaterialCommunityIcons name="car-side" size={40} color="#B26969" />
              </View>
              <Text style={styles.roleTitle}>I'm a Driver</Text>
              <Text style={styles.roleDesc}>Find and book parking spaces easily.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleCard, SHADOWS.medium]}
              onPress={() => { setRole('PARKING_OWNER'); setStep(2); }}
            >
              <View style={[styles.roleIconCircle, { backgroundColor: '#EEF4F9' }]}>
                <MaterialCommunityIcons name="garage" size={40} color="#2D4057" />
              </View>
              <Text style={styles.roleTitle}>I'm a Parking Owner</Text>
              <Text style={styles.roleDesc}>List and manage your parking slots.</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton onPress={() => { setRole(null); setStep(1); }} />

          <View style={styles.header}>
            <Image 
              source={require('../../../assets/Parkify.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Registering as {role === 'DRIVER' ? 'Driver' : 'Parking Owner'}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#7A868E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#7A868E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="phone-outline" size={20} color="#7A868E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="077XXXXXXX"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Physical Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#7A868E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="No, Street, City"
                  value={address}
                  onChangeText={setAddress}
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
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  textContentType="password"
                  autoComplete="off"
                  autoCorrect={false}
                  placeholderTextColor="#A0AEC0"
                />
              </View>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBackground}>
                    <View style={[styles.strengthBar, { width: strength.width, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[styles.strengthText, { color: strength.color }]}>
                    Strength: {strength.label}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, SHADOWS.medium]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.primaryButtonText}>Register Now</Text>
                  <MaterialCommunityIcons name="account-plus" size={22} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Sign In</Text>
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
    backgroundColor: '#FFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2D4057',
    marginBottom: 5,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7A868E',
    fontWeight: '500',
    textAlign: 'center',
  },
  roleContainer: {
    gap: 20,
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#FFF',
    padding: 25,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F1F1',
  },
  roleIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2D4057',
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    color: '#7A868E',
    textAlign: 'center',
    lineHeight: 18,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D4057',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
    paddingHorizontal: 15,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D4057',
    fontWeight: '600',
  },
  strengthContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  strengthBarBackground: {
    height: 6,
    backgroundColor: '#F1F1F1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: '#2D4057',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    color: '#7A868E',
    fontSize: 15,
    fontWeight: '500',
  },
  loginText: {
    color: '#B26969',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default RegisterScreen;
