import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="light" backgroundColor="#1E1E1E" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
