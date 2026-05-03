import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Animated, ScrollView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const DriverSidebar = ({ isSidebarOpen, toggleSidebar, sidebarAnim, navigation }) => {
  const { user, logout } = useAuth();

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

  const handleNav = (id) => {
    toggleSidebar();
    if (id === 'overview') navigation.navigate('DriverDashboard');
    else if (id === 'vehicles') navigation.navigate('VehicleList');
    else if (id === 'bookings') navigation.navigate('DriverReservations');
    else if (id === 'payments') navigation.navigate('DriverPayments');
    else if (id === 'profile') navigation.navigate('DriverProfile');
    else if (id === 'services') navigation.navigate('DriverServiceAppointments');
    else if (id === 'slots') navigation.navigate('ParkingSlots');
  };

  return (
    <>
      {isSidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}

      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Image 
            source={require('../../assets/Parkify.png')} 
            style={styles.sidebarLogo} 
            resizeMode="contain" 
          />
          <Text style={styles.sidebarBrand}>Parkify</Text>
        </View>

        <View style={styles.sidebarUserCard}>
          <View style={styles.sidebarAvatar}>
            {user?.profilePicture ? (
              <Image source={{ uri: getImageUrl(user.profilePicture) }} style={styles.avatarImg} />
            ) : (
              <MaterialCommunityIcons name="account" size={36} color="#FFF" />
            )}
          </View>
          <View>
            <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'DRIVER'}</Text>
            <Text style={styles.sidebarUserRole}>Driver</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sidebarMenuContainer}>
          <ScrollView 
            style={styles.sidebarMenu} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNav(item.id)}
              >
                <View style={styles.menuIconBox}>
                  <MaterialCommunityIcons name={item.icon} size={22} color="rgba(255,255,255,0.8)" />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.sidebarLogout} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.sidebarVersion}>Parkify v1.0.0</Text>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
  },
  sidebar: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: Platform.OS === 'web' ? 300 : width * 0.8,
    backgroundColor: '#1A202C',
    zIndex: 3000,
    paddingVertical: 10,
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  sidebarLogo: {
    width: 40,
    height: 40,
  },
  sidebarBrand: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 12,
    letterSpacing: 1,
  },
  sidebarUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  sidebarAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  sidebarUserName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sidebarUserRole: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 10,
  },
  sidebarMenuContainer: {
    flex: 1,
  },
  sidebarMenu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  sidebarLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    borderRadius: 12,
    marginTop: 5,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  sidebarVersion: {
    color: '#4A5568',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
});

export default DriverSidebar;
