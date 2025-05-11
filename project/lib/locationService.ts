// Location service for autocomplete suggestions
// Using OpenStreetMap Nominatim API for geocoding

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Function to get location suggestions based on search text
export async function getLocationSuggestions(searchText: string): Promise<LocationSuggestion[]> {
  if (!searchText || searchText.length < 3) {
    return [];
  }

  try {
    // Use OpenStreetMap Nominatim API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchText
      )}&limit=5&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      id: item.place_id,
      name: item.display_name.split(',')[0],
      address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
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

// Function to geocode an address string to coordinates
export async function geocodeAddress(address: string): Promise<{latitude: number, longitude: number} | null> {
  if (!address) return null;
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }
    
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}
