import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

// ── Stat Card ─────────────────────────────────
const StatCard = ({ icon, label, value, color, onPress, isEditing }) => (
  <TouchableOpacity 
    style={[styles.statCard, SHADOWS.small, isEditing && styles.statCardEditing]} 
    onPress={onPress}
    activeOpacity={isEditing ? 0.7 : 1}
    disabled={!isEditing}
  >
    <View style={[styles.statIconBox, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={icon} size={22} color="#FFF" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Setting Row ────────────────────────────────
const SettingRow = ({ icon, label, value, onPress, showArrow = true, danger = false }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.settingIconBox, danger && styles.settingIconBoxDanger]}>
      <MaterialCommunityIcons name={icon} size={20} color={danger ? '#B26969' : '#2D4057'} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
    </View>
    {showArrow && (
      <MaterialCommunityIcons name="chevron-right" size={22} color="#C4CDD6" />
    )}
  </TouchableOpacity>
);

const ParkingOwnerProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slotCount, setSlotCount] = useState(0);

  // Sidebar State
  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Password Modal State
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    active: user?.active !== undefined ? user.active : true,
    profilePicture: user?.profilePicture || null,
  });

  useEffect(() => {
    refreshUser();
    // In a real app, fetch actual slot count
    setSlotCount(2); 
  }, []);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('ParkingOwnerDashboard');
    else if (id === 'slots') navigation.navigate('ParkingPlaceList');
    else if (id === 'inventory') navigation.navigate('Inventory');
    else if (id === 'service') navigation.navigate('ServiceCenter');
    else if (id === 'reservations') navigation.navigate('OwnerReservations');
    else if (id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
    else if (id === 'refunds') navigation.navigate('OwnerRefunds');
    else if (id === 'earningsHistory') navigation.navigate('OwnerEarnings');
    else if (id === 'profile') return; // already here
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

  const getImageUrl = (uri) => {
    if (!uri) return null;
    if (uri.startsWith('http') || uri.startsWith('data:')) return uri;
    
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
    
    return `${baseUrl}/${path}`;
  };

  const pickImage = async () => {
    if (!isEditing) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled) {
      setForm({ ...form, profilePicture: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleToggleFeature = async (type) => {
    if (!isEditing) return;
    const featureName = type === 'inventory' ? 'Inventory' : 'Service Center';
    const currentValue = type === 'inventory' ? user?.ownerServices?.hasInventory : user?.ownerServices?.hasServiceCenter;
    
    Alert.alert(
      `${currentValue ? 'Disable' : 'Enable'} ${featureName}`,
      `Would you like to ${currentValue ? 'disable' : 'enable'} the ${featureName} feature?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              setLoading(true);
              const services = { ...(user?.ownerServices || {}) };
              if (type === 'inventory') services.hasInventory = !currentValue;
              else services.hasServiceCenter = !currentValue;

              const res = await api.put('/auth/update-profile', { ownerServices: services });
              await updateUser(res.data.user);
              Alert.alert('Success', `${featureName} ${!currentValue ? 'enabled' : 'disabled'} successfully!`);
            } catch (err) {
              Alert.alert('Error', `Failed to update ${featureName}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/auth/update-profile', {
        name: form.name,
        phoneNumber: form.phoneNumber,
        address: form.address,
        active: form.active,
        profilePicture: form.profilePicture,
      });
      await updateUser(res.data.user);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const initials = (user?.name || 'O')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D4057" />

      {/* ── Sidebar Overlay ── */}
      {isSidebarOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />
      )}

      {/* ── Navy Sidebar ── */}
      {/* ── Sidebar ── */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        {/* Logo */}
        <View style={styles.sidebarHeader}>
          <Image source={require('../../assets/Parkify.png')} style={styles.sidebarLogo} resizeMode="contain" />
          <Text style={styles.sidebarBrand}>Parkify</Text>
        </View>

        {/* User card */}
        <View style={styles.sidebarUserCard}>
          <View style={[styles.sidebarAvatar, { overflow: 'hidden' }]}>
            {user?.profilePicture
              ? <Image source={{ uri: getImageUrl(user.profilePicture) }} style={{ width: '100%', height: '100%' }} />
              : <MaterialCommunityIcons name="account" size={36} color="#FFF" />}
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

      {/* ── Header ── */}
      <View style={styles.headerBg}>
        <View style={{ position: 'absolute', left: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
          <TouchableOpacity style={{ padding: 5 }} onPress={toggleSidebar}>
            <MaterialCommunityIcons name="menu" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Owner Profile</Text>
        <View style={styles.headerRightArea}>
          {isEditing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={{ padding: 5, marginRight: 10 }} onPress={() => setIsEditing(false)} disabled={loading}>
                <MaterialCommunityIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 5 }} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#FFF" /> : <MaterialCommunityIcons name="check" size={24} color="#FFF" />}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={{ padding: 5 }} onPress={() => setIsEditing(true)}>
              <MaterialCommunityIcons name="pencil" size={22} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Avatar Hero ── */}
      <View style={styles.avatarHero}>
        <TouchableOpacity style={styles.avatarRing} onPress={pickImage} disabled={!isEditing} activeOpacity={0.7}>
          <View style={[styles.avatar, { overflow: 'hidden' }]}>
            {form.profilePicture ? (
              <Image source={{ uri: getImageUrl(form.profilePicture) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
            {isEditing && (
              <View style={styles.cameraIconOverlay}>
                <MaterialCommunityIcons name="camera" size={14} color="#FFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.heroName}>{user?.name || 'Parking Owner'}</Text>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="shield-account" size={14} color="#FFF" />
          <Text style={styles.roleText}>Verified Owner</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <StatCard icon="garage" label="Slots" value={slotCount} color="#2D4057" isEditing={false} />
          <StatCard 
            icon="package-variant" 
            label="Inventory" 
            value={user?.ownerServices?.hasInventory ? "ON" : "OFF"} 
            color="#B26969" 
            isEditing={isEditing} 
            onPress={() => handleToggleFeature('inventory')}
          />
          <StatCard 
            icon="tools" 
            label="Services" 
            value={user?.ownerServices?.hasServiceCenter ? "ON" : "OFF"} 
            color="#7A806B" 
            isEditing={isEditing} 
            onPress={() => handleToggleFeature('service')}
          />
        </View>

        {/* ── Personal Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={[styles.card, SHADOWS.small]}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}><MaterialCommunityIcons name="account" size={18} color="#B26969" /></View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? <TextInput style={styles.fieldInput} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} /> : <Text style={styles.fieldValue}>{form.name || '—'}</Text>}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}><MaterialCommunityIcons name="phone" size={18} color="#B26969" /></View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {isEditing ? <TextInput style={styles.fieldInput} value={form.phoneNumber} onChangeText={(v) => setForm({ ...form, phoneNumber: v })} keyboardType="phone-pad" /> : <Text style={styles.fieldValue}>{form.phoneNumber || '—'}</Text>}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}><MaterialCommunityIcons name="map-marker" size={18} color="#B26969" /></View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Business Address</Text>
                {isEditing ? <TextInput style={styles.fieldInput} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} /> : <Text style={styles.fieldValue}>{form.address || '—'}</Text>}
              </View>
            </View>
          </View>
        </View>

        {/* ── Account Settings ── */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={[styles.card, SHADOWS.small]}>
            <SettingRow icon="logout" label="Sign Out" onPress={handleLogout} showArrow={false} danger={true} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  headerBg: { width: '100%', height: 60, backgroundColor: '#2D4057', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  menuBtn: { position: 'absolute', left: 20, padding: 5, zIndex: 10 },
  headerRightArea: { position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  avatarHero: { backgroundColor: '#2D4057', alignItems: 'center', paddingBottom: 35, paddingTop: 10, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#B26969', justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(178,105,105,0.15)' },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#B26969', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  cameraIconOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(45, 64, 87, 0.7)', alignItems: 'center', paddingVertical: 4 },
  heroName: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(178,105,105,0.3)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 8 },
  roleText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 25 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 15, alignItems: 'center', gap: 6 },
  statCardEditing: { borderWidth: 1, borderColor: '#B26969' },
  statIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#2D4057' },
  statLabel: { fontSize: 10, color: '#7A868E', fontWeight: '700', textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#7A868E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#F7FAFC', marginHorizontal: 16 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  fieldIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FDF4F4', justifyContent: 'center', alignItems: 'center' },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#7A868E', fontWeight: '700', marginBottom: 3 },
  fieldValue: { fontSize: 15, color: '#2D4057', fontWeight: '700' },
  fieldInput: { fontSize: 15, color: '#2D4057', fontWeight: '700', borderBottomWidth: 1.5, borderBottomColor: '#B26969', paddingBottom: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  settingIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' },
  settingIconBoxDanger: { backgroundColor: '#FDF4F4' },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#2D4057' },
  settingLabelDanger: { color: '#B26969' },
  settingValue: { fontSize: 12, color: '#7A868E', marginTop: 2 },
  
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

export default ParkingOwnerProfileScreen;
