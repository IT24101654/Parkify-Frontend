import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import api from '../../services/api';

const ManageUsers = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(text.toLowerCase()) || 
        user.email.toLowerCase().includes(text.toLowerCase()) ||
        user.role.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${userId}`);
              fetchUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={[styles.userCard, SHADOWS.small]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'SUPER_ADMIN' ? '#2D4057' : '#B26969' }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '15' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>
      {item.role !== 'SUPER_ADMIN' && (
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => handleDeleteUser(item._id, item.name)}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={22} color="#E74C3C" />
        </TouchableOpacity>
      )}
    </View>
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return '#2D4057';
      case 'PARKING_OWNER': return '#7D8570';
      case 'DRIVER': return '#B26969';
      default: return '#7A868E';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header matching Dashboard */}
      {/* Global Top Nav Bar used instead */}

      <View style={styles.content}>
        <View style={[styles.searchBar, SHADOWS.small]}>
          <MaterialCommunityIcons name="magnify" size={22} color="#7A868E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or role..."
            placeholderTextColor="#A0AEC0"
            value={search}
            onChangeText={handleSearch}
          />
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#B26969" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-search-outline" size={60} color="#CBD5E0" />
                <Text style={styles.emptyText}>No users found</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    borderRadius: 14,
    height: 55,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2D4057',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  details: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D4057',
  },
  userEmail: {
    fontSize: 13,
    color: '#7A868E',
    marginTop: 2,
    fontWeight: '500',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 10,
    backgroundColor: '#F9F4F4',
    borderRadius: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#7A868E',
    fontWeight: '600',
    marginTop: 15,
  },
});

export default ManageUsers;
