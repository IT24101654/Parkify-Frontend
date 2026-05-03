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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const AddVehicleScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [licenseImage, setLicenseImage] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    brand: '',
    model: '',
    type: 'Car',
    fuelType: 'Petrol',
  });

  const pickImage = async (imageType) => {
    if (Platform.OS === 'web') {
      // Web doesn't support 3-button Alert.alert, default to gallery
      handleImageSource(imageType, 'gallery');
      return;
    }

    Alert.alert(
      'Select Image Source',
      'Choose where to get the image from',
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

  const handleAddVehicle = async () => {
    if (!formData.vehicleNumber || !formData.brand || !formData.model) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!vehicleImage || !licenseImage) {
      Alert.alert('Error', 'Please upload both Vehicle Image and Revenue License Copy');
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
          data.append('vehicleImage', blob, `vehicle_${Date.now()}.jpg`);
        } else {
          const uriParts = vehicleImage.split('.');
          const extension = uriParts[uriParts.length - 1].toLowerCase();
          const type = extension === 'jpg' ? 'jpeg' : extension;
          data.append('vehicleImage', {
            uri: Platform.OS === 'android' ? vehicleImage : vehicleImage.replace('file://', ''),
            name: `vehicle_${Date.now()}.${extension}`,
            type: `image/${type}`,
          });
        }
      }

      if (licenseImage) {
        if (Platform.OS === 'web') {
          const response = await fetch(licenseImage);
          const blob = await response.blob();
          data.append('licenseImage', blob, `license_${Date.now()}.jpg`);
        } else {
          const uriParts = licenseImage.split('.');
          const extension = uriParts[uriParts.length - 1].toLowerCase();
          const type = extension === 'jpg' ? 'jpeg' : extension;
          data.append('licenseImage', {
            uri: Platform.OS === 'android' ? licenseImage : licenseImage.replace('file://', ''),
            name: `license_${Date.now()}.${extension}`,
            type: `image/${type}`,
          });
        }
      }

      await api.post('/vehicles', data);

      Alert.alert('Success', 'Vehicle added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add vehicle');
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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#2D4057" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Add New Vehicle</Text>
              <Text style={styles.headerSubtitle}>Enter your vehicle details below</Text>
            </View>
            <View style={{ width: 28 }} />
          </View>

          <View style={[styles.formCard, SHADOWS.medium]}>
            {/* Vehicle Image Picker */}
            <Text style={styles.imageLabel}>Vehicle Photo (Required)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('vehicle')}>
              {vehicleImage ? (
                <Image source={{ uri: vehicleImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="car-outline" size={32} color="#9C8C79" />
                  <Text style={styles.imagePlaceholderText}>Upload Vehicle Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* License Image Picker */}
            <Text style={styles.imageLabel}>Revenue License Copy (Required)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('license')}>
              {licenseImage ? (
                <Image source={{ uri: licenseImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="file-document-outline" size={32} color="#9C8C79" />
                  <Text style={styles.imagePlaceholderText}>Upload License Copy</Text>
                </View>
              )}
            </TouchableOpacity>

            <CustomInput
              label="Vehicle Number"
              placeholder="e.g. CAS-1234"
              value={formData.vehicleNumber}
              onChangeText={(val) => setFormData({ ...formData, vehicleNumber: val })}
            />
            <CustomInput
              label="Brand"
              placeholder="e.g. Toyota"
              value={formData.brand}
              onChangeText={(val) => setFormData({ ...formData, brand: val })}
            />
            <CustomInput
              label="Model"
              placeholder="e.g. Corolla"
              value={formData.model}
              onChangeText={(val) => setFormData({ ...formData, model: val })}
            />

            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.pickerRow}>
              {['Car', 'Bike', 'Van'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerItem, formData.type === type && styles.pickerActive]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text style={[styles.pickerText, formData.type === type && styles.pickerTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Fuel Type</Text>
            <View style={styles.pickerRow}>
              {['Petrol', 'Diesel', 'Hybrid', 'EV'].map((fuel) => (
                <TouchableOpacity
                  key={fuel}
                  style={[styles.pickerItem, formData.fuelType === fuel && styles.pickerActive]}
                  onPress={() => setFormData({ ...formData, fuelType: fuel })}
                >
                  <Text style={[styles.pickerText, formData.fuelType === fuel && styles.pickerTextActive]}>
                    {fuel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomButton
              title="Save Vehicle"
              onPress={handleAddVehicle}
              loading={loading}
              style={{ marginTop: 20 }}
            />
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
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D4057',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7A868E',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageLabel: {
    fontSize: 14,
    color: '#2D4057',
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 5,
  },
  imagePicker: {
    width: '100%',
    height: 140,
    backgroundColor: '#FAF7F4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0EBE6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 12,
    color: '#9C8C79',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    color: '#2D4057',
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pickerItem: {
    flexBasis: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#F9FAFB',
  },
  pickerActive: {
    backgroundColor: '#B26969',
    borderColor: '#B26969',
  },
  pickerText: {
    fontSize: 12,
    color: '#7A868E',
    fontWeight: '600',
  },
  pickerTextActive: {
    color: '#FFF',
  },
});

export default AddVehicleScreen;
