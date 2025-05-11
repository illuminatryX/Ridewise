import { fetchRidePrices } from './apiService';
import { RideApiInput } from '../types/rides';

/**
 * A test function to verify our API integration is working correctly
 */
export const testApiIntegration = async () => {
  const testRideData: RideApiInput = {
    start_place: 'Test Start',
    destination_place: 'Test Destination',
    pickup_latitude: 12.9716,
    pickup_longitude: 77.5946,
    drop_latitude: 13.0836,
    drop_longitude: 77.6729
  };

  try {
    console.log('🧪 Testing API integration with data:', testRideData);
    const response = await fetchRidePrices(testRideData);
    console.log('✅ API test successful! Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('❌ API test failed:', error);
    throw error;
  }
};
