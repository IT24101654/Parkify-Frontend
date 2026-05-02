import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text, StyleSheet, StatusBar, Platform, Image } from 'react-native';
import { COLORS } from '../theme/theme';

// Auth Screens for post-reg setup
import SetupProfileScreen from '../screens/auth/SetupProfileScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import AdminProfile from '../screens/admin/AdminProfile';
import AdminNotifications from '../screens/admin/AdminNotifications';

// Driver Screens
import DriverDashboard from '../screens/DriverDashboard';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import VehicleListScreen from '../screens/VehicleListScreen';
import EditVehicleScreen from '../screens/EditVehicleScreen';
import VehicleSetupScreen from '../screens/VehicleSetupScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import ParkingSlotsScreen from '../screens/driver/ParkingSlotsScreen';
import SelectSlotScreen from '../screens/driver/SelectSlotScreen';
import DriverInventoryScreen from '../screens/driver/DriverInventoryScreen';
import DriverServiceCenterScreen from '../screens/driver/DriverServiceCenterScreen';
import ReservationScreen from '../screens/driver/ReservationScreen';
import CheckoutPaymentScreen from '../screens/driver/CheckoutPaymentScreen';
import DriverReservationsScreen from '../screens/driver/DriverReservationsScreen';
import DriverPaymentsScreen from '../screens/driver/DriverPaymentsScreen';
import ServiceAppointmentScreen from '../screens/driver/ServiceAppointmentScreen';
import DriverServiceAppointmentsScreen from '../screens/driver/DriverServiceAppointmentsScreen';

// Parking Owner Screens
import ParkingOwnerDashboard from '../screens/ParkingOwnerDashboard';
import ParkingOwnerProfileScreen from '../screens/ParkingOwnerProfileScreen';
import ParkingPlaceListScreen from '../screens/parkingOwner/ParkingPlaceListScreen';
import AddParkingPlaceScreen from '../screens/parkingOwner/AddParkingPlaceScreen';
import ManageSlotsScreen from '../screens/parkingOwner/ManageSlotsScreen';
import InventoryScreen from '../screens/parkingOwner/InventoryScreen';
import ServiceCenterScreen from '../screens/parkingOwner/ServiceCenterScreen';
import MapPickerScreen from '../screens/parkingOwner/MapPickerScreen';
import OwnerReservationsScreen from '../screens/parkingOwner/OwnerReservationsScreen';
import OwnerServiceAppointmentsScreen from '../screens/parkingOwner/OwnerServiceAppointmentsScreen';
import OwnerRefundsScreen from '../screens/parkingOwner/OwnerRefundsScreen';
import OwnerEarningsScreen from '../screens/parkingOwner/OwnerEarningsScreen';

const Stack = createStackNavigator();
const Tab = createMaterialTopTabNavigator();

const CustomGlobalHeader = ({ state, navigation, title }) => {
  const { logout } = useAuth();
  
  const icons = {
    Dashboard: 'view-dashboard',
    Users: 'account-group',
    Notifications: 'bell',
    Profile: 'account-circle',
    ParkingOwnerDashboard: 'view-dashboard',
    DriverDashboard: 'view-dashboard',
  };

  return (
    <View style={styles.headerOuter}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.headerContainer}>
        {/* Back Button */}
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Parkify.png')} 
            style={styles.logoMini}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>PARKIFY</Text>
        </View>
        
        {/* Tab Icons (Only if multiple tabs exist) */}
        {state && state.routes && state.routes.length > 1 && (
          <View style={styles.navIcons}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const iconName = icons[route.name] || 'circle';

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={() => navigation.navigate(route.name)}
                  style={[styles.navBtn, isFocused && styles.navBtnActive]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={iconName} 
                    size={22} 
                    color={isFocused ? COLORS.secondary : COLORS.primary} 
                  />
                  {isFocused && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Title if no tabs */}
        {(!state || !state.routes || state.routes.length <= 1) && (
           <Text style={styles.headerTitle}>{title}</Text>
        )}

        {/* Logout Section */}
        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn} activeOpacity={0.7}>
          <View style={styles.logoutCircle}>
             <MaterialCommunityIcons name="logout" size={18} color={COLORS.secondary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminTabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomGlobalHeader {...props} />}
    screenOptions={{ swipeEnabled: true }}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Users" component={ManageUsers} />
    <Tab.Screen name="Notifications" component={AdminNotifications} />
    <Tab.Screen name="Profile" component={AdminProfile} />
  </Tab.Navigator>
);

const DriverStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
    <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
    <Stack.Screen name="VehicleList" component={VehicleListScreen} />
    <Stack.Screen name="EditVehicle" component={EditVehicleScreen} />
    <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
    <Stack.Screen name="ParkingSlots" component={ParkingSlotsScreen} />
    <Stack.Screen name="SelectSlot" component={SelectSlotScreen} />
    <Stack.Screen name="DriverInventory" component={DriverInventoryScreen} />
    <Stack.Screen name="DriverServiceCenter" component={DriverServiceCenterScreen} />
    <Stack.Screen name="Reservation" component={ReservationScreen} />
    <Stack.Screen name="CheckoutPayment" component={CheckoutPaymentScreen} />
    <Stack.Screen name="DriverReservations" component={DriverReservationsScreen} />
    <Stack.Screen name="DriverPayments" component={DriverPaymentsScreen} />
    <Stack.Screen name="ServiceAppointment" component={ServiceAppointmentScreen} />
    <Stack.Screen name="DriverServiceAppointments" component={DriverServiceAppointmentsScreen} />
  </Stack.Navigator>
);

const OwnerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ParkingOwnerDashboard" component={ParkingOwnerDashboard} />
    <Stack.Screen name="ParkingOwnerProfile" component={ParkingOwnerProfileScreen} />
    <Stack.Screen name="ParkingPlaceList" component={ParkingPlaceListScreen} />
    <Stack.Screen name="AddParkingPlace" component={AddParkingPlaceScreen} />
    <Stack.Screen name="ManageSlots" component={ManageSlotsScreen} />
    <Stack.Screen name="Inventory" component={InventoryScreen} />
    <Stack.Screen name="ServiceCenter" component={ServiceCenterScreen} />
    <Stack.Screen name="MapPicker" component={MapPickerScreen} />
    <Stack.Screen name="OwnerReservations" component={OwnerReservationsScreen} />
    <Stack.Screen name="OwnerServiceAppointments" component={OwnerServiceAppointmentsScreen} />
    <Stack.Screen name="OwnerRefunds" component={OwnerRefundsScreen} />
    <Stack.Screen name="OwnerEarnings" component={OwnerEarningsScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const { user } = useAuth();

  if (user && user.role !== 'SUPER_ADMIN' && !user.isProfileComplete) {
     return (
       <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
          <Stack.Screen name="VehicleSetup" component={VehicleSetupScreen} />
       </Stack.Navigator>
     );
  }

  if (user?.role === 'SUPER_ADMIN') {
    return <AdminTabNavigator />;
  }
  if (user?.role === 'PARKING_OWNER') {
    return <OwnerStack />;
  }

  return <DriverStack />;
};

const styles = StyleSheet.create({
  headerOuter: {
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  headerContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoMini: {
    width: 28,
    height: 28,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  navIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  navBtnActive: {
    backgroundColor: '#F9F4F4',
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.secondary,
  },
  headerBackBtn: {
    marginRight: 10,
    padding: 5,
  },
  logoutBtn: {
    padding: 5,
  },
  logoutCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(178, 105, 105, 0.1)',
  },
});

export default MainNavigator;
