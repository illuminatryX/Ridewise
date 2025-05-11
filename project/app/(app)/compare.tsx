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

  // Initial setup when the component first mounts
  useEffect(() => {
    // Don't load any mock data - start with an empty state
    setRides([]);
    setFilteredRides([]);
    
    // Auto-trigger API request immediately on page load/reload when we have location data
    if (params.triggerSearch === 'true' || (sourceCoords && destinationCoords)) {
      loadRides();
    } else {
      // Don't show loading if we're not making a request
      setIsLoading(false);
    }
  }, []);

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
      setIsLoading(true);
      
      // Always use the coordinates from URL parameters to ensure data consistency
      if (!sourceCoords || !destinationCoords) {
        Alert.alert('Error', 'Missing location coordinates. Please try selecting locations again.');
        setIsLoading(false);
        return;
      }
      
      // Log the coordinates from URL parameters that we're going to use
      console.log('Using coordinates from URL params:', {
        source: {
          address: source,
          lat: sourceCoords.latitude,
          lng: sourceCoords.longitude
        },
        destination: {
          address: destination,
          lat: destinationCoords.latitude,
          lng: destinationCoords.longitude
        }
      });
      
      // Create a fresh ride data object from the URL parameters
      const rideData: RideApiInput = {
        start_place: source,
        destination_place: destination,
        pickup_lat: sourceCoords.latitude,      // Updated to match API field names
        pickup_lng: sourceCoords.longitude,     // Updated to match API field names
        drop_lat: destinationCoords.latitude,   // Updated to match API field names
        drop_lng: destinationCoords.longitude   // Updated to match API field names
      };
      
      console.log('Prepared fresh ride data for API:', rideData);
      
      // Update the in-memory ride data for consistency
      await updateRideData(
        source,
        destination,
        sourceCoords,
        destinationCoords
      );
      
      // Generate local mock data directly to guarantee we have ride options
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
      
      try {
        // Fetch ride prices from the API
        console.log('Attempting to fetch ride prices from API with data:', JSON.stringify(rideData));
        
        // Make direct fetch call for debugging
        try {
          // Log the original ride data for debugging
          console.log('Fetching ride prices from API with data:', rideData);

          // Create an ordered object with the exact property order required by the API
          const orderedRideData = {
            start_place: rideData.start_place.trim(),
            destination_place: rideData.destination_place.trim(),
            pickup_lat: rideData.pickup_lat,
            pickup_lng: rideData.pickup_lng,
            drop_lat: rideData.drop_lat,
            drop_lng: rideData.drop_lng
          };
          
          // Debug logging for the coordinates
          console.log('DEBUG - Coordinate values:', { 
            pickup_lat: orderedRideData.pickup_lat, 
            pickup_lng: orderedRideData.pickup_lng,
            drop_lat: orderedRideData.drop_lat,
            drop_lng: orderedRideData.drop_lng
          });
          
          // Use the ordered object to create URL parameters in the correct order
          const params = new URLSearchParams();
          
          // Add parameters in the same specific order as apiService.ts
          // Start place must be first
          params.append('start_place', encodeURIComponent(orderedRideData.start_place));
          // Destination place must be second
          params.append('destination_place', encodeURIComponent(orderedRideData.destination_place));
          
          // Then coordinates - with null/undefined checks
          // Ensure each coordinate is a valid number before calling toFixed
          params.append('pickup_lat', 
            typeof orderedRideData.pickup_lat === 'number' ? orderedRideData.pickup_lat.toFixed(6) : '0');
          params.append('pickup_lng', 
            typeof orderedRideData.pickup_lng === 'number' ? orderedRideData.pickup_lng.toFixed(6) : '0');
          params.append('drop_lat', 
            typeof orderedRideData.drop_lat === 'number' ? orderedRideData.drop_lat.toFixed(6) : '0');
          params.append('drop_lng', 
            typeof orderedRideData.drop_lng === 'number' ? orderedRideData.drop_lng.toFixed(6) : '0');
          
          const directUrl = `https://b00dk70f-8000.inc1.devtunnels.ms/ride-options?${params.toString()}`;
          console.log('DEBUG - Making direct fetch to:', directUrl);
          
          // Add mode: 'cors' and other options to help with potential CORS issues
          const directResponse = await fetch(directUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            },
          });
          console.log('DEBUG - Direct fetch status:', directResponse.status);
          
          // Get the raw text response regardless of status code
          const text = await directResponse.text();
          console.log('RAW API RESPONSE TEXT:', text);
          
          if (directResponse.ok) {
            console.log('DEBUG - Direct fetch response text:', text);
            
            try {
              const jsonData = JSON.parse(text);
              console.log('API response received:', jsonData);
              
              // Check if the response format is as expected
              if (jsonData.success === true && jsonData.data) {
                console.log('Direct fetch successful with data');
                
                // Process and use the received data
                const processedRides = processApiResponse(jsonData);
                setRides(processedRides);
                setFilteredRides(processedRides);
              } else {
                // Log detailed error information
                console.error('API returned error:', {
                  success: jsonData.success,
                  error: jsonData.error,
                  data: jsonData.data
                });
                
                // Display a more descriptive error message if available
                const errorMessage = jsonData.error 
                  ? `API Error: ${jsonData.error}` 
                  : 'Could not load ride prices';
                
                setRides(mockRides);
                setFilteredRides(mockRides);
                Alert.alert('Data Error', errorMessage + '. Showing estimated prices instead.');
              }
            } catch (parseError) {
              console.error('JSON parse error:', parseError, 'for text:', text);
              setRides(mockRides);
              setFilteredRides(mockRides);
              Alert.alert('Response Error', 'Invalid data received. Showing estimated prices instead.');
            }
          } else {
            // No rides in the API response, fall back to mock data
            console.log('API returned no rides, falling back to mock data');
            console.log('Using mock rides instead:', mockRides.length);
            setRides(mockRides);
            setFilteredRides(mockRides);
            Alert.alert('No Rides Found', 'No ride options were found from the providers. Showing estimated prices instead.');
          }
        } catch (directError) {
          console.error('DEBUG - Direct fetch error:', directError);
        }
        
        // Now try the regular API call
        const response = await fetchRidePrices(rideData);
        console.log('API response received:', response);
        
        if (response.success && response.data) {
          setApiResponse(response.data);
          
          // Process the API response and convert to our RideOption format
          const processedRides = processApiResponse(response.data);
          
          // Check if we got any rides from the API
          if (processedRides.length > 0) {
            setRides(processedRides);
            setFilteredRides(processedRides);
            console.log('Processed API response into ride options:', processedRides);
          } else {
            // No rides in the API response, fall back to mock data
            console.log('API returned no rides, falling back to mock data');
            console.log('Using mock rides instead:', mockRides.length);
            setRides(mockRides);
            setFilteredRides(mockRides);
            Alert.alert('No Rides Found', 'No ride options were found from the providers. Showing estimated prices instead.');
          }
        } else {
          // API call failed, use mock data
          console.log('API call failed with error:', response.error);
          console.log('Using mock rides instead:', mockRides.length);
          setRides(mockRides);
          setFilteredRides(mockRides);
          Alert.alert('API Error', 'Couldn\'t fetch real-time prices. Showing estimated prices instead.');
        }
      } catch (apiError) {
        // API call completely failed, fall back to mock data
        console.error('API call threw exception:', apiError);
        setRides(mockRides);
        setFilteredRides(mockRides);
        Alert.alert('Connection Error', 'Network error while fetching ride data. Showing estimated prices instead.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading rides:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load ride data. Please try again.');
    }
  };
  
  // Type definition for the API response just for local use
  type ApiResponseType = {
    success?: boolean;
    error?: string;
    data?: any;
    Uber?: { options: Array<{fleet: string, price: string}> };
    Rapido?: { 
      service?: string; 
      start?: string; 
      destination?: string; 
      options?: Array<{fleet: string, fare?: string, price?: string}> 
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
  
  const processApiResponse = (apiResponse: ApiResponseType): RideOption[] => {
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
      
      return rides;
    } catch (error) {
      console.error('Error processing API response:', error);
      return [];
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
                label="Pick-up"
                value={source}
                onChangeText={setSource}
                iconColor={colors.secondary}
                onLocationSelect={handleSourceLocationSelect}
                onFocus={() => setActiveInput('source')}
              />
            </View>
            
            <View style={[styles.locationInputWrapper, { zIndex: 100 }]}>
              <LocationInput
                label="Drop-off"
                value={destination}
                onChangeText={setDestination}
                iconColor={colors.accent}
                onLocationSelect={handleDestinationLocationSelect}
                onFocus={() => setActiveInput('destination')}
              />
            </View>
            
            <Button
              title="Update Search"
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
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  locationInputs: {
    marginBottom: 15,
  },
  locationInputWrapper: {
    marginBottom: 10,
  },
  searchButton: {
    marginTop: 5,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  filterContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    paddingLeft: 5,
  },
  filtersScrollContent: {
    paddingHorizontal: 5,
    paddingBottom: 5,
    gap: 10,
  },
  ridesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  companySection: {
    marginBottom: 20,
  },
  companyHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    paddingLeft: 5,
  },
  updateButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#3371FF',
    alignSelf: 'stretch',
  },
});