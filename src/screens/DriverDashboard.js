import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONTS, SIZES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

const DriverDashboard = ({ navigation }) => {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{user?.name || 'Driver'}</Text>
          </View>
          <TouchableOpacity onPress={signOut}>
            <Icon name="logout" size={24} color={COLORS.navyDeep} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VehicleList')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="directions-car" size={30} color="#2196F3" />
            </View>
            <Text style={styles.cardTitle}>My Vehicles</Text>
            <Text style={styles.cardDesc}>Manage your registered vehicles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => {}}>
            <View style={[styles.iconContainer, { backgroundColor: '#F1F8E9' }]}>
              <Icon name="local-parking" size={30} color="#4CAF50" />
            </View>
            <Text style={styles.cardTitle}>Find Parking</Text>
            <Text style={styles.cardDesc}>Locate nearby parking slots</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => {}}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="history" size={30} color="#FF9800" />
            </View>
            <Text style={styles.cardTitle}>History</Text>
            <Text style={styles.cardDesc}>View your past bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => {}}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="person" size={30} color="#9C27B0" />
            </View>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardDesc}>Update your account info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    ...FONTS.body,
    color: COLORS.textMuted,
  },
  nameText: {
    ...FONTS.h1,
    color: COLORS.navyDeep,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.cardWhite,
    borderRadius: SIZES.radius,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.navyDeep,
    marginBottom: 5,
  },
  cardDesc: {
    ...FONTS.caption,
    color: COLORS.textMuted,
  },
});

export default DriverDashboard;
