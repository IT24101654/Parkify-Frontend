import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch,
  ActivityIndicator, Image, Platform, Animated, Dimensions, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapView, { Marker, UrlTile } from '../../components/MapView';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const InputField = ({ label, icon, name, placeholder, value, onChangeText, error, keyboardType = 'default', multiline = false }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}><MaterialCommunityIcons name={icon} size={14} color={COLORS.secondary} /> {label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea, error && styles.inputError]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const AddParkingPlaceScreen = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const isEdit = route.params?.isEdit || false;
  const editPlace = route.params?.place || null;

  const [loading, setLoading] = useState(false);
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
    else if (id === 'slots') navigation.navigate('ParkingPlaceList');
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
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    parkingName: '',
    description: '',
    slots: '',
    address: '',
    city: '',
    location: '',
    price: '',
    dailyPrice: '',
    weekendPrice: '',
    type: 'Private',
    openHours: '08:00',
    closeHours: '20:00',
    is24Hours: false,
    weekendAvailable: true,
    temporaryClosed: false,
    hasInventory: false,
    hasServiceCenter: false,
    latitude: '6.9271',
    longitude: '79.8612'
  });

  const [errors, setErrors] = useState({});

  // Handle location returned from MapPickerScreen
  useEffect(() => {
    if (route.params?.selectedLocation) {
      const { lat, lng, address: pickedAddress } = route.params.selectedLocation;
      setFormData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
        location: pickedAddress || prev.location,
      }));
      navigation.setParams({ selectedLocation: undefined });
    }
  }, [route.params?.selectedLocation]);

  useEffect(() => {
    if (isEdit && editPlace) {
      setFormData({
        parkingName: editPlace.parkingName || '',
        description: editPlace.description || '',
        slots: editPlace.slots?.toString() || '',
        address: editPlace.address || '',
        city: editPlace.city || '',
        location: editPlace.location || '',
        price: editPlace.price?.toString() || '',
        dailyPrice: editPlace.dailyPrice?.toString() || '',
        weekendPrice: editPlace.weekendPrice?.toString() || '',
        type: editPlace.type || 'Private',
        openHours: editPlace.openHours || '08:00',
        closeHours: editPlace.closeHours || '20:00',
        is24Hours: editPlace.is24Hours || false,
        weekendAvailable: editPlace.weekendAvailable !== false,
        temporaryClosed: editPlace.temporaryClosed || false,
        hasInventory: editPlace.hasInventory || false,
        hasServiceCenter: editPlace.hasServiceCenter || false,
        latitude: editPlace.latitude?.toString() || '6.9271',
        longitude: editPlace.longitude?.toString() || '79.8612'
      });
      if (editPlace.placeImage) {
        let baseUrl = api.defaults.baseURL.replace('/api', '').replace(/\/$/, '');
        const cleanPath = editPlace.placeImage.replace(/\\/g, '/');
        const finalPath = cleanPath.includes('uploads/') ? cleanPath : `uploads/parking-photos/${cleanPath}`;
        setImage(`${baseUrl}/${finalPath.startsWith('/') ? finalPath.slice(1) : finalPath}`);
      }
    }
  }, [isEdit, editPlace]);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.parkingName) newErrors.parkingName = "Name is required";
    if (!formData.slots) newErrors.slots = "Slot count is required";
    if (!formData.price) newErrors.price = "Hourly rate is required";
    if (!formData.location) newErrors.location = "Location description is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        ownerId: user._id || user.id,
        slots: parseInt(formData.slots),
        price: parseFloat(formData.price),
        dailyPrice: formData.dailyPrice ? parseFloat(formData.dailyPrice) : null,
        weekendPrice: formData.weekendPrice ? parseFloat(formData.weekendPrice) : null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        hasInventory: formData.hasInventory,
        hasServiceCenter: formData.hasServiceCenter,
      };

      let response;
      if (isEdit) {
        response = await api.put(`/parking/update/${editPlace.id || editPlace._id}`, payload);
      } else {
        response = await api.post('/parking/add', payload);
      }

      const savedPlaceId = response.data.id || response.data._id;

      // Handle Image Upload
      if (image && !image.startsWith('http') && savedPlaceId) {
        const formDataImg = new FormData();
        if (Platform.OS === 'web') {
          const response = await fetch(image);
          const blob = await response.blob();
          formDataImg.append('file', blob, `parking_${savedPlaceId}.jpg`);
        } else {
          const uriParts = image.split('.');
          const fileType = uriParts[uriParts.length - 1];
          formDataImg.append('file', {
            uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
            name: `parking_${savedPlaceId}.${fileType}`,
            type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
          });
        }

        await api.post(`/parking/${savedPlaceId}/upload-image`, formDataImg, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      Alert.alert("Success", `Parking Place ${isEdit ? 'Updated' : 'Registered'} Successfully!`);
      navigation.goBack();
      if (route.params?.onComplete) route.params.onComplete();
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", "Failed to save parking place. Please check your data.");
    } finally {
      setLoading(false);
    }
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuBtn, { marginLeft: 10 }]} onPress={toggleSidebar}>
            <MaterialCommunityIcons name="menu" size={26} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Parking' : 'Add Parking'}</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="camera-plus" size={40} color={COLORS.gray300} />
              <Text style={styles.imagePlaceholderText}>Add Place Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <InputField 
          label="Parking Name" icon="car" name="parkingName" 
          placeholder="e.g. Premium City Parking" 
          value={formData.parkingName} onChangeText={(t) => handleInputChange('parkingName', t)}
          error={errors.parkingName}
        />
        <InputField 
          label="Total Slots" icon="grid" name="slots" 
          placeholder="e.g. 50" keyboardType="numeric" 
          value={formData.slots} onChangeText={(t) => handleInputChange('slots', t)}
          error={errors.slots}
        />
        <InputField 
          label="Description" icon="information" name="description" 
          placeholder="Describe amenities, security, etc." multiline 
          value={formData.description} onChangeText={(t) => handleInputChange('description', t)}
          error={errors.description}
        />
        
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField 
              label="City" icon="city" name="city" placeholder="e.g. Colombo" 
              value={formData.city} onChangeText={(t) => handleInputChange('city', t)}
            />
          </View>
          <View style={{ width: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}><MaterialCommunityIcons name="tag" size={14} color={COLORS.secondary} /> Category</Text>
            <View style={styles.categoryPicker}>
              {['Private', 'Public', 'VIP', 'Staff'].map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.catBtn, formData.type === cat && styles.catBtnActive]}
                  onPress={() => handleInputChange('type', cat)}
                >
                  <Text style={[styles.catBtnText, formData.type === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <InputField 
          label="Full Address" icon="map-marker" name="address" placeholder="123, Main Street, Colombo" 
          value={formData.address} onChangeText={(t) => handleInputChange('address', t)}
        />
        <InputField 
          label="Display Location" icon="map-marker-radius" name="location" placeholder="e.g. Near World Trade Center" 
          value={formData.location} onChangeText={(t) => handleInputChange('location', t)}
          error={errors.location}
        />

        {/* ── Map Location Picker ── */}
        <Text style={styles.sectionTitle}>GPS Location</Text>
        <TouchableOpacity
          style={styles.mapPickerBtn}
          onPress={() => navigation.navigate('MapPicker', {
            currentLat: formData.latitude,
            currentLng: formData.longitude,
            isEdit,
            place: editPlace,
          })}
        >
          <MaterialCommunityIcons name="map-marker-plus" size={22} color={COLORS.secondary} />
          <Text style={styles.mapPickerBtnText}>Select on Map</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#A0AEC0" />
        </TouchableOpacity>

        {/* Mini map preview */}
        {formData.latitude && formData.longitude ? (
          <View style={styles.miniMapContainer}>
            <MapView
              style={styles.miniMap}
              region={{
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                latitudeDelta: 0.01, longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <UrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                shouldReplaceMapContent={true}
                flipY={false}
              />
              <Marker coordinate={{
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
              }}>
                <View style={styles.miniMarker}>
                  <MaterialCommunityIcons name="parking" size={14} color="#FFF" />
                </View>
              </Marker>
            </MapView>
            <View style={styles.miniMapOverlay}>
              <Text style={styles.miniMapCoord}>
                {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Pricing (LKR)</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField 
              label="Hourly" icon="clock-outline" name="price" placeholder="Rate" keyboardType="numeric" 
              value={formData.price} onChangeText={(t) => handleInputChange('price', t)}
              error={errors.price}
            />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <InputField 
              label="Daily" icon="calendar-today" name="dailyPrice" placeholder="Rate" keyboardType="numeric" 
              value={formData.dailyPrice} onChangeText={(t) => handleInputChange('dailyPrice', t)}
            />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <InputField 
              label="Weekend" icon="calendar-week" name="weekendPrice" placeholder="Rate" keyboardType="numeric" 
              value={formData.weekendPrice} onChangeText={(t) => handleInputChange('weekendPrice', t)}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Operating Hours</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <InputField 
              label="Opening" icon="clock-start" name="openHours" placeholder="08:00" 
              value={formData.openHours} onChangeText={(t) => handleInputChange('openHours', t)}
            />
          </View>
          <View style={{ width: 15 }} />
          <View style={{ flex: 1 }}>
            <InputField 
              label="Closing" icon="clock-end" name="closeHours" placeholder="20:00" 
              value={formData.closeHours} onChangeText={(t) => handleInputChange('closeHours', t)}
            />
          </View>
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Open 24 Hours</Text>
            <Switch
              value={formData.is24Hours}
              onValueChange={(val) => handleInputChange('is24Hours', val)}
              trackColor={{ false: '#767577', true: COLORS.primary }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Weekend Available</Text>
            <Switch
              value={formData.weekendAvailable}
              onValueChange={(val) => handleInputChange('weekendAvailable', val)}
              trackColor={{ false: '#767577', true: COLORS.primary }}
            />
          </View>
        </View>

        {/* ── Additional Services ── */}
        <Text style={styles.sectionTitle}>Additional Services</Text>
        <View style={styles.switchContainer}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelRow}>
              <MaterialCommunityIcons name="package-variant-closed" size={20} color={COLORS.secondary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.switchLabel}>Inventory Available</Text>
                <Text style={styles.switchSub}>Spare parts, fuel, food items</Text>
              </View>
            </View>
            <Switch
              value={formData.hasInventory}
              onValueChange={(val) => handleInputChange('hasInventory', val)}
              trackColor={{ false: '#767577', true: COLORS.secondary }}
              thumbColor={formData.hasInventory ? '#FFF' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.switchRow, { marginTop: 5 }]}>
            <View style={styles.switchLabelRow}>
              <MaterialCommunityIcons name="tools" size={20} color={COLORS.secondary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.switchLabel}>Service Center</Text>
                <Text style={styles.switchSub}>Car wash, oil change, repairs</Text>
              </View>
            </View>
            <Switch
              value={formData.hasServiceCenter}
              onValueChange={(val) => handleInputChange('hasServiceCenter', val)}
              trackColor={{ false: '#767577', true: COLORS.secondary }}
              thumbColor={formData.hasServiceCenter ? '#FFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={22} color="#FFF" />
              <Text style={styles.submitBtnText}>{isEdit ? 'Update Details' : 'Register Parking'}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  menuBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  imagePicker: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EEE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden'
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { marginTop: 10, color: COLORS.textMuted, fontWeight: '600' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 11, marginTop: 4, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, marginTop: 15, marginBottom: 15, textTransform: 'uppercase' },
  switchContainer: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 25 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  switchSub: { fontSize: 12, color: '#A0AEC0', fontWeight: '500', marginTop: 2 },

  // Map picker styles
  mapPickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.secondary, marginBottom: 15,
    borderStyle: 'dashed',
  },
  mapPickerBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  miniMapContainer: {
    height: 160, borderRadius: 16, overflow: 'hidden',
    marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative',
  },
  miniMap: { ...StyleSheet.absoluteFillObject },
  miniMarker: {
    backgroundColor: COLORS.secondary, width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  miniMapOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(45,64,87,0.8)', padding: 8, alignItems: 'center',
  },
  miniMapCoord: { color: '#FFF', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  submitBtn: { 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    paddingVertical: 15, 
    borderRadius: 15,
    marginTop: 10
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  categoryPicker: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, 
    marginTop: 2 
  },
  catBtn: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  catBtnActive: { 
    backgroundColor: COLORS.secondary, 
    borderColor: COLORS.secondary 
  },
  catBtnText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: COLORS.primary 
  },
  catBtnTextActive: { 
    color: '#FFF' 
  },
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

export default AddParkingPlaceScreen;
