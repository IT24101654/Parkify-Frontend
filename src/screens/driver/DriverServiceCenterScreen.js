import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  FlatList, StatusBar, SafeAreaView, ActivityIndicator, Linking, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api, { getImageUrl } from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';
import DriverSidebar from '../../components/DriverSidebar';
import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const DriverServiceCenterScreen = ({ route, navigation }) => {
  const { placeId, parkingName } = route.params;
  const [center, setCenter] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchServiceCenterData = useCallback(async () => {
    if (!placeId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log("DEBUG: Fetching service center for placeId:", placeId);
      // Fetch Service Center Details by Parking Place ID
      const centerRes = await api.get(`/service-centers/by-parking-place/${placeId}`);
      if (centerRes.data) {
        setCenter(centerRes.data);
        
        // Fetch Service Items for this center
        const itemsRes = await api.get(`/service-centers/service-items/center/${centerRes.data._id}`);
        setServices(itemsRes.data || []);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Service center not found for this owner (404 expected if not set up).');
        setCenter(null);
      } else {
        console.error('Error fetching service center:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchServiceCenterData();
  }, [fetchServiceCenterData]);

  const handleCall = () => {
    if (center?.contactNumber) {
      Linking.openURL(`tel:${center.contactNumber}`);
    }
  };

  const getImageUrlLocal = (imagePath) => {
    return getImageUrl(imagePath, 'service');
  };

  const renderServiceItem = ({ item }) => {
    const imageUrl = getImageUrlLocal(item.image);
    return (
      <View style={styles.serviceItem}>
        <View style={styles.serviceImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.serviceIconContainer}>
              <MaterialCommunityIcons name="tools" size={24} color={COLORS.secondary} />
            </View>
          )}
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.servicePrice}>LKR {item.price}</Text>
        </View>
        <TouchableOpacity 
          style={styles.bookItemBtn}
          onPress={() => navigation.navigate('ServiceAppointment', {
            serviceType: item.name,
            serviceCenter: center.name,
            parkingPlaceId: placeId,
            parkingName: parkingName
          })}
        >
          <Text style={styles.bookItemBtnText}>Book</Text>
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Service Center</Text>
          <Text style={styles.headerSub}>{parkingName}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('DriverServiceAppointments', {
            placeId: placeId,
            parkingName: parkingName
          })} 
          style={styles.historyBtn}
        >
          <MaterialCommunityIcons name="calendar-clock" size={26} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : center ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Info Card */}
          <View style={[styles.infoCard, SHADOWS.medium]}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="store-cog" size={32} color={COLORS.primary} />
              <View style={styles.infoTitleBox}>
                <Text style={styles.infoTitle}>
                  {center?.name?.toLowerCase() === "yasith's service center" ? "Service Center" : (center?.name || 'Service Center')}
                </Text>
                {center.active && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Open</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.infoDesc}>{center.description || 'No description provided.'}</Text>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#718096" />
              <Text style={styles.detailText}>{center.workingHours || 'Working hours not specified'}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color="#718096" />
              <Text style={styles.detailText}>{center.address || 'Address not specified'}</Text>
            </View>

            {center.contactNumber ? (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <MaterialCommunityIcons name="phone" size={18} color="#FFF" />
                <Text style={styles.callBtnText}>Call {center.contactNumber}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Services List */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Available Services</Text>
            
            {services.length > 0 ? (
              services.map((item) => (
                <View key={item._id}>
                  {renderServiceItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="hammer-wrench" size={40} color="#E2E8F0" />
                <Text style={styles.emptyDesc}>No services listed yet.</Text>
              </View>
            )}
          </View>
          
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="store-off" size={60} color="#E2E8F0" />
          <Text style={styles.emptyTitle}>Service Center Not Found</Text>
          <Text style={styles.emptyDesc}>This parking place has not set up a service center yet.</Text>
        </View>
      )}
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
  historyBtn: { padding: 5 },
  
  scrollContent: { padding: 15, paddingBottom: 40 },
  
  infoCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#EDF2F7'
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoTitleBox: { marginLeft: 12, flex: 1 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  activeBadge: { backgroundColor: '#C6F6D5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#22543D' },
  infoDesc: { fontSize: 14, color: '#4A5568', lineHeight: 22, marginBottom: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  detailText: { fontSize: 14, color: '#4A5568', flex: 1 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.secondary, paddingVertical: 12, borderRadius: 10, marginTop: 15
  },
  callBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  
  servicesSection: { paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 15, marginLeft: 5 },
  
  serviceItem: {
    flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#EDF2F7', alignItems: 'center'
  },
  serviceImageContainer: {
    width: 60, height: 60, borderRadius: 10, backgroundColor: '#FFF5F5',
    overflow: 'hidden', marginRight: 15, justifyContent: 'center', alignItems: 'center'
  },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  serviceIconContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  serviceInfo: { flex: 1, paddingRight: 10 },
  serviceName: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  serviceDesc: { fontSize: 13, color: '#718096', marginBottom: 6 },
  servicePrice: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  
  bookItemBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center'
  },
  bookItemBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginTop: 15, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#718096', textAlign: 'center', paddingHorizontal: 40 }
});

export default DriverServiceCenterScreen;
