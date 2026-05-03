import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

const MapView = React.forwardRef(({ style, region, children, onRegionChangeComplete, onPress }, ref) => {
  const iframeRef = useRef(null);
  const { latitude, longitude } = region || { latitude: 6.9271, longitude: 79.8612 };

  // Use a Leaflet map via CDN inside the iframe to make it interactive
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${latitude}, ${longitude}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var marker = L.marker([${latitude}, ${longitude}], { draggable: true }).addTo(map);

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          window.parent.postMessage({ type: 'onPress', coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } }, '*');
        });

        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          window.parent.postMessage({ type: 'onDragEnd', coordinate: { latitude: pos.lat, longitude: pos.lng } }, '*');
        });

        map.on('moveend', function() {
          var center = map.getCenter();
          window.parent.postMessage({ type: 'onRegionChangeComplete', region: { latitude: center.lat, longitude: center.lng } }, '*');
        });

        window.addEventListener('message', function(event) {
          if (event.data.type === 'animateToRegion') {
            map.flyTo([event.data.region.latitude, event.data.region.longitude], 15);
            marker.setLatLng([event.data.region.latitude, event.data.region.longitude]);
          }
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'onPress' && onPress) {
        onPress({ nativeEvent: { coordinate: event.data.coordinate } });
      } else if (event.data.type === 'onDragEnd' && onPress) {
        // We reuse onPress or handle it specifically
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

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'animateToRegion', region }, '*');
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

export const Marker = ({ coordinate, children }) => null;
export const Circle = () => null;
export const UrlTile = () => null;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default MapView;
