import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

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
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const menuItems = [
    { id: 'overview', title: 'Overview', icon: 'view-dashboard' },
    { id: 'slots', title: 'Parking Slots', icon: 'map-marker-radius' },
    { id: 'bookings', title: 'Reservations', icon: 'book-open-variant' },
    { id: 'payments', title: 'Payments', icon: 'wallet' },
    { id: 'vehicles', title: 'My Vehicles', icon: 'car-multiple' },
    { id: 'profile', title: 'My Profile', icon: 'account-circle' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
              <Image source={{ uri: user.profilePicture }} style={{ width: '100%', height: '100%' }} />
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
              else if (item.id === 'profile') navigation.navigate('DriverProfile');
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
                <Image source={{ uri: user.profilePicture }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={styles.avatarText}>{(user?.name || 'D')[0]?.toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
           <Text style={styles.welcomeTitle}>Welcome to your Dashboard</Text>
           <Text style={styles.welcomeName}>{user?.name || 'Driver'}</Text>
        </View>

        {/* Voice Assistant Widget */}
        <View style={[styles.voiceWidget, SHADOWS.medium]}>
           <View style={styles.voiceInner}>
              <TouchableOpacity 
                style={[styles.micBtn, isVoiceActive && styles.micBtnActive]}
                onPress={() => setIsVoiceActive(!isVoiceActive)}
              >
                <MaterialCommunityIcons name={isVoiceActive ? "microphone-off" : "microphone"} size={32} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.voiceLabel}>
                {isVoiceActive ? 'Listening...' : 'Voice Assistant — Click to speak'}
              </Text>
              <View style={styles.tipRow}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#B08974" />
                <Text style={styles.tipText}>Try: "Nearest parking"</Text>
              </View>
           </View>
        </View>

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
            footerText="Explore Now"
            color="#6F7C80"
            onPress={() => {}}
          />
          <FeatureCard 
            icon="book-open-variant"
            title="Reservations"
            desc="View your bookings"
            footerText="History"
            color="#B26969"
            onPress={() => {}}
          />
          <FeatureCard 
            icon="wallet"
            title="Payments"
            desc="Manage your wallet"
            footerText="Secure"
            color="#7A806B"
            onPress={() => {}}
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
            icon="package-variant-closed"
            title="Inventory"
            desc="Browse accessories"
            footerText="Shop"
            color="#B08974"
            onPress={() => {}}
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
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#b26969d4',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D4057',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    width: '100%',
  },
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
    fontSize: 14,
    color: '#2D4057',
    fontWeight: '700',
    marginBottom: 10,
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
    padding: 25,
    paddingTop: 55,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sidebarLogo: {
    width: 35,
    height: 35,
  },
  sidebarBrand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  sidebarUserCard: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  sidebarAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B26969',
    marginBottom: 10,
  },
  sidebarUserName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  sidebarUserRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B26969',
    marginTop: 3,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 10,
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 5,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 14,
    marginBottom: 5,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  sidebarLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#B26969',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 5,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  sidebarVersion: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 12,
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
});

export default DriverDashboard;
