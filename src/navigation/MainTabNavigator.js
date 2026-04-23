import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView, StatusBar, Platform, Image } from 'react-native';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import AdminProfile from '../screens/admin/AdminProfile';
import AdminNotifications from '../screens/admin/AdminNotifications';

// Driver Screens
import DriverDashboard from '../screens/DriverDashboard';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import VehicleListScreen from '../screens/VehicleListScreen';

const Stack = createStackNavigator();
const Tab = createMaterialTopTabNavigator();

const CustomAdminHeader = ({ state, navigation }) => {
  const { logout } = useAuth();
  
  const icons = {
    Dashboard: 'view-dashboard',
    Users: 'account-group',
    Notifications: 'bell',
    Profile: 'account-circle',
  };

  return (
    <View style={styles.headerOuter}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.headerContainer}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Parkify.png')} 
            style={styles.logoMini}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>PARKIFY</Text>
        </View>
        
        {/* Navigation Icons Section */}
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
                  color={isFocused ? '#B26969' : '#2D4057'} 
                />
                {isFocused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Section */}
        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn} activeOpacity={0.7}>
          <View style={styles.logoutCircle}>
             <MaterialCommunityIcons name="logout" size={18} color="#B26969" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminTabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomAdminHeader {...props} />}
    screenOptions={{
      swipeEnabled: true,
    }}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Users" component={ManageUsers} />
    <Tab.Screen name="Notifications" component={AdminNotifications} />
    <Tab.Screen name="Profile" component={AdminProfile} />
  </Tab.Navigator>
);

const DriverStack = () => (
  <Stack.Navigator screenOptions={{ 
    headerStyle: { backgroundColor: '#FFF' },
    headerTintColor: '#2D4057',
    headerTitleStyle: { fontWeight: 'bold' }
  }}>
    <Stack.Screen name="DriverDashboard" component={DriverDashboard} options={{ title: 'Dashboard' }} />
    <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Add Vehicle' }} />
    <Stack.Screen name="VehicleList" component={VehicleListScreen} options={{ title: 'My Vehicles' }} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const { user } = useAuth();

  if (user?.role === 'SUPER_ADMIN') {
    return <AdminTabNavigator />;
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
    color: '#B26969',
    letterSpacing: 0.5,
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
    backgroundColor: '#B26969',
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
