import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type RideCardProps = {
  company: string;
  fleetType: string;
  eta: string;
  price: string;
  onPress: () => void;
};

export default function RideCard({
  company,
  fleetType,
  eta,
  price,
  onPress,
}: RideCardProps) {
  const { colors } = useTheme();

  const getCompanyLogo = () => {
    switch (company.toLowerCase()) {
      case 'uber':
        return 'https://logo.clearbit.com/uber.com';
      case 'ola':
        return 'https://logo.clearbit.com/olacabs.com';
      case 'rapido':
        return 'https://logo.clearbit.com/rapido.bike';
      default:
        return 'https://via.placeholder.com/40';
    }
  };

  const getVehicleIcon = () => {
    const fleetTypeLower = fleetType.toLowerCase();
    
    // Check if the fleet type contains 'bike' or 'moto' to show motorcycle emoji
    if (fleetTypeLower.includes('bike') || fleetTypeLower.includes('moto')) {
      return '🏍️';
    }
    
    switch (fleetTypeLower) {
      case 'auto':
        return '🛺';
      case 'mini':
        return '🚗';
      case 'micro':
        return '🚗';
      case 'prime':
      case 'premier':
        return '🚙';
      case 'prime sedan':
        return '🚙';
      case 'xl':
      case 'uberxl':
        return '🚐';
      default:
        return '🚗';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.logoContainer}>
        <Image source={{ uri: getCompanyLogo() }} style={styles.logo} />
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <Text style={[styles.company, { color: colors.text }]}>
            {company} <Text style={styles.vehicleIcon}>{getVehicleIcon()}</Text>
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>{price}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.fleetType, { color: colors.textSecondary }]}>
            {fleetType}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12, // Reduced padding
    borderRadius: 10, // Slightly smaller border radius
    marginBottom: 8, // Reduced margin
    // Use Platform-specific styling for shadows
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  logoContainer: {
    marginRight: 12, // Reduced margin
    justifyContent: 'center',
  },
  logo: {
    width: 32, // Reduced size
    height: 32, // Reduced size
    borderRadius: 16, // Adjusted border radius
  },
  detailsContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2, // Reduced margin
  },
  company: {
    fontWeight: '600',
    fontSize: 15, // Slightly smaller font
  },
  price: {
    fontSize: 15, // Slightly smaller font
    fontWeight: '700',
  },
  fleetType: {
    fontSize: 13, // Smaller font
  },
  eta: {
    fontSize: 13, // Smaller font
  },
  vehicleIcon: {
    fontSize: 14, // Smaller font
  },
});