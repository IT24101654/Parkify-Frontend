import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const OTPVerificationScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { email = '', role = 'DRIVER', type = 'LOGIN', password = '' } = params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const { login, registerSuccess } = useAuth();
  
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'REGISTER') {
        const response = await api.post('/auth/verify-register-otp', {
          email,
          otp: otpCode,
          role
        });
        
        if (response.data.token) {
          await registerSuccess(response.data.user, response.data.token);
        }
      } else {
        const result = await login(email, password, otpCode, role);
        if (!result.success) {
          Alert.alert('Verification Failed', result.message);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setTimer(60);
    try {
      if (type === 'REGISTER') {
        await api.post('/auth/register-otp', { email }); // Basic resend if supported
      } else {
        await api.post('/auth/login', { email, password });
      }
      Alert.alert('Success', 'OTP has been resent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <BackButton onPress={() => navigation.goBack()} />


        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check-outline" size={40} color="#B26969" />
          </View>
          
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={el => { if (inputRefs.current) inputRefs.current[index] = el; }}
                style={[styles.otpInput, digit !== '' && styles.otpInputActive]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.verifyBtn, SHADOWS.medium]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive code? </Text>
            {timer > 0 ? (
              <Text style={styles.timerText}>Wait {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendAction}>Resend Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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

  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    paddingTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    ...SHADOWS.small,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: '500',
  },
  emailText: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  otpInput: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  otpInputActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.surface,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  resendText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  resendAction: {
    color: COLORS.secondary,
    fontWeight: '800',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  timerText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default OTPVerificationScreen;
