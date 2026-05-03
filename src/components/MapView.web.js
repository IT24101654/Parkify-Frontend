import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// Helper to convert React children to marker data for Leaflet
const extractMarkers = (children) => {
  const markers = [];
  React.Children.forEach(children, child => {
    if (child && child.type && (child.type.name === 'Marker' || child.type.displayName === 'Marker' || child.props.coordinate)) {
      markers.push({
        latitude: child.props.coordinate.latitude,
        longitude: child.props.coordinate.longitude,
        title: child.props.title || '',
        description: child.props.description || ''
      });
    }
  });
  return markers;
};

const MapView = React.forwardRef(({ style, region, children, onRegionChangeComplete, onPress }, ref) => {
  const iframeRef = useRef(null);
  const initialRegion = region || { latitude: 6.9271, longitude: 79.8612 };
  
  const markers = useMemo(() => extractMarkers(children), [children]);

  const mapHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background: #f0f0f0; }
        #map { height: 100vh; width: 100vw; }
        .custom-marker { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${initialRegion.latitude}, ${initialRegion.longitude}], 13);
        L.control.zoom({ position: 'topright' }).addTo(map);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var markers = [];
        var activeMarker = null;

        function clearMarkers() {
          markers.forEach(m => map.removeLayer(m));
          markers = [];
        }

        function addMarkers(markerList) {
          clearMarkers();
          markerList.forEach(m => {
            var leafletMarker = L.marker([m.latitude, m.longitude]).addTo(map);
            if (m.title) leafletMarker.bindPopup("<b>" + m.title + "</b><br>" + (m.description || ''));
            markers.push(leafletMarker);
          });
        }

        // Initial markers
        addMarkers(${JSON.stringify(markers)});

        map.on('click', function(e) {
          window.parent.postMessage({ type: 'onPress', coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } }, '*');
        });

        map.on('moveend', function() {
          var center = map.getCenter();
          window.parent.postMessage({ type: 'onRegionChangeComplete', region: { latitude: center.lat, longitude: center.lng } }, '*');
        });

        window.addEventListener('message', function(event) {
          if (event.data.type === 'animateToRegion') {
            map.flyTo([event.data.region.latitude, event.data.region.longitude], 15);
          } else if (event.data.type === 'updateMarkers') {
            addMarkers(event.data.markers);
          }
        });
      </script>
    </body>
    </html>
  `, [initialRegion.latitude, initialRegion.longitude]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'onPress' && onPress) {
        onPress({ nativeEvent: { coordinate: event.data.coordinate } });
      } else if (event.data.type === 'onRegionChangeComplete' && onRegionChangeComplete) {
        onRegionChangeComplete({
          latitude: event.data.region.latitude,
          longitude: event.data.region.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPress, onRegionChangeComplete]);

  // Update markers when children change
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'updateMarkers', markers }, '*');
  }, [markers]);

  React.useImperativeHandle(ref, () => ({
    animateToRegion: (reg) => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'animateToRegion', region: reg }, '*');
    }
  }));

  return (
    <View style={[styles.container, style]}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        title="Interactive Map"
      />
    </View>
  );
});

export const Marker = ({ coordinate, title, description, children }) => null;
export const Circle = () => null;
export const UrlTile = () => null;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    backgroundColor: '#f0f0f0'
  },
});

export default MapView;
