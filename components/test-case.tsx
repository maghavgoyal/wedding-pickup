"use client"

import { useState, useEffect } from "react"
import { useWorkflow } from "@/context/workflow-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

// Sample CSV data for testing
const sampleCsvData = [
  // Test Case 1: Multiple pickups at same time, location (Airport 14:30)
  {
    name: "John Smith",
    email: "john@example.com",
    phone: "+1234567890",
    pickupLocation: "Airport",
    arrivalDate: "2024-03-20",
    arrivalTime: "14:30",
    numberOfGuests: 2,
  },
  {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1987654321",
    pickupLocation: "Airport",
    arrivalDate: "2024-03-20",
    arrivalTime: "14:30",
    numberOfGuests: 3,
  },
  {
    name: "Charlie Brown",
    email: "charlie@example.com",
    phone: "+1888999000",
    pickupLocation: "Airport",
    arrivalDate: "2024-03-20",
    arrivalTime: "14:30",
    numberOfGuests: 4,
  },
  // Test Case 2: Single pickup within driver capacity
  {
    name: "Alice Williams",
    email: "alice@example.com",
    phone: "+1555666777",
    pickupLocation: "Hotel Downtown",
    arrivalDate: "2024-03-20",
    arrivalTime: "15:15",
    numberOfGuests: 2,
  },
  // Test Case 3: Large group exceeding single driver capacity
  {
    name: "Family Group",
    email: "family@example.com",
    phone: "+1444555666",
    pickupLocation: "Train Station",
    arrivalDate: "2024-03-20",
    arrivalTime: "16:00",
    numberOfGuests: 8,
  },
  // Test Case 4: Multiple pickups close in time (within 30-min window)
  {
    name: "Quick Pickup 1",
    email: "quick1@example.com",
    phone: "+1777888999",
    pickupLocation: "Airport",
    arrivalDate: "2024-03-20",
    arrivalTime: "17:00",
    numberOfGuests: 2,
  },
  {
    name: "Quick Pickup 2",
    email: "quick2@example.com",
    phone: "+1777888990",
    pickupLocation: "Airport",
    arrivalDate: "2024-03-20",
    arrivalTime: "17:15",
    numberOfGuests: 1,
  },
  {
    name: "Quick Pickup 3",
    email: "quick3@example.com",
    phone: "+1777888991",
    pickupLocation: "Airport",
    arrivalDate: "2024-03-20",
    arrivalTime: "17:25",
    numberOfGuests: 1,
  },
  // Test Case 5: Late night pickup
  {
    name: "Late Arrival",
    email: "late@example.com",
    phone: "+1123456789",
    pickupLocation: "Airport",
    arrivalDate: "2024-03-20",
    arrivalTime: "23:45",
    numberOfGuests: 2,
  },
  // Test Case 6: Early morning next day
  {
    name: "Early Bird",
    email: "early@example.com",
    phone: "+1987654322",
    pickupLocation: "Train Station",
    arrivalDate: "2024-03-21",
    arrivalTime: "05:30",
    numberOfGuests: 1,
  },
  // Test Case 7: Multiple locations same time
  {
    name: "Hotel Guest",
    email: "hotel@example.com",
    phone: "+1222333444",
    pickupLocation: "Hotel Downtown",
    arrivalDate: "2024-03-20",
    arrivalTime: "17:00",
    numberOfGuests: 3,
  },
  // Test Case 8: Multiple pickups at Train Station within 30-min window
  {
    name: "Train Guest 1",
    email: "train1@example.com",
    phone: "+1333444555",
    pickupLocation: "Train Station",
    arrivalDate: "2024-03-20",
    arrivalTime: "18:00",
    numberOfGuests: 2,
  },
  {
    name: "Train Guest 2",
    email: "train2@example.com",
    phone: "+1333444556",
    pickupLocation: "Train Station",
    arrivalDate: "2024-03-20",
    arrivalTime: "18:20",
    numberOfGuests: 1,
  }
]

// Add dummy itinerary data
const dummyItinerary = [
  // Test Case 1: Multiple drivers for simultaneous Airport pickups
  {
    id: "itinerary-1",
    driverId: "driver-1",
    pickupLocation: "Airport",
    pickupTime: "2024-03-20T14:30:00",
    guests: [
      {
        name: "John Smith",
        numberOfGuests: 2
      }
    ],
    totalGuests: 2
  },
  {
    id: "itinerary-2",
    driverId: "driver-2",
    pickupLocation: "Airport",
    pickupTime: "2024-03-20T14:30:00",
    guests: [
      {
        name: "Jane Doe",
        numberOfGuests: 3
      }
    ],
    totalGuests: 3
  },
  {
    id: "itinerary-3",
    driverId: "driver-3",
    pickupLocation: "Airport",
    pickupTime: "2024-03-20T14:30:00",
    guests: [
      {
        name: "Charlie Brown",
        numberOfGuests: 4
      }
    ],
    totalGuests: 4
  },
  // Test Case 2: Single pickup within capacity
  {
    id: "itinerary-4",
    driverId: "driver-1",
    pickupLocation: "Hotel Downtown",
    pickupTime: "2024-03-20T15:15:00",
    guests: [
      {
        name: "Alice Williams",
        numberOfGuests: 2
      }
    ],
    totalGuests: 2
  },
  // Test Case 3: Split large group across drivers
  {
    id: "itinerary-5",
    driverId: "driver-2",
    pickupLocation: "Train Station",
    pickupTime: "2024-03-20T16:00:00",
    guests: [
      {
        name: "Family Group",
        numberOfGuests: 4
      }
    ],
    totalGuests: 4
  },
  {
    id: "itinerary-6",
    driverId: "driver-3",
    pickupLocation: "Train Station",
    pickupTime: "2024-03-20T16:00:00",
    guests: [
      {
        name: "Family Group",
        numberOfGuests: 4
      }
    ],
    totalGuests: 4
  },
  // Test Case 4 & 7: Multiple locations and close timing
  {
    id: "itinerary-7",
    driverId: "driver-1",
    pickupLocation: "Airport",
    pickupTime: "2024-03-20T17:00:00",
    guests: [
      {
        name: "Quick Pickup 1",
        numberOfGuests: 2
      },
      {
        name: "Quick Pickup 2",
        numberOfGuests: 1
      },
      {
        name: "Quick Pickup 3",
        numberOfGuests: 1
      }
    ],
    totalGuests: 4,
    waitTime: 25 // minutes waited for all passengers
  },
  {
    id: "itinerary-8",
    driverId: "driver-2",
    pickupLocation: "Hotel Downtown",
    pickupTime: "2024-03-20T17:00:00",
    guests: [
      {
        name: "Hotel Guest",
        numberOfGuests: 3
      }
    ],
    totalGuests: 3
  },
  // Test Case 8: Combined Train Station pickups within 30-min window
  {
    id: "itinerary-9",
    driverId: "driver-3",
    pickupLocation: "Train Station",
    pickupTime: "2024-03-20T18:00:00",
    guests: [
      {
        name: "Train Guest 1",
        numberOfGuests: 2
      },
      {
        name: "Train Guest 2",
        numberOfGuests: 1
      }
    ],
    totalGuests: 3,
    waitTime: 20 // minutes waited for all passengers
  },
  // Test Case 5: Late night pickup
  {
    id: "itinerary-10",
    driverId: "driver-1",
    pickupLocation: "Airport",
    pickupTime: "2024-03-20T23:45:00",
    guests: [
      {
        name: "Late Arrival",
        numberOfGuests: 2
      }
    ],
    totalGuests: 2
  },
  // Test Case 6: Early morning next day
  {
    id: "itinerary-11",
    driverId: "driver-2",
    pickupLocation: "Train Station",
    pickupTime: "2024-03-21T05:30:00",
    guests: [
      {
        name: "Early Bird",
        numberOfGuests: 1
      }
    ],
    totalGuests: 1
  }
]

export function TestCase() {
  const {
    setCsvData,
    setSelectedCsvFile,
    locationTimings,
    setLocationTimings,
    driverCapacity,
    setDriverCapacity,
    drivers,
    setDrivers,
    setItinerary,
    currentStep,
    setCurrentStep
  } = useWorkflow()

  const [isLoading, setIsLoading] = useState(false)

  // Step 1: Load sample CSV data
  const loadSampleData = async () => {
    setIsLoading(true)
    try {
      setCsvData(sampleCsvData)
      setSelectedCsvFile("sample_wedding_guests.csv")
      setCurrentStep("review")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Extract locations and set round-trip times
  useEffect(() => {
    if (currentStep === "review") {
      const locations = [...new Set(sampleCsvData.map((guest) => guest.pickupLocation))]
      setLocationTimings(
        locations.map((location) => ({
          location,
          roundTripMinutes: location === "Airport" ? 90 : location === "Train Station" ? 60 : 45,
        })),
      )
      setDriverCapacity({ maxPassengers: 4 })
    }
  }, [currentStep, setLocationTimings, setDriverCapacity])

  // Step 3: Add sample drivers
  const addSampleDrivers = async () => {
    setIsLoading(true)
    try {
      setDrivers([
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
        },
      ])
      setCurrentStep("itinerary")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 4: Set dummy itinerary
  const setDummyItinerary = async () => {
    setIsLoading(true)
    try {
      setItinerary(dummyItinerary)
      setCurrentStep("communication")
    } finally {
      setIsLoading(false)
    }
  }

  // Map workflow steps to tab values
  const stepToTab = {
    upload: "step-1",
    review: "step-2",
    itinerary: "step-3",
    communication: "step-4"
  }

  // Map tab values to workflow steps
  const tabToStep = {
    "step-1": "upload",
    "step-2": "review",
    "step-3": "itinerary",
    "step-4": "communication"
  } as const

  const handleTabChange = (value: string) => {
    setCurrentStep(tabToStep[value as keyof typeof tabToStep])
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Workflow</CardTitle>
          <CardDescription>Step through the workflow with sample data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={stepToTab[currentStep]} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="step-1">1. Load Data</TabsTrigger>
              <TabsTrigger value="step-2">2. Review</TabsTrigger>
              <TabsTrigger value="step-3">3. Drivers</TabsTrigger>
              <TabsTrigger value="step-4">4. Itinerary</TabsTrigger>
            </TabsList>

            <TabsContent value="step-1">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">Sample CSV Data</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                  {JSON.stringify(sampleCsvData, null, 2)}
                </pre>
                <Button onClick={loadSampleData} className="mt-4" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Load Sample Data"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="step-2">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">Extracted Locations & Round-Trip Times</h3>
                <div className="grid grid-cols-2 gap-4">
                  {locationTimings.map((timing, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="font-medium">{timing.location}</div>
                      <div className="text-sm text-muted-foreground">
                        Round-trip time: {timing.roundTripMinutes} minutes
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 border rounded-md">
                  <div className="font-medium">Driver Capacity</div>
                  <div className="text-sm text-muted-foreground">
                    Maximum passengers per vehicle: {driverCapacity.maxPassengers}
                  </div>
                </div>
                <Button onClick={addSampleDrivers} className="mt-4" disabled={locationTimings.length === 0 || isLoading}>
                  {isLoading ? "Adding Drivers..." : "Continue to Drivers"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="step-3">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">Sample Drivers</h3>
                <div className="grid grid-cols-2 gap-4">
                  {drivers.map((driver, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="font-medium">{driver.name}</div>
                      <div className="text-sm text-muted-foreground">Phone: {driver.phone}</div>
                      <div className="text-sm text-muted-foreground">
                        Vehicle capacity: {driver.vehicleCapacity} passengers
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={setDummyItinerary} className="mt-4" disabled={drivers.length === 0 || isLoading}>
                  {isLoading ? "Setting Itinerary..." : "Set Dummy Itinerary"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="step-4">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">Generated Itinerary</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                  {JSON.stringify(dummyItinerary, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
