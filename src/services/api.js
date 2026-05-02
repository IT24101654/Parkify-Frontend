import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's actual IP address so it works on BOTH Emulator and Physical Phone
// Replace with your actual Render Backend URL after deployment
const PRODUCTION_URL = 'https://parkify-backend-xxxx.onrender.com/api'; 
const LOCAL_URL = 'http://172.20.10.13:5000/api';

const BASE_URL = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') 
  ? PRODUCTION_URL 
  : LOCAL_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
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
