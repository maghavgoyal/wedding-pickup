// Test data for itinerary generation testing

export const testCsvData = [
  // Airport pickups - multiple groups with different sizes
  {
    name: "Airport Group 1",
    pickupLocation: "Airport",
    numberOfGuests: 4,
    arrivalDate: "2024-03-20",
    arrivalTime: "14:30"
  },
  {
    name: "Airport Group 2",
    pickupLocation: "Airport",
    numberOfGuests: 3,
    arrivalDate: "2024-03-20",
    arrivalTime: "14:30"
  },
  {
    name: "Airport Group 3",
    pickupLocation: "Airport",
    numberOfGuests: 2,
    arrivalDate: "2024-03-20",
    arrivalTime: "14:30"
  },
  // Hotel pickups - testing capacity limits
  {
    name: "Hotel Group 1",
    pickupLocation: "Hotel Downtown",
    numberOfGuests: 6,
    arrivalDate: "2024-03-20",
    arrivalTime: "15:00"
  },
  {
    name: "Hotel Group 2",
    pickupLocation: "Hotel Downtown",
    numberOfGuests: 2,
    arrivalDate: "2024-03-20",
    arrivalTime: "15:00"
  },
  // Train Station pickups - testing time windows
  {
    name: "Train Group 1",
    pickupLocation: "Train Station",
    numberOfGuests: 3,
    arrivalDate: "2024-03-20",
    arrivalTime: "16:00"
  },
  {
    name: "Train Group 2",
    pickupLocation: "Train Station",
    numberOfGuests: 2,
    arrivalDate: "2024-03-20",
    arrivalTime: "16:15"
  },
  {
    name: "Train Group 3",
    pickupLocation: "Train Station",
    numberOfGuests: 4,
    arrivalDate: "2024-03-20",
    arrivalTime: "16:30"
  },
  // Late night pickups
  {
    name: "Late Night Group",
    pickupLocation: "Airport",
    numberOfGuests: 2,
    arrivalDate: "2024-03-20",
    arrivalTime: "23:45"
  },
  // Early morning pickups
  {
    name: "Early Morning Group",
    pickupLocation: "Train Station",
    numberOfGuests: 1,
    arrivalDate: "2024-03-21",
    arrivalTime: "05:30"
  }
];

export const testLocationTimings = [
  {
    location: "Airport",
    roundTripMinutes: 90 // Longest trip time
  },
  {
    location: "Train Station",
    roundTripMinutes: 60 // Medium trip time
  },
  {
    location: "Hotel Downtown",
    roundTripMinutes: 45 // Shortest trip time
  }
];

export const testDrivers = [
  {
    id: "driver-1",
    name: "Driver One",
    phone: "+1111111111",
    vehicleCapacity: 4,
    availability: "24/7"
  },
  {
    id: "driver-2",
    name: "Driver Two",
    phone: "+2222222222",
    vehicleCapacity: 6,
    availability: "Day Shift (6 AM - 6 PM)"
  },
  {
    id: "driver-3",
    name: "Driver Three",
    phone: "+3333333333",
    vehicleCapacity: 4,
    availability: "Night Shift (2 PM - 2 AM)"
  }
];

// Expected itinerary structure for verification
export const expectedItinerary = [
  // Airport pickups (14:30) - split across drivers due to capacity
  {
    id: "itinerary-1",
    driverId: "driver-1",
    pickupLocation: "Airport",
    pickupTime: "14:30",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Airport Group 1",
        numberOfGuests: 4
      }
    ],
    totalGuests: 4
  },
  {
    id: "itinerary-2",
    driverId: "driver-2",
    pickupLocation: "Airport",
    pickupTime: "14:30",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Airport Group 2",
        numberOfGuests: 3
      }
    ],
    totalGuests: 3
  },
  {
    id: "itinerary-3",
    driverId: "driver-3",
    pickupLocation: "Airport",
    pickupTime: "14:30",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Airport Group 3",
        numberOfGuests: 2
      }
    ],
    totalGuests: 2
  },
  // Hotel pickups (15:00) - testing capacity limits
  {
    id: "itinerary-4",
    driverId: "driver-2",
    pickupLocation: "Hotel Downtown",
    pickupTime: "15:00",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Hotel Group 1",
        numberOfGuests: 6
      }
    ],
    totalGuests: 6
  },
  {
    id: "itinerary-5",
    driverId: "driver-1",
    pickupLocation: "Hotel Downtown",
    pickupTime: "15:00",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Hotel Group 2",
        numberOfGuests: 2
      }
    ],
    totalGuests: 2
  },
  // Train Station pickups (16:00-16:30) - testing time windows
  {
    id: "itinerary-6",
    driverId: "driver-3",
    pickupLocation: "Train Station",
    pickupTime: "16:00",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Train Group 1",
        numberOfGuests: 3
      }
    ],
    totalGuests: 3
  },
  {
    id: "itinerary-7",
    driverId: "driver-1",
    pickupLocation: "Train Station",
    pickupTime: "16:15",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Train Group 2",
        numberOfGuests: 2
      }
    ],
    totalGuests: 2
  },
  {
    id: "itinerary-8",
    driverId: "driver-2",
    pickupLocation: "Train Station",
    pickupTime: "16:30",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Train Group 3",
        numberOfGuests: 4
      }
    ],
    totalGuests: 4
  },
  // Late night pickup
  {
    id: "itinerary-9",
    driverId: "driver-3",
    pickupLocation: "Airport",
    pickupTime: "23:45",
    arrivalDate: "2024-03-20",
    guests: [
      {
        name: "Late Night Group",
        numberOfGuests: 2
      }
    ],
    totalGuests: 2
  },
  // Early morning pickup
  {
    id: "itinerary-10",
    driverId: "driver-1",
    pickupLocation: "Train Station",
    pickupTime: "05:30",
    arrivalDate: "2024-03-21",
    guests: [
      {
        name: "Early Morning Group",
        numberOfGuests: 1
      }
    ],
    totalGuests: 1
  }
]; 