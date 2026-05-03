import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const VehicleSetupScreen = ({ navigation }) => {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [licenseImage, setLicenseImage] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    brand: '',
    model: '',
    type: 'Car',
    fuelType: 'Petrol',
  });

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const pickImage = async (imageType) => {
    if (Platform.OS === 'web') {
      handleImageSource(imageType, 'gallery');
      return;
    }

    Alert.alert(
      'Upload Document',
      `Select source for ${imageType === 'vehicle' ? 'Vehicle Photo' : 'Revenue License'}`,
      [
        { text: 'Camera', onPress: () => handleImageSource(imageType, 'camera') },
        { text: 'Gallery', onPress: () => handleImageSource(imageType, 'gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleImageSource = async (imageType, source) => {
    let result;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
    };

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      if (imageType === 'vehicle') setVehicleImage(result.assets[0].uri);
      else setLicenseImage(result.assets[0].uri);
    }
  };

  const handleFinish = async () => {
    if (!formData.vehicleNumber || !formData.brand || !formData.model) {
      Alert.alert('Required Fields', 'Please enter your vehicle details to continue.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('vehicleNumber', formData.vehicleNumber);
      data.append('brand', formData.brand);
      data.append('model', formData.model);
      data.append('type', formData.type);
      data.append('fuelType', formData.fuelType);

      if (vehicleImage) {
        if (Platform.OS === 'web') {
          const response = await fetch(vehicleImage);
          const blob = await response.blob();
          data.append('vehicleImage', blob, `v_${Date.now()}.jpg`);
        } else {
          const extension = vehicleImage.split('.').pop().toLowerCase();
          data.append('vehicleImage', {
            uri: Platform.OS === 'android' ? vehicleImage : vehicleImage.replace('file://', ''),
            name: `v_${Date.now()}.${extension}`,
            type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
          });
        }
      }

      if (licenseImage) {
        if (Platform.OS === 'web') {
          const response = await fetch(licenseImage);
          const blob = await response.blob();
          data.append('licenseImage', blob, `l_${Date.now()}.jpg`);
        } else {
          const extension = licenseImage.split('.').pop().toLowerCase();
          data.append('licenseImage', {
            uri: Platform.OS === 'android' ? licenseImage : licenseImage.replace('file://', ''),
            name: `l_${Date.now()}.${extension}`,
            type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
          });
        }
      }

      await api.post('/vehicles', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      });

      // Update user state to complete onboarding
      const finishRes = await api.put('/auth/finalize-onboarding');
      await updateUser(finishRes.data.user);
      
      Alert.alert('Welcome!', 'Vehicle registered and setup complete!');
    } catch (error) {
      console.error('Setup Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to register vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.card}>
      <Text style={styles.title}>What vehicles do you have?</Text>
      <Text style={styles.subtitle}>Select all the vehicle types you plan to use with Parkify</Text>
      
      <View style={styles.typeGrid}>
        {[
          { id: 'Car', icon: 'car' },
          { id: 'Bike', icon: 'motorcycle' },
          { id: 'Van', icon: 'van-utility' },
          { id: 'Lorry', icon: 'truck' },
        ].map((type) => (
          <TouchableOpacity 
            key={type.id}
            style={[
              styles.typeCard,
              selectedTypes.includes(type.id) && styles.typeCardActive
            ]}
            onPress={() => toggleType(type.id)}
          >
            <MaterialCommunityIcons 
              name={type.icon} 
              size={40} 
              color={selectedTypes.includes(type.id) ? '#FFF' : '#B26969'} 
            />
            <Text style={[
              styles.typeLabel,
              selectedTypes.includes(type.id) && styles.typeLabelActive
            ]}>{type.id}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <CustomButton 
        title="Continue to Details"
        onPress={() => setStep(2)}
        disabled={selectedTypes.length === 0}
        style={{ marginTop: 20 }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.stepContainer}>
               <Text style={styles.stepText}>Step {step} of 2</Text>
            </View>
            <Text style={styles.title}>{step === 1 ? 'Vehicle Selection' : 'Vehicle Details'}</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Tell us which vehicles you normally drive' 
                : 'Now, let\'s add your primary vehicle\'s details'}
            </Text>
          </View>

          {step === 1 ? renderStep1() : (
            <View style={[styles.card, SHADOWS.medium]}>
            <View style={styles.imageSection}>
               <TouchableOpacity style={styles.imageBox} onPress={() => pickImage('vehicle')}>
                  {vehicleImage ? (
                    <Image source={{ uri: vehicleImage }} style={styles.fullImage} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera-plus" size={30} color="#B26969" />
                      <Text style={styles.imageLabel}>Vehicle Photo</Text>
                    </>
                  )}
               </TouchableOpacity>

               <TouchableOpacity style={styles.imageBox} onPress={() => pickImage('license')}>
                  {licenseImage ? (
                    <Image source={{ uri: licenseImage }} style={styles.fullImage} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="file-document-outline" size={30} color="#B26969" />
                      <Text style={styles.imageLabel}>Revenue License</Text>
                    </>
                  )}
               </TouchableOpacity>
            </View>

            <CustomInput
              label="Vehicle Number (e.g. CAD-6533)"
              placeholder="Enter number"
              value={formData.vehicleNumber}
              onChangeText={(val) => setFormData({ ...formData, vehicleNumber: val })}
            />

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <CustomInput
                        label="Brand"
                        placeholder="Toyota"
                        value={formData.brand}
                        onChangeText={(val) => setFormData({ ...formData, brand: val })}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <CustomInput
                        label="Model"
                        placeholder="Corolla"
                        value={formData.model}
                        onChangeText={(val) => setFormData({ ...formData, model: val })}
                    />
                </View>
            </View>

            <Text style={styles.sectionLabel}>Vehicle Type</Text>
            <View style={styles.pickerRow}>
              {['Car', 'Bike', 'Van'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerItem, formData.type === type && styles.pickerActive]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text style={[styles.pickerText, formData.type === type && styles.pickerTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Fuel Type</Text>
            <View style={styles.pickerRow}>
              {['Petrol', 'Diesel', 'Hybrid', 'EV'].map((fuel) => (
                <TouchableOpacity
                  key={fuel}
                  style={[styles.pickerItem, formData.fuelType === fuel && styles.pickerActive, { flexBasis: '22%' }]}
                  onPress={() => setFormData({ ...formData, fuelType: fuel })}
                >
                  <Text style={[styles.pickerText, formData.fuelType === fuel && styles.pickerTextActive]}>{fuel}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomButton
              title="Finish & Start Exploring"
              onPress={handleFinish}
              loading={loading}
              style={{ marginTop: 30 }}
            />
          </View>
          )}

          <TouchableOpacity style={styles.skipBtn} onPress={() => handleFinish()}>
             <Text style={styles.skipText}>I'll do this later</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { padding: 25 },
  header: { marginBottom: 30, alignItems: 'center' },
  stepContainer: { backgroundColor: '#F9F4F4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 15 },
  stepText: { color: '#B26969', fontSize: 12, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '900', color: '#2D4057', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#7A868E', textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 30, padding: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  imageSection: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  imageBox: { flex: 1, height: 110, backgroundColor: '#FAF7F4', borderRadius: 20, borderWidth: 1, borderColor: '#F0EBE6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageLabel: { fontSize: 11, color: '#9C8C79', fontWeight: '700', marginTop: 8 },
  row: { flexDirection: 'row' },
  sectionLabel: { fontSize: 14, color: '#2D4057', fontWeight: '800', marginTop: 20, marginBottom: 12 },
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#EDF2F7' },
  pickerActive: { backgroundColor: '#B26969', borderColor: '#B26969' },
  pickerText: { fontSize: 12, fontWeight: '700', color: '#7A868E' },
  pickerTextActive: { color: '#FFF' },
  skipBtn: { marginTop: 20, alignSelf: 'center', padding: 10 },
  skipText: { color: '#7A868E', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  
  // Multi-step additions
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginVertical: 25,
  },
  typeCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#FAF7F4',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0EBE6',
  },
  typeCardActive: {
    backgroundColor: '#B26969',
    borderColor: '#B26969',
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D4057',
    marginTop: 10,
  },
  typeLabelActive: {
    color: '#FFF',
  },
});

export default VehicleSetupScreen;
