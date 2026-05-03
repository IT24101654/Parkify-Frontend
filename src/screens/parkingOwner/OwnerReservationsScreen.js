import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, SafeAreaView, StatusBar, Modal, ScrollView, Animated, Dimensions, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/theme';

 const { width } = Dimensions.get('window');

 const OwnerReservationsScreen = ({ navigation }) => {
   const { user, logout } = useAuth();
   const [reservations, setReservations] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedRes, setSelectedRes] = useState(null);
   const [modalVisible, setModalVisible] = useState(false);

   // Sidebar State
   const [sidebarAnim] = useState(new Animated.Value(-width));
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

   const toggleSidebar = () => {
     const toValue = isSidebarOpen ? -width : 0;
     Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
     setIsSidebarOpen(!isSidebarOpen);
   };

   const sidebarMenuItems = [
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
     else if (id === 'reservations') return; // Already here
     else if (id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
     else if (id === 'refunds') navigation.navigate('OwnerRefunds');
     else if (id === 'earningsHistory') navigation.navigate('OwnerEarnings');
     else if (id === 'profile') navigation.navigate('ParkingOwnerProfile');
   };
  
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0 });

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reservations/owner');
      const data = res.data || [];
      setReservations(data);
      
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === 'PENDING').length,
        confirmed: data.filter(r => r.status === 'CONFIRMED').length,
        cancelled: data.filter(r => r.status === 'CANCELLED').length
      });
    } catch (error) {
      console.error('Error fetching owner reservations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleMarkAsPaid = async (reservationId) => {
    try {
      setLoading(true);
      await api.put(`/reservations/mark-paid/${reservationId}`);
      Alert.alert("Success", "Reservation marked as paid!");
      setModalVisible(false);
      fetchReservations();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (res) => {
    setSelectedRes(res);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return '#22543D';
      case 'PENDING': return '#B7791F';
      case 'CANCELLED': return '#C53030';
      default: return '#4A5568';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'CONFIRMED': return '#C6F6D5';
      case 'PENDING': return '#FEEBC8';
      case 'CANCELLED': return '#FED7D7';
      default: return '#E2E8F0';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.resId}>#{item._id?.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.driverName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.parkingName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="car" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.vehicleNumber} (Slot {item.slotNumber})</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.reservationDate} | {item.startTime} - {item.endTime}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>Payment</Text>
          <Text style={[styles.paymentStatus, item.paymentStatus === 'PAID' ? {color: '#38A169'} : {color: '#D69E2E'}]}>
            {item.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
          </Text>
        </View>
        <Text style={styles.amount}>Rs. {item.totalAmount?.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
       {/* Sidebar Overlay */}
       {isSidebarOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />}
       
       {/* Sidebar */}
       <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
         <View style={styles.sidebarHeader}>
           <Image source={require('../../../assets/Parkify.png')} style={styles.sidebarLogo} resizeMode="contain" />
           <Text style={styles.sidebarBrand}>Parkify</Text>
         </View>
         <View style={styles.sidebarUserCard}>
           <View style={styles.sidebarAvatar}>
             {user?.profilePicture ? <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} /> : <MaterialCommunityIcons name="account" size={36} color="#FFF" />}
           </View>
           <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'OWNER'}</Text>
           <Text style={styles.sidebarUserRole}>Parking Owner</Text>
         </View>
         <View style={styles.divider} />
         <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
           {sidebarMenuItems.map(item => (
             <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleSidebarNav(item.id)}>
               <View style={styles.menuIconBox}>
                 <MaterialCommunityIcons name={item.icon} size={22} color="rgba(255,255,255,0.8)" />
               </View>
               <Text style={styles.menuText}>{item.title}</Text>
             </TouchableOpacity>
           ))}
         </ScrollView>
         <View style={styles.divider} />
         <TouchableOpacity style={styles.sidebarLogout} onPress={logout}>
           <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
           <Text style={styles.logoutText}>Sign Out</Text>
         </TouchableOpacity>
       </Animated.View>

       <View style={styles.header}>
         <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
           <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Reservations</Text>
         <TouchableOpacity onPress={fetchReservations} style={styles.refreshBtn}>
           <MaterialCommunityIcons name="refresh" size={24} color="#B26969" />
         </TouchableOpacity>
       </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { borderColor: '#E2E8F0' }]}>
            <Text style={styles.statVal}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#FEEBC8', backgroundColor: '#FFFAF0' }]}>
            <Text style={[styles.statVal, { color: '#DD6B20' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#C6F6D5', backgroundColor: '#F0FFF4' }]}>
            <Text style={[styles.statVal, { color: '#38A169' }]}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#FED7D7', backgroundColor: '#FFF5F5' }]}>
            <Text style={[styles.statVal, { color: '#E53E3E' }]}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#B26969" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={reservations}
            renderItem={renderItem}
            keyExtractor={item => item.id || item._id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank" size={60} color="#CBD5E0" />
                <Text style={styles.emptyText}>No reservations found.</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRes && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reservation Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#A0AEC0" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Res ID</Text>
                    <Text style={styles.detailVal}>#{selectedRes._id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Driver</Text>
                    <Text style={styles.detailVal}>{selectedRes.driverName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailVal}>{selectedRes.parkingName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Slot</Text>
                    <Text style={styles.detailVal}>{selectedRes.slotNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vehicle</Text>
                    <Text style={styles.detailVal}>{selectedRes.vehicleNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Schedule</Text>
                    <Text style={styles.detailVal}>{selectedRes.reservationDate} ({selectedRes.startTime} - {selectedRes.endTime})</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedRes.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedRes.status) }]}>{selectedRes.status}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment</Text>
                    <Text style={[styles.detailVal, selectedRes.paymentStatus === 'PAID' ? {color: '#38A169'} : {color: '#D69E2E'}]}>
                      {selectedRes.paymentStatus}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalVal}>Rs. {selectedRes.totalAmount?.toFixed(2)}</Text>
                  </View>

                  {selectedRes.paymentStatus !== 'PAID' && (
                    <TouchableOpacity 
                      style={styles.confirmPaidBtn} 
                      onPress={() => handleMarkAsPaid(selectedRes._id)}
                    >
                      <MaterialCommunityIcons name="cash-check" size={20} color="#FFF" />
                      <Text style={styles.confirmPaidText}>Confirm Cash Payment</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

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
  refreshBtn: { padding: 4 },
  
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 15, gap: 10, justifyContent: 'space-between'
  },
  statBox: {
    width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', marginBottom: 10
  },
  statVal: { fontSize: 24, fontWeight: '900', color: '#2D3748' },
  statLabel: { fontSize: 13, color: '#718096', fontWeight: '600', marginTop: 4 },
  
  listContent: { padding: 15, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 15,
    borderWidth: 1, borderColor: '#EDF2F7', elevation: 1
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resId: { fontSize: 14, fontWeight: '800', color: '#B26969' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  
  cardBody: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDF2F7' },
  paymentBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentLabel: { fontSize: 12, color: '#A0AEC0' },
  paymentStatus: { fontSize: 12, fontWeight: '800' },
  amount: { fontSize: 16, fontWeight: '900', color: '#2D3748' },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 10, fontSize: 15, color: '#A0AEC0', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#2D4057' },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  detailLabel: { fontSize: 14, color: '#718096', fontWeight: '600' },
  detailVal: { fontSize: 14, color: '#2D3748', fontWeight: '700' },
  totalRow: { marginTop: 10, borderBottomWidth: 0 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#2D3748' },
  totalVal: { fontSize: 20, fontWeight: '900', color: '#B26969' },
  confirmPaidBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#38A169', 
    paddingVertical: 14, 
    borderRadius: 12, 
    marginTop: 20, 
    marginBottom: 10 
  },
  confirmPaidText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

   // Sidebar Styles (Synced with Dashboard)
   overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },
   sidebar: { position: 'absolute', top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#2D4057', zIndex: 3000, padding: 20, paddingTop: 40 },
   sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
   sidebarLogo: { width: 30, height: 30 },
   sidebarBrand: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
   sidebarUserCard: { alignItems: 'center', paddingVertical: 2, marginBottom: 0 },
   sidebarAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B26969', marginBottom: 5 },
   avatarImg: { width: '100%', height: '100%', borderRadius: 25 },
   sidebarUserName: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
   sidebarUserRole: { fontSize: 11, fontWeight: '700', color: '#B26969', marginTop: 2 },
   divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
   sidebarMenu: { flex: 1, paddingTop: 0 },
   menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 5, borderRadius: 14, marginBottom: 0 },
   menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
   menuText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
   sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#B26969', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginTop: 2 },
   logoutText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
   menuBtn: { padding: 5 }
 });

export default OwnerReservationsScreen;
