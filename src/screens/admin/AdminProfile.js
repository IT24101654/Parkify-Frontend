import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminProfile = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    nicNumber: '',
    profilePicture: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/admin/profile');
      setProfile(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfile({ ...profile, profilePicture: base64Image });
    }
  };

  const handleUpdate = async () => {
    if (!profile.name || !profile.email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put('/admin/profile', profile);
      setProfile(response.data);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const InputField = ({ label, value, onChangeText, icon, keyboardType = 'default' }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name={icon} size={20} color="#7A868E" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={`Enter ${label}`}
          placeholderTextColor="#A0AEC0"
        />
      </View>
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
      {/* Global Top Nav Bar used instead */}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, SHADOWS.medium]}>
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editAvatarBtn} 
              activeOpacity={0.8}
              onPress={pickImage}
            >
              <MaterialCommunityIcons name="camera-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.roleTag}>
             <Text style={styles.profileRole}>SUPER ADMIN</Text>
          </View>
        </View>

        <View style={[styles.formCard, SHADOWS.medium]}>
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Account Details</Text>
             <View style={styles.titleUnderline} />
          </View>

          <InputField 
            label="Full Name" 
            value={profile.name} 
            onChangeText={(text) => setProfile({ ...profile, name: text })}
            icon="account-outline"
          />
          <InputField 
            label="Email Address" 
            value={profile.email} 
            onChangeText={(text) => setProfile({ ...profile, email: text })}
            icon="email-outline"
            keyboardType="email-address"
          />
          <InputField 
            label="Phone Number" 
            value={profile.phoneNumber} 
            onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
            icon="phone-outline"
            keyboardType="phone-pad"
          />
          <InputField 
            label="Address" 
            value={profile.address} 
            onChangeText={(text) => setProfile({ ...profile, address: text })}
            icon="map-marker-outline"
          />
          <InputField 
            label="NIC Number" 
            value={profile.nicNumber} 
            onChangeText={(text) => setProfile({ ...profile, nicNumber: text })}
            icon="card-account-details-outline"
          />

          <TouchableOpacity 
            style={[styles.updateBtn, SHADOWS.small]}
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.updateBtnText}>Save Changes</Text>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={() => logout()}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#E74C3C" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAE3D8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAE3D8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 5,
    backgroundColor: '#FFF',
    position: 'relative',
    marginBottom: 15,
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#2D4057',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#B26969',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D4057',
  },
  roleTag: {
    backgroundColor: 'rgba(125, 133, 112, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  profileRole: {
    fontSize: 12,
    color: '#7D8570',
    fontWeight: '800',
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
  },
  sectionHeader: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D4057',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
    paddingHorizontal: 15,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D4057',
    fontWeight: '600',
  },
  updateBtn: {
    backgroundColor: '#2D4057',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    padding: 15,
    gap: 10,
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default AdminProfile;
