import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ButtonProps = {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
};

export default function Button({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? colors.textSecondary : colors.primary,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: disabled ? '#FFF5CC' : colors.secondary,
          },
          text: {
            color: colors.primary,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled ? colors.textSecondary : colors.primary,
          },
          text: {
            color: disabled ? colors.textSecondary : colors.primary,
          },
        };
      case 'text':
        return {
          container: {
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
          },
          text: {
            color: disabled ? colors.textSecondary : colors.primary,
          },
        };
      default:
        return {
          container: {
            backgroundColor: disabled ? colors.textSecondary : colors.primary,
          },
          text: {
            color: '#FFFFFF',
          },
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyles.container,
        disabled || isLoading ? styles.disabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? colors.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.buttonText, buttonStyles.text, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});