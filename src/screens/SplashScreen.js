import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const carPos = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Car bounce animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ])
    ).start();

    // 2. Sequence of main animations
    Animated.sequence([
      // Fade in the background and logo
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Drive the car across the screen (taking about 4 seconds)
      Animated.parallel([
        Animated.timing(carPos, {
          toValue: width + 100,
          duration: 4000,
          useNativeDriver: true,
        }),
        // Fade in tagline halfway
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 1500,
          delay: 1000,
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Total 5 seconds before finishing
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Top Logo Section */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/Parkify.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>PARKIFY</Text>
        </View>

        {/* Road and Car Animation */}
        <View style={styles.roadContainer}>
          <View style={styles.roadLine} />
          <Animated.View style={[
            styles.carWrapper, 
            { 
              transform: [
                { translateX: carPos },
                { translateY: bounceAnim },
                { scaleX: 1 } // Ensure icon faces right (direction of travel)
              ] 
            }
          ]}>
            <MaterialCommunityIcons name="car-side" size={75} color="#b26969" />
            {/* Sharp Triangular Headlight Beam (as per reference image) */}
            <View style={styles.sharpBeam} />
            <View style={styles.headlightCore} />
          </Animated.View>
        </View>

        {/* Bottom Tagline */}
        <Animated.View style={[styles.footer, { opacity: textAnim }]}>
          <Text style={styles.tagline}>Happy Parking, Happy Driving!</Text>
          <Text style={styles.loadingText}>Initializing Smart Infrastructure...</Text>
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, {
              transform: [{
                translateX: carPos.interpolate({
                  inputRange: [0, width],
                  outputRange: [-width, 0],
                  extrapolate: 'clamp'
                })
              }]
            }]} />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark professional background
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 100,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 8,
  },
  roadContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    position: 'relative',
  },
  roadLine: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
    top: '70%',
  },
  carWrapper: {
    position: 'absolute',
    bottom: 20,
  },
  headlightCore: {
    position: 'absolute',
    right: 5,
    top: 38, // Moved up from 50
    width: 8,
    height: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    zIndex: 10,
  },
  sharpBeam: {
    position: 'absolute',
    right: -250, // Slightly shorter for better stability
    top: 13,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 25,
    borderBottomWidth: 25,
    borderLeftWidth: 250,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scaleX: -1 }],
  },

  footer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  tagline: {
    fontSize: 18,
    color: '#AE8E82',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 10,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#b26969',
  },
});

export default SplashScreen;
