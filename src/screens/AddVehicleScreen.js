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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONTS, SIZES } from '../styles/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import api from '../services/api';

const AddVehicleScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    brand: '',
    model: '',
    type: 'Car',
    fuelType: 'Petrol',
  });

  const handleAddVehicle = async () => {
    if (!formData.vehicleNumber || !formData.brand || !formData.model) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/vehicles', formData);
      Alert.alert('Success', 'Vehicle added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.navyDeep} />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
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
              {['Petrol', 'Diesel', 'Electric'].map((fuel) => (
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
    backgroundColor: COLORS.bgLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.cardWhite,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.navyDeep,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  formCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  label: {
    ...FONTS.caption,
    color: COLORS.navyDeep,
    marginBottom: 10,
    marginTop: 10,
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  pickerItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 10,
  },
  pickerActive: {
    backgroundColor: COLORS.primaryCoral,
    borderColor: COLORS.primaryCoral,
  },
  pickerText: {
    ...FONTS.body,
    color: COLORS.textMain,
  },
  pickerTextActive: {
    color: '#FFF',
  },
});

export default AddVehicleScreen;
