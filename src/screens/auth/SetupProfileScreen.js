import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../theme/theme';
import BackButton from '../../components/BackButton';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SetupProfileScreen = ({ route, navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Driver specific fields
  const [driverPreferences, setDriverPreferences] = useState('nearest');
  
  // Owner specific fields
  const [ownerServices, setOwnerServices] = useState({
    hasInventory: false,
    hasServiceCenter: false
  });

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    try {
      const response = await api.put('/auth/complete-profile', {
        driverPreferences: user?.role === 'DRIVER' ? driverPreferences : undefined,
        ownerServices: user?.role === 'PARKING_OWNER' ? ownerServices : undefined
      });
      
      if (user?.role === 'DRIVER') {
        navigation.navigate('VehicleSetup');
      } else {
        await updateUser(response.data.user);
        Alert.alert('Success', 'Profile setup completed!', [
          { text: 'Let\'s Go!' }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDriverPreferences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Your Preference</Text>
      <Text style={styles.sectionSubtitle}>How would you like us to suggest parking slots?</Text>
      
      <View style={styles.preferenceColumn}>
        {[
          { id: 'nearest', label: 'Nearest', icon: 'map-marker-radius' },
          { id: 'cheapest', label: 'Cheapest', icon: 'cash-multiple' },
          { id: 'available', label: 'Available', icon: 'check-circle' }
        ].map((pref) => (
          <TouchableOpacity 
            key={pref.id}
            style={[
              styles.prefCard, 
              driverPreferences === pref.id && styles.prefCardSelected
            ]}
            onPress={() => setDriverPreferences(pref.id)}
          >
            <MaterialCommunityIcons 
              name={pref.icon} 
              size={30} 
              color={driverPreferences === pref.id ? '#FFF' : '#7A868E'} 
            />
            <Text style={[
              styles.prefLabel, 
              driverPreferences === pref.id && styles.prefLabelSelected
            ]}>{pref.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOwnerServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Additional Services</Text>
      <Text style={styles.sectionSubtitle}>What additional facilities do you offer at your location?</Text>
      
      <View style={styles.serviceRow}>
        <TouchableOpacity 
          style={[styles.serviceCard, ownerServices.hasInventory && styles.serviceCardSelected]}
          onPress={() => setOwnerServices({ ...ownerServices, hasInventory: !ownerServices.hasInventory })}
        >
          <View style={[styles.iconBox, ownerServices.hasInventory && styles.iconBoxSelected]}>
            <MaterialCommunityIcons 
                name="package-variant-closed" 
                size={28} 
                color={ownerServices.hasInventory ? '#FFF' : '#2D4057'} 
            />
          </View>
          <View style={styles.serviceText}>
            <Text style={[styles.serviceLabel, ownerServices.hasInventory && styles.serviceLabelSelected]}>Inventory Management</Text>
            <Text style={styles.serviceDesc}>Offer spare parts and supplies</Text>
          </View>
          <MaterialCommunityIcons 
             name={ownerServices.hasInventory ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
             size={24} 
             color={ownerServices.hasInventory ? '#FFF' : '#A0AEC0'} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.serviceCard, ownerServices.hasServiceCenter && styles.serviceCardSelected]}
          onPress={() => setOwnerServices({ ...ownerServices, hasServiceCenter: !ownerServices.hasServiceCenter })}
        >
          <View style={[styles.iconBox, ownerServices.hasServiceCenter && styles.iconBoxSelected]}>
            <MaterialCommunityIcons 
                name="tools" 
                size={28} 
                color={ownerServices.hasServiceCenter ? '#FFF' : '#2D4057'} 
            />
          </View>
          <View style={styles.serviceText}>
            <Text style={[styles.serviceLabel, ownerServices.hasServiceCenter && styles.serviceLabelSelected]}>Service Center</Text>
            <Text style={styles.serviceDesc}>Vehicle repair and maintenance</Text>
          </View>
          <MaterialCommunityIcons 
             name={ownerServices.hasServiceCenter ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
             size={24} 
             color={ownerServices.hasServiceCenter ? '#FFF' : '#A0AEC0'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => logout()} style={{ marginLeft: -10, marginTop: -20, marginBottom: 20 }} />
        
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/Parkify.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Just one more step to customize your experience as a {user?.role === 'DRIVER' ? 'Driver' : 'Parking Owner'}</Text>
        </View>

        {user?.role === 'DRIVER' ? renderDriverPreferences() : renderOwnerServices()}

        <TouchableOpacity 
          style={[styles.completeBtn, SHADOWS.medium]}
          onPress={handleCompleteSetup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.btnContent}>
              <Text style={styles.completeBtnText}>Finalize Setup</Text>
              <MaterialCommunityIcons name="arrow-right" size={24} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 30,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D4057',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7A868E',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D4057',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7A868E',
    marginBottom: 20,
    fontWeight: '500',
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
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D4057',
    fontWeight: '600',
  },
  preferenceColumn: {
    gap: 15,
  },
  prefCard: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EDF2F7',
    gap: 15,
  },
  prefCardSelected: {
    backgroundColor: '#B26969',
    borderColor: '#B26969',
  },
  prefLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A868E',
  },
  prefLabelSelected: {
    color: '#FFF',
  },
  serviceRow: {
    gap: 15,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EDF2F7',
    gap: 15,
  },
  serviceCardSelected: {
    backgroundColor: '#2D4057',
    borderColor: '#2D4057',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  serviceText: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D4057',
    marginBottom: 2,
  },
  serviceLabelSelected: {
    color: '#FFF',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#7A868E',
    fontWeight: '500',
  },
  completeBtn: {
    backgroundColor: '#2D4057',
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default SetupProfileScreen;
