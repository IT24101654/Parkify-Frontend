import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use your computer's actual IP address so it works on BOTH Emulator and Physical Phone
// Actual Render Backend URL
const PRODUCTION_URL = 'https://parkify-backend-0nwc.onrender.com/api'; 
const LOCAL_URL = 'http://172.20.10.13:5000/api';

// Safe check for Web vs Native
const isWeb = Platform.OS === 'web';
const isProductionWeb = isWeb && typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

const BASE_URL = isProductionWeb || !__DEV__
  ? PRODUCTION_URL 
  : LOCAL_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds
});

/**
 * Robust image URL helper for Web & Mobile
 * @param {string} path - The image path or filename
 * @param {string} type - 'profile', 'parking', 'inventory', 'service'
 */
export const getImageUrl = (path, type = 'profile') => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;

  // Get base URL (remove /api suffix)
  const baseUrl = BASE_URL.replace('/api', '').replace(/\/$/, '');
  
  // Normalize slashes
  const cleanPath = path.replace(/\\/g, '/');
  
  let folder = '';
  switch (type) {
    case 'parking': folder = 'uploads/parking-photos'; break;
    case 'inventory': folder = 'uploads/inventory-photos'; break;
    case 'service': folder = 'uploads/service-photos'; break;
    default: folder = 'uploads/profile-pictures'; // profile is default
  }

  // If path already includes 'uploads', don't add folder
  if (cleanPath.includes('uploads/')) {
    const finalPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    return `${baseUrl}/${finalPath}`;
  }

  const finalPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  return `${baseUrl}/${folder}/${finalPath}`;
};

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
