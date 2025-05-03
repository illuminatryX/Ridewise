import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import LocationInput from '@/components/LocationInput';
import { useTheme } from '@/context/ThemeContext';
import OpenStreetMap from '@/components/OpenStreetMap';
import { geocodeAddress } from '@/lib/locationService';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { Navigation } from 'lucide-react-native';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { location, loading, error, getLocation } = useCurrentLocation();
  const hasSetInitialLocation = useRef(false);
  
  // State for active input field (to know which field to update when map is clicked)
  const [activeInput, setActiveInput] = useState<'source' | 'destination' | null>(null);
  
  // Location inputs
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  
  // Map coordinates
  const [sourceCoords, setSourceCoords] = useState<LocationCoords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<LocationCoords | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  // Update source location when device location is available
  useEffect(() => {
    if (location && !hasSetInitialLocation.current) {
      console.log('Setting initial location from device GPS:', location);
      hasSetInitialLocation.current = true;
      
      setSourceCoords({
        latitude: location.latitude,
        longitude: location.longitude
      });
      
      if (location.address) {
        setCurrentLocation(location.address);
      }
    }
  }, [location]);

  // When both source and destination are set, show the route
  useEffect(() => {
    if (sourceCoords && destinationCoords) {
      console.log('Both source and destination coordinates are set, showing route');
      setShowRoute(true);
    } else {
      setShowRoute(false);
    }
  }, [sourceCoords, destinationCoords]);

  // When a location is selected from autocomplete
  const handleSourceLocationSelect = (location: any) => {
    console.log('Source location selected:', location);
    setSourceCoords({
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

  // When a destination is selected from autocomplete
  const handleDestinationLocationSelect = (location: any) => {
    console.log('Destination location selected:', location);
    setDestinationCoords({
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

  // Handle clicks on the map
  const handleMapClick = (coords: {latitude: number, longitude: number, isDestination?: boolean}) => {
    console.log('Map clicked:', coords);
    // If a specific field is being edited, update that field
    if (activeInput === 'source' || coords.isDestination === false) {
      setSourceCoords({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      // Reverse geocode to get address
      reverseGeocode(coords.latitude, coords.longitude, (address) => {
        setCurrentLocation(address);
      });
    } else if (activeInput === 'destination' || coords.isDestination === true) {
      setDestinationCoords({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      // Reverse geocode to get address
      reverseGeocode(coords.latitude, coords.longitude, (address) => {
        setDestination(address);
      });
    } else {
      // If no field is active, default to updating the destination
      setDestinationCoords({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      // Reverse geocode to get address
      reverseGeocode(coords.latitude, coords.longitude, (address) => {
        setDestination(address);
      });
    }
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number, callback: (address: string) => void) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.display_name) {
        callback(data.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // Geocode locations if manually entered (not from autocomplete)
  useEffect(() => {
    const geocodeLocations = async () => {
      // Only geocode current location if it's entered manually and we don't have coords
      if (currentLocation && !sourceCoords) {
        console.log('Geocoding manually entered current location:', currentLocation);
        const coords = await geocodeAddress(currentLocation);
        if (coords) {
          setSourceCoords(coords);
        }
      }
    };
    
    geocodeLocations();
  }, [currentLocation]);

  // Geocode destination separately
  useEffect(() => {
    const geocodeDestination = async () => {
      // Only geocode destination if it's entered manually and we don't have coords
      if (destination && !destinationCoords) {
        console.log('Geocoding manually entered destination:', destination);
        const coords = await geocodeAddress(destination);
        if (coords) {
          setDestinationCoords(coords);
        }
      }
    };
    
    geocodeDestination();
  }, [destination]);

  const handleSearch = () => {
    if (!currentLocation || !destination) {
      Alert.alert('Missing Information', 'Please enter both locations');
      return;
    }

    if (!sourceCoords || !destinationCoords) {
      Alert.alert('Location Error', 'Please make sure both locations are valid');
      return;
    }

    router.push({
      pathname: '/compare',
      params: {
        from: currentLocation,
        to: destination,
        fromLat: sourceCoords.latitude.toString(),
        fromLng: sourceCoords.longitude.toString(),
        toLat: destinationCoords.latitude.toString(),
        toLng: destinationCoords.longitude.toString(),
      },
    });
  };

  const renderMap = () => {
    // If we don't have source coordinates yet, show a loading state
    if (!sourceCoords) {
      return (
        <View style={[styles.map, {justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{color: colors.text, marginTop: 10}}>Getting your location...</Text>
        </View>
      );
    }
    
    return (
      <OpenStreetMap
        style={styles.map}
        latitude={sourceCoords.latitude}
        longitude={sourceCoords.longitude}
        zoom={15}
        destinationLatitude={destinationCoords?.latitude}
        destinationLongitude={destinationCoords?.longitude}
        showRoute={showRoute}
        onMapClick={handleMapClick}
      />
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>RideWise</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find the best ride for your journey
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {renderMap()}
        
        {/* Map controls overlay */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={[styles.mapControlButton, { backgroundColor: colors.card }]}
            onPress={() => {
              getLocation();
              hasSetInitialLocation.current = false;
            }}
          >
            <Navigation size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.mapInstructions, { color: colors.card, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            Tap on map to set locations
          </Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Where are you going?
        </Text>

        <View style={styles.inputsContainer}>
          <View style={styles.locationInputWrapper}>
            <LocationInput
              label="Pick-up"
              value={currentLocation}
              onChangeText={setCurrentLocation}
              placeholder="Your current location"
              iconColor={colors.secondary}
              onLocationSelect={handleSourceLocationSelect}
              onFocus={() => setActiveInput('source')}
            />
          </View>
          
          <View style={styles.locationInputWrapper}>
            <LocationInput
              label="Drop-off"
              value={destination}
              onChangeText={setDestination}
              placeholder="Your destination"
              iconColor={colors.accent}
              onLocationSelect={handleDestinationLocationSelect}
              onFocus={() => setActiveInput('destination')}
            />
          </View>
        </View>

        <Button
          title="Find Rides"
          onPress={handleSearch}
          style={styles.searchButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  mapContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapInstructions: {
    padding: 6,
    borderRadius: 4,
    fontSize: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputsContainer: {
    marginBottom: 24,
    zIndex: 999, // Ensure this container is above other elements
  },
  locationInputWrapper: {
    zIndex: 999, // Ensure all inputs and their dropdowns appear above other elements
    marginBottom: 16,
    position: 'relative',
  },
  searchButton: {
    height: 54,
    marginTop: 8,
    zIndex: 1, // Lower z-index for the button
  },
});