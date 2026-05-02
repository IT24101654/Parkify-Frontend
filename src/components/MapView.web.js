import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MapView = ({ children, style }) => (
  <View style={[style, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
    <MaterialCommunityIcons name="map-outline" size={48} color="#A0AEC0" />
    <Text style={{ color: '#718096', marginTop: 10, fontWeight: '600' }}>Map View (Native Only)</Text>
    <Text style={{ color: '#A0AEC0', fontSize: 12 }}>Voice assistant can still be tested here.</Text>
    {children}
  </View>
);

export const Marker = () => null;
export const Circle = () => null;
export const UrlTile = () => null;

export default MapView;
