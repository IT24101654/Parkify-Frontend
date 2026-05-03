import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
  FlatList, StatusBar, Animated, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ParkingOwnerSidebar from '../../components/ParkingOwnerSidebar';

const { width } = Dimensions.get('window');

const ManageSlotsScreen = ({ navigation, route }) => {
  const { place } = route.params;
  const { user, logout } = useAuth();
  const [slotsList, setSlotsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
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
  const [expandedGroups, setExpandedGroups] = useState({});
  const [bulkSlotData, setBulkSlotData] = useState({
    prefix: 'P-',
    count: '10',
    type: 'Car'
  });

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/slots/place/${place.id || place._id}`);
      setSlotsList(res.data);
    } catch (error) {
      console.error("Error loading slots:", error);
    } finally {
      setLoading(false);
    }
  }, [place]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleBulkCreate = async () => {
    if (!bulkSlotData.count || isNaN(bulkSlotData.count) || parseInt(bulkSlotData.count) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid slot count.");
      return;
    }

    try {
      setBulkLoading(true);
      const payload = { 
        ...bulkSlotData, 
        count: parseInt(bulkSlotData.count),
        placeId: place.id || place._id 
      };
      await api.post('/slots/bulk-create', payload);
      Alert.alert("Success", `Generated ${bulkSlotData.count} slots successfully!`);
      loadSlots();
      setBulkSlotData({ prefix: 'P-', count: '10', type: 'Car' });
    } catch (error) {
      console.error("Error bulk creating slots:", error);
      Alert.alert("Error", "Failed to generate slots.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteSlot = (slotId) => {
    Alert.alert(
      "Delete Slot",
      "Are you sure you want to delete this slot?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete(`/slots/delete/${slotId}`);
              loadSlots();
            } catch (error) {
              console.error("Error deleting slot:", error);
              Alert.alert("Error", "Failed to delete slot.");
            }
          } 
        }
      ]
    );
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getGroupedSlots = () => {
    if (!slotsList || slotsList.length === 0) return [];
    const groups = {};

    slotsList.forEach(slot => {
      const match = slot.slotName.match(/^([a-zA-Z\-_]*)(\d+)$/);
      const prefix = match ? match[1] : 'Individual';
      const num = match ? parseInt(match[2], 10) : null;

      const groupKey = `${prefix}_${slot.slotType}_${slot.floor || 'None'}_${slot.slotStatus}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          prefix: prefix,
          type: slot.slotType,
          floor: slot.floor,
          status: slot.slotStatus,
          slots: [],
          isSequential: !!match
        };
      }
      groups[groupKey].slots.push({ ...slot, num });
    });

    return Object.values(groups).map(group => {
      if (group.isSequential && group.slots.length > 1) {
        group.slots.sort((a, b) => a.num - b.num);
        const first = group.slots[0].slotName;
        const last = group.slots[group.slots.length - 1].slotName;
        group.summaryName = `${first} – ${last}`;
      } else if (group.slots.length > 1) {
        group.summaryName = `${group.prefix} (Group of ${group.slots.length})`;
      } else {
        group.summaryName = group.slots[0].slotName;
      }
      return group;
    });
  };

  const renderGroupItem = (group) => (
    <View key={group.id} style={[styles.groupCard, SHADOWS.small]}>
      <TouchableOpacity 
        style={styles.groupHeader} 
        onPress={() => toggleGroup(group.id)}
        activeOpacity={0.7}
      >
        <View style={styles.groupMainInfo}>
          <Text style={styles.groupName}>{group.summaryName}</Text>
          <View style={styles.metaTags}>
            <Text style={[styles.metaTag, { backgroundColor: '#E2E8F0' }]}>{group.type}</Text>
            <Text style={[styles.metaTag, { backgroundColor: '#FEEBC8' }]}>{group.slots.length} Slots</Text>
          </View>
        </View>
        <View style={styles.groupRightInfo}>
          <Text style={[styles.statusPill, styles[group.status.toLowerCase()]]}>{group.status}</Text>
          <MaterialCommunityIcons 
            name={expandedGroups[group.id] ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={COLORS.primary} 
          />
        </View>
      </TouchableOpacity>

      {expandedGroups[group.id] && (
        <View style={styles.groupDetails}>
          <View style={styles.detailsGrid}>
            {group.slots.map(slot => (
              <View key={slot.id || slot._id} style={styles.miniSlotCard}>
                <Text style={styles.miniSlotName}>{slot.slotName}</Text>
                <TouchableOpacity 
                  onPress={() => handleDeleteSlot(slot.id || slot._id)}
                  style={styles.miniDelBtn}
                >
                  <MaterialCommunityIcons name="close" size={14} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ParkingOwnerSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuBtn, { marginLeft: 10 }]} onPress={toggleSidebar}>
            <MaterialCommunityIcons name="menu" size={26} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Manage Slots</Text>
          <Text style={styles.headerSubtitle}>{place.parkingName}</Text>
        </View>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bulk Creator Section */}
        <View style={[styles.creatorCard, SHADOWS.medium]}>
          <View style={styles.creatorHeader}>
            <MaterialCommunityIcons name="magic-staff" size={20} color={COLORS.secondary} />
            <Text style={styles.creatorTitle}>Bulk Generate Slots</Text>
          </View>
          
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>ID Prefix</Text>
              <TextInput
                style={styles.textInput}
                value={bulkSlotData.prefix}
                onChangeText={(text) => setBulkSlotData({ ...bulkSlotData, prefix: text })}
                placeholder="SPOT-"
              />
            </View>
            <View style={{ width: 10 }} />
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Count</Text>
              <TextInput
                style={styles.textInput}
                value={bulkSlotData.count}
                onChangeText={(text) => setBulkSlotData({ ...bulkSlotData, count: text })}
                placeholder="10"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Vehicle Type</Text>
            <View style={styles.typeSelector}>
              {['Car', 'Bike', 'Van', 'EV'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeBtn, 
                    bulkSlotData.type === type && styles.typeBtnActive
                  ]}
                  onPress={() => setBulkSlotData({ ...bulkSlotData, type })}
                >
                  <Text style={[
                    styles.typeBtnText,
                    bulkSlotData.type === type && styles.typeBtnTextActive
                  ]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.generateBtn, bulkLoading && styles.disabledBtn]} 
            onPress={handleBulkCreate}
            disabled={bulkLoading}
          >
            {bulkLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus-box-multiple" size={20} color="#FFF" />
                <Text style={styles.generateBtnText}>Generate Slots</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Slots List Section */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-pie" size={20} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>Existing Slots Summary</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.groupsContainer}>
              {getGroupedSlots().map(renderGroupItem)}
              {slotsList.length === 0 && (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="information-outline" size={40} color={COLORS.gray300} />
                  <Text style={styles.emptyText}>No slots configured yet. Use the tool above to generate slots.</Text>
                </View>
              )}
            </View>
          )}
        </View>
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
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  headerSubtitle: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  menuBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  creatorCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 25 
  },
  creatorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  creatorTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  formRow: { flexDirection: 'row', marginBottom: 15 },
  formField: { flex: 1, marginBottom: 15 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase' },
  textInput: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 15, 
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  typeSelector: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  typeBtn: { 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  typeBtnTextActive: { color: '#FFF' },
  generateBtn: { 
    backgroundColor: COLORS.secondary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    paddingVertical: 12, 
    borderRadius: 12,
    marginTop: 10
  },
  disabledBtn: { opacity: 0.7 },
  generateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  listSection: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  groupsContainer: { gap: 12 },
  groupCard: { backgroundColor: '#FFF', borderRadius: 15, overflow: 'hidden' },
  groupHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15 
  },
  groupMainInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 5 },
  metaTags: { flexDirection: 'row', gap: 8 },
  metaTag: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: COLORS.primary },
  groupRightInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusPill: { fontSize: 10, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, textTransform: 'uppercase' },
  available: { backgroundColor: '#E6F4EA', color: '#1E8E3E' },
  occupied: { backgroundColor: '#FEEFC3', color: '#B05E27' },
  groupDetails: { padding: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FAFAFA' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniSlotCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: '#FFF', 
    paddingHorizontal: 8, 
    paddingVertical: 5, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  miniSlotName: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  miniDelBtn: { padding: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginTop: 10 },

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
  menuTextActive: { color: '#FFF' },
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#B26969', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginTop: 2 },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  sidebarVersion: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600', marginTop: 8 },
});

export default ManageSlotsScreen;
