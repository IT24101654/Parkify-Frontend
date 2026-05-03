import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../theme/theme';

const CustomDrawer = (props) => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#2D4057' }}>
      <View style={styles.drawerHeader}>
        <Image
          source={require('../../assets/Parkify.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.userInfo}>
           <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="account" size={40} color="#FFF" />
           </View>
           <Text style={styles.userName}>{user?.name?.toUpperCase() || 'USER'}</Text>
           <Text style={styles.userRole}>{user?.role?.replace('_', ' ')}</Text>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: '#2D4057' }}>
        <View style={styles.drawerListWrapper}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <MaterialCommunityIcons name="logout" size={24} color="#FFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Parkify v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#2D4057',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  userInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#B26969',
  },
  userName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  userRole: {
    color: '#B26969',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  drawerListWrapper: {
    flex: 1,
    paddingTop: 10,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#B26969',
    borderRadius: 15,
    gap: 12,
    ...SHADOWS.medium,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  versionText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
});

export default CustomDrawer;
