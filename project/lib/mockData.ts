export type RideData = {
  id: string;
  company: string;
  fleetType: string;
  eta: string;
  price: string;
};

export const fleetTypes = [
  'All',
  'Bike',
  'Auto',
  'Mini',
  'Prime',
  'XL',
];

export const generateMockRides = (
  sourceLocation: string,
  destinationLocation: string
): RideData[] => {
  // This function would normally call an external API
  // For demo purposes, we'll generate mock data
  
  const mockRides: RideData[] = [
    {
      id: '1',
      company: 'Uber',
      fleetType: 'Mini',
      eta: '3 mins',
      price: '₹149',
    },
    {
      id: '2',
      company: 'Uber',
      fleetType: 'Prime',
      eta: '4 mins',
      price: '₹199',
    },
    {
      id: '3',
      company: 'Ola',
      fleetType: 'Mini',
      eta: '5 mins',
      price: '₹145',
    },
    {
      id: '4',
      company: 'Ola',
      fleetType: 'Prime',
      eta: '6 mins',
      price: '₹189',
    },
    {
      id: '5',
      company: 'Rapido',
      fleetType: 'Bike',
      eta: '2 mins',
      price: '₹79',
    },
    {
      id: '6',
      company: 'Ola',
      fleetType: 'Auto',
      eta: '4 mins',
      price: '₹120',
    },
    {
      id: '7',
      company: 'Uber',
      fleetType: 'XL',
      eta: '8 mins',
      price: '₹299',
    },
    {
      id: '8',
      company: 'Rapido',
      fleetType: 'Auto',
      eta: '3 mins',
      price: '₹115',
    },
  ];
  
  return mockRides;
};