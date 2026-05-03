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
import DriverSidebar from '../components/DriverSidebar';

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

// ── Main Screen ────────────────────────────────
const DriverProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(0);
  
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
    driverPreferences: user?.driverPreferences || 'nearest',
    active: user?.active !== undefined ? user.active : true,
    profilePicture: user?.profilePicture || null,
  });

  useEffect(() => {
    fetchVehicleCount();
    refreshUser();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      sidebarAnim.setValue(-width);
      setIsSidebarOpen(false);
      fetchVehicleCount();
      refreshUser();
    });
    return unsubscribe;
  }, [navigation]);

  // Sync form when user changes (after refresh)
  useEffect(() => {
    if (user && !isEditing) {
      setForm({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        driverPreferences: user.driverPreferences || 'nearest',
        active: user.active !== undefined ? user.active : true,
        profilePicture: user.profilePicture || null,
      });
    }
  }, [user]);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('DriverDashboard');
    else if (id === 'vehicles') navigation.navigate('VehicleList');
  };

  const sidebarMenuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'view-dashboard' },
    { id: 'slots', title: 'Parking Slots', icon: 'map-marker-radius' },
    { id: 'bookings', title: 'Reservations', icon: 'book-open-variant' },
    { id: 'payments', title: 'Payments', icon: 'wallet' },
    { id: 'vehicles', title: 'My Vehicles', icon: 'car-multiple' },
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

  const fetchVehicleCount = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicleCount(res.data.length);
    } catch (e) {}
  };

  const pickImage = async () => {
    if (!isEditing) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Compress heavily to prevent PayloadTooLarge errors
      base64: true,
    });

    if (!result.canceled) {
      setForm({ ...form, profilePicture: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const cyclePreference = () => {
    const prefs = ['nearest', 'cheapest', 'available'];
    const currentIndex = prefs.indexOf(form.driverPreferences);
    const nextIndex = (currentIndex + 1) % prefs.length;
    setForm({ ...form, driverPreferences: prefs[nextIndex] });
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
        driverPreferences: form.driverPreferences,
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

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      Alert.alert('Success', 'Password changed successfully!');
      setIsPasswordModalVisible(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = (user?.name || 'D')
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
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}

      {/* ── Navy Sidebar ── */}
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
              <Image source={{ uri: getImageUrl(user.profilePicture) }} style={{ width: '100%', height: '100%' }} />
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
                item.id === 'profile' && styles.menuItemActive,
              ]}
              onPress={() => handleSidebarNav(item.id)}
            >
              <View style={[styles.menuIconBox, item.id === 'profile' && styles.menuIconBoxActive]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={item.id === 'profile' ? '#FFF' : 'rgba(255,255,255,0.8)'}
                />
              </View>
              <Text style={[styles.menuText, item.id === 'profile' && styles.menuTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sidebarDivider} />
        <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.sidebarVersion}>Parkify v1.0.0</Text>
      </Animated.View>

      {/* ── Header ── */}
      <View style={styles.headerBg}>
        <TouchableOpacity style={styles.menuBtn} onPress={toggleSidebar}>
          <MaterialCommunityIcons name="menu" size={28} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <View style={styles.headerRightArea}>
          {isEditing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={{ padding: 5, marginRight: 10 }}
                onPress={() => {
                  setIsEditing(false);
                  setForm({
                    name: user?.name || '',
                    phoneNumber: user?.phoneNumber || '',
                    address: user?.address || '',
                    driverPreferences: user?.driverPreferences || 'nearest',
                    active: user?.active !== undefined ? user.active : true,
                    profilePicture: user?.profilePicture || null,
                  });
                }}
                disabled={loading}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 5 }} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialCommunityIcons name="check" size={24} color="#FFF" />
                )}
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
        <TouchableOpacity 
          style={styles.avatarRing} 
          onPress={pickImage} 
          disabled={!isEditing}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { overflow: 'hidden' }]}>
            {form.profilePicture ? (
              <Image 
                source={{ uri: getImageUrl(form.profilePicture) }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
            
            {isEditing && (
              <View style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                backgroundColor: 'rgba(45, 64, 87, 0.7)',
                alignItems: 'center',
                paddingVertical: 4,
              }}>
                <MaterialCommunityIcons name="camera" size={14} color="#FFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.heroName}>{user?.name || 'Driver'}</Text>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="steering" size={14} color="#FFF" />
          <Text style={styles.roleText}>Verified Driver</Text>
        </View>
        <Text style={styles.heroEmail}>{user?.email || ''}</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <StatCard 
            icon="car-multiple" 
            label="Vehicles" 
            value={vehicleCount} 
            color="#2D4057" 
            isEditing={false}
          />
          <StatCard 
            icon={
              form.driverPreferences === 'nearest'
                ? 'map-marker-radius'
                : form.driverPreferences === 'cheapest'
                ? 'cash-multiple'
                : 'check-circle'
            }
            label="Preference" 
            value={form.driverPreferences.charAt(0).toUpperCase() + form.driverPreferences.slice(1)} 
            color="#B26969" 
            onPress={cyclePreference}
            isEditing={isEditing}
          />
          <StatCard 
            icon={form.active ? "shield-check" : "shield-off"} 
            label="Status" 
            value={form.active ? "Active" : "Inactive"} 
            color={form.active ? "#7A806B" : "#B26969"} 
            onPress={() => setForm({ ...form, active: !form.active })}
            isEditing={isEditing}
          />
        </View>

        {/* ── Personal Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={[styles.card, SHADOWS.small]}>
            {/* Name */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <MaterialCommunityIcons name="account" size={18} color="#B26969" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={form.name}
                    onChangeText={(v) => setForm({ ...form, name: v })}
                    placeholder="Enter your name"
                    placeholderTextColor="#C4CDD6"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{form.name || '—'}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Phone */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <MaterialCommunityIcons name="phone" size={18} color="#B26969" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={form.phoneNumber}
                    onChangeText={(v) => setForm({ ...form, phoneNumber: v })}
                    placeholder="Enter phone number"
                    placeholderTextColor="#C4CDD6"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{form.phoneNumber || '—'}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Address */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#B26969" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Address</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={form.address}
                    onChangeText={(v) => setForm({ ...form, address: v })}
                    placeholder="Enter your address"
                    placeholderTextColor="#C4CDD6"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{form.address || '—'}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Email (read-only) */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <MaterialCommunityIcons name="email" size={18} color="#B26969" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <Text style={[styles.fieldValue, styles.fieldValueMuted]}>{user?.email || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Account Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={[styles.card, SHADOWS.small]}>
            <SettingRow
              icon="car-multiple"
              label="My Vehicles"
              value={`${vehicleCount} registered`}
              onPress={() => navigation.navigate('VehicleList')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="lock-outline"
              label="Change Password"
              onPress={() => setIsPasswordModalVisible(true)}
            />
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={[styles.card, SHADOWS.small]}>
            <SettingRow
              icon="logout"
              label="Sign Out"
              onPress={handleLogout}
              showArrow={false}
              danger={true}
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              secureTextEntry
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
              placeholderTextColor="#7A868E"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              secureTextEntry
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
              placeholderTextColor="#7A868E"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              secureTextEntry
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
              placeholderTextColor="#7A868E"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSave]} 
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnTextSave}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },

  // Sidebar styles
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
  },
  sidebar: {
    position: 'absolute', top: 0, bottom: 0,
    width: width * 0.75,
    backgroundColor: '#2D4057',
    zIndex: 3000, padding: 20, paddingTop: 40,
  },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  sidebarLogo: { width: 30, height: 30 },
  sidebarBrand: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  sidebarUserCard: { alignItems: 'center', paddingVertical: 2, marginBottom: 0 },
  sidebarAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#B26969', marginBottom: 5,
  },
  sidebarUserName: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sidebarUserRole: { fontSize: 11, fontWeight: '700', color: '#B26969', marginTop: 2 },
  sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  sidebarMenu: { flex: 1, paddingTop: 0 },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconBoxActive: { backgroundColor: '#B26969' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8, paddingHorizontal: 5,
    borderRadius: 14, marginBottom: 0,
  },
  menuItemActive: { backgroundColor: 'rgba(178,105,105,0.15)' },
  menuText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  menuTextActive: { color: '#FFF' },
  sidebarLogout: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#B26969', paddingVertical: 12,
    paddingHorizontal: 16, borderRadius: 14, marginTop: 2,
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  sidebarVersion: {
    textAlign: 'center', color: 'rgba(255,255,255,0.3)',
    fontSize: 10, fontWeight: '600', marginTop: 10,
  },

  // Header
  headerBg: {
    width: '100%',
    height: 60,
    backgroundColor: '#2D4057',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  menuBtn: { 
    position: 'absolute', 
    left: 20, 
    padding: 5, 
    zIndex: 10 
  },
  headerRightArea: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },

  // Avatar Hero
  avatarHero: {
    backgroundColor: '#2D4057',
    alignItems: 'center',
    paddingBottom: 35,
    paddingTop: 10,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#B26969',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(178,105,105,0.15)',
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#B26969',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  heroName: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(178,105,105,0.3)',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginBottom: 8,
  },
  roleText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Scroll
  scrollArea: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 25 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: {
    flex: 1, backgroundColor: '#FFF',
    borderRadius: 20, padding: 15,
    alignItems: 'center', gap: 6,
  },
  statCardEditing: {
    borderWidth: 1, borderColor: '#B26969',
  },
  statIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#2D4057' },
  statLabel: { fontSize: 10, color: '#7A868E', fontWeight: '700', textAlign: 'center' },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: '#7A868E',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginLeft: 4,
  },

  // Card
  card: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#F7FAFC', marginHorizontal: 16 },

  // Field Row
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  fieldIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#FDF4F4',
    justifyContent: 'center', alignItems: 'center',
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#7A868E', fontWeight: '700', marginBottom: 3 },
  fieldValue: { fontSize: 15, color: '#2D4057', fontWeight: '700' },
  fieldValueMuted: { color: '#9C8C79' },
  fieldInput: {
    fontSize: 15, color: '#2D4057', fontWeight: '700',
    borderBottomWidth: 1.5, borderBottomColor: '#B26969',
    paddingBottom: 4,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  settingIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  settingIconBoxDanger: { backgroundColor: '#FDF4F4' },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#2D4057' },
  settingLabelDanger: { color: '#B26969' },
  settingValue: { fontSize: 12, color: '#7A868E', marginTop: 2 },

  // Sidebar Styles
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
  },
  sidebar: {
    position: 'absolute', top: 0, bottom: 0,
    width: width * 0.75, backgroundColor: '#2D4057',
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
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    paddingVertical: 12, paddingHorizontal: 5,
    borderRadius: 14, marginBottom: 5,
  },
  menuText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  sidebarLogout: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    backgroundColor: '#B26969', paddingVertical: 12,
    paddingHorizontal: 16, borderRadius: 14, marginTop: 'auto', marginBottom: 5,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  sidebarVersion: {
    textAlign: 'center', color: 'rgba(255,255,255,0.3)',
    fontSize: 10, fontWeight: '600', marginTop: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D4057',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F4F7FA',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#2D4057',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F4F7FA',
  },
  modalBtnSave: {
    backgroundColor: '#B26969',
  },
  modalBtnTextCancel: {
    color: '#4A5568',
    fontWeight: '700',
    fontSize: 15,
  },
  modalBtnTextSave: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default DriverProfileScreen;
