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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONTS, SIZES } from '../styles/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import api from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [driverPreferences, setDriverPreferences] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    address: '',
    hasInventory: false,
    hasServiceCenter: false,
    nicNumber: '',
  });

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(selectedRole === 'owner' ? 1.5 : 2);
  };

  const handleRegisterSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    const userPayload = {
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      address: formData.address || '',
      role: role === 'owner' ? 'PARKING_OWNER' : 'DRIVER',
      hasInventory: formData.hasInventory,
      hasServiceCenter: formData.hasServiceCenter,
      ...(role === 'driver' && formData.nicNumber ? { nicNumber: formData.nicNumber } : {}),
    };

    try {
      await api.post('/auth/register-otp', userPayload);
      Alert.alert('Success', 'OTP sent to your email!');
      setStep(3);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-register-otp', {
        email: formData.email.trim().toLowerCase(),
        otp,
        role: role === 'owner' ? 'PARKING_OWNER' : 'DRIVER',
      });

      // For simplicity, we just navigate to login or handle it like the ITP project
      if (role === 'driver') {
        setStep(4);
      } else {
        Alert.alert('Success', 'Registration Successful! Please login.');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const toggleVehicle = (vehicle: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicle) ? prev.filter((v) => v !== vehicle) : [...prev, vehicle]
    );
  };

  const handleFinalizeDriver = () => {
    Alert.alert('Success', 'Setup Complete! Please login to continue.');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.title}>Join Parkify as a...</Text>
              <View style={styles.roleGrid}>
                <TouchableOpacity style={styles.roleBox} onPress={() => handleRoleSelect('driver')}>
                  <Icon name="directions-car" size={40} color={COLORS.primaryCoral} />
                  <Text style={styles.roleTitle}>Driver</Text>
                  <Text style={styles.roleDesc}>I want to find and book parking slots.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.roleBox} onPress={() => handleRoleSelect('owner')}>
                  <Icon name="real-estate-agent" size={40} color={COLORS.primaryCoral} />
                  <Text style={styles.roleTitle}>Parking Owner</Text>
                  <Text style={styles.roleDesc}>I want to list and manage my parking spaces.</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 1.5 && (
            <View style={styles.card}>
              <Text style={styles.title}>Tell us about your place</Text>
              <View style={styles.questionSection}>
                <Text style={styles.questionText}>Do you have an inventory?</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.hasInventory && styles.radioActive]}
                    onPress={() => setFormData({ ...formData, hasInventory: true })}
                  >
                    <Text style={[styles.radioLabel, formData.hasInventory && styles.radioLabelActive]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, !formData.hasInventory && styles.radioActive]}
                    onPress={() => setFormData({ ...formData, hasInventory: false })}
                  >
                    <Text style={[styles.radioLabel, !formData.hasInventory && styles.radioLabelActive]}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.questionSection}>
                <Text style={styles.questionText}>Do you have a service center?</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.hasServiceCenter && styles.radioActive]}
                    onPress={() => setFormData({ ...formData, hasServiceCenter: true })}
                  >
                    <Text style={[styles.radioLabel, formData.hasServiceCenter && styles.radioLabelActive]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, !formData.hasServiceCenter && styles.radioActive]}
                    onPress={() => setFormData({ ...formData, hasServiceCenter: false })}
                  >
                    <Text style={[styles.radioLabel, !formData.hasServiceCenter && styles.radioLabelActive]}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <CustomButton title="Continue" onPress={() => setStep(2)} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.title}>Create Account</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <CustomInput
                    label="First Name"
                    value={formData.firstName}
                    onChangeText={(val) => setFormData({ ...formData, firstName: val })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <CustomInput
                    label="Last Name"
                    value={formData.lastName}
                    onChangeText={(val) => setFormData({ ...formData, lastName: val })}
                  />
                </View>
              </View>
              <CustomInput
                label="Email Address"
                value={formData.email}
                onChangeText={(val) => setFormData({ ...formData, email: val })}
                keyboardType="email-address"
              />
              <CustomInput
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(val) => setFormData({ ...formData, phoneNumber: val })}
                keyboardType="phone-pad"
              />
              <CustomInput
                label="Password"
                value={formData.password}
                onChangeText={(val) => setFormData({ ...formData, password: val })}
                secureTextEntry
              />
              {role === 'driver' && (
                <CustomInput
                  label="NIC Number (Optional)"
                  value={formData.nicNumber}
                  onChangeText={(val) => setFormData({ ...formData, nicNumber: val })}
                />
              )}
              <CustomButton title="Register Now" onPress={handleRegisterSubmit} loading={loading} />
            </View>
          )}

          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.instructionText}>
                We've sent a 6-digit code to {formData.email}
              </Text>
              <CustomInput
                label="OTP Code"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <CustomButton title="Verify & Complete" onPress={handleVerifyAndRegister} loading={loading} />
            </View>
          )}

          {step === 4 && (
            <View style={styles.card}>
              <Text style={styles.title}>What vehicles do you have?</Text>
              <Text style={styles.instructionText}>Select all that apply</Text>
              <View style={styles.vehicleGrid}>
                {['Car', 'Bike', 'Van', 'Lorry'].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.vehicleOption, selectedVehicles.includes(v) && styles.vehicleActive]}
                    onPress={() => toggleVehicle(v)}
                  >
                    <Icon
                      name={v === 'Car' ? 'directions-car' : v === 'Bike' ? 'motorcycle' : v === 'Van' ? 'airport-shuttle' : 'local-shipping'}
                      size={30}
                      color={selectedVehicles.includes(v) ? '#FFF' : COLORS.primaryCoral}
                    />
                    <Text style={[styles.vehicleLabel, selectedVehicles.includes(v) && styles.vehicleLabelActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <CustomButton
                title="Next"
                disabled={selectedVehicles.length === 0}
                onPress={() => setStep(5)}
              />
            </View>
          )}

          {step === 5 && (
            <View style={styles.card}>
              <Text style={styles.title}>Your Preference</Text>
              <Text style={styles.instructionText}>What is most important when finding a slot?</Text>
              {[
                { id: 'cheap', label: 'Cheapest Price', icon: 'payments' },
                { id: 'near', label: 'Nearest Location', icon: 'near-me' },
                { id: 'avail', label: 'Maximum Availability', icon: 'event-available' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.prefOption, driverPreferences === p.id && styles.prefActive]}
                  onPress={() => setDriverPreferences(p.id)}
                >
                  <Icon name={p.icon} size={24} color={driverPreferences === p.id ? '#FFF' : COLORS.primaryCoral} />
                  <Text style={[styles.prefLabel, driverPreferences === p.id && styles.prefLabelActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
              <CustomButton
                title="Go to Login"
                disabled={!driverPreferences}
                onPress={handleFinalizeDriver}
                loading={loading}
              />
            </View>
          )}
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
  card: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
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
  roleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleBox: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.radius,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  roleTitle: {
    ...FONTS.h3,
    color: COLORS.navyDeep,
    marginTop: 10,
  },
  roleDesc: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 5,
  },
  questionSection: {
    marginBottom: 20,
  },
  questionText: {
    ...FONTS.body,
    fontWeight: '600',
    color: COLORS.navyDeep,
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 10,
  },
  radioActive: {
    backgroundColor: COLORS.primaryCoral,
    borderColor: COLORS.primaryCoral,
  },
  radioLabel: {
    ...FONTS.body,
    color: COLORS.textMain,
  },
  radioLabelActive: {
    color: '#FFF',
  },
  row: {
    flexDirection: 'row',
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vehicleOption: {
    width: '48%',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  vehicleActive: {
    backgroundColor: COLORS.primaryCoral,
    borderColor: COLORS.primaryCoral,
  },
  vehicleLabel: {
    ...FONTS.body,
    marginTop: 5,
    color: COLORS.textMain,
  },
  vehicleLabelActive: {
    color: '#FFF',
  },
  prefOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.radius,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  prefActive: {
    backgroundColor: COLORS.primaryCoral,
    borderColor: COLORS.primaryCoral,
  },
  prefLabel: {
    ...FONTS.body,
    marginLeft: 15,
    color: COLORS.textMain,
  },
  prefLabelActive: {
    color: '#FFF',
  },
});

export default RegisterScreen;
