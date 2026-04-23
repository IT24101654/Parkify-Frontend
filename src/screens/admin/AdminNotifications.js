import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import api from '../../services/api';

const AdminNotifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.isRead && styles.unreadCard, SHADOWS.small]}
      onPress={() => !item.isRead && handleMarkAsRead(item._id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '15' }]}>
        <MaterialCommunityIcons name={getIconName(item.type)} size={26} color={getIconColor(item.type)} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.message, !item.isRead && styles.unreadText]}>{item.message}</Text>
        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="clock-outline" size={12} color="#7A868E" />
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const getIconName = (type) => {
    switch (type) {
      case 'USER_REGISTRATION': return 'account-plus';
      case 'VEHICLE_ADDED': return 'car-side';
      default: return 'bell-ring';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'USER_REGISTRATION': return '#798B96';
      case 'VEHICLE_ADDED': return '#7D8570';
      default: return '#B26969';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Premium NavBar */}
      {/* Global Top Nav Bar used instead */}

      <View style={styles.mainContent}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#B26969" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.listHeader}>
                <Text style={styles.headerTitle}>Recent Alerts</Text>
                <View style={styles.titleUnderline} />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={80} color="#CBD5E0" />
                <Text style={styles.emptyText}>All caught up!</Text>
                <Text style={styles.emptySubText}>No new notifications found</Text>
              </View>
            }
          />
        )}
      </View>
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
  backBtn: {
    padding: 5,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B26969',
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D4057',
  },
  titleUnderline: {
    width: 35,
    height: 4,
    backgroundColor: '#B26969',
    marginTop: 6,
    borderRadius: 2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  unreadCard: {
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    borderLeftColor: '#B26969',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
    fontWeight: '500',
  },
  unreadText: {
    fontWeight: '700',
    color: '#2D4057',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  time: {
    fontSize: 12,
    color: '#7A868E',
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B26969',
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    color: '#2D4057',
    fontWeight: '800',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#7A868E',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default AdminNotifications;
