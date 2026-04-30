import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const ParkingOwnerDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  const StatCard = ({ label, value, icon, color }) => (
    <View style={[styles.statCard, SHADOWS.small]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const ActionCard = ({ title, desc, icon, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.actionCard, SHADOWS.medium]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={30} color="#FFF" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDesc}>{desc}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#A0AEC0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{user?.name || 'Parking Owner'}</Text>
          </View>
          <View style={styles.profileCircle}>
            <Text style={styles.initials}>{user?.name?.charAt(0) || 'P'}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Slots" value="24" icon="parking" color="#2D4057" />
          <StatCard label="Earnings" value="Rs. 12k" icon="cash-multiple" color="#27AE60" />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <ActionCard 
            title="Manage Parking Slots" 
            desc="Add, edit or remove slots" 
            icon="garage-open" 
            color="#2D4057"
            onPress={() => {}}
          />
          <ActionCard 
            title="Booking History" 
            desc="View all past and active bookings" 
            icon="calendar-clock" 
            color="#B26969"
            onPress={() => {}}
          />
          
          {user?.ownerServices?.hasInventory && (
            <ActionCard 
              title="Inventory Management" 
              desc="Manage your spare parts and supplies" 
              icon="package-variant-closed" 
              color="#7D8570"
              onPress={() => {}}
            />
          )}

          {user?.ownerServices?.hasServiceCenter && (
            <ActionCard 
              title="Service Center" 
              desc="Manage repair and maintenance requests" 
              icon="tools" 
              color="#E67E22"
              onPress={() => {}}
            />
          )}
        </View>

        {/* Services Tag */}
        <View style={styles.servicesTagContainer}>
           <Text style={styles.tagLabel}>Registered Services:</Text>
           <View style={styles.tagRow}>
              {user?.ownerServices?.hasInventory && (
                <View style={styles.tag}>
                   <MaterialCommunityIcons name="check-circle" size={14} color="#27AE60" />
                   <Text style={styles.tagText}>Inventory</Text>
                </View>
              )}
              {user?.ownerServices?.hasServiceCenter && (
                <View style={styles.tag}>
                   <MaterialCommunityIcons name="check-circle" size={14} color="#27AE60" />
                   <Text style={styles.tagText}>Service Center</Text>
                </View>
              )}
              {!user?.ownerServices?.hasInventory && !user?.ownerServices?.hasServiceCenter && (
                <View style={styles.tag}>
                   <Text style={styles.tagText}>Basic Parking Only</Text>
                </View>
              )}
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: '#7A868E',
    fontWeight: '500',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D4057',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#B26969',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D4057',
  },
  statLabel: {
    fontSize: 12,
    color: '#7A868E',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D4057',
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  actionIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D4057',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#7A868E',
    fontWeight: '500',
  },
  servicesTagContainer: {
    marginTop: 10,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D4057',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D4057',
  },
});

export default ParkingOwnerDashboard;
