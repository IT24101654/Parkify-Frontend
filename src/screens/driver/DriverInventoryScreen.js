import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  FlatList, Dimensions, StatusBar, SafeAreaView, ActivityIndicator, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api, { getImageUrl } from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';
import DriverSidebar from '../../components/DriverSidebar';
import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const DriverInventoryScreen = ({ route, navigation }) => {
  const { placeId, parkingName } = route.params;
  const [selectedType, setSelectedType] = useState('FOOD'); // 'FOOD', 'SPARE_PART', 'FUEL'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const categories = [
    { id: 'FOOD', title: 'Food & Beverage', icon: 'food-fork-drink', color: '#F59E0B' },
    { id: 'SPARE_PART', title: 'Spare Parts', icon: 'cogs', color: '#3B82F6' },
    { id: 'FUEL', title: 'Fuel', icon: 'fuel', color: '#EF4444' }
  ];

  const fetchItems = useCallback(async () => {
    if (!selectedType || !placeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log("DEBUG: Fetching inventory for placeId:", placeId);
      const res = await api.get(`/inventory/robust/by-parking-place/${placeId}`);
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
    } finally {
      setLoading(false);
    }
  }, [selectedType, placeId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getImageUrlLocal = (imagePath) => {
    return getImageUrl(imagePath, 'inventory');
  };

  const renderItem = ({ item }) => {
    const imageUrl = getImageUrlLocal(item.image);
    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image-outline" size={24} color="#A0AEC0" />
              </View>
            )}
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.category || item.inventoryType}</Text>
              </View>
              <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.price}>LKR {item.unitPrice}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Sidebar */}
      <DriverSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.backBtn}>
          <MaterialCommunityIcons name="menu" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Available Inventory</Text>
          <Text style={styles.headerSub}>{parkingName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Categories Horizontal List */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {categories.map((cat) => {
            const isSelected = selectedType === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTab, isSelected && { backgroundColor: cat.color }]}
                onPress={() => setSelectedType(cat.id)}
              >
                <MaterialCommunityIcons 
                  name={cat.icon} 
                  size={18} 
                  color={isSelected ? '#FFF' : cat.color} 
                />
                <Text style={[styles.categoryTabText, isSelected && styles.categoryTabTextSelected]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant" size={60} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>No Items Found</Text>
                <Text style={styles.emptyDesc}>There are no {selectedType.toLowerCase()} items available right now.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingVertical: 15,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
  },
  backBtn: { padding: 5 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  headerSub: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },
  
  categoriesContainer: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoriesList: { paddingHorizontal: 15, gap: 10 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: '#F8F9FA',
    borderWidth: 1, borderColor: '#EDF2F7'
  },
  categoryTabText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
  categoryTabTextSelected: { color: '#FFF' },
  
  content: { flex: 1 },
  listContainer: { padding: 15, paddingBottom: 40 },
  
  card: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  cardContent: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  imageContainer: {
    width: 70, height: 70, borderRadius: 12, backgroundColor: '#F7FAFC',
    overflow: 'hidden', marginRight: 12
  },
  itemImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { backgroundColor: '#EDF2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#4A5568' },
  quantityText: { fontSize: 12, fontWeight: '600', color: '#718096' },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginTop: 15, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#718096', textAlign: 'center', paddingHorizontal: 40 }
});

export default DriverInventoryScreen;
