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
import { updateRideData } from '@/lib/rideDataService';

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

  // Track if the component has been loaded to handle auto-reload behavior
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Just track if the component has been loaded
  useEffect(() => {
    // Mark the component as loaded, but don't auto-navigate
    setIsLoaded(true);
  }, []);

  // Only show the route when both source and destination are set
  useEffect(() => {
    if (sourceCoords && destinationCoords) {
      setShowRoute(true);
    } else {
      setShowRoute(false);
    }
  }, [sourceCoords, destinationCoords]);
  
  // Update ride data only when actively submitting the search
  const updateRideDataBeforeSearch = async () => {
    if (currentLocation && destination && sourceCoords && destinationCoords) {
      try {
        await updateRideData(
          currentLocation,
          destination,
          sourceCoords,
          destinationCoords
        );
      } catch (err) {
        console.error('Error updating ride data:', err);
      }
    }
  };

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

  const handleSearch = async () => {
    if (!currentLocation || !destination) {
      Alert.alert('Missing Information', 'Please enter both locations');
      return;
    }

    if (!sourceCoords || !destinationCoords) {
      Alert.alert('Location Error', 'Please make sure both locations are valid');
      return;
    }

    // Update ride data before navigating - use our focused method to avoid unnecessary API calls
    try {
      await updateRideDataBeforeSearch();
      
      // Add a unique timestamp to force the compare page to recognize params change
      const timestamp = Date.now().toString();
      
      // Navigate to compare screen with parameters
      router.push({
        pathname: '/compare',
        params: {
          from: currentLocation,
          to: destination,
          fromLat: sourceCoords.latitude.toString(),
          fromLng: sourceCoords.longitude.toString(),
          toLat: destinationCoords.latitude.toString(),
          toLng: destinationCoords.longitude.toString(),
          triggerSearch: 'true',
          ts: timestamp // Add timestamp to ensure params are seen as changed
        }
      });
      
    } catch (error) {
      console.error('Error in handleSearch:', error);
      Alert.alert('Error', 'Failed to update ride data. Please try again.');
    }
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
          <View style={[styles.locationInputWrapper, inputWrapperZIndex.source]}>
            <LocationInput
              label=""
              value={currentLocation}
              onChangeText={setCurrentLocation}
              placeholder="Your current location"
              iconColor={colors.secondary}
              onLocationSelect={handleSourceLocationSelect}
              onFocus={() => setActiveInput('source')}
            />
          </View>
          
          <View style={[styles.locationInputWrapper, inputWrapperZIndex.destination]}>
            <LocationInput
              label=""
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

// Separate styles for z-index management
const inputWrapperZIndex = {
  source: {
    zIndex: 200,
  },
  destination: {
    zIndex: 100,
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 6,
    paddingTop: Platform.OS === 'ios' ? 25 : 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 0,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    height: height * 0.35,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 5,
  },
  mapControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  mapInstructions: {
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputsContainer: {
    marginBottom: 12,
  },
  locationInputWrapper: {
    marginBottom: 8,
  },
  searchButton: {
    marginTop: 6,
    zIndex: 1,
    paddingVertical: 8,
  },
  inputContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 30 : 15,
    left: 0,
    right: 0,
    padding: 8,
    zIndex: 100,
  },
  inputsCard: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  inputRow: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  buttonContainer: {
    marginTop: 6,
  },
  locationButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
  },
  locationButtonText: {
    marginLeft: 4,
    fontSize: 11,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// ... (rest of the code remains the same)