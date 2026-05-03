import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, SafeAreaView, StatusBar, Modal, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import DriverSidebar from '../../components/DriverSidebar';
import { Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

const DriverReservationsScreen = ({ navigation }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [sidebarAnim] = useState(new Animated.Value(-width));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const toValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reservations/my');
      setReservations(res.data || []);
    } catch (error) {
      console.error('Error fetching driver reservations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const openModal = (res) => {
    setSelectedRes(res);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return '#22543D';
      case 'PENDING': return '#B7791F';
      case 'CANCELLED': return '#C53030';
      default: return '#4A5568';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'CONFIRMED': return '#C6F6D5';
      case 'PENDING': return '#FEEBC8';
      case 'CANCELLED': return '#FED7D7';
      default: return '#E2E8F0';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.resId}>#{item._id?.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.parkingName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="car" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.vehicleNumber} (Slot {item.slotNumber})</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.reservationDate} | {item.startTime} - {item.endTime}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>Payment</Text>
          <Text style={[styles.paymentStatus, item.paymentStatus === 'PAID' ? {color: '#38A169'} : {color: '#D69E2E'}]}>
            {item.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
          </Text>
        </View>
        <Text style={styles.amount}>Rs. {item.totalAmount?.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>My Reservations</Text>
        <TouchableOpacity onPress={fetchReservations} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color="#B26969" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#B26969" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderItem}
          keyExtractor={item => item.id || item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={60} color="#CBD5E0" />
              <Text style={styles.emptyText}>You haven't made any reservations yet.</Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRes && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reservation Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#A0AEC0" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Res ID</Text>
                    <Text style={styles.detailVal}>#{selectedRes._id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailVal}>{selectedRes.parkingName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Slot</Text>
                    <Text style={styles.detailVal}>{selectedRes.slotNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vehicle</Text>
                    <Text style={styles.detailVal}>{selectedRes.vehicleNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Schedule</Text>
                    <Text style={styles.detailVal}>{selectedRes.reservationDate} ({selectedRes.startTime} - {selectedRes.endTime})</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedRes.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedRes.status) }]}>{selectedRes.status}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment</Text>
                    <Text style={[styles.detailVal, selectedRes.paymentStatus === 'PAID' ? {color: '#38A169'} : {color: '#D69E2E'}]}>
                      {selectedRes.paymentStatus}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalVal}>Rs. {selectedRes.totalAmount?.toFixed(2)}</Text>
                  </View>

                  {selectedRes.paymentStatus === 'PENDING' && selectedRes.status !== 'CANCELLED' && (
                    <TouchableOpacity 
                      style={styles.payBtn}
                      onPress={() => {
                        setModalVisible(false);
                        navigation.navigate('CheckoutPayment', {
                          reservation: selectedRes,
                          place: { price: selectedRes.pricePerHour } // Mock place object needed for CheckoutPayment
                        });
                      }}
                    >
                      <Text style={styles.payBtnText}>PROCEED TO PAYMENT</Text>
                      <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resId: { fontSize: 14, fontWeight: '800', color: '#B26969' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  
  cardBody: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDF2F7' },
  paymentBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentLabel: { fontSize: 12, color: '#A0AEC0' },
  paymentStatus: { fontSize: 12, fontWeight: '800' },
  amount: { fontSize: 16, fontWeight: '900', color: '#2D3748' },
  
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 10, fontSize: 15, color: '#A0AEC0', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#2D4057' },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  detailLabel: { fontSize: 14, color: '#718096', fontWeight: '600' },
  detailVal: { fontSize: 14, color: '#2D3748', fontWeight: '700' },
  totalRow: { marginTop: 10, borderBottomWidth: 0 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#2D3748' },
  totalVal: { fontSize: 20, fontWeight: '900', color: '#B26969' },
  
  payBtn: {
    backgroundColor: '#B26969', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 8, marginTop: 25, marginBottom: 15
  },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});

export default DriverReservationsScreen;
