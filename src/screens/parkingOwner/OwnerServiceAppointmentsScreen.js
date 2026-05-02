import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Alert, Animated, Dimensions, Image, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

 const { width } = Dimensions.get('window');

 const OwnerServiceAppointmentsScreen = ({ navigation }) => {
   const { user, logout } = useAuth();
   const [appointments, setAppointments] = useState([]);
   const [loading, setLoading] = useState(true);

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
     else if (id === 'reservations') navigation.navigate('OwnerReservations');
     else if (id === 'serviceBookings') return; // Already here
     else if (id === 'refunds') navigation.navigate('OwnerRefunds');
     else if (id === 'earningsHistory') navigation.navigate('OwnerEarnings');
     else if (id === 'profile') navigation.navigate('ParkingOwnerProfile');
   };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-appointments/owner');
      setAppointments(res.data || []);
    } catch (error) {
      console.error('Error fetching owner appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleAction = (id, bookingId, action) => {
    const actionText = action === 'complete' ? 'Complete' : 'Cancel';
    Alert.alert(`${actionText} Appointment`, `Are you sure you want to ${actionText.toLowerCase()} appointment #${bookingId}?`, [
      { text: 'No', style: 'cancel' },
      { text: `Yes, ${actionText}`, style: action === 'cancel' ? 'destructive' : 'default', onPress: async () => {
        try {
          await api.patch(`/service-appointments/${id}/${action}`);
          fetchAppointments();
        } catch (error) {
          Alert.alert('Error', `Failed to ${actionText.toLowerCase()} appointment`);
        }
      }}
    ]);
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
            <MaterialCommunityIcons name="account" size={20} color="#718096" />
            <Text style={styles.infoText}>{item.customerName}</Text>
          </View>
          {item.phone && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#718096" />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="car" size={20} color="#718096" />
            <Text style={styles.infoText}>{item.vehicleId} ({item.vehicleType})</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="tools" size={20} color="#718096" />
            <Text style={styles.infoText}>{item.serviceType} at {item.serviceCenter}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#718096" />
            <Text style={styles.infoText}>{new Date(item.serviceDate).toLocaleDateString()} at {item.timeSlot}</Text>
          </View>
          {item.notes && (
             <View style={styles.notesBox}>
               <MaterialCommunityIcons name="text-box-outline" size={18} color="#718096" style={{marginTop: 2}} />
               <Text style={styles.notesText}>{item.notes}</Text>
             </View>
          )}
        </View>

        {item.status === 'BOOKED' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => handleAction(item._id, item.bookingId, 'cancel')}
            >
              <MaterialCommunityIcons name="close" size={18} color="#E53E3E" />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => handleAction(item._id, item.bookingId, 'complete')}
            >
              <MaterialCommunityIcons name="check" size={18} color="#FFF" />
              <Text style={styles.completeBtnText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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
           <MaterialCommunityIcons name="menu" size={26} color={COLORS.primary} />
         </TouchableOpacity>
         <View style={styles.headerCenter}>
           <Text style={styles.headerTitle}>Service Bookings</Text>
         </View>
         <TouchableOpacity onPress={fetchAppointments} style={styles.refreshBtn}>
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
              <Text style={styles.emptyText}>No appointments booked yet.</Text>
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
  notesBox: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, gap: 8, marginTop: 5 },
  notesText: { fontSize: 13, color: '#4A5568', flex: 1, fontStyle: 'italic' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F7FAFC' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 6 },
  cancelBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FED7D7' },
  cancelBtnText: { color: '#E53E3E', fontSize: 14, fontWeight: '700' },
  completeBtn: { backgroundColor: '#38A169' },
  completeBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
   emptyText: { fontSize: 15, color: '#A0AEC0', fontWeight: '600', marginTop: 15 },

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
   menuBtn: { padding: 5 },
   refreshBtn: { padding: 5 }
 });

export default OwnerServiceAppointmentsScreen;
