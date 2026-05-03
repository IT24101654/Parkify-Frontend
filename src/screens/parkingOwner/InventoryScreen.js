import React, { useState, useEffect, useCallback } from 'react';
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
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import ParkingOwnerSidebar from '../../components/ParkingOwnerSidebar';

const { width } = Dimensions.get('window');

const InventoryScreen = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const [selectedType, setSelectedType] = useState(null); // 'FOOD', 'SPARE_PART', 'FUEL'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Sidebar animation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useState(new Animated.Value(-width))[0];

  const [form, setForm] = useState({ 
    itemName: '', inventoryType: '', category: '', quantity: '', 
    unitPrice: '', supplier: '', expiryDate: '', thresholdValue: '', 
    lastRestockDate: '', image: '' 
  });

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

  const categories = [
    { id: 'FOOD', title: 'Food & Beverage', icon: 'food-fork-drink', desc: 'Manage snacks, drinks and meals', color: '#F59E0B' },
    { id: 'SPARE_PART', title: 'Spare Parts', icon: 'cogs', desc: 'Manage vehicle parts and tools', color: '#3B82F6' },
    { id: 'FUEL', title: 'Fuel Management', icon: 'fuel', desc: 'Monitor petrol and diesel stock', color: '#EF4444' }
  ];

  const fetchItems = useCallback(async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      const res = await api.get('/inventory/owner');
      const filtered = res.data.filter(item => {
        const itemType = (item.inventoryType || '').toUpperCase();
        if (selectedType === 'FOOD') {
          return itemType.includes('FOOD') || itemType.includes('BEVERAGE');
        }
        return itemType === selectedType;
      });
      setItems(filtered);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert('Error', 'Failed to load inventory items.');
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setForm({ ...form, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarNav = (id) => {
    toggleSidebar();
    if (id === 'dashboard') navigation.navigate('ParkingOwnerDashboard');
    else if (id === 'slots') navigation.navigate('ParkingPlaceList');
    else if (id === 'inventory') return; // Already here
    else if (id === 'service') navigation.navigate('ServiceCenter');
    else if (id === 'reservations') navigation.navigate('OwnerReservations');
    else if (id === 'serviceBookings') navigation.navigate('OwnerServiceAppointments');
    else if (id === 'refunds') navigation.navigate('OwnerRefunds');
    else if (id === 'earningsHistory') navigation.navigate('OwnerEarnings');
    else if (id === 'profile') navigation.navigate('ParkingOwnerProfile');
  };


  const handleSave = async () => {
    if (!form.itemName || !form.quantity || !form.unitPrice) {
      Alert.alert('Validation', 'Please fill required fields.');
      return;
    }
    try {
      const payload = {
        ...form,
        inventoryType: selectedType,
        quantity: parseFloat(form.quantity),
        unitPrice: parseFloat(form.unitPrice),
        thresholdValue: parseFloat(form.thresholdValue || 0)
      };

      if (editingId) {
        await api.put(`/inventory/${editingId}`, payload);
      } else {
        await api.post('/inventory/add', payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm({ itemName: '', quantity: '', thresholdValue: '', unitPrice: '', category: '', supplier: '', expiryDate: '', lastRestockDate: '', image: '' });
      fetchItems();
      Alert.alert('Success', `Item ${editingId ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      console.error('Inventory Save Error:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to save item.';
      Alert.alert('Error', msg);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/inventory/${id}`);
          fetchItems();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete item.');
        }
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const isLowStock = item.quantity <= item.thresholdValue;
    return (
      <View style={[styles.itemCard, isLowStock && styles.lowStockCard]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImageLarge} resizeMode="cover" />
        ) : (
          <View style={styles.noImagePlaceholderLarge}>
            <MaterialCommunityIcons name="image-off" size={40} color="#CBD5E0" />
          </View>
        )}
        <View style={styles.itemCardContent}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemSub}>Qty: {item.quantity} | Rs. {item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.itemMeta}>
              {selectedType === 'FOOD' ? `Expiry: ${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}` : 
               selectedType === 'SPARE_PART' ? `Category: ${item.category || 'N/A'}` :
               `Last Restock: ${item.lastRestockDate ? new Date(item.lastRestockDate).toLocaleDateString() : 'N/A'}`}
            </Text>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
              const formattedExpiry = item.expiryDate ? item.expiryDate.split('T')[0] : '';
              const formattedRestock = item.lastRestockDate ? item.lastRestockDate.split('T')[0] : '';
              setForm({ 
                ...item, 
                quantity: item.quantity.toString(), 
                unitPrice: item.unitPrice.toString(), 
                thresholdValue: item.thresholdValue.toString(),
                expiryDate: formattedExpiry,
                lastRestockDate: formattedRestock
              });
              setEditingId(item._id);
              setShowForm(true);
            }}>
              <MaterialCommunityIcons name="pencil" size={20} color="#3182CE" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
              <MaterialCommunityIcons name="trash-can" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (!selectedType) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
        
        <ParkingOwnerSidebar 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          sidebarAnim={sidebarAnim} 
          navigation={navigation} 
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventory</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.categoryGrid}>
          <Text style={styles.subtitle}>Select a category to manage your stock</Text>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => setSelectedType(cat.id)}>
              <View style={[styles.catIconBox, { backgroundColor: cat.color + '15' }]}>
                <MaterialCommunityIcons name={cat.icon} size={40} color={cat.color} />
              </View>
              <View style={styles.catContent}>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <Text style={styles.catDesc}>{cat.desc}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E0" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <ParkingOwnerSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setSelectedType(null)} style={styles.menuBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#2D4057" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSidebar} style={[styles.menuBtn, { marginLeft: 10 }]}>
            <MaterialCommunityIcons name="menu" size={26} color="#2D4057" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{categories.find(c => c.id === selectedType)?.title || 'Inventory'}</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus-circle" size={28} color="#ED8936" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ED8936" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package-variant" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>No items found in this category.</Text>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit' : 'Add New'} {categories.find(c => c.id === selectedType)?.title || 'Inventory'} Item</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#A0AEC0" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {form.image ? (
                  <Image source={{ uri: form.image }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="camera-plus" size={40} color="#ED8936" />
                    <Text style={styles.imagePlaceholderText}>Add Item Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput 
                  style={styles.input} 
                  value={form.itemName} 
                  onChangeText={t => setForm({...form, itemName: t})} 
                  placeholder={selectedType === 'FOOD' ? "e.g. Sandwich, Coke" : selectedType === 'FUEL' ? "e.g. Octane 95" : "e.g. Engine Oil"} 
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput style={styles.input} value={form.quantity} onChangeText={t => setForm({...form, quantity: t})} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unit Price (Rs.) *</Text>
                  <TextInput style={styles.input} value={form.unitPrice} onChangeText={t => setForm({...form, unitPrice: t})} placeholder="0.00" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Low Stock Threshold *</Text>
                <TextInput style={styles.input} value={form.thresholdValue} onChangeText={t => setForm({...form, thresholdValue: t})} placeholder="Alert below this qty" keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Supplier</Text>
                <TextInput style={styles.input} value={form.supplier} onChangeText={t => setForm({...form, supplier: t})} placeholder="Supplier Name" />
              </View>
              {selectedType === 'FOOD' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
                  <TextInput style={styles.input} value={form.expiryDate} onChangeText={t => setForm({...form, expiryDate: t})} placeholder="2026-12-31" />
                </View>
              )}
              {selectedType === 'FUEL' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Restock Date (YYYY-MM-DD)</Text>
                  <TextInput style={styles.input} value={form.lastRestockDate} onChangeText={t => setForm({...form, lastRestockDate: t})} placeholder={new Date().toISOString().split('T')[0]} />
                </View>
              )}
              {selectedType === 'SPARE_PART' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vehicle Category</Text>
                  <TextInput style={styles.input} value={form.category} onChangeText={t => setForm({...form, category: t})} placeholder="e.g. SUV, Sedan" />
                </View>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update Item' : 'Add Item'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// Reuse sidebar logic from dashboard
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2D4057' },
  menuBtn: { padding: 5 },
  addBtn: { padding: 5 },
  subtitle: { fontSize: 16, color: '#718096', textAlign: 'center', marginBottom: 30, fontWeight: '500' },
  categoryGrid: { padding: 20 },
  catCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  catIconBox: { width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  catContent: { flex: 1 },
  catTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 4 },
  catDesc: { fontSize: 13, color: '#A0AEC0', lineHeight: 18 },
  listContainer: { padding: 20 },
  itemCard: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, overflow: 'hidden' },
  lowStockCard: { borderLeftWidth: 4, borderLeftColor: '#EF4444', backgroundColor: '#FFF5F5' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
  itemSub: { fontSize: 14, color: '#4A5568', fontWeight: '600' },
  itemMeta: { fontSize: 12, color: '#A0AEC0', marginTop: 4 },
  itemActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 8, backgroundColor: '#F8F9FA', borderRadius: 8 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#A0AEC0', marginTop: 15, fontSize: 16, fontWeight: '500' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#2D3748' },
  formScroll: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#4A5568', marginBottom: 8 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#ED8936', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // New Image Styles
  itemImageLarge: { width: '100%', height: 200, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  noImagePlaceholderLarge: { width: '100%', height: 120, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  itemCardContent: { padding: 15, flexDirection: 'row', alignItems: 'center' },
  imagePicker: { width: '100%', height: 180, backgroundColor: '#F7FAFC', borderRadius: 12, marginBottom: 20, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ED8936' },
  pickedImage: { width: '100%', height: '100%', borderRadius: 12 },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { marginTop: 10, color: '#ED8936', fontWeight: '700' },

  // Sidebar Styles (Synced with Dashboard)
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
});

export default InventoryScreen;
