import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator, Animated, Dimensions, Image, Alert, StatusBar, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ParkingOwnerSidebar from '../../components/ParkingOwnerSidebar';

const { width } = Dimensions.get('window');

const OwnerRefundsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/owner/refunds/pending');
      setRefunds(res.data || []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleProcessRefund = async (paymentId, action) => {
    Alert.alert(
      `${action === 'APPROVE' ? 'Approve' : 'Reject'} Refund`,
      `Are you sure you want to ${action.toLowerCase()} this refund request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: async () => {
            try {
              await api.post('/payments/owner/refunds/process', { paymentId, action });
              Alert.alert('Success', `Refund ${action.toLowerCase()}ed successfully.`);
              fetchRefunds();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to process refund');
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'view-dashboard' },
    { id: 'slots', title: 'Parking Slots', icon: 'car-brake-parking' },
    { id: 'inventory', title: 'Inventory', icon: 'package-variant-closed' },
    { id: 'service', title: 'Service Center', icon: 'store-cog' },
    { id: 'reservations', title: 'Reservations', icon: 'calendar-check' },
    { id: 'serviceBookings', title: 'Service Bookings', icon: 'hammer-wrench' },
    { id: 'refunds', title: 'Refund Requests', icon: 'cash-refund' },
    { id: 'earningsHistory', title: 'Earnings History', icon: 'chart-line' },
    { id: 'profile', title: 'My Profile', icon: 'account-circle' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="account-circle" size={40} color="#CBD5E0" />
        <View style={styles.headerInfo}>
          <Text style={styles.driverName}>{item.reservationId?.driverName || 'Unknown Driver'}</Text>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.amount}>Rs. {item.amount?.toFixed(2)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Reservation ID:</Text>
          <Text style={styles.val}>#{item.reservationId?._id?.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Refund Reason:</Text>
          <Text style={styles.reasonText}>{item.refundReason}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleProcessRefund(item._id, 'REJECT')}
        >
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleProcessRefund(item._id, 'APPROVE')}
        >
          <Text style={styles.approveBtnText}>Approve Refund</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <View style={styles.navbar}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>Refund Requests</Text>
        <TouchableOpacity onPress={fetchRefunds} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color="#B26969" />
        </TouchableOpacity>
      </View>

      <ParkingOwnerSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      {loading ? (
        <ActivityIndicator size="large" color="#B26969" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={refunds}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-remove" size={60} color="#CBD5E0" />
              <Text style={styles.emptyText}>No pending refund requests.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', elevation: 2 },
  menuBtn: { padding: 4 },
  navbarTitle: { fontSize: 18, fontWeight: '800', color: '#2D4057' },
  refreshBtn: { padding: 4 },

  listContent: { padding: 15, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#EDF2F7', elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: '800', color: '#2D3748' },
  dateText: { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '900', color: '#B26969' },

  body: { marginVertical: 10 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  label: { fontSize: 14, color: '#718096', fontWeight: '600' },
  val: { fontSize: 14, color: '#2D3748', fontWeight: '800' },
  reasonBox: { backgroundColor: '#FFF5F5', padding: 12, borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#FED7D7' },
  reasonLabel: { fontSize: 12, fontWeight: '800', color: '#B26969', marginBottom: 4 },
  reasonText: { fontSize: 13, color: '#2D3748', lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 15 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#EDF2F7' },
  rejectBtnText: { color: '#4A5568', fontWeight: '800' },
  approveBtn: { backgroundColor: '#38A169' },
  approveBtnText: { color: '#FFF', fontWeight: '800' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, fontSize: 16, color: '#A0AEC0', fontWeight: '600' },

  // Sidebar
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },
  sidebar: { position: 'absolute', top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#2D4057', zIndex: 3000, padding: 20, paddingTop: 40 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sidebarLogo: { width: 30, height: 30 },
  sidebarBrand: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  sidebarUserCard: { alignItems: 'center', paddingVertical: 2, marginBottom: 0 },
  sidebarAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B26969', marginBottom: 5 },
  sidebarUserName: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sidebarUserRole: { fontSize: 11, fontWeight: '700', color: '#B26969', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  sidebarMenu: { flex: 1, paddingTop: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 5, borderRadius: 14, marginBottom: 0 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#B26969', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginTop: 2 },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});

export default OwnerRefundsScreen;
