import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DriverSidebar from '../components/DriverSidebar';

const { width } = Dimensions.get('window');

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

const DriverDashboard = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuth();
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (refreshUser) refreshUser();
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <DriverSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContent}>
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

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeSubtitle}>Welcome to your Dashboard</Text>
            <View style={styles.nameRow}>
              <Text style={styles.welcomeTitle}>{user?.name || 'Driver'}</Text>
              <MaterialCommunityIcons name="hand-wave" size={24} color="#ED8936" style={{ marginLeft: 10 }} />
            </View>
            <View style={styles.welcomeDivider} />
          </View>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', width: '100%' },
  mainContent: { flex: 1, width: '100%' },
  responsiveContent: { width: '100%', maxWidth: Platform.OS === 'web' ? 800 : '100%', alignSelf: 'center', flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  menuBtn: { padding: 4 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2D4057', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold', textTransform: 'uppercase' },
  welcomeSection: { alignItems: 'center', marginBottom: 30, marginTop: 15 },
  welcomeSubtitle: { fontSize: 24, fontWeight: '900', color: '#B26969', textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#2D4057', textAlign: 'center' },
  welcomeDivider: { width: 40, height: 3, backgroundColor: '#ED8936', borderRadius: 2, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  featureCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  fcIconWrapper: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  fcTitle: { fontSize: 15, fontWeight: '800', color: '#2D4057', marginBottom: 4 },
  fcDesc: { fontSize: 11, color: '#7A868E', marginBottom: 12, lineHeight: 16 },
  fcFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 8 },
  fcFooterText: { fontSize: 10, color: '#9C8C79', fontWeight: '700', textTransform: 'uppercase' },
  notificationBtn: { position: 'relative' },
  notificationDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#B26969', borderWidth: 1.5, borderColor: '#FFF' },
});

export default DriverDashboard;
