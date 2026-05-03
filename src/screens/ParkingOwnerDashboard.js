import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Animated, PanResponder, StatusBar,
  SafeAreaView, ActivityIndicator, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const FeatureCard = ({ icon, title, desc, footerText, color, onPress }) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.fcIconWrapper, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.fcTitle}>{title}</Text>
    <Text style={styles.fcDesc} numberOfLines={2}>{desc}</Text>
    <View style={styles.fcFooter}>
      <Text style={styles.fcFooterText}>{footerText}</Text>
      <MaterialCommunityIcons name="chevron-right" size={14} color="#9C8C79" />
    </View>
  </TouchableOpacity>
);

const ParkingOwnerDashboard = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuth();
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Background blobs animation
  const blob1Pos = useRef(new Animated.ValueXY({ x: width * 0.2, y: 100 })).current;
  const blob2Pos = useRef(new Animated.ValueXY({ x: width * 0.8, y: 300 })).current;
  const blob3Pos = useRef(new Animated.ValueXY({ x: width * 0.5, y: 500 })).current;
  const blob4Pos = useRef(new Animated.ValueXY({ x: width * 0.1, y: 700 })).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
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

  useEffect(() => {
    refreshUser();
  }, []);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getImageUrl = (uri) => {
    if (!uri) return null;
    if (uri.startsWith('http') || uri.startsWith('data:')) return uri;
    const formattedUri = uri.replace(/\\/g, '/');
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${formattedUri}`;
  };

  const handleToggleFeature = async (feature) => {
    try {
      await api.post('/owner/toggle-service', { service: feature });
      refreshUser();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Interactive Background Elements (ITP Style Mesh Gradient) */}
      <View style={styles.bgWrapper} {...panResponder.panHandlers}>
        <Animated.View style={[styles.blob, styles.blob1, { transform: blob1Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob2, { transform: blob2Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob3, { transform: blob3Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob4, { transform: blob4Pos.getTranslateTransform() }]} />
      </View>
      <View style={styles.bgGradientOverlay} />

      <ParkingOwnerSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContent}>
          {/* Navbar */}
          <View style={styles.navbar}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
              <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity style={styles.notificationBtn}>
                <MaterialCommunityIcons name="bell-outline" size={26} color="#2D4057" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('ParkingOwnerProfile')}>
                {user?.profilePicture ? (
                  <Image source={{ uri: getImageUrl(user.profilePicture) }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                ) : (
                  <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'O'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeSubtitle}>Owner Dashboard</Text>
            <View style={styles.nameRow}>
              <Text style={styles.welcomeTitle}>{user?.name || 'Owner'}</Text>
              <MaterialCommunityIcons name="star-circle" size={24} color="#ED8936" style={{ marginLeft: 10 }} />
            </View>
            <View style={styles.welcomeDivider} />
          </View>

          {/* Feature Grid */}
          <View style={styles.grid}>
            <FeatureCard
              icon="map-marker-plus" title="Parking Places" desc="Manage your locations"
              footerText="View All" color="#B08974" onPress={() => navigation.navigate('ParkingPlaceList')} />

            <FeatureCard
              icon="calendar-check" title="Reservations" desc="Recent slot bookings"
              footerText="View History" color="#B26969" onPress={() => {}} />

            {hasInventory ? (
              <FeatureCard
                icon="package-variant" title="Inventory" desc="Manage parts & accessories"
                footerText="Manage Shop" color="#7A806B" onPress={() => navigation.navigate('Inventory')} />
            ) : (
              <TouchableOpacity
                style={[styles.featureCard, { opacity: 0.8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E0' }]}
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
                  footerText="Appointments" color="#4A5568" onPress={() => {}} />
              </>
            ) : (
              <TouchableOpacity
                style={[styles.featureCard, { opacity: 0.8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E0' }]}
                onPress={() => handleToggleFeature('serviceCenter')}
              >
                <View style={[styles.fcIconWrapper, { backgroundColor: '#E2E8F0' }]}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#718096" />
                </View>
                <Text style={[styles.fcTitle, { color: '#718096' }]}>Service Center</Text>
                <Text style={styles.fcDesc}>Offer vehicle repairs</Text>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', width: '100%' },
  mainContent: { flex: 1, width: '100%' },
  responsiveContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1200 : '100%',
    alignSelf: 'center',
  },
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 40 },

  // Navbar
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  menuBtn: { padding: 4 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2D4057', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  notificationBtn: { position: 'relative' },
  notificationDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#B26969', borderWidth: 1.5, borderColor: '#FFF' },

  // Welcome
  welcomeSection: { alignItems: 'center', marginBottom: 30, marginTop: 15 },
  welcomeSubtitle: { fontSize: 24, fontWeight: '900', color: '#B26969', letterSpacing: -0.5, textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#2D4057', textAlign: 'center' },
  welcomeDivider: { width: 40, height: 3, backgroundColor: '#ED8936', borderRadius: 2, marginTop: 10, opacity: 0.8 },

  // Feature Cards
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  featureCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 20,
    borderWidth: 1, borderColor: '#F0F0F0', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5,
  },
  fcIconWrapper: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  fcTitle: { fontSize: 15, fontWeight: '800', color: '#2D4057', marginBottom: 4 },
  fcDesc: { fontSize: 11, color: '#7A868E', marginBottom: 12, lineHeight: 16 },
  fcFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 8 },
  fcFooterText: { fontSize: 10, color: '#9C8C79', fontWeight: '700', textTransform: 'uppercase' },

  // Overlay
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },

  // Sidebar
  sidebar: { position: 'absolute', top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#2D4057', zIndex: 3000, padding: 20, paddingTop: 40, paddingBottom: 30 },
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
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#B26969', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginTop: 10, marginBottom: 5 },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  sidebarVersion: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600', marginTop: 10 },

  // Background Mesh
  bgGradientOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.88)', zIndex: -1 },
  bgWrapper: { ...StyleSheet.absoluteFillObject, zIndex: -2, backgroundColor: '#d1c9ba' },
  blob: { position: 'absolute', width: 350, height: 350, borderRadius: 175, opacity: 0.5 },
  blob1: { backgroundColor: '#F2C6AF' },
  blob2: { backgroundColor: '#BDAD9C' },
  blob3: { backgroundColor: '#BBC4A0' },
  blob4: { backgroundColor: '#99D3E4' },
});

export default ParkingOwnerDashboard;
