import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, SafeAreaView, StatusBar, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';
import DriverSidebar from '../../components/DriverSidebar';
import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

const ServiceAppointmentScreen = ({ route, navigation }) => {
  const { serviceType, serviceCenter, parkingPlaceId, parkingName } = route.params;

  const [form, setForm] = useState({
    customerName: '', phone: '', vehicleId: '', vehicleType: 'Car',
    serviceDate: new Date(), timeSlot: '', notes: ''
  });
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVehicles, setFetchingVehicles] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setFetchingVehicles(true);
    
    // 1. Fetch User Profile
    try {
      const userRes = await api.get('/auth/profile');
      if (userRes.data) {
        setForm(prev => ({ 
          ...prev, 
          customerName: userRes.data.name || '', 
          phone: userRes.data.phoneNumber || userRes.data.phone || '' 
        }));
      }
    } catch (error) {
      console.log('Error fetching profile for appointment:', error.message);
    }

    // 2. Fetch Vehicles
    try {
      console.log("DEBUG: Fetching vehicles for appointment...");
      const vehRes = await api.get('/vehicles');
      const vehicleList = vehRes.data || [];
      console.log("DEBUG: Vehicles received:", vehicleList.length);
      
      setVehicles(vehicleList);
      
      if (vehicleList.length > 0) {
        setForm(prev => ({ 
          ...prev, 
          vehicleId: vehicleList[0].vehicleNumber, 
          vehicleType: vehicleList[0].type || 'Car' 
        }));
      }
    } catch (error) {
      console.log('Error fetching vehicles for appointment:', error.message);
    } finally {
      setFetchingVehicles(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setForm({ ...form, serviceDate: selectedDate });
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.customerName || !form.vehicleId || !form.timeSlot) {
      Alert.alert('Error', 'Please fill all required fields and select a time slot.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName: form.customerName,
        phone: form.phone,
        vehicleId: form.vehicleId,
        vehicleType: form.vehicleType,
        serviceType: serviceType,
        serviceCenter: serviceCenter,
        parkingPlaceId: parkingPlaceId,
        serviceDate: form.serviceDate.toISOString().split('T')[0],
        timeSlot: form.timeSlot,
        notes: form.notes
      };

      console.log('DEBUG: Submitting booking payload:', payload);
      const res = await api.post('/service-appointments', payload);
      console.log('DEBUG: Booking success:', res.data);

      setShowSuccess(true);
      
      // Auto-navigate after 2 seconds
      setTimeout(() => {
        navigation.navigate('DriverServiceAppointments', {
          placeId: parkingPlaceId,
          parkingName: parkingName
        });
      }, 1500);

    } catch (error) {
      console.error('DEBUG: Booking Error Details:', error.response?.data || error.message);
      Alert.alert('Booking Failed', error.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <DriverSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.backBtn}>
          <MaterialCommunityIcons name="menu" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Book Service</Text>
          <Text style={styles.headerSub}>{serviceType}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.scBanner}>
          <MaterialCommunityIcons name="store-cog" size={24} color={COLORS.secondary} />
          <Text style={styles.scBannerText}>
            {serviceCenter?.toLowerCase().includes("yasith") ? "Service Center" : serviceCenter}
          </Text>
        </View>

        <View style={[styles.card, SHADOWS.small]}>
          
          {/* Customer Info */}
          <Text style={styles.label}>Customer Name *</Text>
          <View style={styles.inputBox}>
            <MaterialCommunityIcons name="account" size={20} color="#718096" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={form.customerName}
              onChangeText={(t) => setForm({...form, customerName: t})}
              placeholder="Your Name"
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputBox}>
            <MaterialCommunityIcons name="phone" size={20} color="#718096" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(t) => setForm({...form, phone: t})}
              placeholder="e.g. 077XXXXXXX"
              keyboardType="phone-pad"
            />
          </View>

          {/* Vehicle Selection */}
          <Text style={styles.label}>Select Vehicle *</Text>
          {fetchingVehicles ? (
            <ActivityIndicator size="small" color={COLORS.secondary} style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
          ) : (
            <View style={styles.vehicleGrid}>
              {vehicles.map(v => (
                <TouchableOpacity 
                  key={v._id || v.id} 
                  style={[styles.vehicleOption, form.vehicleId === v.vehicleNumber && styles.vehicleSelected]}
                  onPress={() => setForm({...form, vehicleId: v.vehicleNumber, vehicleType: v.type || 'Car'})}
                >
                  <MaterialCommunityIcons 
                    name={v.type?.toLowerCase() === 'bike' ? 'motorbike' : 'car'} 
                    size={24} 
                    color={form.vehicleId === v.vehicleNumber ? COLORS.secondary : '#718096'} 
                  />
                  <Text style={[styles.vehOptionText, form.vehicleId === v.vehicleNumber && {color: COLORS.secondary, fontWeight: '700'}]}>
                    {v.vehicleNumber}
                  </Text>
                </TouchableOpacity>
              ))}
              {vehicles.length === 0 && (
                <View style={{ width: '100%' }}>
                  <TextInput
                    style={[styles.input, { borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 8, paddingHorizontal: 15, height: 50 }]}
                    value={form.vehicleId}
                    onChangeText={(t) => setForm({...form, vehicleId: t})}
                    placeholder="License Plate (e.g. CAA-1234)"
                  />
                  <Text style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>No vehicles found in your profile.</Text>
                </View>
              )}
            </View>
          )}

          {/* Date Picker */}
          <Text style={styles.label}>Service Date *</Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <MaterialCommunityIcons name="calendar" size={22} color={COLORS.secondary} />
            <Text style={styles.dateText}>{form.serviceDate.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>
          
          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={form.serviceDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {Platform.OS === 'web' && (
            <View style={{ marginTop: 10 }}>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.serviceDate.toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, serviceDate: new Date(e.target.value) })}
                style={{
                  width: '100%',
                  height: 45,
                  borderRadius: 10,
                  border: '1px solid #EDF2F7',
                  padding: '0 10px',
                  fontSize: '16px',
                  backgroundColor: '#F8F9FA'
                }}
              />
            </View>
          )}

          {/* Time Slots */}
          <Text style={styles.label}>Available Time Slots *</Text>
          <View style={styles.slotGrid}>
            {SLOTS.map(slot => (
              <TouchableOpacity 
                key={slot}
                style={[styles.slotBtn, form.timeSlot === slot && styles.slotSelected]}
                onPress={() => setForm({...form, timeSlot: slot})}
              >
                <Text style={[styles.slotText, form.timeSlot === slot && {color: '#FFF'}]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={form.notes}
            onChangeText={(t) => setForm({...form, notes: t})}
            placeholder="Special requests or instructions..."
            multiline
            numberOfLines={3}
          />
          
        </View>
        
        {showSuccess && (
          <View style={styles.successBox}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#059669" />
            <Text style={styles.successText}>Booking Confirmed! Redirecting...</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, (loading || showSuccess) && {opacity: 0.7}]} 
          onPress={handleSubmit}
          disabled={loading || showSuccess}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color="#FFF" />
              <Text style={styles.submitBtnText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingVertical: 15,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
  },
  backBtn: { padding: 5 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  headerSub: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },
  
  scrollContent: { padding: 15, paddingBottom: 40 },
  
  scBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5',
    padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FED7D7'
  },
  scBannerText: { marginLeft: 10, fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8, marginTop: 15 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EDF2F7',
    borderRadius: 10, paddingHorizontal: 12, height: 50, backgroundColor: '#F8F9FA'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#2D3748' },
  
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vehicleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 10, backgroundColor: '#FFF'
  },
  vehicleSelected: { borderColor: COLORS.secondary, backgroundColor: '#FFF5F5' },
  vehOptionText: { fontSize: 14, color: '#4A5568', fontWeight: '600' },
  
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#EDF2F7',
    borderRadius: 10, paddingHorizontal: 15, height: 50, backgroundColor: '#F8F9FA'
  },
  dateText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#EDF2F7', backgroundColor: '#FFF'
  },
  slotSelected: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  slotText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
  
  textArea: {
    borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 10, padding: 15,
    backgroundColor: '#F8F9FA', fontSize: 15, color: '#2D3748', height: 100, textAlignVertical: 'top'
  },
  
  submitBtn: {
    backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 56, borderRadius: 12
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  successBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#D1FAE5', padding: 12, borderRadius: 12,
    marginBottom: 15, borderWidth: 1, borderColor: '#A7F3D0'
  },
  successText: { fontSize: 14, fontWeight: '700', color: '#059669' }
});

export default ServiceAppointmentScreen;
