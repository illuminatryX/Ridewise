import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  errorMsg?: string;
}

// Hook to get the current device location with reverse geocoding
export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get location automatically when hook is initialized
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }
      
      console.log('Getting current position...');
      
      // Get current position with high accuracy
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      console.log('Current position received:', position.coords);
      
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get address
      console.log('Reverse geocoding position...');
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      let formattedAddress = '';
      
      if (addressResponse && addressResponse.length > 0) {
        const addressData = addressResponse[0];
        const components = [
          addressData.name,
          addressData.street,
          addressData.district,
          addressData.city,
          addressData.region,
          addressData.country
        ].filter(Boolean);
        
        formattedAddress = components.join(', ');
        console.log('Address found:', formattedAddress);
      }
      
      const locationData = {
        latitude,
        longitude,
        address: formattedAddress,
      };
      
      setLocation(locationData);
      console.log('Location set:', locationData);
      return locationData;
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Could not retrieve location');
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    loading,
    error,
    getLocation,
  };
}
