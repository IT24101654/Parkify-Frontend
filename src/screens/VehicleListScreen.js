import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const VehicleListScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const sidebarMenuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'view-dashboard' },
    { id: 'slots', title: 'Parking Slots', icon: 'map-marker-radius' },
    { id: 'bookings', title: 'Reservations', icon: 'book-open-variant' },
    { id: 'payments', title: 'Payments', icon: 'wallet' },
    { id: 'vehicles', title: 'My Vehicles', icon: 'car-multiple' },
    { id: 'profile', title: 'My Profile', icon: 'account-circle' },
  ];

  const handleSidebarNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('DriverDashboard');
    else if (id === 'profile') navigation.navigate('DriverProfile');
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Remove Vehicle',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vehicles/${id}`);
              fetchVehicles();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVehicles();
    });
    return unsubscribe;
  }, [navigation]);

  const getImageUrl = (uri) => {
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    
    // Normalize slashes
    const cleanUri = uri.replace(/\\/g, '/');
    
    // Get base URL without /api suffix
    let baseUrl = api.defaults.baseURL;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    } else if (baseUrl.endsWith('/api/')) {
      baseUrl = baseUrl.slice(0, -5);
    }
    
    // Remove leading slash from uri if present to avoid double slashes
    const path = cleanUri.startsWith('/') ? cleanUri.slice(1) : cleanUri;
    
    const finalUrl = `${baseUrl}/${path}`;
    console.log('Vehicle Image URL:', finalUrl);
    return finalUrl;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.medium]}>
      <View style={styles.imageContainer}>
        {item.vehicleImage ? (
          <Image source={{ uri: getImageUrl(item.vehicleImage) }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.noImage}>
            <MaterialCommunityIcons name="car" size={40} color="#DDD" />
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>My {item.type}</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.brandTitle}>{item.brand} {item.model}</Text>
        </View>
        <Text style={styles.subtitle}>Registered Fleet Vehicle</Text>

        <View style={styles.tagRow}>
          <View style={[styles.tag, styles.tagPrimary]}>
            <MaterialCommunityIcons name="ev-station" size={14} color="#B26969" />
            <Text style={[styles.tagText, styles.tagTextPrimary]}>{item.fuelType}</Text>
          </View>
          <View style={styles.tag}>
            <MaterialCommunityIcons name="shape-outline" size={14} color="#7A868E" />
            <Text style={styles.tagText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.plateContainer}>
            <MaterialCommunityIcons name="pound" size={16} color="#B26969" />
            <Text style={styles.plateText}>{item.vehicleNumber}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('EditVehicle', { id: item._id })}
            >
              <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item._id)}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}

      {/* Navy Sidebar */}
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
          {sidebarMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'vehicles' && styles.menuItemActive,
              ]}
              onPress={() => handleSidebarNav(item.id)}
            >
              <View style={[styles.menuIconBox, item.id === 'vehicles' && styles.menuIconBoxActive]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={item.id === 'vehicles' ? '#FFF' : 'rgba(255,255,255,0.8)'}
                />
              </View>
              <Text style={[styles.menuText, item.id === 'vehicles' && styles.menuTextActive]}>
                {item.title}
              </Text>
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

      {/* Header with Hamburger */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={toggleSidebar}>
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>My Vehicles</Text>
          <Text style={styles.subtitleHeader}>Manage your registered fleet</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddVehicle')}
        >
          <MaterialCommunityIcons name="plus" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#B26969" />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-off" size={60} color="#DDD" />
              <Text style={styles.emptyText}>No vehicles registered yet.</Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddVehicle')}
              >
                <Text style={styles.emptyAddText}>+ Add Your First Vehicle</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F8' },

  // Sidebar styles
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
  },
  sidebar: {
    position: 'absolute', top: 0, bottom: 0,
    width: width * 0.75,
    backgroundColor: '#2D4057',
    zIndex: 3000, padding: 25, paddingTop: 55, paddingBottom: 30,
  },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  sidebarLogo: { width: 35, height: 35 },
  sidebarBrand: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  sidebarUserCard: { alignItems: 'center', paddingVertical: 15, marginBottom: 10 },
  sidebarAvatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#B26969', marginBottom: 10,
  },
  sidebarUserName: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sidebarUserRole: { fontSize: 12, fontWeight: '700', color: '#B26969', marginTop: 3 },
  sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  sidebarMenu: { flex: 1, paddingTop: 5 },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconBoxActive: { backgroundColor: '#B26969' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    paddingVertical: 12, paddingHorizontal: 5,
    borderRadius: 14, marginBottom: 5,
  },
  menuItemActive: { backgroundColor: 'rgba(178,105,105,0.15)' },
  menuText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  menuTextActive: { color: '#FFF' },
    paddingHorizontal: 16, borderRadius: 14, marginTop: 'auto', marginBottom: 5,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  sidebarVersion: {
    textAlign: 'center', color: 'rgba(255,255,255,0.3)',
    fontSize: 10, fontWeight: '600', marginTop: 12,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  menuBtn: { padding: 5, marginRight: 10 },
  headerCenter: { flex: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#2D4057' },
  subtitleHeader: { fontSize: 11, color: '#7A868E', marginTop: 1 },
  addButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#B26969',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#B26969',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 5,
  },

  // List
  listContent: { padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 15 },
  emptyText: { fontSize: 16, color: '#AAA', fontWeight: '600' },
  emptyAddBtn: {
    backgroundColor: '#B26969', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 20, marginTop: 5,
  },
  emptyAddText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Card
  card: {
    backgroundColor: '#FFF', borderRadius: 24,
    marginBottom: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F5F5F5',
  },
  imageContainer: { position: 'relative', height: 180 },
  vehicleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  noImage: {
    width: '100%', height: '100%',
    backgroundColor: '#F7F7F7',
    justifyContent: 'center', alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#2D4057',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  typeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  cardInfo: { padding: 18 },
  titleRow: { marginBottom: 4 },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#2D4057' },
  subtitle: { fontSize: 12, color: '#9C8C79', fontWeight: '600', marginBottom: 12 },
  tagRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F7FAFC', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: '#EDF2F7',
  },
  tagPrimary: { backgroundColor: '#FDF4F4', borderColor: 'rgba(178,105,105,0.2)' },
  tagText: { fontSize: 12, color: '#7A868E', fontWeight: '600' },
  tagTextPrimary: { color: '#B26969' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plateContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FDF4F4', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(178,105,105,0.2)',
  },
  plateText: { fontSize: 14, fontWeight: '900', color: '#2D4057' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  editBtn: { backgroundColor: '#B08974' },
  deleteBtn: { backgroundColor: '#B26969' },
});

export default VehicleListScreen;
