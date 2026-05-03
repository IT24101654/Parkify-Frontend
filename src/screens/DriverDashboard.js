import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { PanResponder } from 'react-native';
import api from '../services/api';
import VoiceAssistantWidget from '../components/VoiceAssistant/VoiceAssistantWidget';
import VoiceWave from '../components/VoiceAssistant/VoiceWave';

const { width } = Dimensions.get('window');

const FeatureCard = ({ icon, title, desc, footerText, color, onPress }) => (
  <TouchableOpacity
    style={[styles.featureCard, SHADOWS.medium]}
    onPress={onPress}
    activeOpacity={0.9}
  >
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

const DriverDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Interactive Background State (ITP Mesh Gradient Logic)
  const touchX = useRef(new Animated.Value(width / 2)).current;
  const touchY = useRef(new Animated.Value(width / 2)).current;

  // 4 Blobs for Mesh Effect
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

  const stopAndProcessVoice = async (finalTranscript) => {
    if (!finalTranscript || finalTranscript.trim() === '') {
      return;
    }

    let pref = 'BALANCED';
    if (finalTranscript.includes('cheap') || finalTranscript.includes('price')) pref = 'CHEAPEST';
    else if (finalTranscript.includes('near') || finalTranscript.includes('close') || finalTranscript.includes('around')) pref = 'NEAREST';
    else if (finalTranscript.includes('available') || finalTranscript.includes('empty') || finalTranscript.includes('space')) pref = 'MOST_AVAILABLE';

    let targetEntity = 'PARKING';
    if (finalTranscript.includes('inventory') || finalTranscript.includes('shop') || finalTranscript.includes('item') || finalTranscript.includes('buy') || finalTranscript.includes('accessories')) {
      targetEntity = 'INVENTORY';
    } else if (finalTranscript.includes('service') || finalTranscript.includes('repair') || finalTranscript.includes('maintenance') || finalTranscript.includes('wash')) {
      targetEntity = 'SERVICE';
    }

    try {
      const reqPayload = { preferenceType: pref, latitude: 6.9271, longitude: 79.8612, targetEntity: targetEntity };

      let bestPlace = null;
      try {
        const res = await api.get('/parking');
        const places = res.data || [];

        if (places.length > 0) {
          if (pref === 'CHEAPEST') {
            bestPlace = places.sort((a, b) => a.price - b.price)[0];
          } else if (targetEntity === 'INVENTORY') {
            bestPlace = places.find(p => p.hasInventory) || places[0];
          } else if (targetEntity === 'SERVICE') {
            bestPlace = places.find(p => p.hasServiceCenter) || places[0];
          } else {
            bestPlace = places[0]; // Nearest (mocked to first available)
          }
        }
      } catch (e) {
        console.log("Failed to fetch parking places for AI", e);
      }

      if (targetEntity === 'INVENTORY') {
        navigation.navigate('ParkingSlots');
      } else if (targetEntity === 'SERVICE') {
        navigation.navigate('DriverServiceAppointments');
      } else {
        navigation.navigate('ParkingSlots', bestPlace ? { autoSelectPlace: bestPlace } : undefined);
      }
    } catch (err) {
      console.error("AI Assistant Error:", err);
    }
  };

  const onVoiceCommand = async (command) => {
    if (!command) return;
    await stopAndProcessVoice(command);
  };

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Reset sidebar when screen comes back into focus (e.g. returning from VehicleList)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      sidebarAnim.setValue(-width);
      setIsSidebarOpen(false);
    });
    return unsubscribe;
  }, [navigation]);

  const getImageUrl = (uri) => {
    if (!uri) return null;
    if (uri.startsWith('http') || uri.startsWith('data:')) return uri;
    const formattedUri = uri.replace(/\\/g, '/');
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${formattedUri}`;
  };

  const menuItems = [
    { id: 'overview', title: 'Overview', icon: 'view-dashboard' },
    { id: 'slots', title: 'Parking Slots', icon: 'map-marker-radius' },
    { id: 'bookings', title: 'Reservations', icon: 'book-open-variant' },
    { id: 'services', title: 'Service Appointments', icon: 'tools' },
    { id: 'payments', title: 'Payments', icon: 'wallet' },
    { id: 'vehicles', title: 'My Vehicles', icon: 'car-multiple' },
    { id: 'profile', title: 'My Profile', icon: 'account-circle' },
  ];

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" />

      {/* Interactive Background Elements (ITP Style Mesh Gradient) */}
      <View style={styles.bgWrapper}>
        <Animated.View style={[styles.blob, styles.blob1, { transform: blob1Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob2, { transform: blob2Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob3, { transform: blob3Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, styles.blob4, { transform: blob4Pos.getTranslateTransform() }]} />
      </View>
      <View style={styles.bgGradientOverlay} />

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}

      {/* Custom Sidebar */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        {/* Sidebar Header with User Info */}
        <View style={styles.sidebarHeader}>
          <Image
            source={require('../../assets/Parkify.png')}
            style={styles.sidebarLogo}
            resizeMode="contain"
          />
          <Text style={styles.sidebarBrand}>Parkify</Text>
        </View>

        <View style={styles.sidebarUserCard}>
          <View style={[styles.sidebarAvatar, { overflow: 'hidden' }]}>
            {user?.profilePicture ? (
              <Image source={{ uri: getImageUrl(user.profilePicture) }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="account" size={36} color="#FFF" />
            )}
          </View>
          <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'DRIVER'}</Text>
          <Text style={styles.sidebarUserRole}>Driver</Text>
        </View>

        <View style={styles.sidebarDivider} />

        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => {
              toggleSidebar();
              if (item.id === 'vehicles') navigation.navigate('VehicleList');
              else if (item.id === 'bookings') navigation.navigate('DriverReservations');
              else if (item.id === 'payments') navigation.navigate('DriverPayments');
              else if (item.id === 'profile') navigation.navigate('DriverProfile');
              else if (item.id === 'services') navigation.navigate('DriverServiceAppointments');
            }}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name={item.icon} size={22} color="rgba(255,255,255,0.8)" />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sidebarDivider} />
        <TouchableOpacity style={styles.sidebarLogout} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.sidebarVersion}>Parkify v1.0.0</Text>
      </Animated.View>

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
            <TouchableOpacity style={[styles.avatar, { overflow: 'hidden' }]} onPress={() => navigation.navigate('DriverProfile')}>
              {user?.profilePicture ? (
                <Image source={{ uri: getImageUrl(user.profilePicture) }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={styles.avatarText}>{(user?.name || 'D')[0]?.toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtitle}>Welcome to your Dashboard</Text>
          <View style={styles.nameRow}>
            <Text style={styles.welcomeTitle}>{user?.name || 'Driver'}</Text>
            <MaterialCommunityIcons name="hand-wave" size={24} color="#ED8936" style={{ marginLeft: 10 }} />
          </View>
          <View style={styles.welcomeDivider} />
        </View>

        {/* High Performance Voice Assistant Widget */}
        <VoiceAssistantWidget onCommandProcessed={onVoiceCommand} />

        {/* Features Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard Features</Text>
          <Text style={styles.sectionSubtitle}>Select a category to manage your parking experience</Text>
        </View>

        {/* Features Grid */}
        <View style={styles.grid}>
          <FeatureCard
            icon="map-marker-radius"
            title="Parking Slots"
            desc="Find available slots"
            footerText="Explore Nearby"
            color="#6F7C80"
            onPress={() => navigation.navigate('ParkingSlots')}
          />
          <FeatureCard
            icon="book-open-variant"
            title="Reservations"
            desc="View your bookings"
            footerText="History"
            color="#B26969"
            onPress={() => navigation.navigate('DriverReservations')}
          />
          <FeatureCard
            icon="tools"
            title="Services"
            desc="Vehicle appointments"
            footerText="Bookings"
            color="#C05621"
            onPress={() => navigation.navigate('DriverServiceAppointments')}
          />
          <FeatureCard
            icon="wallet"
            title="Payments"
            desc="Manage your wallet"
            footerText="Secure"
            color="#7A806B"
            onPress={() => navigation.navigate('DriverPayments')}
          />
          <FeatureCard
            icon="car-multiple"
            title="My Vehicles"
            desc="Manage your fleet"
            footerText="Garage"
            color="#2D4057"
            onPress={() => navigation.navigate('VehicleList')}
          />

          <FeatureCard
            icon="account-circle"
            title="My Profile"
            desc="Update your info"
            footerText="Settings"
            color="#4A5568"
            onPress={() => navigation.navigate('DriverProfile')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D4057',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Welcome Section
  welcomeSection: { alignItems: 'center', marginBottom: 30, marginTop: 15 },
  welcomeSubtitle: { fontSize: 24, fontWeight: '900', color: '#B26969', letterSpacing: -0.5, textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#2D4057', textAlign: 'center' },
  welcomeDivider: { width: 40, height: 3, backgroundColor: '#ED8936', borderRadius: 2, marginTop: 10, opacity: 0.8 },
  voiceWidget: {
    backgroundColor: '#FAF7F4',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F0EBE6',
  },
  voiceInner: {
    alignItems: 'center',
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#B08974',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#B08974',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  micBtnActive: {
    backgroundColor: '#B26969',
  },
  voiceLabel: {
    fontSize: 18,
    color: '#B08974',
    fontWeight: '800',
    marginVertical: 10,
    textAlign: 'center',
    minHeight: 26,
    fontStyle: 'italic',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(176, 137, 116, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 12,
    color: '#B08974',
    fontWeight: '600',
  },
  tipChip1: {
    backgroundColor: 'rgba(176, 137, 116, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(176, 137, 116, 0.2)'
  },
  tipChipText1: { color: '#B08974', fontSize: 12, fontWeight: '600' },
  tipChip2: {
    backgroundColor: 'rgba(176, 137, 116, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122, 128, 107, 0.2)'
  },
  tipChipText2: { color: '#7A806B', fontSize: 12, fontWeight: '600' },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#B08974',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9C8C79',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  fcIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fcTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D4057',
    marginBottom: 4,
  },
  fcDesc: {
    fontSize: 11,
    color: '#7A868E',
    marginBottom: 12,
    lineHeight: 16,
  },
  fcFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    paddingTop: 8,
  },
  fcFooterText: {
    fontSize: 10,
    color: '#9C8C79',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: '#2D4057',
    zIndex: 3000,
    padding: 20,
    paddingTop: 40,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sidebarLogo: {
    width: 30,
    height: 30,
  },
  sidebarBrand: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  sidebarUserCard: {
    alignItems: 'center',
    paddingVertical: 2,
    marginBottom: 0,
  },
  sidebarAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B26969',
    marginBottom: 5,
  },
  sidebarUserName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  sidebarUserRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B26969',
    marginTop: 2,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 0,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 14,
    marginBottom: 0,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  sidebarLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#B26969',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 2,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  sidebarVersion: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 10,
  },
  notificationBtn: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B26969',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  bgGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  blob1: {
    backgroundColor: '#F2C6AF', // ITP Peach
  },
  blob2: {
    backgroundColor: '#BDAD9C', // ITP Sand
  },
  blob3: {
    backgroundColor: '#BBC4A0', // ITP Sage
  },
  blob4: {
    backgroundColor: '#99D3E4', // ITP Sky Blue
  },
});

export default DriverDashboard;
