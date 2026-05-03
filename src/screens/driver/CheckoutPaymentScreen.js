import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, Alert, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

const CheckoutPaymentScreen = ({ route, navigation }) => {
  const { reservation, place } = route.params;
  const [selectedMethod, setSelectedMethod] = useState('STRIPE');
  const [processing, setProcessing] = useState(false);
  const [cashSuccess, setCashSuccess] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await api.post(`/reservations/${reservation._id}/pay`, {
        paymentMethod: selectedMethod
      });

      if (selectedMethod === 'CASH') {
        setCashSuccess(true);
      } else {
        const { checkoutUrl } = res.data;
        if (checkoutUrl) {
          // Open Stripe Checkout in phone's default browser
          const supported = await Linking.canOpenURL(checkoutUrl);
          if (supported) {
            await Linking.openURL(checkoutUrl);
            Alert.alert(
              'Payment Initiated',
              'Please complete the payment in your browser. The app will update once payment is successful.',
              [{ text: 'OK', onPress: () => navigation.navigate('DriverReservations') }]
            );
          } else {
            Alert.alert('Error', 'Cannot open payment page.');
          }
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Payment initiation failed.');
    } finally {
      setProcessing(false);
    }
  };

  if (cashSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successContainer}>
          <MaterialCommunityIcons name="check-circle" size={100} color="#16a34a" />
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successDesc}>Your slot has been reserved for Reservation #{reservation._id.slice(-6).toUpperCase()}.</Text>
          
          <View style={styles.cashBox}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#16a34a" />
            <Text style={styles.cashBoxText}>Please pay Rs. {reservation.totalAmount} in cash on arrival at the parking slot.</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('DriverReservations')}
          >
            <Text style={styles.btnPrimaryText}>View My Reservations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2D4057" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Text style={styles.headerSub}>Rs. {reservation.totalAmount}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Choose Payment Method</Text>
        
        <View style={styles.methodsContainer}>
          <TouchableOpacity 
            style={[styles.methodCard, selectedMethod === 'STRIPE' && styles.methodCardSelected]}
            onPress={() => setSelectedMethod('STRIPE')}
          >
            <MaterialCommunityIcons 
              name="credit-card-outline" 
              size={40} 
              color={selectedMethod === 'STRIPE' ? '#B26969' : '#A0AEC0'} 
            />
            <Text style={[styles.methodTitle, selectedMethod === 'STRIPE' && { color: '#B26969' }]}>Pay with Card</Text>
            <Text style={styles.methodDesc}>Secure payment via Stripe</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodCard, selectedMethod === 'CASH' && styles.methodCardSelected]}
            onPress={() => setSelectedMethod('CASH')}
          >
            <MaterialCommunityIcons 
              name="cash-marker" 
              size={40} 
              color={selectedMethod === 'CASH' ? '#B26969' : '#A0AEC0'} 
            />
            <Text style={[styles.methodTitle, selectedMethod === 'CASH' && { color: '#B26969' }]}>Cash on Arrival</Text>
            <Text style={styles.methodDesc}>Pay directly at the slot</Text>
          </TouchableOpacity>
        </View>

        {selectedMethod === 'CASH' && (
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#3182CE" />
            <Text style={styles.infoText}>Please bring the exact amount of Rs. {reservation.totalAmount} in cash.</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payBtn, processing && { opacity: 0.7 }]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.payBtnText}>
              {selectedMethod === 'CASH' ? 'Confirm Cash Booking' : 'Pay Securely with Stripe'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerSub: { fontSize: 14, fontWeight: '700', color: '#B26969' },
  backBtn: { padding: 4 },
  
  content: { padding: 20, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 20 },
  
  methodsContainer: { flexDirection: 'row', gap: 15 },
  methodCard: {
    flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 16,
    alignItems: 'center', borderWidth: 2, borderColor: '#EDF2F7', elevation: 1
  },
  methodCardSelected: { borderColor: '#B26969', backgroundColor: '#FFF5F5' },
  methodTitle: { fontSize: 16, fontWeight: '800', color: '#4A5568', marginTop: 10, marginBottom: 4 },
  methodDesc: { fontSize: 12, color: '#A0AEC0', textAlign: 'center' },
  
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EBF4FF', padding: 15, borderRadius: 12, marginTop: 25,
    borderWidth: 1, borderColor: '#BEE3F8'
  },
  infoText: { flex: 1, fontSize: 14, color: '#2B6CB0', fontWeight: '600' },
  
  footer: {
    backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#EDF2F7', elevation: 10
  },
  payBtn: {
    backgroundColor: '#B26969', paddingVertical: 16, borderRadius: 16, alignItems: 'center'
  },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#16a34a', marginTop: 20, marginBottom: 10 },
  successDesc: { fontSize: 16, color: '#4A5568', textAlign: 'center', marginBottom: 30 },
  cashBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f0fdf4', padding: 20, borderRadius: 16,
    borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 30
  },
  cashBoxText: { flex: 1, fontSize: 15, color: '#166534', fontWeight: '600' },
  btnPrimary: {
    backgroundColor: '#2D4057', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, width: '100%', alignItems: 'center'
  },
  btnPrimaryText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});

export default CheckoutPaymentScreen;
