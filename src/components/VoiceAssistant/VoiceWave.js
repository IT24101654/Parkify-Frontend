import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, G, Mask, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

const VoiceWave = ({ isActive }) => {
  const transSlow = useSharedValue(0);
  const transMed = useSharedValue(0);
  const transFast = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      transSlow.value = withRepeat(withTiming(-200, { duration: 4000, easing: Easing.linear }), -1, false);
      transMed.value = withRepeat(withTiming(-200, { duration: 3000, easing: Easing.linear }), -1, false);
      transFast.value = withRepeat(withTiming(-200, { duration: 2000, easing: Easing.linear }), -1, false);
    } else {
      transSlow.value = 0;
      transMed.value = 0;
      transFast.value = 0;
    }
  }, [isActive]);

  const styleSlow = useAnimatedStyle(() => ({ transform: [{ translateX: transSlow.value }] }));
  const styleMed = useAnimatedStyle(() => ({ transform: [{ translateX: transMed.value }] }));
  const styleFast = useAnimatedStyle(() => ({ transform: [{ translateX: transFast.value }] }));

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 400 60" preserveAspectRatio="none" style={styles.svg}>
        <Defs>
          <LinearGradient id="gradTheme1" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#7A8487" /> 
            <Stop offset="50%" stopColor="#A88373" />
            <Stop offset="100%" stopColor="#7D846C" /> 
          </LinearGradient>
          <LinearGradient id="gradTheme2" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#A88373" />
            <Stop offset="50%" stopColor="#9C8B7A" /> 
            <Stop offset="100%" stopColor="#7A8487" />
          </LinearGradient>
          <LinearGradient id="gradTheme3" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#7D846C" />
            <Stop offset="50%" stopColor="#7A8487" />
            <Stop offset="100%" stopColor="#9C8B7A" />
          </LinearGradient>
          
          {/* Corrected Mask: White is visible, Black is transparent */}
          <LinearGradient id="edgeFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="white" stopOpacity="0" />
            <Stop offset="25%" stopColor="white" stopOpacity="1" />
            <Stop offset="75%" stopColor="white" stopOpacity="1" />
            <Stop offset="100%" stopColor="white" stopOpacity="0" />
          </LinearGradient>
          <Mask id="waveMask">
            <Rect x="0" y="0" width="400" height="60" fill="url(#edgeFade)" />
          </Mask>
        </Defs>
        
        <G mask="url(#waveMask)">
          <AnimatedG style={styleSlow}>
            <Path fill="none" stroke="url(#gradTheme1)" strokeWidth="4" opacity="0.8"
                  d="M 0 30 Q 50 10, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30" />
          </AnimatedG>
          <AnimatedG style={styleFast}>
            <Path fill="none" stroke="url(#gradTheme2)" strokeWidth="5" opacity="0.6"
                  d="M 0 30 Q 50 50, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30" />
          </AnimatedG>
          <AnimatedG style={styleMed}>
            <Path fill="none" stroke="url(#gradTheme3)" strokeWidth="3" opacity="0.9"
                  d="M 0 30 Q 50 20, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30" />
          </AnimatedG>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: '100%',
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: 10,
  },
  svg: {
    width: '100%',
    height: '100%',
  }
});

export default VoiceWave;
