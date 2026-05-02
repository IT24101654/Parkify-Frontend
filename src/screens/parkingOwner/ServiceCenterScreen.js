import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const CATEGORY_CONFIG = {
  'Car Wash': { icon: 'car-wash', color: '#9B8C7B', bg: '#F5F2EE', border: '#DDD6CC' },
  'Oil Change': { icon: 'oil', color: '#7D8570', bg: '#F2F3F0', border: '#CDD0C8' },
  'Tire Service': { icon: 'tire', color: '#738189', bg: '#F0F2F4', border: '#C8CDD2' },
  'Battery Service': { icon: 'battery-charging', color: '#8B9AA6', bg: '#F0F3F5', border: '#C8D0D8' },
  'Full Service': { icon: 'hammer-wrench', color: '#A09282', bg: '#F6F3F0', border: '#D8D0C8' },
  'Other Repairs': { icon: 'tools', color: '#AE958B', bg: '#F5F1EF', border: '#DDD0CB' },
};

const ServiceCenterScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [serviceCenter, setServiceCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [serviceItems, setServiceItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewAppointments, setViewAppointments] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [centerForm, setCenterForm] = useState({ name: '', workingHours: '', contactNumber: '', address: '' });
  
  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useState(new Animated.Value(-width))[0];

  const [form, setForm] = useState({ name: '', description: '', price: '', estimatedTime: '', image: null });

  const categories = [
    { name: 'Car Wash', icon: 'car-wash', desc: 'Washing & detailing' },
    { name: 'Oil Change', icon: 'oil', desc: 'Oil & filter change' },
    { name: 'Tire Service', icon: 'tire', desc: 'Repair & replacement' },
    { name: 'Battery Service', icon: 'battery-charging', desc: 'Testing & replacement' },
    { name: 'Full Service', icon: 'hammer-wrench', desc: 'Comprehensive maintenance' },
    { name: 'Other Repairs', icon: 'tools', desc: 'General repairs' }
  ];

  const fetchServiceCenter = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-centers/my-center');
      setServiceCenter(res.data);
    } catch (error) {
      console.error('Error fetching service center:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServiceItems = useCallback(async () => {
    if (!serviceCenter || !selectedCategory) return;
    try {
      setItemsLoading(true);
      setServiceItems([]); // Clear list to prevent showing stale data from previous category
      const res = await api.get(`/service-centers/service-items/center/${serviceCenter._id}`);
      const filtered = res.data.filter(item => 
        item.category?.trim().toLowerCase() === selectedCategory?.trim().toLowerCase()
      );
      setServiceItems(filtered);
    } catch (error) {
      console.error('Error fetching service items:', error);
    } finally {
      setItemsLoading(false);
    }
  }, [serviceCenter, selectedCategory]);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/service-centers/appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }, []);

  useEffect(() => {
    fetchServiceCenter();
  }, [fetchServiceCenter]);

  useEffect(() => {
    if (selectedCategory) fetchServiceItems();
  }, [selectedCategory, fetchServiceItems]);

  useEffect(() => {
    if (viewAppointments) fetchAppointments();
  }, [viewAppointments, fetchAppointments]);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const handleSidebarNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('ParkingOwnerDashboard');
    else if (id === 'slots') navigation.navigate('ParkingPlaceList');
    else if (id === 'inventory') navigation.navigate('Inventory');
    else if (id === 'service') return; // Already here
    else if (id === 'reservations') navigation.navigate('OwnerReservations');
    else if (id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
    else if (id === 'refunds') navigation.navigate('OwnerRefunds');
    else if (id === 'earningsHistory') navigation.navigate('OwnerEarnings');
    else if (id === 'profile') navigation.navigate('ParkingOwnerProfile');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setForm({ ...form, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSaveCenter = async () => {
    try {
      const res = await api.put('/service-centers/my-center', centerForm);
      setServiceCenter(res.data);
      setShowCenterForm(false);
      Alert.alert('Success', 'Service Center updated successfully!');
    } catch (error) {
      console.error('Error updating service center:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update Service Center.');
    }
  };

  const handleSaveItem = async () => {
    if (!form.name || !form.price || !form.estimatedTime) {
      Alert.alert('Validation', 'Please fill required fields.');
      return;
    }
    try {
      const payload = { 
        ...form, 
        category: selectedCategory.trim(), 
        price: parseFloat(form.price) 
      };
      if (editingId) {
        await api.put(`/service-centers/service-items/${editingId}`, payload);
      } else {
        await api.post('/service-centers/service-items/add', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', description: '', price: '', estimatedTime: '', image: null });
      fetchServiceItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to save service.');
    }
  };

  const handleDeleteItem = (id) => {
    Alert.alert('Delete Service', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/service-centers/service-items/${id}`);
          fetchServiceItems();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete service.');
        }
      }}
    ]);
  };

  const cfg = useMemo(() => CATEGORY_CONFIG[selectedCategory] || {}, [selectedCategory]);

  if (loading) return <View style={styles.loadingFull}><ActivityIndicator size="large" color="#B08974" /></View>;

  // ── Appointment Management View ──
  if (viewAppointments) {
    return (
      <SafeAreaView style={styles.container}>
        {isSidebarOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />}
        
        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
          <View style={styles.sidebarHeader}>
            <Image source={require('../../../assets/Parkify.png')} style={styles.sidebarLogo} resizeMode="contain" />
            <Text style={styles.sidebarBrand}>Parkify</Text>
          </View>
          <View style={styles.sidebarUserCard}>
            <View style={styles.sidebarAvatar}>
              {user?.profilePicture ? <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} /> : <MaterialCommunityIcons name="account" size={36} color="#FFF" />}
            </View>
            <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'OWNER'}</Text>
            <Text style={styles.sidebarUserRole}>Parking Owner</Text>
          </View>
          <View style={styles.divider} />
          <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
            {sidebarMenuItems.map(item => (
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
        </Animated.View>

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setViewAppointments(false)} style={styles.menuBtn}>
              <MaterialCommunityIcons name="arrow-left" size={26} color="#2D4057" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSidebar} style={[styles.menuBtn, { marginLeft: 10 }]}>
              <MaterialCommunityIcons name="menu" size={26} color="#2D4057" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Appointments</Text>
          <View style={{ width: 28 }} />
        </View>
        <FlatList
          data={appointments}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.apptCard}>
              <View style={styles.apptHeader}>
                <Text style={styles.apptId}>#{item.bookingId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'BOOKED' ? '#E6FFFA' : '#FEE2E2' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'BOOKED' ? '#2C7A7B' : '#991B1B' }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.apptSub}>{item.vehicleId} • {item.serviceType}</Text>
              <View style={styles.apptFooter}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color="#718096" />
                <Text style={styles.apptTime}>{new Date(item.serviceDate).toLocaleDateString()} at {item.timeSlot}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>No appointments scheduled.</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  // ── Category Service Management View ──
  if (selectedCategory) {
    return (
      <SafeAreaView style={styles.container}>
        {isSidebarOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />}
        
        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
          <View style={styles.sidebarHeader}>
            <Image source={require('../../../assets/Parkify.png')} style={styles.sidebarLogo} resizeMode="contain" />
            <Text style={styles.sidebarBrand}>Parkify</Text>
          </View>
          <View style={styles.sidebarUserCard}>
            <View style={styles.sidebarAvatar}>
              {user?.profilePicture ? <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} /> : <MaterialCommunityIcons name="account" size={36} color="#FFF" />}
            </View>
            <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'OWNER'}</Text>
            <Text style={styles.sidebarUserRole}>Parking Owner</Text>
          </View>
          <View style={styles.divider} />
          <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
            {sidebarMenuItems.map(item => (
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
        </Animated.View>

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.menuBtn}>
              <MaterialCommunityIcons name="arrow-left" size={26} color="#2D4057" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSidebar} style={[styles.menuBtn, { marginLeft: 10 }]}>
              <MaterialCommunityIcons name="menu" size={26} color="#2D4057" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{selectedCategory}</Text>
          <TouchableOpacity onPress={() => { setEditingId(null); setForm({name:'', description:'', price:'', estimatedTime:'', image: null}); setShowForm(true); }} style={styles.addBtn}>
            <MaterialCommunityIcons name="plus-circle" size={28} color={cfg.color} />
          </TouchableOpacity>
        </View>
        {itemsLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={cfg.color} />
          </View>
        ) : (
          <FlatList
          data={serviceItems}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.serviceItemCard}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImageLarge} resizeMode="cover" />
              ) : (
                <View style={[styles.placeholderBoxLarge, { backgroundColor: cfg.bg }]}>
                  <MaterialCommunityIcons name={cfg.icon} size={60} color={cfg.color} />
                </View>
              )}
              <View style={styles.serviceItemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity onPress={() => { setForm({...item, price: item.price.toString()}); setEditingId(item._id); setShowForm(true); }}>
                      <MaterialCommunityIcons name="pencil-circle" size={26} color="#3182CE" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteItem(item._id)}>
                      <MaterialCommunityIcons name="delete-circle" size={26} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>
                <View style={styles.itemFooter}>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>Rs. {item.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.timeTag}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#718096" />
                    <Text style={styles.timeText}>{item.estimatedTime}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tools" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>No services found in this category.</Text>
            </View>
          }
        />
        )}
        <Modal visible={showForm} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%', justifyContent: 'flex-end' }}
            >
              <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{editingId ? 'Edit' : 'Add'} {selectedCategory} Service</Text>
                  
                  {/* Image Picker */}
                  <TouchableOpacity style={styles.modalImagePicker} onPress={pickImage}>
                    {form.image ? (
                      <Image source={{ uri: form.image }} style={styles.modalPreviewImage} />
                    ) : (
                      <View style={styles.modalImagePlaceholder}>
                        <MaterialCommunityIcons name="camera-plus" size={32} color="#CBD5E0" />
                        <Text style={styles.modalImageText}>Add Service Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TextInput style={styles.input} placeholder="Service Name" value={form.name} onChangeText={t => setForm({...form, name: t})} />
                  <TextInput style={styles.input} placeholder="Price (Rs.)" value={form.price} onChangeText={t => setForm({...form, price: t})} keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Estimated Time (e.g. 30 mins)" value={form.estimatedTime} onChangeText={t => setForm({...form, estimatedTime: t})} />
                  <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" value={form.description} onChangeText={t => setForm({...form, description: t})} multiline />
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}><Text>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: cfg.color }]} onPress={handleSaveItem}><Text style={{ color: '#FFF', fontWeight: '800' }}>Save</Text></TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Main Dashboard View ──
  return (
    <SafeAreaView style={styles.container}>
      {isSidebarOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleSidebar} />}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Image source={require('../../../assets/Parkify.png')} style={styles.sidebarLogo} resizeMode="contain" />
          <Text style={styles.sidebarBrand}>Parkify</Text>
        </View>
        <View style={styles.sidebarUserCard}>
          <View style={styles.sidebarAvatar}>
            {user?.profilePicture ? <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} /> : <MaterialCommunityIcons name="account" size={36} color="#FFF" />}
          </View>
          <Text style={styles.sidebarUserName}>{user?.name?.toUpperCase() || 'OWNER'}</Text>
          <Text style={styles.sidebarUserRole}>Parking Owner</Text>
        </View>
        <View style={styles.divider} />
        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {sidebarMenuItems.map(item => (
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
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}><MaterialCommunityIcons name="menu" size={28} color="#2D4057" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Service Center</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Info Strip */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>
                {serviceCenter?.name?.toLowerCase() === "yasith's service center" ? "Service Center" : (serviceCenter?.name || 'Service Center')}
              </Text>
              <Text style={styles.infoSub}>{serviceCenter?.workingHours || 'Working Hours Not Set'}</Text>
              <Text style={styles.infoSub}>{serviceCenter?.contactNumber || 'No Contact Info'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.centerEditBtn} 
              onPress={() => {
                setCenterForm({
                  name: serviceCenter?.name || '',
                  workingHours: serviceCenter?.workingHours || '',
                  contactNumber: serviceCenter?.contactNumber || '',
                  address: serviceCenter?.address || ''
                });
                setShowCenterForm(true);
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Appointment Strip */}
        <TouchableOpacity style={styles.appointmentStrip} onPress={() => setViewAppointments(true)}>
          <View style={styles.stripLeft}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#B08974" />
            <Text style={styles.stripText}>Manage Appointments</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#B08974" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Manage Categories</Text>
        <View style={styles.grid}>
          {categories.map((cat, idx) => (
            <TouchableOpacity key={idx} style={styles.gridCard} onPress={() => setSelectedCategory(cat.name)}>
              <MaterialCommunityIcons name={cat.icon} size={32} color="#ED8936" />
              <Text style={styles.gridTitle}>{cat.name}</Text>
              <Text style={styles.gridDesc}>{cat.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showCenterForm} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Service Center Details</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Center Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={centerForm.name} 
                    onChangeText={t => setCenterForm({...centerForm, name: t})} 
                    placeholder="e.g. Service Center"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Working Hours</Text>
                  <TextInput 
                    style={styles.input} 
                    value={centerForm.workingHours} 
                    onChangeText={t => setCenterForm({...centerForm, workingHours: t})} 
                    placeholder="e.g. 9:00 AM - 6:00 PM"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Contact Number</Text>
                  <TextInput 
                    style={styles.input} 
                    value={centerForm.contactNumber} 
                    onChangeText={t => setCenterForm({...centerForm, contactNumber: t})} 
                    placeholder="e.g. 0112345678"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.modalLabel}>Address</Text>
                  <TextInput 
                    style={styles.input} 
                    value={centerForm.address} 
                    onChangeText={t => setCenterForm({...centerForm, address: t})} 
                    placeholder="e.g. 123 Main St, Colombo"
                  />
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCenterForm(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#2D4057' }]} onPress={handleSaveCenter}>
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>Update Center</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 18, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EDF2F7',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 100
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2D4057' },
  infoCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, elevation: 3 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  infoTitle: { fontSize: 24, fontWeight: '900', color: '#2D4057', marginBottom: 8 },
  infoSub: { fontSize: 14, color: '#718096', marginBottom: 4, fontWeight: '600' },
  centerEditBtn: { backgroundColor: '#3182CE', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#718096', marginBottom: 8, textTransform: 'uppercase' },
  cancelBtnText: { fontWeight: '700', color: '#718096' },
  appointmentStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDF8F4', padding: 18, borderRadius: 15, borderLeftWidth: 5, borderLeftColor: '#B08974', marginBottom: 25 },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stripText: { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { backgroundColor: '#FFF', width: '48%', padding: 20, borderRadius: 20, marginBottom: 15, alignItems: 'center', textAlign: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  gridTitle: { fontSize: 15, fontWeight: '800', color: '#2D3748', marginTop: 10, marginBottom: 5 },
  gridDesc: { fontSize: 11, color: '#A0AEC0', textAlign: 'center' },
  
  // Service Item Card (Prominent Style)
  serviceItemCard: { backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, overflow: 'hidden' },
  itemImageLarge: { width: '100%', height: 180 },
  placeholderBoxLarge: { width: '100%', height: 180, justifyContent: 'center', alignItems: 'center' },
  serviceItemInfo: { padding: 18 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceName: { fontSize: 20, fontWeight: '900', color: '#2D3748', flex: 1 },
  itemActions: { flexDirection: 'row', gap: 10 },
  itemDesc: { fontSize: 13, color: '#718096', marginBottom: 15, lineHeight: 18, fontWeight: '500' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 15 },
  priceBadge: { backgroundColor: '#FDF8F4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#ED8936' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#ED8936' },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { fontSize: 13, color: '#718096', fontWeight: '700' },

  // Modal Styles Enhancement
  modalImagePicker: { width: '100%', height: 120, backgroundColor: '#F7FAFC', borderRadius: 12, borderWeight: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden' },
  modalPreviewImage: { width: '100%', height: '100%' },
  modalImagePlaceholder: { alignItems: 'center' },
  modalImageText: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', marginTop: 5 },

  // Appt Card
  apptCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  apptId: { fontSize: 14, fontWeight: '800', color: '#A0AEC0' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800' },
  customerName: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 5 },
  apptSub: { fontSize: 14, color: '#718096', marginBottom: 10 },
  apptFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 10 },
  apptTime: { fontSize: 13, color: '#718096', fontWeight: '600' },

  // Sidebar (Synced)
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },
  sidebar: { position: 'absolute', top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#2D4057', zIndex: 3000, padding: 20, paddingTop: 40 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sidebarLogo: { width: 30, height: 30 },
  sidebarBrand: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  sidebarUserCard: { alignItems: 'center', paddingVertical: 2, marginBottom: 0 },
  sidebarAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B26969', marginBottom: 5 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 25 },
  sidebarUserName: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sidebarUserRole: { fontSize: 11, fontWeight: '700', color: '#B26969', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  sidebarMenu: { flex: 1, paddingTop: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 5, borderRadius: 14, marginBottom: 0 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#B26969', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginTop: 2 },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Modal (Quick)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 20 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 10, padding: 12, marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  cancelBtn: { padding: 12 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#A0AEC0', marginTop: 15, fontSize: 16, fontWeight: '500' },
});

export default ServiceCenterScreen;
