import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DriverSidebar from '../../components/DriverSidebar';
import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const webInputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #EDF2F7',
  marginTop: '5px',
  fontSize: '16px',
  backgroundColor: '#F8F9FA'
};

const ReservationScreen = ({ route, navigation }) => {
  const { place, slot } = route.params;
  const { user } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 60 * 60 * 1000)); // +1 hour
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedVehicle(res.data[0]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'Failed to load your vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDurationHours = () => {
    let diff = endTime.getTime() - startTime.getTime();
    if (diff <= 0) return 0;
    return diff / (1000 * 60 * 60);
  };

  const calculateTotalAmount = () => {
    const hours = calculateDurationHours();
    if (hours <= 0) return 0;
    return (hours * (place.price || 0)).toFixed(2);
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleBook = async () => {
    if (!selectedVehicle) {
      Alert.alert('Vehicle Required', 'Please add and select a vehicle to make a reservation.');
      return;
    }
    
    if (calculateDurationHours() <= 0) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        driverName: user.name,
        parkingPlaceId: place._id || place.id,
        slotId: slot._id || slot.id,
        slotNumber: slot.slotName,
        vehicleNumber: selectedVehicle.vehicleNumber,
        vehicleType: selectedVehicle.type || 'Car',
        reservationDate: date.toISOString().split('T')[0],
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        duration: calculateDurationHours().toFixed(2),
        pricePerHour: place.price,
        totalAmount: parseFloat(calculateTotalAmount())
      };

      const res = await api.post('/reservations/book', payload);
      
      // Navigate to Checkout
      navigation.navigate('CheckoutPayment', {
        reservation: res.data,
        place
      });

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create reservation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#B26969" />
      </View>
    );
  }

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
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2D4057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Reservation</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Parking Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#B08974" />
            <Text style={styles.sectionTitle}>Parking Details</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{place.parkingName}</Text>
            <Text style={styles.cardSubtitle}>Slot: {slot.slotName} ({slot.slotType})</Text>
            <Text style={styles.cardText}>{place.location || place.address}</Text>
          </View>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="car" size={20} color="#B08974" />
            <Text style={styles.sectionTitle}>Select Vehicle</Text>
          </View>
          {vehicles.length === 0 ? (
            <View style={styles.card}>
              <Text style={{ color: '#718096' }}>No vehicles found. Please add a vehicle in your profile first.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
              {vehicles.map(v => (
                <TouchableOpacity
                  key={v._id || v.id}
                  style={[styles.vehicleCard, selectedVehicle?._id === v._id && styles.vehicleCardSelected]}
                  onPress={() => setSelectedVehicle(v)}
                >
                  <MaterialCommunityIcons 
                    name={v.type === 'Bike' ? 'motorbike' : 'car'} 
                    size={24} 
                    color={selectedVehicle?._id === v._id ? '#FFF' : '#2D4057'} 
                  />
                  <Text style={[styles.vehicleNumber, selectedVehicle?._id === v._id && { color: '#FFF' }]}>
                    {v.vehicleNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#B08974" />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>
          <View style={styles.card}>
            {Platform.OS === 'web' ? (
              <View style={{ padding: 15 }}>
                <Text style={styles.webLabel}>Select Date:</Text>
                <input 
                  type="date" 
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  style={webInputStyle}
                />
                <Text style={[styles.webLabel, { marginTop: 10 }]}>Start Time:</Text>
                <input 
                  type="time" 
                  value={formatTime(startTime)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':');
                    const newTime = new Date(startTime);
                    newTime.setHours(parseInt(h), parseInt(m));
                    setStartTime(newTime);
                  }}
                  style={webInputStyle}
                />
                <Text style={[styles.webLabel, { marginTop: 10 }]}>End Time:</Text>
                <input 
                  type="time" 
                  value={formatTime(endTime)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':');
                    const newTime = new Date(endTime);
                    newTime.setHours(parseInt(h), parseInt(m));
                    setEndTime(newTime);
                  }}
                  style={webInputStyle}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <Text style={styles.inputValue}>{date.toDateString()}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.inputRow} onPress={() => setShowStartTimePicker(true)}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <Text style={styles.inputValue}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.inputRow, { borderBottomWidth: 0 }]} onPress={() => setShowEndTimePicker(true)}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <Text style={styles.inputValue}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(e, d) => {
                      setShowDatePicker(false);
                      if (d) setDate(d);
                    }}
                  />
                )}
                {showStartTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    onChange={(e, t) => {
                      setShowStartTimePicker(Platform.OS === 'ios');
                      if (t) setStartTime(t);
                    }}
                  />
                )}
                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    onChange={(e, t) => {
                      setShowEndTimePicker(Platform.OS === 'ios');
                      if (t) setEndTime(t);
                    }}
                  />
                )}
              </>
            )}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash" size={20} color="#B08974" />
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryVal}>{calculateDurationHours().toFixed(2)} Hrs</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryVal}>Rs. {place.price} / hr</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalVal}>Rs. {calculateTotalAmount()}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.bookBtn, saving && { opacity: 0.7 }]} 
          onPress={handleBook}
          disabled={saving || vehicles.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.bookBtnText}>PROCEED TO PAYMENT</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', elevation: 2
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2D4057' },
  backBtn: { padding: 4 },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#2D3748' },
  
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, elevation: 1, borderWidth: 1, borderColor: '#EDF2F7' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#2D4057', marginBottom: 4 },
  cardSubtitle: { fontSize: 15, color: '#B26969', fontWeight: '700', marginBottom: 4 },
  cardText: { fontSize: 14, color: '#718096' },
  
  vehicleScroll: { flexDirection: 'row' },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 12
  },
  vehicleCardSelected: { backgroundColor: '#2D4057', borderColor: '#2D4057' },
  vehicleNumber: { fontSize: 14, fontWeight: '700', color: '#2D4057' },
  
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  inputLabel: { fontSize: 15, color: '#4A5568', fontWeight: '600' },
  inputValue: { fontSize: 16, color: '#2D4057', fontWeight: '700' },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 15, color: '#718096' },
  summaryVal: { fontSize: 15, color: '#2D4057', fontWeight: '600' },
  totalRow: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EDF2F7' },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#2D3748' },
  totalVal: { fontSize: 22, fontWeight: '900', color: '#B26969' },
  
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#EDF2F7', elevation: 10
  },
  bookBtn: {
    backgroundColor: '#B26969', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 8
  },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  webLabel: { fontSize: 14, fontWeight: '700', color: '#4A5568' }
});

export default ReservationScreen;
