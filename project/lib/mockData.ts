export type RideData = {
  id: string;
  company: string;
  fleetType: string;
  eta: string;
  price: string;
  category?: string; // Add category field for grouping
};

// Define categories and their associated fleet types
export type FilterCategory = {
  name: string;
  types: string[];
};

export const fleetCategories: FilterCategory[] = [
  {
    name: 'All',
    types: [] // Special case - matches everything
  },
  {
    name: 'Two-Wheeler',
    types: ['Bike', 'Moto', 'Moto Saver']
  },
  {
    name: 'Auto',
    types: ['Auto']
  },
  {
    name: 'Economy',
    types: ['Mini', 'Uber Go', 'Go Sedan']
  },
  {
    name: 'Standard',
    types: ['Cab Non AC', 'Prime', 'Premier']
  },
  {
    name: 'Premium',
    types: ['Cab Premium', 'Black', 'Uber Pet']
  },
  {
    name: 'Large',
    types: ['XL', 'UberXL', 'XL+ (Innova)']
  }
];

// For backward compatibility
export const fleetTypes = ['All', ...fleetCategories.flatMap(category => 
  category.name !== 'All' ? [category.name, ...category.types] : []
)];

// Helper function to generate mock ride data
export const generateMockRides = (source: string, destination: string): RideData[] => {
  const mockRides: RideData[] = [
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
  ];
  
  return mockRides;
};

/**
 * Generate a mock API response that matches the format we expect from the API
 * This is useful for testing when the API is not available
 * @param source Source location
 * @param destination Destination location
 * @param sourceLat Source latitude
 * @param sourceLng Source longitude
 * @param destLat Destination latitude
 * @param destLng Destination longitude
 * @returns An ApiRideResponse object that mimics the real API response
 */
export const generateMockApiResponse = (
  source: string, 
  destination: string,
  sourceLat: number,
  sourceLng: number,
  destLat: number,
  destLng: number
): ApiRideResponse => {
  return {
    "Rapido": {
      "service": "Rapido",
      "start": source,
      "destination": destination,
      "options": [
        {
          "fleet": "Bike",
          "fare": "₹120"
        },
        {
          "fleet": "Auto",
          "fare": "₹200"
        }
      ]
    },
    "Uber": {
      "service": "Uber",
      "pickup": [sourceLat, sourceLng],
      "drop": [destLat, destLng],
      "options": [
        {
          "fleet": "Uber Go4",
          "price": "₹289"
        },
        {
          "fleet": "Moto1",
          "price": "₹120"
        },
        {
          "fleet": "Premier4",
          "price": "₹349"
        },
        {
          "fleet": "Auto3",
          "price": "₹180"
        },
        {
          "fleet": "UberXL6",
          "price": "₹480"
        },
        {
          "fleet": "Go Sedan4",
          "price": "₹310"
        }
      ]
    }
  };
};

// Helper function to determine category based on fleet type
function getCategoryForFleetType(fleetType: string): string {
  for (const category of fleetCategories) {
    if (category.types.some(type => 
      fleetType.includes(type) || type.includes(fleetType)
    )) {
      return category.name;
    }
  }
  return 'Other'; // Default category if no match found
}