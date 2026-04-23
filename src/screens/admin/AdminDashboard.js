import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again.');
        logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
      <MaterialCommunityIcons 
        name={icon} 
        size={60} 
        color={color} 
        style={styles.iconBackground} 
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B26969" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAE3D8" />
      
      {/* Premium Header / Nav Bar */}
      {/* Header removed to use global Top Nav Bar */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#B26969"]} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Hello, Admin</Text>
          <Text style={styles.welcomeSubtitle}>Overview & System Controls</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Users" 
            value={stats?.totalUsers || 0} 
            icon="account-group" 
            color="#798B96" 
          />
          <StatCard 
            title="Total Vehicles" 
            value={stats?.totalVehicles || 0} 
            icon="car-multiple" 
            color="#7D8570" 
          />
          <StatCard 
            title="Active Drivers" 
            value={stats?.stats?.drivers || 0} 
            icon="steering" 
            color="#B26969" 
          />
          <StatCard 
            title="Parking Owners" 
            value={stats?.stats?.owners || 0} 
            icon="home-city" 
            color="#9B8C7B" 
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>System Management</Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, SHADOWS.medium]}
            onPress={() => navigation.navigate('Users')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#798B96' }]}>
              <MaterialCommunityIcons name="account-cog" size={28} color="#FFF" />
            </View>
            <Text style={styles.actionText}>User Handling</Text>
            <Text style={styles.actionDesc}>Manage all system accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, SHADOWS.medium]}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#AE958B' }]}>
              <MaterialCommunityIcons name="account-circle" size={28} color="#FFF" />
            </View>
            <Text style={styles.actionText}>My Profile</Text>
            <Text style={styles.actionDesc}>Edit your admin details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, SHADOWS.medium]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#7D8570' }]}>
              <MaterialCommunityIcons name="bell-ring" size={28} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Notifications</Text>
            <Text style={styles.actionDesc}>View system alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, SHADOWS.medium]}
            onPress={() => logout()}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#2D4057' }]}>
              <MaterialCommunityIcons name="logout" size={28} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Logout</Text>
            <Text style={styles.actionDesc}>Exit admin session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAE3D8',
  },
  navBar: {
    height: 65,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9F4EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B26969',
    letterSpacing: 1,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B26969',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAE3D8',
  },
  scrollContent: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 25,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#B26969',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#798B96',
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#7A868E',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D4057',
  },
  iconBackground: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.05,
  },
  sectionHeader: {
    marginBottom: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D4057',
  },
  titleUnderline: {
    width: 40,
    height: 4,
    backgroundColor: '#B26969',
    marginTop: 6,
    borderRadius: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D4057',
  },
  actionDesc: {
    fontSize: 12,
    color: '#7A868E',
    marginTop: 4,
  },
});

export default AdminDashboard;
