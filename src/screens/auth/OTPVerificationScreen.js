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
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { email, role, type, password } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const { login } = useAuth();
  
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
        const response = await api.post('/auth/verify-registration-otp', {
          email,
          otp: otpCode,
          role
        });
        
        if (response.data.token) {
          Alert.alert('Success', 'Account verified successfully!', [
            { text: 'OK', onPress: () => navigation.replace('Login') }
          ]);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2D4057" />
        </TouchableOpacity>

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
                ref={el => inputRefs.current[index] = el}
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
    backgroundColor: '#FFF',
  },
  flex: {
    flex: 1,
  },
  backBtn: {
    padding: 20,
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
    backgroundColor: '#F9F4EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    ...SHADOWS.small,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2D4057',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A868E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: '500',
  },
  emailText: {
    color: '#B26969',
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
    borderColor: '#EDF2F7',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#2D4057',
    backgroundColor: '#F7FAFC',
  },
  otpInputActive: {
    borderColor: '#B26969',
    backgroundColor: '#FFF',
  },
  verifyBtn: {
    backgroundColor: '#2D4057',
    width: '100%',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  resendText: {
    color: '#7A868E',
    fontSize: 15,
    fontWeight: '500',
  },
  resendAction: {
    color: '#B26969',
    fontWeight: '800',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  timerText: {
    color: '#7A868E',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default OTPVerificationScreen;
