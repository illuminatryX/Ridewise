import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import RideCard from '@/components/RideCard';
import FilterChip from '@/components/FilterChip';
import LocationInput from '@/components/LocationInput';
import Button from '@/components/Button';
import { fleetTypes, generateMockRides, RideData } from '@/lib/mockData';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react-native';
import { geocodeAddress } from '@/lib/locationService';

export default function CompareScreen() {
  const params = useLocalSearchParams<{ 
    from: string; 
    to: string;
    fromLat: string;
    fromLng: string;
    toLat: string;
    toLng: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  
  // State for active input field (to know which field to update when map is clicked)
  const [activeInput, setActiveInput] = useState<'source' | 'destination' | null>(null);
  
  const [source, setSource] = useState(params.from || '');
  const [destination, setDestination] = useState(params.to || '');
  const [selectedFleetType, setSelectedFleetType] = useState('All');
  const [rides, setRides] = useState<RideData[]>([]);
  const [filteredRides, setFilteredRides] = useState<RideData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Store coordinates for potential route display
  const [sourceCoords, setSourceCoords] = useState(
    params.fromLat && params.fromLng 
      ? { latitude: parseFloat(params.fromLat), longitude: parseFloat(params.fromLng) } 
      : null
  );
  
  const [destinationCoords, setDestinationCoords] = useState(
    params.toLat && params.toLng 
      ? { latitude: parseFloat(params.toLat), longitude: parseFloat(params.toLng) } 
      : null
  );

  useEffect(() => {
    // Fetch rides
    loadRides();
  }, [source, destination]);

  useEffect(() => {
    // Apply filters when fleet type changes
    if (selectedFleetType === 'All') {
      setFilteredRides(rides);
    } else {
      setFilteredRides(
        rides.filter((ride) => ride.fleetType === selectedFleetType)
      );
    }
  }, [selectedFleetType, rides]);

  // When a location is selected from autocomplete
  const handleSourceLocationSelect = (location: any) => {
    console.log('Source location selected:', location);
    setSourceCoords({
      latitude: location.latitude,
      longitude: location.longitude
    });
    setSource(location.address);
  };

  // When a destination is selected from autocomplete
  const handleDestinationLocationSelect = (location: any) => {
    console.log('Destination location selected:', location);
    setDestinationCoords({
      latitude: location.latitude,
      longitude: location.longitude
    });
    setDestination(location.address);
  };

  const loadRides = () => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const mockRides = generateMockRides(source, destination);
      setRides(mockRides);
      setFilteredRides(mockRides);
      setIsLoading(false);
    }, 1000);
  };

  const handleSearch = async () => {
    // If addresses were entered manually, try to geocode them
    if (source && !sourceCoords) {
      const coords = await geocodeAddress(source);
      if (coords) {
        setSourceCoords(coords);
      }
    }
    
    if (destination && !destinationCoords) {
      const coords = await geocodeAddress(destination);
      if (coords) {
        setDestinationCoords(coords);
      }
    }
    
    loadRides();
  };

  const handleRideSelect = (ride: RideData) => {
    // Navigate back to home screen with the selected ride details
    router.push({
      pathname: '/',
      params: {
        selectedRide: JSON.stringify({
          id: ride.id,
          company: ride.company,
          fleetType: ride.fleetType,
          price: ride.price,
          source: source,
          destination: destination,
          sourceCoords: sourceCoords ? JSON.stringify(sourceCoords) : null,
          destinationCoords: destinationCoords ? JSON.stringify(destinationCoords) : null
        })
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Compare Rides</Text>
          
          <View style={styles.locationInputs}>
            <View style={styles.locationInputWrapper}>
              <LocationInput
                label="Pick-up"
                value={source}
                onChangeText={setSource}
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
                iconColor={colors.accent}
                onLocationSelect={handleDestinationLocationSelect}
                onFocus={() => setActiveInput('destination')}
              />
            </View>
          </View>
          
          <Button
            title="Update Search"
            onPress={handleSearch}
            style={styles.searchButton}
            icon={<SearchIcon size={16} color="white" />}
          />
        </View>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {fleetTypes.map((type) => (
            <FilterChip
              key={type}
              label={type}
              isSelected={selectedFleetType === type}
              onPress={() => setSelectedFleetType(type)}
            />
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.ridesContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Finding the best rides for you...
            </Text>
          </View>
        ) : filteredRides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No rides available for the selected filter.
            </Text>
            <TouchableOpacity onPress={() => setSelectedFleetType('All')}>
              <Text style={[styles.resetText, { color: colors.primary }]}>
                Reset filters
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredRides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ridesList}
            renderItem={({ item }) => (
              <RideCard
                company={item.company}
                fleetType={item.fleetType}
                eta={item.eta}
                price={item.price}
                onPress={() => handleRideSelect(item)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10, // Ensure header is above everything else
  },
  headerContent: {
    paddingHorizontal: 24,
    zIndex: 10, // Ensure header content is above other elements
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  locationInputs: {
    marginBottom: 8,
    zIndex: 999, // Very high z-index to ensure it's above everything
  },
  locationInputWrapper: {
    marginBottom: 12,
    zIndex: 999, // Very high z-index to ensure it's above everything
    position: 'relative',
  },
  searchButton: {
    marginTop: 8,
    zIndex: 1, // Lower z-index for button so it appears below dropdowns
  },
  filterContainer: {
    paddingVertical: 16,
    zIndex: 1, // Lower z-index for filters
  },
  filtersScrollContent: {
    paddingHorizontal: 24,
  },
  ridesContainer: {
    flex: 1,
    zIndex: 1, // Lower z-index for rides container
  },
  ridesList: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
});