import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, SafeAreaView, StatusBar, Modal, TextInput, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import DriverSidebar from '../../components/DriverSidebar';
import { Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

const DriverPaymentsScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('');

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/my-payments');
      setPayments(res.data || []);
    } catch (error) {
      console.error('Error fetching driver payments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the refund.');
      return;
    }
    try {
      await api.post('/payments/request-refund', {
        paymentId: selectedPayment,
        reason: refundReason
      });
      Alert.alert('Success', 'Refund request submitted successfully.');
      setModalVisible(false);
      setRefundReason('');
      fetchPayments();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to request refund');
    }
  };

  const renderItem = ({ item }) => {
    const isPaid = item.status === 'PAID';
    const isRefunded = item.status === 'REFUNDED';
    const isRefundRequested = item.status === 'REFUND_REQUESTED';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons 
              name={isRefunded ? "refresh-circle" : (isPaid ? "check-circle" : "cash-clock")} 
              size={24} 
              color={isRefunded ? "#B26969" : (isPaid ? "#38A169" : "#D69E2E")} 
            />
          </View>
          <View style={styles.headerTextInfo}>
            <Text style={styles.parkingName}>{item.parkingName}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.amount}>Rs. {item.amount?.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reservation ID</Text>
            <Text style={styles.infoVal}>#{item.reservationId?.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoVal, { color: isPaid ? '#38A169' : (isRefunded ? '#B26969' : (isRefundRequested ? '#D69E2E' : '#718096')) }]}>
              {item.status} ({item.paymentMethod})
            </Text>
          </View>

          {isPaid && (
            <TouchableOpacity 
              style={styles.refundBtn} 
              onPress={() => {
                setSelectedPayment(item.id);
                setModalVisible(true);
              }}
            >
              <Text style={styles.refundBtnText}>Request Refund</Text>
            </TouchableOpacity>
          )}

          {isRefundRequested && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={styles.reasonText}>{item.refundReason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Driver Sidebar */}
      <DriverSidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        sidebarAnim={sidebarAnim} 
        navigation={navigation} 
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.backBtn}>
          <MaterialCommunityIcons name="menu" size={28} color="#2D4057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Payments</Text>
        <TouchableOpacity onPress={fetchPayments} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color="#B26969" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#B26969" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={payments}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="wallet-outline" size={60} color="#CBD5E0" />
              <Text style={styles.emptyText}>No payment history found.</Text>
            </View>
          }
        />
      )}

      {/* Refund Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Refund</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reason for refund..."
              multiline
              numberOfLines={4}
              value={refundReason}
              onChangeText={setRefundReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleRequestRefund}>
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', elevation: 2
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2D4057' },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  
  listContent: { padding: 15, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 15,
    borderWidth: 1, borderColor: '#EDF2F7', elevation: 1
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F7FAFC', paddingBottom: 15 },
  iconBox: { 
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F7FAFC',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  headerTextInfo: { flex: 1 },
  parkingName: { fontSize: 16, fontWeight: '800', color: '#2D3748' },
  dateText: { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '900', color: '#2D3748' },
  
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#718096', fontWeight: '500' },
  infoVal: { fontSize: 14, color: '#2D3748', fontWeight: '700' },
  
  refundBtn: {
    backgroundColor: '#B26969', paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', marginTop: 15
  },
  refundBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  reasonBox: { backgroundColor: '#FFF5F5', padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#FED7D7' },
  reasonLabel: { fontSize: 12, fontWeight: '800', color: '#B26969', marginBottom: 4 },
  reasonText: { fontSize: 13, color: '#2D3748', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 15 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 10, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  cancelBtn: { padding: 10 },
  cancelBtnText: { fontSize: 15, color: '#718096', fontWeight: '700' },
  submitBtn: { backgroundColor: '#B26969', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, fontSize: 15, color: '#A0AEC0', fontWeight: '600' }
});

export default DriverPaymentsScreen;
