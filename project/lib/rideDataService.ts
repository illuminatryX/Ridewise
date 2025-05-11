import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Path to the JSON file
const JSON_FILE_PATH = '/Users/dishanachar/Downloads/project/lib/rideData.json';

export interface RideData {
  // Must maintain this order for proper API compatibility
  start_place: string;
  destination_place: string;
  pickup_lat: number;     // Changed from pickup_latitude to match API
  pickup_lng: number;     // Changed from pickup_longitude to match API
  drop_lat: number;       // Changed from drop_latitude to match API
  drop_lng: number;       // Changed from drop_longitude to match API
}

// In-memory storage of ride data (single instance)
let currentRideData: RideData = {
  start_place: '',
  destination_place: '',
  pickup_lat: 0,      // Changed from pickup_latitude to match API
  pickup_lng: 0,      // Changed from pickup_longitude to match API
  drop_lat: 0,        // Changed from drop_latitude to match API
  drop_lng: 0         // Changed from drop_longitude to match API
};

/**
 * Updates the ride data with location information
 * @param sourceAddress The starting address
 * @param destinationAddress The destination address
 * @param sourceCoords The source coordinates {latitude, longitude}
 * @param destinationCoords The destination coordinates {latitude, longitude}
 * @returns Promise<RideData> The updated ride data
 */
export const updateRideData = async (
  sourceAddress: string,
  destinationAddress: string,
  sourceCoords: { latitude: number; longitude: number },
  destinationCoords: { latitude: number; longitude: number }
): Promise<RideData> => {
  try {
    // Update the in-memory ride data with explicit property order
    // Create a new object with properties in the exact order required by Rapido API
    const orderedRideData = {
      start_place: sourceAddress,
      destination_place: destinationAddress,
      pickup_lat: sourceCoords.latitude,      // Updated field name to match API
      pickup_lng: sourceCoords.longitude,     // Updated field name to match API
      drop_lat: destinationCoords.latitude,   // Updated field name to match API
      drop_lng: destinationCoords.longitude   // Updated field name to match API
    };
    
    // Ensure we maintain the correct property order
    currentRideData = orderedRideData;
    
    // Write to the physical JSON file
    const jsonString = JSON.stringify(currentRideData, null, 2);
    
    // Use fetch API to write to the JSON file via a simple server endpoint
    // This is a mock implementation that doesn't actually write to the file in development
    // but simulates what would happen in a production environment
    console.log('Would write to JSON file in production:', jsonString);
    
    // In a real app, you would use an API endpoint to update the JSON file
    // For development purposes, we'll log the data to update manually
    console.log('To update the file manually, replace the contents of rideData.json with:');
    console.log(jsonString);
    
    // For demo purposes, let's also print step-by-step instructions
    console.log('\n====== MANUAL UPDATE INSTRUCTIONS ======');
    console.log('1. Open the file: /Users/dishanachar/Downloads/project/lib/rideData.json');
    console.log('2. Replace ALL content with the JSON shown above');
    console.log('3. Save the file');
    console.log('================================\n');
    
    console.log('Ride data updated successfully:', currentRideData);
    return currentRideData;
  } catch (error) {
    console.error('Error updating ride data:', error);
    Alert.alert('Error', 'Failed to update ride data');
    throw error;
  }
};

/**
 * Gets the current ride data
 * @returns Promise<RideData> The current ride data
 */
export const getRideData = async (): Promise<RideData> => {
  // Simply return the in-memory data
  return currentRideData;
};

/**
 * Prepares ride data for API call
 * @returns Promise<RideData> The ride data ready for API
 */
export const getRideDataForApi = async (): Promise<RideData> => {
  return currentRideData;
};

/**
 * Updates a specific field in the ride data
 * @param field The field to update
 * @param value The new value
 */
export const updateRideDataField = async (
  field: keyof RideData,
  value: string | number
): Promise<void> => {
  try {
    // Type checking and validation
    if (typeof currentRideData[field] === 'number' && typeof value === 'string') {
      // Handle numeric fields
      (currentRideData as any)[field] = parseFloat(value);
    } else {
      // Handle string fields
      (currentRideData as any)[field] = value;
    }
    
    console.log(`Updated field ${field} to:`, value);
  } catch (error) {
    console.error(`Error updating field ${field}:`, error);
    Alert.alert('Error', `Failed to update ${field}`);
    throw error;
  }
};
