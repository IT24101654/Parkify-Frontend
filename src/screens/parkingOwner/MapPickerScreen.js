import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Dimensions,
  TextInput, Keyboard, Alert, Platform
} from 'react-native';

import MapView, { Marker, UrlTile } from '../../components/MapView';

import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/theme';

const { width } = Dimensions.get('window');

const MapPickerScreen = ({ navigation, route }) => {
  const { currentLat, currentLng } = route.params || {};

  const initLat = parseFloat(currentLat) || 6.9271;
  const initLng = parseFloat(currentLng) || 79.8612;

  const [markerCoords, setMarkerCoords] = useState({ latitude: initLat, longitude: initLng });
  const [mapRegion, setMapRegion] = useState({
    latitude: initLat, longitude: initLng,
    latitudeDelta: 0.02, longitudeDelta: 0.02,
  });
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);

  const reverseGeocode = useCallback(async (coords) => {
    try {
      const geo = await Location.reverseGeocodeAsync(coords);
      if (geo && geo[0]) {
        const g = geo[0];
        const parts = [g.name, g.street, g.district, g.city].filter(Boolean);
        setAddress(parts.slice(0, 3).join(', '));
      }
    } catch {
      setAddress('');
    }
  }, []);

  const handleMapPress = (event) => {
    const coords = event.nativeEvent.coordinate;
    setMarkerCoords(coords);
    reverseGeocode(coords);
  };

  const handleMarkerDrag = (event) => {
    const coords = event.nativeEvent.coordinate;
    setMarkerCoords(coords);
    reverseGeocode(coords);
  };

  const getMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocating(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      const region = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setMarkerCoords(coords);
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 600);
      reverseGeocode(coords);
    } catch (e) {
      console.error('Location error:', e);
    } finally {
      setLocating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    Keyboard.dismiss();
    try {
      const geo = await Location.geocodeAsync(searchQuery);
      if (geo && geo.length > 0) {
        const coords = { latitude: geo[0].latitude, longitude: geo[0].longitude };
        const region = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
        setMarkerCoords(coords);
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 600);
        reverseGeocode(coords);
      } else {
        Alert.alert("Not Found", "Location not found. Try a more specific address or city name.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to search location.");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    const displayAddress = address || `${markerCoords.latitude.toFixed(5)}, ${markerCoords.longitude.toFixed(5)}`;
    navigation.navigate('AddParkingPlace', {
      ...route.params,
      selectedLocation: {
        lat: markerCoords.latitude,
        lng: markerCoords.longitude,
        address: displayAddress,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pin Location</Text>
          <Text style={styles.headerSub}>Tap the map or drag the pin</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, area, street..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
            {searching ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <MaterialCommunityIcons name="magnify" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          onPress={handleMapPress}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            shouldReplaceMapContent={true}
            flipY={false}
          />
          <Marker
            coordinate={markerCoords}
            draggable
            onDragEnd={handleMarkerDrag}
          >
            <View style={styles.markerWrap}>
              <View style={styles.markerPin}>
                <MaterialCommunityIcons name="parking" size={20} color="#FFF" />
              </View>
              <View style={styles.markerTail} />
            </View>
          </Marker>
        </MapView>

        {/* GPS Button */}
        <TouchableOpacity style={styles.gpsBtn} onPress={getMyLocation} disabled={locating}>
          {locating
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : <MaterialCommunityIcons name="crosshairs-gps" size={24} color={COLORS.primary} />
          }
        </TouchableOpacity>

        {/* Instruction Banner */}
        <View pointerEvents="none" style={styles.banner}>
          <MaterialCommunityIcons name="gesture-tap" size={14} color="#FFF" />
          <Text style={styles.bannerText}>Tap map or drag pin to position</Text>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.coordRow}>
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>LATITUDE</Text>
            <Text style={styles.coordVal}>{markerCoords.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.coordDivider} />
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>LONGITUDE</Text>
            <Text style={styles.coordVal}>{markerCoords.longitude.toFixed(6)}</Text>
          </View>
        </View>

        {address ? (
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.secondary} />
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <MaterialCommunityIcons name="check-circle" size={22} color="#FFF" />
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
        </TouchableOpacity>
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
  headerSub: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },

  mapWrapper: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },

  searchContainer: {
    position: 'absolute', top: 15, left: 15, right: 15,
    flexDirection: 'row', backgroundColor: '#FFF',
    borderRadius: 16, padding: 5,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
    zIndex: 10,
  },
  searchInput: {
    flex: 1, paddingHorizontal: 15, fontSize: 15, color: COLORS.primary, fontWeight: '600'
  },
  searchBtn: {
    backgroundColor: COLORS.secondary,
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center'
  },

  markerWrap: { alignItems: 'center' },
  markerPin: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#FFF',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6
  },
  markerTail: {
    width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: COLORS.secondary, marginTop: -2
  },

  gpsBtn: {
    position: 'absolute', bottom: 20, right: 15,
    backgroundColor: '#FFF', padding: 13, borderRadius: 14,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8
  },

  banner: {
    position: 'absolute', top: 12, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(45,64,87,0.75)', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20
  },
  bannerText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  bottomPanel: {
    backgroundColor: '#FFF', padding: 20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10
  },
  coordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  coordBox: { flex: 1, alignItems: 'center' },
  coordLabel: { fontSize: 10, fontWeight: '800', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: 0.5 },
  coordVal: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginTop: 4 },
  coordDivider: { width: 1, height: 40, backgroundColor: '#EDF2F7' },

  addressRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF9F9', padding: 12, borderRadius: 12,
    marginBottom: 15, borderWidth: 1, borderColor: '#FDE8E8'
  },
  addressText: { flex: 1, fontSize: 13, color: '#4A5568', fontWeight: '600', lineHeight: 18 },

  confirmBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
  },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default MapPickerScreen;
