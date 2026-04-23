import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';

const { width } = Dimensions.get('window');

const features = [
  { icon: 'map', title: 'Parking Place', desc: 'Real-time slot monitoring and dynamic pricing.' },
  { icon: 'event-available', title: 'Reservations', desc: 'Instant booking with automated slot hold system.' },
  { icon: 'psychology', title: 'AI Assistant', desc: 'Personalized recommendations based on patterns.' },
  { icon: 'payments', title: 'Payments', desc: 'Secure digital billing and automated transactions.' },
  { icon: 'inventory', title: 'Inventory', desc: 'Track stock levels and automate maintenance alerts.' },
  { icon: 'build', title: 'Vehicle Service', desc: 'Manage appointments and view service history.' }
];

const WelcomeScreen = ({ navigation }) => {
  const [typedTitle1, setTypedTitle1] = React.useState('');
  const [typedTitle2, setTypedTitle2] = React.useState('');

  const fullTitle1 = "Empowering Cities with";
  const fullTitle2 = "Smart Parking";

  React.useEffect(() => {
    let index1 = 0;
    let index2 = 0;

    const typeNext1 = () => {
      if (index1 <= fullTitle1.length) {
        setTypedTitle1(fullTitle1.substring(0, index1));
        index1++;
        setTimeout(typeNext1, 70);
      } else {
        typeNext2();
      }
    };

    const typeNext2 = () => {
      if (index2 <= fullTitle2.length) {
        setTypedTitle2(fullTitle2.substring(0, index2));
        index2++;
        setTimeout(typeNext2, 100);
      }
    };

    typeNext1();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Section */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1000' }}
          style={styles.heroSection}
          blurRadius={5} // Added blur for better readability
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.heroContent}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>⚡ PARKIFY AI ENGINE v2.0 LIVE</Text>
                </View>

                <View style={styles.logoRow}>
                  <Image
                    source={require('../../../assets/Parkify.png')}
                    style={styles.logoMini}
                    resizeMode="contain"
                  />
                  <Text style={styles.logoBrand}>PARKIFY</Text>
                </View>

                <Text style={styles.heroTitle}>{typedTitle1}{'\n'}
                  <Text style={styles.heroTitleHighlight}>{typedTitle2}</Text>
                </Text>
                <Text style={styles.heroSubtitle}>
                  The world's most advanced AI-Based management system. Reduce congestion and maximize occupancy in real-time.
                </Text>

                <View style={styles.heroButtons}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.registerBtn}
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={styles.registerBtnText}>Register Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.loginBtn}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.loginBtnText}>Log In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>


        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Our Smart Solutions</Text>
          <View style={styles.grid}>
            {features.map((item, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.iconWrapper}>
                  <MaterialIcons name={item.icon} size={30} color="#AE8E82" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialIcons name="garage" size={40} color={COLORS.white} />
          <Text style={styles.footerText}>© 2026 Parkify AI Solutions.</Text>
          <Text style={styles.footerSub}>Leading the way in Smart Infrastructure.</Text>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroSection: {
    width: '100%',
    height: 650,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.50)', // Reduced darkness as requested
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  heroContent: {
    padding: SPACING.xl,
    alignItems: 'center', // Center everything
    justifyContent: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoMini: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  logoBrand: {
    fontSize: 30, // Much larger brand name
    fontWeight: '900',
    color: '#b26969', // Updated to requested color
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 46,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 54,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  heroTitleHighlight: {
    color: '#AE8E82', // Updated to requested color
  },

  heroSubtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 26,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    paddingHorizontal: 10,
  },
  registerBtn: {
    backgroundColor: '#b26969',
    paddingVertical: 18,
    borderRadius: 15,
    flex: 1,
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 8,
  },
  registerBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  loginBtn: {
    backgroundColor: '#2D4057',
    paddingVertical: 18,
    borderRadius: 15,
    flex: 1,
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 8,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  featuresSection: {
    padding: SPACING.xl,
    marginTop: -40,
    backgroundColor: '#FCF8F5',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D4057',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  featureCard: {
    backgroundColor: COLORS.white,
    width: (width - SPACING.xl * 2 - 15) / 2,
    padding: 20,
    borderRadius: 24,
    ...SHADOWS.small,
    marginBottom: 5,
  },
  iconWrapper: {
    backgroundColor: '#FDF7F2',
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D4057',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#7A868E',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#2D4057',
    padding: 60,
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 15,
  },
  footerSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 5,
  }
});

export default WelcomeScreen;

