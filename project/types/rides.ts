// Input data format for the Ride API - field names must exactly match API requirements
export interface RideApiInput {
  // Must maintain this order for proper API compatibility
  start_place: string;
  destination_place: string;
  pickup_lat: number; // Changed from pickup_latitude to match API
  pickup_lng: number; // Changed from pickup_longitude to match API
  drop_lat: number;   // Changed from drop_latitude to match API
  drop_lng: number;   // Changed from drop_longitude to match API
}

// Display format for ride options in the UI
export interface RideOption {
  id: string;
  company: string;
  fleetType: string;
  eta: string;
  price: string;
  category?: string;
}

// API response format - more flexible to handle different formats
export interface ApiRideResponse {
  // Standard nested format we expect
  Rapido?: {
    service: string;
    start: string;
    destination: string;
    options: {
      fleet: string;
      fare: string;
    }[];
  };
  Uber?: {
    service: string;
    pickup: number[];
    drop: number[];
    options: {
      fleet: string;
      price: string;
    }[];
  };
  
  // Alternative formats the API might return
  status?: string;
  message?: string;
  data?: any; // In case API uses a data wrapper
  results?: any; // Another common wrapper
  error?: any; // Error information
  
  // Allow any additional properties we might not expect
  [key: string]: any;
}
