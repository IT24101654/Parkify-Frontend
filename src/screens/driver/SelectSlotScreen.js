import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DriverSidebar from '../../components/DriverSidebar';
import { Animated } from 'react-native';

const { width } = Dimensions.get('window');

const SelectSlotScreen = ({ route, navigation }) => {
  const { place } = route.params;
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/slots/place/${place._id}`);
      setSlots(res.data || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      Alert.alert('Error', 'Failed to load slots for this location.');
    } finally {
      setLoading(false);
    }
  }, [place._id]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleBook = () => {
    if (!selectedSlot) {
      Alert.alert('Selection Required', 'Please select a slot first.');
      return;
    }
    // Navigate to Reservation Form
    navigation.navigate('Reservation', { place, slot: selectedSlot });
  };

  const floors = [...new Set(slots.map(s => s.floor || 'G'))].sort();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Sidebar */}
      <DriverSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.backBtn}>
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2D4057" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Slot</Text>
          <Text style={styles.headerSubtitle}>{place.parkingName}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.legendItem}>
            <View style={[styles.box, { backgroundColor: '#E2E8F0' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.box, { backgroundColor: '#B26969' }]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.box, { backgroundColor: '#ED8936' }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#B26969" style={{ marginTop: 100 }} />
        ) : slots.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#E2E8F0" />
            <Text style={styles.emptyText}>No slots configured for this place.</Text>
          </View>
        ) : (
          floors.map(floor => (
            <View key={floor} style={styles.floorSection}>
              <View style={styles.floorHeader}>
                <MaterialCommunityIcons name="layers-outline" size={20} color="#B08974" />
                <Text style={styles.floorTitle}>Floor: {floor}</Text>
              </View>
              <View style={styles.slotsGrid}>
                {slots.filter(s => (s.floor || 'G') === floor).map(slot => {
                  const isAvailable = slot.slotStatus === 'Available';
                  const isSelected = selectedSlot?._id === slot._id;
                  
                  return (
                    <TouchableOpacity
                      key={slot._id}
                      style={[
                        styles.slotCard,
                        !isAvailable && styles.slotOccupied,
                        isSelected && styles.slotSelected
                      ]}
                      onPress={() => isAvailable && setSelectedSlot(slot)}
                      disabled={!isAvailable}
                    >
                      <MaterialCommunityIcons 
                        name={slot.slotType === 'Bike' ? 'motorbike' : 'car'} 
                        size={24} 
                        color={isSelected ? '#FFF' : !isAvailable ? '#FFF' : '#A0AEC0'} 
                      />
                      <Text style={[
                        styles.slotName,
                        (isSelected || !isAvailable) && { color: '#FFF' }
                      ]}>
                        {slot.slotName}
                      </Text>
                      {!isAvailable && (
                        <View style={styles.occupiedBadge}>
                          <Text style={styles.occupiedText}>FULL</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer Button */}
      {selectedSlot && (
        <View style={styles.footer}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionLabel}>Selected Slot</Text>
            <Text style={styles.selectionVal}>{selectedSlot.slotName} ({selectedSlot.slotType})</Text>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleBook}>
            <Text style={styles.confirmBtnText}>CONFIRM & BOOK</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    elevation: 2
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2D4057' },
  headerSubtitle: { fontSize: 12, color: '#A0AEC0', fontWeight: '700', textTransform: 'uppercase' },
  backBtn: { padding: 4 },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#EDF2F7'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: { width: 16, height: 16, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '700', color: '#718096' },
  
  floorSection: { marginBottom: 30 },
  floorHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, paddingLeft: 5 },
  floorTitle: { fontSize: 18, fontWeight: '800', color: '#B08974' },
  
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slotCard: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EDF2F7',
    position: 'relative'
  },
  slotOccupied: { backgroundColor: '#B26969', borderColor: '#B26969' },
  slotSelected: { backgroundColor: '#ED8936', borderColor: '#ED8936' },
  slotName: { fontSize: 16, fontWeight: '900', color: '#2D4057', marginTop: 8 },
  
  occupiedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  occupiedText: { fontSize: 8, fontWeight: '900', color: '#FFF' },
  
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#A0AEC0', marginTop: 15, fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10
  },
  selectionInfo: { flex: 1 },
  selectionLabel: { fontSize: 12, color: '#A0AEC0', fontWeight: '700' },
  selectionVal: { fontSize: 16, fontWeight: '800', color: '#2D4057' },
  confirmBtn: {
    backgroundColor: '#B26969',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    gap: 8
  },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' }
});

export default SelectSlotScreen;
