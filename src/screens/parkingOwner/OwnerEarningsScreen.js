import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator, Animated, Dimensions, Image, StatusBar, ScrollView, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ParkingOwnerSidebar from '../../components/ParkingOwnerSidebar';

const { width } = Dimensions.get('window');

const OwnerEarningsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [earningsData, setEarningsData] = useState({ totalEarnings: 0, count: 0, payments: [] });
  const [loading, setLoading] = useState(true);
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/owner/earnings');
      setEarningsData(res.data);
    } catch (error) {
      console.error('Error fetching earnings history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
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

  const handleSidebarNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('ParkingOwnerDashboard');
    else if (id === 'slots') navigation.navigate('ParkingPlaceList');
    else if (id === 'inventory') navigation.navigate('Inventory');
    else if (id === 'service') navigation.navigate('ServiceCenter');
    else if (id === 'reservations') navigation.navigate('OwnerReservations');
    else if (id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
    else if (id === 'refunds') navigation.navigate('OwnerRefunds');
    else if (id === 'earningsHistory') return; // Already here
    else if (id === 'profile') navigation.navigate('ParkingOwnerProfile');
  };

  const handleOpenDetails = (payment) => {
    setSelectedPayment(payment);
    setIsModalVisible(true);
  };

  const renderPaymentItem = ({ item }) => (
    <TouchableOpacity style={styles.paymentCard} onPress={() => handleOpenDetails(item)}>
      <View style={styles.paymentIconBox}>
        <MaterialCommunityIcons 
          name={item.paymentMethod === 'STRIPE' ? 'credit-card-outline' : 'cash-multiple'} 
          size={24} color="#B26969" 
        />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentDate}>{new Date(item.createdAt).toLocaleDateString()} | {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        <Text style={styles.paymentMethodText}>{item.paymentMethod} Payment - {item.parkingName}</Text>
      </View>
      <Text style={styles.paymentAmount}>+ Rs.{item.amount.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.navbar}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>Earnings History</Text>
        <TouchableOpacity onPress={fetchEarnings} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color="#B26969" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryHeader}>
        <Text style={styles.summaryLabel}>Total Balance</Text>
        <Text style={styles.summaryAmount}>Rs. {earningsData.totalEarnings.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        <Text style={styles.summarySub}>From {earningsData.count} successful transactions</Text>
      </View>

      <ParkingOwnerSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#B26969" style={{ marginTop: 50 }} />
        ) : (
          <>
          <FlatList
            data={earningsData.payments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="cash-off" size={60} color="#E2E8F0" />
                  <Text style={styles.emptyText}>No earnings found yet.</Text>
                </View>
              )
            }
          />

          {/* Payment Detail Modal */}
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#2D4057" />
                  </TouchableOpacity>
                </View>

                {selectedPayment && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Parking Info</Text>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="office-building" size={20} color="#B26969" />
                        <Text style={styles.detailText}>{selectedPayment.parkingName}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="car-brake-parking" size={20} color="#B26969" />
                        <Text style={styles.detailText}>Slot: {selectedPayment.reservationId?.slotNumber || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="car" size={20} color="#B26969" />
                        <Text style={styles.detailText}>Vehicle: {selectedPayment.reservationId?.vehicleNumber || 'N/A'}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Driver Details</Text>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="account" size={20} color="#B26969" />
                        <Text style={styles.detailText}>{selectedPayment.reservationId?.driverName || 'Unknown'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="email" size={20} color="#B26969" />
                        <Text style={styles.detailText}>{selectedPayment.reservationId?.driverId?.email || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="phone" size={20} color="#B26969" />
                        <Text style={styles.detailText}>{selectedPayment.reservationId?.driverId?.phoneNumber || 'N/A'}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailSection}>
                      <Text style={styles.sectionLabel}>Payment Info</Text>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="cash" size={20} color="#B26969" />
                        <Text style={styles.detailValue}>Rs. {selectedPayment.amount?.toFixed(2)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar-clock" size={20} color="#B26969" />
                        <Text style={styles.detailText}>
                          {new Date(selectedPayment.createdAt).toLocaleDateString()} at {new Date(selectedPayment.createdAt).toLocaleTimeString()}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="credit-card-outline" size={20} color="#B26969" />
                        <Text style={styles.detailText}>Method: {selectedPayment.paymentMethod}</Text>
                      </View>
                    </View>
                  </ScrollView>
                )}
                
                <TouchableOpacity 
                  style={styles.closeModalBtn} 
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.closeModalText}>Close Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  menuBtn: { padding: 4 },
  navbarTitle: { fontSize: 18, fontWeight: '800', color: '#2D4057' },
  refreshBtn: { padding: 4 },

  summaryHeader: { backgroundColor: '#B26969', padding: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600' },
  summaryAmount: { color: '#FFF', fontSize: 36, fontWeight: '900', marginVertical: 8 },
  summarySub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },

  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 20 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 16, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: '#EDF2F7' },
  paymentIconBox: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  paymentInfo: { flex: 1, marginLeft: 15 },
  paymentDate: { fontSize: 12, color: '#A0AEC0', fontWeight: '600' },
  paymentMethodText: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginTop: 2 },
  paymentAmount: { fontSize: 16, fontWeight: '900', color: '#38A169' },

  emptyState: { alignItems: 'center', marginTop: 60 },
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

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#2D4057' },
  detailSection: { marginVertical: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#7A868E', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  detailText: { fontSize: 15, color: '#2D4057', fontWeight: '600' },
  detailValue: { fontSize: 18, color: '#B26969', fontWeight: '900' },
  closeModalBtn: { backgroundColor: '#2D4057', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeModalText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default OwnerEarningsScreen;
