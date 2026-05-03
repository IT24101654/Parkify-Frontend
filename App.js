import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import api from './src/services/api';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Warm up the backend to reduce cold start impact
    const wakeUp = async () => {
      try {
        await api.get('/auth/profile');
      } catch (e) {
        // Ignore error, we just want to ping the server
      }
    };
    wakeUp();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="light" backgroundColor="#1E1E1E" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    width: Platform.OS === 'web' ? '100vw' : '100%',
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
    position: 'relative'
  },

});
