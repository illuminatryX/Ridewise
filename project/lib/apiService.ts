import { Alert } from 'react-native';
import { RideApiInput, ApiRideResponse } from '../types/rides';

const API_BASE_URL = 'https://b00dk70f-8000.inc1.devtunnels.ms';
const API_ENDPOINT = `${API_BASE_URL}/ride-options`;

/**
 * Helper function to fetch from an API and always log the raw response
 * @param url The URL to fetch from
 * @param options Fetch options
 * @returns The response or throws an error
 */
export const fetchWithLogging = async (url: string, options: RequestInit = {}) => {
  try {
    // Fetch response as efficiently as possible
    const response = await fetch(url, options);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    
    // Get the text response
    const text = await response.text();
    
    // Parse as JSON if the content type is JSON
    let parsedData;
    if (isJson && text) {
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }
    
    return { response, text, parsedData };
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Fetches ride prices from the API
 * @param rideData The ride data to send to the API
 * @returns Promise<ApiResponse<ApiRideResponse>> The API response
 */
export const fetchRidePrices = async (rideData: RideApiInput): Promise<ApiResponse<ApiRideResponse>> => {
  try {
    console.log('Fetching ride prices from API with data:', rideData);
    
    // Validate input data to ensure we don't send empty or invalid values
    if (!rideData.start_place || !rideData.destination_place) {
      console.error('Missing location names in ride data');
      throw new Error('Missing source or destination location names');
    }
    
    if (rideData.pickup_lat === 0 || rideData.pickup_lng === 0 ||
        rideData.drop_lat === 0 || rideData.drop_lng === 0) {
      console.error('Invalid coordinates in ride data (zeros detected)');
      throw new Error('Invalid location coordinates');
    }
    
    // Create a new ordered object with the exact property order required by the API
    // This ensures properties are added to URLSearchParams in the correct order
    const orderedRideData = {
      start_place: rideData.start_place.trim(),
      destination_place: rideData.destination_place.trim(),
      pickup_lat: rideData.pickup_lat,
      pickup_lng: rideData.pickup_lng,
      drop_lat: rideData.drop_lat,
      drop_lng: rideData.drop_lng
    };
    
    // Convert the ride data to URL query parameters with the correct parameter names
    // Using the ordered object to maintain proper parameter order
    const params = new URLSearchParams();
    
    // Add parameters in the specific order (needed for some APIs)
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

    // Build the URL
    const url = `${API_ENDPOINT}?${params.toString()}`;
    console.log('Fetching ride prices from URL:', url);
    
    // Use our new fetchWithLogging function to ensure we always log the raw response
    const { response, text, parsedData } = await fetchWithLogging(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} - ${text}`);
    }
    
    // Return a standardized response using the parsed data
    return {
      success: true,
      data: parsedData
    };
    
  } catch (error: any) {
    console.error('Error fetching ride prices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null
    };
  }
};
