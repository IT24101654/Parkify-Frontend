import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Image, Dimensions, Animated, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { PanResponder, Alert } from 'react-native';
import api from '../services/api';

const { width } = Dimensions.get('window');

// ── Feature Card (same style as DriverDashboard) ──
const FeatureCard = ({ icon, title, desc, footerText, color, onPress }) => (
  <TouchableOpacity style={[styles.featureCard, SHADOWS.medium]} onPress={onPress} activeOpacity={0.9}>
    <View style={[styles.fcIconWrapper, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={icon} size={28} color="#FFF" />
    </View>
    <Text style={styles.fcTitle}>{title}</Text>
    <Text style={styles.fcDesc}>{desc}</Text>
    <View style={styles.fcFooter}>
      <MaterialCommunityIcons name="chevron-right" size={16} color="#9C8C79" />
      <Text style={styles.fcFooterText}>{footerText}</Text>
    </View>
  </TouchableOpacity>
);



// ── Main Dashboard ──
const ParkingOwnerDashboard = ({ navigation }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, count: 0 });

  // Interactive Background State (ITP Mesh Gradient)
  const blob1Pos = useRef(new Animated.ValueXY({ x: width * 0.2, y: 100 })).current;
  const blob2Pos = useRef(new Animated.ValueXY({ x: width * 0.8, y: 300 })).current;
  const blob3Pos = useRef(new Animated.ValueXY({ x: width * 0.5, y: 500 })).current;
  const blob4Pos = useRef(new Animated.ValueXY({ x: width * 0.1, y: 700 })).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const { moveX, moveY } = gestureState;
      Animated.parallel([
        Animated.spring(blob1Pos, { toValue: { x: moveX - 100, y: moveY - 100 }, useNativeDriver: false, friction: 8 }),
        Animated.spring(blob2Pos, { toValue: { x: width - moveX - 150, y: width - moveY - 150 }, useNativeDriver: false, friction: 10 }),
        Animated.spring(blob3Pos, { toValue: { x: moveX - 150, y: moveY + 100 }, useNativeDriver: false, friction: 12 }),
        Animated.spring(blob4Pos, { toValue: { x: width - moveX + 50, y: moveY - 200 }, useNativeDriver: false, friction: 15 }),
      ]).start();
    }
  });

  const hasInventory = user?.ownerServices?.hasInventory;
  const hasServiceCenter = user?.ownerServices?.hasServiceCenter;

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/payments/owner/earnings');
      setEarnings(res.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleToggleFeature = async (type) => {
    const featureName = type === 'inventory' ? 'Inventory' : 'Service Center';
    const isCurrentlyEnabled = type === 'inventory' ? user?.ownerServices?.hasInventory : user?.ownerServices?.hasServiceCenter;

    Alert.alert(
      `${isCurrentlyEnabled ? 'Disable' : 'Enable'} ${featureName}`,
      `Would you like to ${isCurrentlyEnabled ? 'disable' : 'enable'} the ${featureName} feature?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: isCurrentlyEnabled ? 'Disable Now' : 'Enable Now', 
          onPress: async () => {
            try {
              setLoading(true);
              const currentServices = user?.ownerServices || { hasInventory: false, hasServiceCenter: false };
              const services = { ...currentServices };
              if (type === 'inventory') services.hasInventory = !isCurrentlyEnabled;
              else services.hasServiceCenter = !isCurrentlyEnabled;

              const res = await api.put('/auth/update-profile', { ownerServices: services });
              await updateUser(res.data.user);
              Alert.alert('Success', `${featureName} ${isCurrentlyEnabled ? 'disabled' : 'enabled'} successfully!`);
            } catch (err) {
              Alert.alert('Error', `Failed to update ${featureName}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      sidebarAnim.setValue(-width);
      setIsSidebarOpen(false);
      fetchEarnings();
      try { await refreshUser(); } catch (_) {}
    });
    return unsubscribe;
  }, [navigation]);

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

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Interactive Background Elements (ITP Style Mesh Gradient) */}
      <View style={styles.bgWrapper}>
        <Animated.View style={[styles.blob, styles.blob1, { transform: blob1Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob2, { transform: blob2Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob3, { transform: blob3Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob4, { transform: blob4Pos.getTranslateTransform() }]} />
      </View>
      <View style={styles.bgGradientOverlay} />

      {/* Overlay */}
      {isSidebarOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />
      )}

      {/* ── Sidebar ── */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        {/* Logo */}
        <View style={styles.sidebarHeader}>
          <Image source={require('../../assets/Parkify.png')} style={styles.sidebarLogo} resizeMode="contain" />
          <Text style={styles.sidebarBrand}>Parkify</Text>
        </View>

        {/* User card */}
        <View style={styles.sidebarUserCard}>
          <View style={[styles.sidebarAvatar, { overflow: 'hidden' }]}>
            {user?.profilePicture
              ? <Image source={{ uri: user.profilePicture }} style={{ width: '100%', height: '100%' }} />
              : <MaterialCommunityIcons name="account" size={36} color="#FFF" />}
          </View>
          <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'OWNER'}</Text>
          <Text style={styles.sidebarUserRole}>Parking Owner</Text>
        </View>

        <View style={styles.divider} />

        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => {
              toggleSidebar();
              if (item.id === 'dashboard') return;
              else if (item.id === 'profile') navigation.navigate('ParkingOwnerProfile');
              else if (item.id === 'slots') navigation.navigate('ParkingPlaceList');
              else if (item.id === 'reservations') navigation.navigate('OwnerReservations');
              else if (item.id === 'inventory') navigation.navigate('Inventory');
              else if (item.id === 'service') navigation.navigate('ServiceCenter');
              else if (item.id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
              else if (item.id === 'refunds') navigation.navigate('OwnerRefunds');
              else if (item.id === 'earningsHistory') navigation.navigate('OwnerEarnings');
            }}>
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
        <Text style={styles.sidebarVersion}>Parkify v1.0.0</Text>
      </Animated.View>

      {/* ── Main Content ── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
          </TouchableOpacity>
          <View style={styles.navRight}>
            <TouchableOpacity style={styles.notificationBtn}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#7A868E" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.avatar, { overflow: 'hidden' }]} onPress={() => navigation.navigate('ParkingOwnerProfile')}>
              {user?.profilePicture
                ? <Image source={{ uri: user.profilePicture }} style={{ width: '100%', height: '100%' }} />
                : <Text style={styles.avatarText}>{(user?.name || 'O')[0]?.toUpperCase()}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtitle}>Welcome to your Dashboard</Text>
          <View style={styles.nameRow}>
            <Text style={styles.welcomeTitle}>{user?.name || 'Parking Owner'}</Text>
            <MaterialCommunityIcons name="hand-wave" size={24} color="#ED8936" style={{ marginLeft: 10 }} />
          </View>
          <View style={styles.welcomeDivider} />
        </View>

        {/* Earnings Summary Card */}
        <View style={[styles.earningsCard, SHADOWS.medium]}>
          <View style={styles.earningsHeader}>
            <View style={styles.earningsIconBox}>
              <MaterialCommunityIcons name="wallet" size={24} color="#FFF" />
            </View>
            <Text style={styles.earningsTitle}>Total Earnings</Text>
          </View>
          <Text style={styles.earningsAmount}>Rs. {earnings.totalEarnings?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          <View style={styles.earningsFooter}>
            <Text style={styles.earningsSubText}>From {earnings.count} successful payments</Text>
            <TouchableOpacity onPress={fetchEarnings}>
              <MaterialCommunityIcons name="refresh" size={16} color="#B26969" />
            </TouchableOpacity>
          </View>
        </View>



        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard Features</Text>
          <Text style={styles.sectionSubtitle}>Manage your parking operations</Text>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.grid}>
          <FeatureCard
            icon="garage" title="My Parking Slots" desc="Manage slots & pricing"
            footerText="Manage Listings" color="#6F7C80" onPress={() => navigation.navigate('ParkingPlaceList')} />
          <FeatureCard
            icon="book-open-variant" title="Reservations" desc="Bookings & confirmations"
            footerText="Review Bookings" color="#B26969" onPress={() => navigation.navigate('OwnerReservations')} />
          <FeatureCard
            icon="cash-refund" title="Refunds" desc="Approve or reject refunds"
            footerText="Action Required" color="#B08974" onPress={() => navigation.navigate('OwnerRefunds')} />
          <FeatureCard
            icon="chart-line" title="Earnings" desc="Revenue & financial reports"
            footerText="Financial Insights" color="#7A806B" onPress={() => navigation.navigate('OwnerEarnings')} />

          {hasInventory ? (
            <FeatureCard
              icon="package-variant-closed" title="Inventory" desc="Track & restock accessories"
              footerText="Shop Inventory" color="#4A5568" onPress={() => navigation.navigate('Inventory')} />
          ) : (
            <TouchableOpacity 
              style={[styles.featureCard, styles.addCard, SHADOWS.medium]} 
              activeOpacity={0.9}
              onPress={() => handleToggleFeature('inventory')}
            >
              <View style={[styles.fcIconWrapper, { backgroundColor: '#E2E8F0' }]}>
                <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#718096" />
              </View>
              <Text style={[styles.fcTitle, { color: '#718096' }]}>Add Inventory</Text>
              <Text style={styles.fcDesc}>Sell accessories & parts</Text>
              <View style={styles.fcFooter}>
                <MaterialCommunityIcons name="auto-fix" size={16} color="#9C8C79" />
                <Text style={styles.fcFooterText}>Enable Feature</Text>
              </View>
            </TouchableOpacity>
          )}

          {hasServiceCenter ? (
            <>
              <FeatureCard
                icon="car-wrench" title="Service Center" desc="Manage repair settings"
                footerText="Settings" color="#2D6A4F" onPress={() => navigation.navigate('ServiceCenter')} />
              <FeatureCard
                icon="tools" title="Service Bookings" desc="Manage service appointments"
                footerText="View" color="#C05621" onPress={() => navigation.navigate('OwnerServiceAppointments')} />
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.featureCard, styles.addCard, SHADOWS.medium]} 
              activeOpacity={0.9}
              onPress={() => handleToggleFeature('service')}
            >
              <View style={[styles.fcIconWrapper, { backgroundColor: '#E2E8F0' }]}>
                <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#718096" />
              </View>
              <Text style={[styles.fcTitle, { color: '#718096' }]}>Add Service Center</Text>
              <Text style={styles.fcDesc}>Vehicle repairs & maintenance</Text>
              <View style={styles.fcFooter}>
                <MaterialCommunityIcons name="auto-fix" size={16} color="#9C8C79" />
                <Text style={styles.fcFooterText}>Enable Feature</Text>
              </View>
            </TouchableOpacity>
          )}

          <FeatureCard
            icon="account-circle" title="My Profile" desc="Profile & account settings"
            footerText="Profile Settings" color="#2D4057" onPress={() => navigation.navigate('ParkingOwnerProfile')} />
        </View>


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 40 },

  // Navbar
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  menuBtn: { padding: 4 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2D4057', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  notificationBtn: { position: 'relative' },
  notificationDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#B26969', borderWidth: 1.5, borderColor: '#FFF' },
  
  // Earnings Card
  earningsCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#EDF2F7' },
  earningsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  earningsIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#B26969', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  earningsTitle: { fontSize: 16, fontWeight: '700', color: '#718096' },
  earningsAmount: { fontSize: 32, fontWeight: '900', color: '#2D3748', marginBottom: 10 },
  earningsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 12 },
  earningsSubText: { fontSize: 13, color: '#A0AEC0', fontWeight: '600' },

  // Welcome Section
  welcomeSection: { alignItems: 'center', marginBottom: 30, marginTop: 15 },
  welcomeSubtitle: { fontSize: 24, fontWeight: '900', color: '#B26969', letterSpacing: -0.5, textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#2D4057', textAlign: 'center' },
  welcomeDivider: { width: 40, height: 3, backgroundColor: '#ED8936', borderRadius: 2, marginTop: 10, opacity: 0.8 },



  // Section header
  sectionHeader: { alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#B08974', textAlign: 'center', letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 13, color: '#9C8C79', fontWeight: '600', textAlign: 'center', marginTop: 4 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 20 },
  addCard: { borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.6)' },
  fcIconWrapper: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  fcTitle: { fontSize: 14, fontWeight: '800', color: '#2D4057', marginBottom: 4 },
  fcDesc: { fontSize: 11, color: '#7A868E', marginBottom: 12, lineHeight: 16 },
  fcFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 8 },
  fcFooterText: { fontSize: 10, color: '#9C8C79', fontWeight: '700', textTransform: 'uppercase' },

  sidebarVersion: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600', marginTop: 12 },

  // Overlay
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },

  // Sidebar
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

  // Background Mesh
  bgGradientOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    zIndex: -1,
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -2,
    backgroundColor: '#d1c9ba',
  },
  blob: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.5,
  },
  blob1: { backgroundColor: '#F2C6AF' },
  blob2: { backgroundColor: '#BDAD9C' },
  blob3: { backgroundColor: '#BBC4A0' },
  blob4: { backgroundColor: '#99D3E4' },
});

export default ParkingOwnerDashboard;
