import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use your computer's actual IP address so it works on BOTH Emulator and Physical Phone
// Actual Render Backend URL
const PRODUCTION_URL = 'https://parkify-backend-0mwc.onrender.com/api'; 
const LOCAL_URL = 'http://172.20.10.13:5000/api';

// Safe check for Web vs Native
const isWeb = Platform.OS === 'web';
const isProductionWeb = isWeb && typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

const BASE_URL = isProductionWeb || !__DEV__
  ? PRODUCTION_URL 
  : LOCAL_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
