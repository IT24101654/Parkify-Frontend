import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Alert, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';
import DriverSidebar from '../../components/DriverSidebar';
import { Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

const DriverServiceAppointmentsScreen = ({ navigation, route }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-appointments/my');
      setAppointments(res.data || []);
    } catch (error) {
      console.error('Error fetching service appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = (id, bookingId) => {
    const cancelAction = async () => {
      try {
        console.log(`DEBUG: Attempting to cancel appointment ID: ${id} (#${bookingId})`);
        const res = await api.patch(`/service-appointments/${id}/cancel`);
        console.log('DEBUG: Cancellation response:', res.data);
        fetchAppointments();
      } catch (error) {
        console.error('DEBUG: Cancellation Error:', error.response?.data || error.message);
        Alert.alert('Error', error.response?.data?.error || 'Failed to cancel appointment');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to cancel appointment #${bookingId}?`)) {
        cancelAction();
      }
    } else {
      Alert.alert('Cancel Appointment', `Are you sure you want to cancel appointment #${bookingId}?`, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: cancelAction }
      ]);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'BOOKED': return { bg: '#FEF3C7', color: '#D97706', icon: 'clock-outline', text: 'Booked' };
      case 'COMPLETED': return { bg: '#D1FAE5', color: '#059669', icon: 'check-circle', text: 'Completed' };
      case 'CANCELLED': return { bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle', text: 'Cancelled' };
      default: return { bg: '#EDF2F7', color: '#4A5568', icon: 'help-circle', text: status };
    }
  };

  const renderItem = ({ item }) => {
    const badge = getStatusBadge(item.status);
    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <Text style={styles.bookingId}>#{item.bookingId}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <MaterialCommunityIcons name={badge.icon} size={14} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="store-cog" size={20} color="#718096" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.serviceCenter?.toLowerCase().includes("yasith") ? "Service Center" : item.serviceCenter}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="tools" size={20} color="#718096" />
            <Text style={styles.infoText}>{item.serviceType}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#718096" />
            <Text style={styles.infoText}>{new Date(item.serviceDate).toLocaleDateString()} at {item.timeSlot}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="car" size={20} color="#718096" />
            <Text style={styles.infoText}>{item.vehicleId} ({item.vehicleType})</Text>
          </View>
        </View>

        {item.status === 'BOOKED' && (
          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => handleCancel(item._id, item.bookingId)}
          >
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Driver Sidebar */}
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Service Appointments</Text>
        </View>
        <TouchableOpacity onPress={fetchAppointments} style={styles.backBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>No service appointments found.</Text>
            </View>
          }
        />
      )}
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
  
  listContainer: { padding: 15, paddingBottom: 40 },
  
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EDF2F7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC', paddingBottom: 10 },
  bookingId: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  
  cardBody: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, color: '#4A5568', fontWeight: '500', flex: 1 },
  
  cancelBtn: { marginTop: 15, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FED7D7', alignItems: 'center' },
  cancelBtnText: { color: '#E53E3E', fontSize: 14, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#A0AEC0', fontWeight: '600', marginTop: 15 }
});

export default DriverServiceAppointmentsScreen;
