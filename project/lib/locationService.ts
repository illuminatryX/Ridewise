// Location service for autocomplete suggestions
// Using OpenStreetMap Nominatim API for geocoding

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Cache for location suggestions to avoid redundant API calls
const suggestionsCache: { [key: string]: { data: LocationSuggestion[], timestamp: number } } = {};

// Cache expiration in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Function to get location suggestions based on search text with caching
export async function getLocationSuggestions(searchText: string): Promise<LocationSuggestion[]> {
  if (!searchText || searchText.length < 3) {
    return [];
  }

  // Normalize search text for caching
  const normalizedSearchText = searchText.trim().toLowerCase();
  
  // Check cache first
  const cachedResult = suggestionsCache[normalizedSearchText];
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRATION) {
    return cachedResult.data;
  }

  try {
    // Use OpenStreetMap Nominatim API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        normalizedSearchText
      )}&limit=5`
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    const processedData = data.map((item: any) => ({
      id: item.place_id,
      name: item.display_name.split(',')[0],
      address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    // Store in cache
    suggestionsCache[normalizedSearchText] = {
      data: processedData,
      timestamp: Date.now()
    };
    
    return processedData;
  } catch (error) {
    // Return empty array without logging on error to reduce console noise
    return [];
  }
}

// Function to get route between two locations
export async function getRoute(
  startLat: number, 
  startLon: number, 
  endLat: number, 
  endLon: number
): Promise<any> {
  try {
    // Use OpenStreetMap OSRM API for routing
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

// Cache for geocoded addresses
const geocodeCache: { [key: string]: { data: {latitude: number, longitude: number} | null, timestamp: number } } = {};

// Function to geocode an address string to coordinates with caching
export async function geocodeAddress(address: string): Promise<{latitude: number, longitude: number} | null> {
  if (!address) return null;
  
  // Normalize address for caching
  const normalizedAddress = address.trim().toLowerCase();
  
  // Check cache first
  const cachedResult = geocodeCache[normalizedAddress];
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRATION) {
    return cachedResult.data;
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedAddress)}&limit=1`
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    let result = null;
    if (data.length > 0) {
      result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    // Store in cache
    geocodeCache[normalizedAddress] = {
      data: result,
      timestamp: Date.now()
    };
    
    return result;
  } catch (error) {
    // Return null without logging to reduce console noise
    return null;
  }
}
