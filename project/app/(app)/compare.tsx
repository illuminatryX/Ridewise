import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import RideCard from '@/components/RideCard';
import FilterChip from '@/components/FilterChip';
import LocationInput from '@/components/LocationInput';
import Button from '@/components/Button';
// Import basic fleetCategories without the generateMockRides function that seems to be causing issues
import { fleetCategories } from '@/lib/mockData';
import { ArrowLeft, Search as SearchIcon, ChevronDown, ChevronUp } from 'lucide-react-native';
import { geocodeAddress } from '@/lib/locationService';
import { updateRideData, getRideDataForApi } from '@/lib/rideDataService';
import { fetchRidePrices } from '@/lib/apiService';
import { RideOption, ApiRideResponse, RideApiInput } from '@/types/rides';

export default function CompareScreen() {
  const params = useLocalSearchParams<{ 
    from: string; 
    to: string;
    fromLat: string;
    fromLng: string;
    toLat: string;
    toLng: string;
    triggerSearch: string;
    ts: string; // Timestamp to force parameter updates
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  
  // State for active input field (to know which field to update when map is clicked)
  const [activeInput, setActiveInput] = useState<'source' | 'destination' | null>(null);
  
  const [source, setSource] = useState(params.from || '');
  const [destination, setDestination] = useState(params.to || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [rides, setRides] = useState<RideOption[]>([]);
  const [filteredRides, setFilteredRides] = useState<RideOption[]>([]);
  const [apiResponse, setApiResponse] = useState<ApiRideResponse | null>(null);
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

  // Update state values when the URL parameters change
  const prevParamsRef = React.useRef<string>("");
  
  useEffect(() => {
    // Convert current params to string for comparison
    const currentParamsString = JSON.stringify({
      from: params.from,
      to: params.to,
      fromLat: params.fromLat,
      fromLng: params.fromLng,
      toLat: params.toLat,
      toLng: params.toLng,
      triggerSearch: params.triggerSearch,
      ts: params.ts // Include timestamp to detect changes
    });
    
    // Only process if params have actually changed
    if (prevParamsRef.current !== currentParamsString) {
      prevParamsRef.current = currentParamsString;
      
      // Update source and destination inputs from params
      if (params.from) {
        setSource(params.from);
      }
      
      if (params.to) {
        setDestination(params.to);
      }
      
      // Update coordinates if they exist in params
      if (params.fromLat && params.fromLng) {
        setSourceCoords({
          latitude: parseFloat(params.fromLat),
          longitude: parseFloat(params.fromLng)
        });
      }
      
      if (params.toLat && params.toLng) {
        setDestinationCoords({
          latitude: parseFloat(params.toLat),
          longitude: parseFloat(params.toLng)
        });
      }
      
      // If we have sufficient data for a search and triggerSearch is true, load rides
      if (params.triggerSearch === 'true' && 
          params.fromLat && params.fromLng && params.toLat && params.toLng) {
        // Schedule the API call to happen after state updates
        setIsLoading(true);
        setTimeout(() => loadRides(), 100);
      } else {
        // Don't show loading if we're not making a request
        setIsLoading(false);
      }
    }
  }, [params]); // Re-run this effect when params change

  useEffect(() => {
    // Apply filters when category changes
    if (selectedCategory === 'All') {
      setFilteredRides(rides);
    } else {
      setFilteredRides(
        rides.filter((ride) => ride.category === selectedCategory)
      );
    }
  }, [selectedCategory, rides]);

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

  const loadRides = async () => {
    try {
      // Clear previous state and show loading indicator
      setIsLoading(true);
      setRides([]);
      setFilteredRides([]);
      
      // Quick validation of coordinates
      if (!sourceCoords || !destinationCoords) {
        Alert.alert('Error', 'Missing location coordinates. Please try selecting locations again.');
        setIsLoading(false);
        return;
      }
      
      // Create ride data object directly from coordinates
      const rideData: RideApiInput = {
        start_place: source,
        destination_place: destination,
        pickup_lat: sourceCoords.latitude,
        pickup_lng: sourceCoords.longitude,
        drop_lat: destinationCoords.latitude,
        drop_lng: destinationCoords.longitude
      };
      
      // Update the ride data in memory for consistency
      await updateRideData(
        source,
        destination,
        sourceCoords,
        destinationCoords
      );
      
      // Generate fallback mock data for Uber and Rapido separately
      const mockUberRides: RideOption[] = [
        {
          id: 'uber-mock-1',
          company: 'Uber',
          fleetType: 'UberGo',
          eta: '4 min',
          price: '₹289',
          category: 'Economy',
        },
        {
          id: 'uber-mock-2',
          company: 'Uber',
          fleetType: 'Premier',
          eta: '6 min',
          price: '₹349',
          category: 'Comfort',
        },
        {
          id: 'uber-mock-3',
          company: 'Uber',
          fleetType: 'UberXL',
          eta: '8 min',
          price: '₹480',
          category: 'Extra Large',
        },
      ];
      
      const mockRapidoRides: RideOption[] = [
        {
          id: 'rapido-mock-1',
          company: 'Rapido',
          fleetType: 'Bike',
          eta: '3 min',
          price: '₹120',
          category: 'Bike',
        },
        {
          id: 'rapido-mock-2',
          company: 'Rapido',
          fleetType: 'Premium Bike',
          eta: '4 min',
          price: '₹150',
          category: 'Bike',
        },
      ];
      
      // Combined mock data (without Ola)
      const mockRides: RideOption[] = [...mockUberRides, ...mockRapidoRides];
      
      try {
        // Make a single API call using our optimized service
        const response = await fetchRidePrices(rideData);
        
        if (response.success && response.data) {
          setApiResponse(response.data);
          
          // Process the API response and get information about which providers responded
          const { processedRides, hasUberData, hasRapidoData } = processApiResponse(response.data);
          
          let finalRides: RideOption[] = [];
          
          // Handle different response scenarios
          if (hasUberData && hasRapidoData) {
            // Both services responded - use only real data
            console.log('Both Uber and Rapido responded with data');
            finalRides = processedRides;
          } else if (hasUberData && !hasRapidoData) {
            // Only Uber responded - combine with mock Rapido data
            console.log('Only Uber responded, adding mock Rapido data');
            finalRides = [...processedRides, ...mockRapidoRides];
          } else if (!hasUberData && hasRapidoData) {
            // Only Rapido responded - combine with mock Uber data
            console.log('Only Rapido responded, adding mock Uber data');
            finalRides = [...processedRides, ...mockUberRides];
          } else {
            // No real data at all - use all mock data
            console.log('No real data available, using all mock data');
            finalRides = mockRides;
            Alert.alert('No Rides Found', 'No ride options were found. Showing estimated prices instead.');
          }
          
          setRides(finalRides);
          setFilteredRides(finalRides);
        } else {
          // API call failed, use mock data
          setRides(mockRides);
          setFilteredRides(mockRides);
          Alert.alert('API Error', 'Couldn\'t fetch real-time prices. Showing estimated prices instead.');
        }
      } catch (apiError) {
        // API call completely failed, fall back to mock data
        setRides(mockRides);
        setFilteredRides(mockRides);
        Alert.alert('Connection Error', 'Network error while fetching ride data. Showing estimated prices instead.');
      }
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load ride data. Please try again.');
    }
  };
  
  // Type definition for the API response just for local use
  type ApiResponseType = {
    success?: boolean;
    error?: string;
    data?: any;
    Uber?: { 
      options?: Array<{fleet: string, price: string}>,
      error?: string,
      success?: boolean
    };
    Rapido?: { 
      service?: string,
      start?: string,
      destination?: string,
      options?: Array<{fleet: string, fare?: string, price?: string}>,
      error?: string,
      success?: boolean
    };
    [key: string]: any; // Allow for other providers we might not know about yet
  };

  // Process API response into our RideOption format
  // Initial load function that only uses mock data without making API calls
  const initialLoadWithMockData = () => {
    setIsLoading(true);
    
    // Use the same mock data as in loadRides function
    const mockRides: RideOption[] = [
      {
        id: 'uber-1',
        company: 'Uber',
        fleetType: 'UberGo',
        eta: '4 min',
        price: '₹289',
        category: 'Economy',
      },
      {
        id: 'uber-2',
        company: 'Uber',
        fleetType: 'Premier',
        eta: '6 min',
        price: '₹349',
        category: 'Comfort',
      },
      {
        id: 'uber-3',
        company: 'Uber',
        fleetType: 'UberXL',
        eta: '8 min',
        price: '₹480',
        category: 'Extra Large',
      },
      {
        id: 'rapido-1',
        company: 'Rapido',
        fleetType: 'Bike',
        eta: '3 min',
        price: '₹120',
        category: 'Bike',
      },
      {
        id: 'ola-1',
        company: 'Ola',
        fleetType: 'Micro',
        eta: '5 min',
        price: '₹279',
        category: 'Economy',
      },
      {
        id: 'ola-2',
        company: 'Ola',
        fleetType: 'Prime Sedan',
        eta: '7 min',
        price: '₹339',
        category: 'Comfort',
      },
    ];
    
    setRides(mockRides);
    setFilteredRides(mockRides);
    setIsLoading(false);
    console.log('Loaded initial mock data without API call');
  };
  
  const processApiResponse = (apiResponse: ApiResponseType): { processedRides: RideOption[], hasUberData: boolean, hasRapidoData: boolean } => {
    const rides: RideOption[] = [];
    
    // First, log the complete structure of the API response
    console.log('Processing API response:', JSON.stringify(apiResponse, null, 2));
    
    // Check if we're getting a nested structure with data property
    if (apiResponse.data) {
      console.log('Found nested data property, using it as the response');
      // If the response has a nested data property, use that instead
      apiResponse = apiResponse.data;
    }
    
    try {
      // First log the keys of the response to understand the structure
      console.log('API response keys:', Object.keys(apiResponse));
      
      // Process Uber data if available
      if (apiResponse.Uber) {
        console.log('Found Uber data:', apiResponse.Uber);
        
        if (Array.isArray(apiResponse.Uber.options)) {
          console.log('Found Uber options array with length:', apiResponse.Uber.options.length);
          apiResponse.Uber.options.forEach((option: any, index: number) => {
            if (option.fleet && option.price) {
              rides.push({
                id: `uber-${index}`,
                company: 'Uber',
                fleetType: option.fleet,
                eta: '4-8 min', // Estimated value
                price: option.price,
                category: getCategoryForFleetType(option.fleet)
              });
            }
          });
        } else {
          console.log('Uber data does not have an options array:', typeof apiResponse.Uber.options);
        }
      } else {
        console.log('No Uber data found in the response');
      }
      
      // Process Rapido data if available
      if (apiResponse.Rapido) {
        console.log('Found Rapido data:', apiResponse.Rapido);
        
        if (apiResponse.Rapido.options && Array.isArray(apiResponse.Rapido.options)) {
          console.log('Found Rapido options array with length:', apiResponse.Rapido.options.length);
          
          apiResponse.Rapido.options.forEach((option: any, index: number) => {
            // Rapido API may use 'fare' instead of 'price', so handle both
            const price = option.price || option.fare;
            
            if (option.fleet && price) {
              rides.push({
                id: `rapido-${index}`,
                company: 'Rapido',
                fleetType: option.fleet,
                eta: '3-6 min', // Estimated value
                price: price, // Use whichever field is available
                category: getCategoryForFleetType(option.fleet)
              });
            } else {
              console.log('Skipping Rapido option due to missing data:', option);
            }
          });
        } else {
          console.log('Rapido data does not have a valid options array');
        }
      } else {
        console.log('No Rapido data found in the response');
      }
      
      // Track which providers returned data
    let hasUberData = false;
    let hasRapidoData = false;
    
    // If Uber data is found, mark it
    if (apiResponse.Uber && rides.some(ride => ride.company === 'Uber')) {
      hasUberData = true;
    }
    
    // If Rapido data is found, mark it
    if (apiResponse.Rapido && rides.some(ride => ride.company === 'Rapido')) {
      hasRapidoData = true;
    }
    
    // If no rides were found with the direct format, try alternative formats
    if (rides.length === 0) {
        // Check if the API response is nested inside a data property
        const responseData = apiResponse.data ? apiResponse.data : apiResponse;
        
        // Process Rapido data if available and nested
        if (responseData.Rapido && responseData.Rapido.options) {
          console.log('Found Rapido data with options:', responseData.Rapido.options.length);
          responseData.Rapido.options.forEach((option: any, index: number) => {
            if (option.fleet && option.fare) {
              rides.push({
                id: `rapido-${index}`,
                company: 'Rapido',
                fleetType: option.fleet,
                eta: '', // Removed ETA
                price: option.fare,
                category: getCategoryForFleetType(option.fleet)
              });
            }
          });
        }
        
        // Process Uber data if available and nested
        if (responseData.Uber && responseData.Uber.options) {
          console.log('Found Uber data with options:', responseData.Uber.options);
          responseData.Uber.options.forEach((option: any, index: number) => {
            if (option.fleet && option.price) {
              // Fast price range conversion for Uber
              let priceDisplay = option.price;
              
              const priceStr = String(option.price || '');
              const numStr = priceStr.replace(/[^0-9.]/g, '');
              const price = parseFloat(numStr);
              
              if (!isNaN(price) && price > 0) {
                const min = Math.max(0, Math.floor(price - 5));
                const max = Math.ceil(price + 5);
                priceDisplay = `₹${min}-${max}`;
              }
              
              rides.push({
                id: `uber-${index}`,
                company: 'Uber',
                fleetType: option.fleet,
                eta: '', // Removed ETA
                price: priceDisplay,
                category: getCategoryForFleetType(option.fleet)
              });
            }
          });
        }
        
        // Handle non-standard/flat response format (direct array)
        if (Array.isArray(responseData)) {
          console.log('Processing array response data with', responseData.length, 'items');
          responseData.forEach((item: any, index: number) => {
            if (item.company && item.type && (item.price || item.fare)) {
              rides.push({
                id: `ride-${index}`,
                company: item.company,
                fleetType: item.type || item.fleet || 'Standard',
                eta: item.eta || '5-8 min',
                price: item.price || item.fare,
                category: getCategoryForFleetType(item.type || item.fleet || 'Standard')
              });
            }
          });
        }
      }
      
      // Log the number of rides found
      console.log(`Found ${rides.length} rides from API response`);
      
      // Update provider flags based on final results
    hasUberData = rides.some(ride => ride.company === 'Uber');
    hasRapidoData = rides.some(ride => ride.company === 'Rapido');
    
    return {
      processedRides: rides,
      hasUberData,
      hasRapidoData
    };
    } catch (error) {
      console.error('Error processing API response:', error);
      return {
        processedRides: [],
        hasUberData: false,
        hasRapidoData: false
      };
    }
  };
  
  // Helper function to determine category based on fleet type
  const getCategoryForFleetType = (fleetType: string): string => {
    const lowerFleetType = fleetType.toLowerCase();
    
    // Check each category to find a match
    for (const category of fleetCategories) {
      if (category.name === 'All') continue;
      
      const matchesType = category.types.some(type => 
        lowerFleetType.includes(type.toLowerCase())
      );
      
      if (matchesType) return category.name;
    }
    
    return 'Standard'; // Default category if no match is found
  };

  const handleSearch = async () => {
    try {
      // If addresses were entered manually, try to geocode them
      if (source && !sourceCoords) {
        const coords = await geocodeAddress(source);
        if (coords) {
          setSourceCoords(coords);
        } else {
          Alert.alert('Error', 'Could not find coordinates for the source location');
          return;
        }
      }
      
      if (destination && !destinationCoords) {
        const coords = await geocodeAddress(destination);
        if (coords) {
          setDestinationCoords(coords);
        } else {
          Alert.alert('Error', 'Could not find coordinates for the destination location');
          return;
        }
      }
      
      // Update ride data JSON for API
      if (sourceCoords && destinationCoords) {
        await updateRideData(
          source,
          destination,
          sourceCoords,
          destinationCoords
        );
        console.log('Ride data updated from compare screen');
      } else {
        Alert.alert('Error', 'Please make sure both locations are valid');
        return;
      }
      
      loadRides();
    } catch (error) {
      console.error('Error updating ride data:', error);
      Alert.alert('Error', 'Failed to prepare ride data. Please try again.');
    }
  };

  const handleRideSelect = (ride: RideOption) => {
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

  // Group rides by company
  const groupedRides = filteredRides.reduce((acc, ride) => {
    if (!acc[ride.company]) {
      acc[ride.company] = [];
    }
    acc[ride.company].push(ride);
    return acc;
  }, {} as Record<string, RideOption[]>);

  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Compare Rides</Text>
          
          <View style={styles.locationInputs}>
            <View style={[styles.locationInputWrapper, { zIndex: 200 }]}>
              <LocationInput
                label=""
                value={source}
                onChangeText={setSource}
                placeholder="Your current location"
                iconColor={colors.secondary}
                onLocationSelect={handleSourceLocationSelect}
                onFocus={() => setActiveInput('source')}
              />
            </View>
            
            <View style={[styles.locationInputWrapper, { zIndex: 100 }]}>
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
            
            <Button
              title="Search"
              onPress={loadRides}
              style={styles.updateButton}
            />
          </View>
          
          {/* Filter toggle button placed here */}
        </View>
      </View>
      
      {/* Filter toggle button */}
      <TouchableOpacity 
        style={[styles.filterToggle, { backgroundColor: colors.card }]}
        onPress={toggleFilters}
      >
        <Text style={[styles.filterToggleText, { color: colors.text }]}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Text>
        {showFilters ? 
          <ChevronUp size={20} color={colors.text} /> : 
          <ChevronDown size={20} color={colors.text} />
        }
      </TouchableOpacity>
      
      {/* Collapsible filter container */}
      {showFilters && (
        <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Filter by Vehicle Type
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {fleetCategories.map((category) => (
              <FilterChip
                key={category.name}
                label={category.name}
                isSelected={selectedCategory === category.name}
                onPress={() => setSelectedCategory(category.name)}
              />
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.ridesContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Finding the best rides for you...
            </Text>
          </View>
        ) : filteredRides.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No rides match your filters. Try a different category.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollContainer}>
            {/* Display rides grouped by company */}
            {Object.keys(groupedRides).map((company) => (
              <View key={company} style={styles.companySection}>
                <Text style={[styles.companyHeader, { color: colors.text }]}>
                  {company}
                </Text>
                {groupedRides[company].map((ride) => (
                  <RideCard
                    key={ride.id}
                    company={ride.company}
                    fleetType={ride.fleetType}
                    eta={ride.eta}
                    price={ride.price}
                    onPress={() => handleRideSelect(ride)}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 35 : 20, // Reduced padding
    paddingBottom: 6, // Reduced padding
    paddingHorizontal: 10, // Reduced padding
    borderBottomWidth: 1,
  },
  headerContent: {
    width: '100%',
  },
  title: {
    fontSize: 18, // Smaller font size
    fontWeight: 'bold',
    marginBottom: 6, // Reduced margin
  },
  locationInputs: {
    marginBottom: 6, // Reduced margin
    width: '100%',
  },
  locationInputWrapper: {
    marginBottom: 6, // Reduced margin
  },
  filterContainer: {
    padding: 8, // Reduced padding
    borderBottomWidth: 1,
  },
  filterTitle: {
    fontSize: 14, // Smaller font size
    fontWeight: '600',
    marginBottom: 4, // Reduced margin
  },
  filtersScrollContent: {
    paddingRight: 6, // Reduced padding
    paddingBottom: 2, // Reduced padding
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6, // Reduced padding
    borderBottomWidth: 1,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  filterToggleText: {
    fontWeight: '600',
    marginRight: 4, // Reduced margin
    fontSize: 13, // Smaller font size
  },
  ridesContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 8, // Reduced padding
  },
  companySection: {
    marginBottom: 10, // Reduced margin
  },
  companyHeader: {
    fontSize: 16, // Smaller font size
    fontWeight: 'bold',
    marginBottom: 6, // Reduced margin
    paddingLeft: 4, // Reduced padding
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noResultsText: {
    fontSize: 15,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
  },
  searchButton: {
    marginTop: 5,
  },
  updateButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#3371FF',
    alignSelf: 'stretch',
  },
});