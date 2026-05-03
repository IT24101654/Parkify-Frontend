import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
  StatusBar,
  ScrollView,
  PanResponder,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DriverSidebar from '../../components/DriverSidebar';

import MapView, { Marker, Circle, UrlTile } from '../../components/MapView';

import * as Location from 'expo-location';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Haversine formula to calculate distance in KM
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ParkingSlotsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [parkingPlaces, setParkingPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const mapRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(height)).current;

  const fetchParkingPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/parking');
      const processed = (res.data || []).map(p => ({
        ...p,
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude)
      }));
      setParkingPlaces(processed);
      setFilteredPlaces(processed);
    } catch (error) {
      console.error('Error fetching parking places:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    let location = await Location.getCurrentPositionAsync({});
    const loc = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setUserLocation(loc);
    setMapRegion({
      ...loc,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  useEffect(() => {
    fetchParkingPlaces();
    requestLocation();
  }, [fetchParkingPlaces]);

  // Handle auto selection from AI Assistant
  useEffect(() => {
    if (navigation && navigation.getState) {
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];
      if (currentRoute?.params?.autoSelectPlace && parkingPlaces.length > 0) {
        // Find matching place in fetched data or use the passed object directly
        const autoPlace = parkingPlaces.find(p => p._id === currentRoute.params.autoSelectPlace._id) || currentRoute.params.autoSelectPlace;
        setTimeout(() => handleMarkerPress(autoPlace), 500);
        
        // Clear param so it doesn't reopen continuously if we close it
        navigation.setParams({ autoSelectPlace: undefined });
      }
    }
  }, [parkingPlaces, navigation]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = parkingPlaces.filter(p =>
      p.parkingName?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
    setFilteredPlaces(filtered);
  }, [searchQuery, parkingPlaces]);

  const handleMarkerPress = (place) => {
    setSelectedPlace(place);
    Animated.spring(cardAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();

    setMapRegion({
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const closeDetails = () => {
    Animated.timing(cardAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true
    }).start(() => setSelectedPlace(null));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only allow downward swipes
        return gestureState.dy > 10;
      },
      onPanResponderMove: Animated.event(
        [null, { dy: cardAnim }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1.5) {
          closeDetails();
        } else {
          Animated.spring(cardAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8
          }).start();
        }
      }
    })
  ).current;

  const getDistanceLabel = (place) => {
    if (!userLocation || !place.latitude || !place.longitude) return '...';
    const d = getDistanceKm(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude);
    return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;

    let baseUrl = api.defaults.baseURL;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    } else if (baseUrl.endsWith('/api/')) {
      baseUrl = baseUrl.slice(0, -5);
    }

    // Parking images are in uploads/parking-photos/
    // If the imagePath already contains the folder, use it, otherwise prepend
    const cleanPath = imagePath.replace(/\\/g, '/');
    const finalPath = cleanPath.includes('uploads/') 
      ? cleanPath 
      : `uploads/parking-photos/${cleanPath}`;
    
    // Avoid double slashes
    const pathPart = finalPath.startsWith('/') ? finalPath.slice(1) : finalPath;
    
    return `${baseUrl}/${pathPart}`;
  };

  const [failedImages, setFailedImages] = useState({});

  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => handleMarkerPress(item)}
    >
      <Image
        source={(item.placeImage && !failedImages[item._id]) ? { uri: getImageUrl(item.placeImage) } : require('../../../assets/Parkify.png')}
        style={styles.placeImage}
        onError={() => setFailedImages(prev => ({...prev, [item._id]: true}))}
      />
      <View style={styles.placeInfo}>
        <View style={styles.placeHeader}>
          <Text style={styles.placeName} numberOfLines={1}>{item.parkingName}</Text>
          <Text style={styles.distanceText}>{getDistanceLabel(item)}</Text>
        </View>
        <Text style={styles.placeAddress} numberOfLines={1}>{item.address || item.location}</Text>
        <View style={styles.placeFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceVal}>Rs.{item.price}</Text>
            <Text style={styles.priceUnit}>/hr</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? '#C6F6D5' : '#FED7D7' }]}>
            <Text style={[styles.statusText, { color: item.status === 'ACTIVE' ? '#22543D' : '#822727' }]}>
              {item.status === 'ACTIVE' ? 'Available' : 'Full'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Driver Sidebar */}
      <DriverSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.backBtn}>
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Parking</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={24} color="#A0AEC0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, address or name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#A0AEC0" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            shouldReplaceMapContent={true}
            flipY={false}
          />
          {filteredPlaces.map(place => (
            <Marker
              key={place._id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              onPress={() => handleMarkerPress(place)}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.markerPin, { backgroundColor: place.status === 'ACTIVE' ? '#27ae60' : '#e74c3c' }]}>
                  <MaterialCommunityIcons name="car-brake-parking" size={16} color="#FFF" />
                </View>
                <View style={[styles.markerArrow, { borderTopColor: place.status === 'ACTIVE' ? '#27ae60' : '#e74c3c' }]} />
              </View>
            </Marker>
          ))}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={1000}
              fillColor="rgba(52, 152, 219, 0.1)"
              strokeColor="rgba(52, 152, 219, 0.3)"
            />
          )}
        </MapView>

        {/* GPS Button */}
        <TouchableOpacity style={styles.gpsBtn} onPress={requestLocation}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#2D4057" />
        </TouchableOpacity>
      </View>

      {/* List View */}
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Parking Places</Text>
          <Text style={styles.countText}>{filteredPlaces.length} results</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#B26969" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredPlaces}
            renderItem={renderPlaceItem}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: 20, paddingTop: 0 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="map-marker-off" size={60} color="#E2E8F0" />
                <Text style={styles.emptyText}>No parking places found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Details Card (Animated) */}
      {selectedPlace && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.detailsCard, { transform: [{ translateY: cardAnim }] }]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={closeDetails} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#A0AEC0" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Image
              source={(selectedPlace.placeImage && !failedImages[selectedPlace._id]) ? { uri: getImageUrl(selectedPlace.placeImage) } : require('../../../assets/Parkify.png')}
              style={styles.cardImage}
              onError={() => setFailedImages(prev => ({...prev, [selectedPlace._id]: true}))}
            />

            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{selectedPlace.parkingName}</Text>
                  <Text style={styles.cardSubtitle}>{selectedPlace.type || 'Standard'} Parking</Text>
                </View>
                <View style={[styles.statusBadgeLarge, { backgroundColor: selectedPlace.status === 'ACTIVE' ? '#C6F6D5' : '#FED7D7' }]}>
                  <Text style={[styles.statusTextLarge, { color: selectedPlace.status === 'ACTIVE' ? '#22543D' : '#822727' }]}>
                    {selectedPlace.status === 'ACTIVE' ? 'Available' : 'Full'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#B26969" />
                  <View>
                    <Text style={styles.detailLabel}>Location ({getDistanceLabel(selectedPlace)})</Text>
                    <Text style={styles.detailVal}>{selectedPlace.location || selectedPlace.address}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#B26969" />
                  <View>
                    <Text style={styles.detailLabel}>Hours</Text>
                    <Text style={styles.detailVal}>{selectedPlace.is24Hours ? '24/7 Open' : `${selectedPlace.openHours} - ${selectedPlace.closeHours}`}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="cash" size={20} color="#B26969" />
                  <View>
                    <Text style={styles.detailLabel}>Pricing (Rs.)</Text>
                    <Text style={styles.detailVal}>Hr: {selectedPlace.price} | Day: {selectedPlace.dailyPrice || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="garage" size={20} color="#B26969" />
                  <View>
                    <Text style={styles.detailLabel}>Capacity</Text>
                    <Text style={styles.detailVal}>{selectedPlace.slots} Total Slots</Text>
                  </View>
                </View>
              </View>

              {selectedPlace.description && (
                <View style={styles.descCard}>
                  <MaterialCommunityIcons name="information-outline" size={20} color="#718096" />
                  <Text style={styles.descText}>{selectedPlace.description}</Text>
                </View>
              )}

              <View style={styles.featureRow}>
                {selectedPlace.hasInventory && (
                  <TouchableOpacity
                    style={[styles.featureBadge, { backgroundColor: '#EBF4FF', borderColor: '#BEE3F8', borderWidth: 1 }]}
                    onPress={() => {
                      const placeId = selectedPlace._id || selectedPlace.id;
                      navigation.navigate('DriverInventory', { placeId: placeId, parkingName: selectedPlace.parkingName });
                    }}
                  >
                    <MaterialCommunityIcons name="package-variant-closed" size={16} color="#3182CE" />
                    <Text style={[styles.featureText, { color: '#2B6CB0', fontWeight: '700' }]}>Inventory</Text>
                  </TouchableOpacity>
                )}
                {selectedPlace.hasServiceCenter && (
                  <TouchableOpacity
                    style={[styles.featureBadge, { backgroundColor: '#E6FFFA', borderColor: '#B2F5EA', borderWidth: 1 }]}
                    onPress={() => {
                      const placeId = selectedPlace._id || selectedPlace.id;
                      navigation.navigate('DriverServiceCenter', { placeId: placeId, parkingName: selectedPlace.parkingName });
                    }}
                  >
                    <MaterialCommunityIcons name="tools" size={16} color="#319795" />
                    <Text style={[styles.featureText, { color: '#285E61', fontWeight: '700' }]}>Service Center</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => navigation.navigate('SelectSlot', { place: selectedPlace })}
              >
                <MaterialCommunityIcons name="calendar-check" size={24} color="#FFF" />
                <Text style={styles.bookBtnText}>VIEW & BOOK SLOTS</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2D4057' },
  backBtn: { padding: 4 },

  searchContainer: { padding: 15, backgroundColor: '#FFF' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#2D3748' },

  mapContainer: { height: height * 0.35, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  gpsBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },

  markerContainer: { alignItems: 'center' },
  markerPin: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2
  },

  listSection: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFF', marginTop: -20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748' },
  countText: { fontSize: 13, color: '#A0AEC0', fontWeight: '600' },

  placeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F7FAFC'
  },
  placeImage: { width: 90, height: 90, borderRadius: 16 },
  placeInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  placeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  placeName: { fontSize: 16, fontWeight: '800', color: '#2D3748', flex: 1 },
  distanceText: { fontSize: 12, color: '#B26969', fontWeight: '700' },
  placeAddress: { fontSize: 13, color: '#718096', marginTop: 4 },
  placeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  priceVal: { fontSize: 16, fontWeight: '900', color: '#ED8936' },
  priceUnit: { fontSize: 11, color: '#A0AEC0', fontWeight: '600', marginLeft: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#A0AEC0', marginTop: 15, fontSize: 16, fontWeight: '600' },

  detailsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    height: height * 0.85,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    zIndex: 1000
  },
  cardHeader: { alignItems: 'center', paddingVertical: 15 },
  handle: { width: 50, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10 },
  closeBtn: { position: 'absolute', right: 25, top: 15, padding: 5 },
  cardImage: { width: width, height: 200, marginTop: 0, borderRadius: 20 },
  cardContent: { padding: 20, paddingTop: 20, paddingBottom: 60 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 24, fontWeight: '900', color: '#2D3748' },
  cardSubtitle: { fontSize: 15, color: '#A0AEC0', fontWeight: '700', marginTop: 4 },
  statusBadgeLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusTextLarge: { fontSize: 12, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F7FAFC', marginVertical: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailItem: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detailLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '700', textTransform: 'uppercase' },
  detailVal: { fontSize: 12, color: '#4A5568', fontWeight: '800', marginTop: 5 },
  descCard: { flexDirection: 'row', gap: 10, backgroundColor: '#F7FAFC', padding: 12, borderRadius: 15, marginBottom: 15 },
  descText: { flex: 1, fontSize: 14, color: '#718096', lineHeight: 20 },
  featureRow: { flexDirection: 'row', gap: 12, marginBottom: 20, justifyContent: 'space-between' },
  featureBadge: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  featureText: { fontSize: 14, fontWeight: '800', color: '#4A5568' },
  bookBtn: {
    backgroundColor: '#B26969',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#B26969',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    marginTop: 10,
    marginBottom: 20
  },
  bookBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 }
});

export default ParkingSlotsScreen;
