import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  detailsContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  company: {
    fontWeight: '600',
    fontSize: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  fleetType: {
    fontSize: 14,
  },
  eta: {
    fontSize: 14,
  },
  vehicleIcon: {
    fontSize: 16,
  },
});