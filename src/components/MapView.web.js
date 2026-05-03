import React from 'react';
import { View, StyleSheet } from 'react-native';

const MapView = React.forwardRef(({ style, region, children, onRegionChangeComplete }, ref) => {
  const { latitude, longitude } = region || { latitude: 6.9271, longitude: 79.8612 };
  
  // Use OpenStreetMap via an iframe for a simple web fallback
  // Alternatively, we could use Leaflet here, but iframe is zero-dependency.
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <View style={[styles.container, style]}>
      <iframe
        src={osmUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        title="Map"
      />
      {/* We can't easily render children (Markers) inside an iframe, 
          but at least the map will be visible. */}
    </View>
  );
});

export const Marker = ({ coordinate, onPress, children }) => {
  // Markers are not easily supported in the iframe fallback
  return null;
};

export const Circle = () => null;
export const UrlTile = () => null;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default MapView;
