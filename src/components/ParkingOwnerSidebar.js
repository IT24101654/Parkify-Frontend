import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Animated, ScrollView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const ParkingOwnerSidebar = ({ isSidebarOpen, toggleSidebar, sidebarAnim, navigation }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'view-dashboard' },
    { id: 'slots', title: 'Parking Slots', icon: 'car-brake-parking' },
    { id: 'inventory', title: 'Inventory', icon: 'package-variant-closed' },
    { id: 'service', title: 'Service Center', icon: 'tools' },
    { id: 'reservations', title: 'Reservations', icon: 'calendar-check' },
    { id: 'serviceBookings', title: 'Service Appointments', icon: 'clock-check' },
    { id: 'earningsHistory', title: 'Earnings', icon: 'cash-multiple' },
    { id: 'profile', title: 'My Profile', icon: 'account-cog' },
  ];

  const handleNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('ParkingOwnerDashboard');
    else if (id === 'slots') navigation.navigate('ParkingPlaceList');
    else if (id === 'inventory') navigation.navigate('Inventory');
    else if (id === 'service') navigation.navigate('ServiceCenter');
    else if (id === 'reservations') navigation.navigate('OwnerReservations');
    else if (id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
    else if (id === 'earningsHistory') navigation.navigate('OwnerEarnings');
    else if (id === 'profile') navigation.navigate('ParkingOwnerProfile');
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
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} />
            ) : (
              <MaterialCommunityIcons name="account" size={36} color="#FFF" />
            )}
          </View>
          <View>
            <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'OWNER'}</Text>
            <Text style={styles.sidebarUserRole}>Parking Owner</Text>
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
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: Platform.OS === 'web' ? 300 : width * 0.8,
    backgroundColor: '#1A202C',
    zIndex: 1000,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
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
    marginBottom: 20,
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
    paddingVertical: 12,
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
    marginTop: 10,
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

export default ParkingOwnerSidebar;
