import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, Image,
  RefreshControl, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Animated, Dimensions, ScrollView } from 'react-native';

const { width } = Dimensions.get('window');

const ParkingPlaceListScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [parkingPlaces, setParkingPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('ParkingOwnerDashboard');
    else if (id === 'slots') return; // Already here
    else if (id === 'inventory') navigation.navigate('Inventory');
    else if (id === 'service') navigation.navigate('ServiceCenter');
    else if (id === 'reservations') navigation.navigate('OwnerReservations');
    else if (id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
    else if (id === 'refunds') navigation.navigate('OwnerRefunds');
    else if (id === 'earningsHistory') navigation.navigate('OwnerEarnings');
    else if (id === 'profile') navigation.navigate('ParkingOwnerProfile');
  };

  const hasInventory = user?.ownerServices?.hasInventory;
  const hasServiceCenter = user?.ownerServices?.hasServiceCenter;

  const sidebarMenuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'view-dashboard' },
    { id: 'slots', title: 'Parking Slots', icon: 'car-brake-parking' },
    { id: 'inventory', title: 'Inventory', icon: 'package-variant-closed' },
    { id: 'service', title: 'Service Center', icon: 'store-cog' },
    { id: 'reservations', title: 'Reservations', icon: 'calendar-check' },
    { id: 'serviceBookings', title: 'Service Bookings', icon: 'hammer-wrench' },
    { id: 'refunds', title: 'Refund Requests', icon: 'cash-refund' },
    { id: 'earningsHistory', title: 'Earnings History', icon: 'chart-line' },
    { id: 'profile', title: 'My Profile', icon: 'account-circle' },
  ];

  const loadParkingPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const ownerId = user?._id || user?.id;
      if (!ownerId) {
        console.error("Owner ID is missing");
        setLoading(false);
        return;
      }
      const res = await api.get(`/parking/owner/${ownerId}`);
      setParkingPlaces(res.data);
    } catch (error) {
      console.error("Error loading parking places:", error);
      // Alert.alert("Error", "Failed to load parking places.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadParkingPlaces();
  }, [loadParkingPlaces]);

  const onRefresh = () => {
    setRefreshing(true);
    loadParkingPlaces();
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Parking Place",
      "Are you sure you want to delete this parking place? This will also delete all associated slots.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete(`/parking/delete/${id}`);
              Alert.alert("Success", "Parking Place Deleted Successfully!");
              loadParkingPlaces();
            } catch (error) {
              console.error("Deletion error:", error);
              Alert.alert("Error", "Failed to delete record.");
            }
          } 
        }
      ]
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    let baseUrl = api.defaults.baseURL.replace('/api', '').replace(/\/$/, '');
    const cleanPath = imagePath.replace(/\\/g, '/');
    const finalPath = cleanPath.includes('uploads/') ? cleanPath : `uploads/parking-photos/${cleanPath}`;
    return `${baseUrl}/${finalPath.startsWith('/') ? finalPath.slice(1) : finalPath}`;
  };

  const renderPlaceItem = ({ item }) => {
    const imageUrl = getImageUrl(item.placeImage);

    return (
      <View style={[styles.card, SHADOWS.medium]}>
        <View style={styles.cardContent}>
          {/* Left: Image */}
          <View style={styles.imageWrapper}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.placeImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image-off" size={24} color={COLORS.gray300} />
              </View>
            )}
            <View style={styles.typeBadgeContainer}>
              <Text style={styles.typeBadge}>{item.type}</Text>
            </View>
          </View>

          {/* Right: Info */}
          <View style={styles.infoWrapper}>
            <View style={styles.titleRow}>
              <Text style={styles.parkingName} numberOfLines={1}>{item.parkingName}</Text>
              {item.status === 'ACTIVE' && (
                <View style={styles.activeDot} />
              )}
            </View>
            
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.secondary} />
              <Text style={styles.locationText} numberOfLines={1}>{item.location || item.city}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="grid" size={14} color="#7A868E" />
                <Text style={styles.statText}>{item.slots} Slots</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>LKR</Text>
                <Text style={styles.priceValue}>{item.price}</Text>
                <Text style={styles.priceUnit}>/hr</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#F2C6AF' }]}
            onPress={() => navigation.navigate('ManageSlots', { place: item })}
          >
            <MaterialCommunityIcons name="view-grid-plus" size={18} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Slots</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#BDAD9C' }]}
            onPress={() => navigation.navigate('AddParkingPlace', { place: item, isEdit: true })}
          >
            <MaterialCommunityIcons name="pencil" size={18} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#B26969' }]}
            onPress={() => handleDelete(item.id || item._id)}
          >
            <MaterialCommunityIcons name="trash-can" size={18} color="#FFF" />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />
      )}

      {/* Navy Sidebar */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Image source={require('../../../assets/Parkify.png')} style={styles.sidebarLogo} resizeMode="contain" />
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
          <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'OWNER'}</Text>
          <Text style={styles.sidebarUserRole}>Parking Owner</Text>
        </View>

        <View style={styles.divider} />

        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {sidebarMenuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleSidebarNav(item.id)}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name={item.icon} size={22} color="rgba(255,255,255,0.8)" />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.divider} />
        <TouchableOpacity style={styles.sidebarLogout} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.sidebarVersion}>Parkify v1.0.0</Text>
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={toggleSidebar}>
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Slots</Text>
          <Text style={styles.headerSubtitle}>Manage your listings</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddParkingPlace')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your places...</Text>
        </View>
      ) : (
        <FlatList
          data={parkingPlaces}
          renderItem={renderPlaceItem}
          keyExtractor={(item) => (item.id || item._id).toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="garage-variant" size={80} color={COLORS.gray300} />
              <Text style={styles.emptyTitle}>No Parking Places Yet</Text>
              <Text style={styles.emptySubtitle}>Add your first parking facility to get started.</Text>
              <TouchableOpacity 
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddParkingPlace')}
              >
                <Text style={styles.emptyAddBtnText}>Register Now</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  menuBtn: { padding: 5, marginRight: 10 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  headerSubtitle: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
  addBtn: { 
    width: 45, 
    height: 45, 
    borderRadius: 12, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  listContent: { padding: 15, paddingBottom: 100 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5'
  },
  cardContent: { flexDirection: 'row', gap: 15 },
  imageWrapper: { 
    width: 100, 
    height: 100, 
    borderRadius: 18, 
    backgroundColor: '#F8F9FA',
    position: 'relative',
    overflow: 'hidden'
  },
  placeImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  typeBadgeContainer: { 
    position: 'absolute', 
    bottom: 5, 
    left: 5, 
    backgroundColor: 'rgba(45, 64, 87, 0.8)', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },
  typeBadge: { color: '#FFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  infoWrapper: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  parkingName: { fontSize: 18, fontWeight: '900', color: COLORS.primary, flex: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locationText: { fontSize: 13, color: '#7A868E', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceLabel: { fontSize: 10, color: COLORS.secondary, fontWeight: '800' },
  priceValue: { fontSize: 18, fontWeight: '900', color: COLORS.secondary },
  priceUnit: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
  cardActions: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 15, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#F8F9FA' 
  },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 10, 
    borderRadius: 12 
  },
  actionBtnText: { fontSize: 13, fontWeight: '800' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textMuted },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
  emptyAddBtn: { marginTop: 30, backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  emptyAddBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  // Sidebar Styles
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },
  sidebar: { position: 'absolute', top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#2D4057', zIndex: 3000, padding: 20, paddingTop: 40 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sidebarLogo: { width: 30, height: 30 },
  sidebarBrand: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  sidebarUserCard: { alignItems: 'center', paddingVertical: 2, marginBottom: 0 },
  sidebarAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B26969', marginBottom: 5 },
  sidebarUserName: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sidebarUserRole: { fontSize: 11, fontWeight: '700', color: '#B26969', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  sidebarMenu: { flex: 1, paddingTop: 0 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 5, borderRadius: 14, marginBottom: 0 },
  menuText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#B26969', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginTop: 2 },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  sidebarVersion: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600', marginTop: 8 },
});

export default ParkingPlaceListScreen;
