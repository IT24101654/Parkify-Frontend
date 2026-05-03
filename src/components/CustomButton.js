import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, SIZES } from '../styles/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
  disabled = false,
}) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFF' : COLORS.primaryCoral} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.primaryText : styles.secondaryText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 55,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primaryCoral,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.navyDeep,
  },
  disabledButton: {
    backgroundColor: COLORS.textMuted,
    borderColor: COLORS.textMuted,
  },
  text: {
    ...FONTS.h3,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFF',
  },
  secondaryText: {
    color: COLORS.navyDeep,
  },
});

export default CustomButton;
