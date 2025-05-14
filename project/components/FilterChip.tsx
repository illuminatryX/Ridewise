import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type FilterChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

export default function FilterChip({
  label,
  isSelected,
  onPress,
}: FilterChipProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : 'transparent',
          borderColor: colors.primary,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          { color: isSelected ? colors.card : colors.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12, // Reduced horizontal padding
    paddingVertical: 6, // Reduced vertical padding
    borderRadius: 16, // Smaller border radius
    borderWidth: 1,
    marginRight: 6, // Reduced margin
    marginBottom: 6, // Reduced margin
  },
  label: {
    fontSize: 13, // Smaller font size
    fontWeight: '500',
  },
});