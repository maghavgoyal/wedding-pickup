"use client"

import { useState, useEffect } from "react"
import { useWorkflow } from "@/context/workflow-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

// Sample CSV data for testing
const sampleCsvData = [
  {
    name: "John Smith",
    email: "john@example.com",
    phone: "+1234567890",
    pickupLocation: "Airport",
    arrivalDate: "2023-06-15",
    arrivalTime: "14:30",
    numberOfGuests: 2,
  },
  {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1987654321",
    pickupLocation: "Airport",
    arrivalDate: "2023-06-15",
    arrivalTime: "15:45",
    numberOfGuests: 1,
  },
  {
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "+1122334455",
    pickupLocation: "Train Station",
    arrivalDate: "2023-06-15",
    arrivalTime: "16:30",
    numberOfGuests: 3,
  },
  {
    name: "Alice Williams",
    email: "alice@example.com",
    phone: "+1555666777",
    pickupLocation: "Hotel Downtown",
    arrivalDate: "2023-06-16",
    arrivalTime: "09:15",
    numberOfGuests: 2,
  },
  {
    name: "Charlie Brown",
    email: "charlie@example.com",
    phone: "+1888999000",
    pickupLocation: "Train Station",
    arrivalDate: "2023-06-16",
    arrivalTime: "10:45",
    numberOfGuests: 4,
  },
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
  } = useWorkflow()

  const [currentStep, setCurrentStep] = useState(1)
  const [itinerary, setItinerary] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Step 1: Load sample CSV data
  const loadSampleData = () => {
    setCsvData(sampleCsvData)
    setSelectedCsvFile("sample_wedding_guests.csv")
    setCurrentStep(2)
  }

  // Step 2: Extract locations and set round-trip times
  useEffect(() => {
    if (currentStep === 2) {
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
  const addSampleDrivers = () => {
    setDrivers([
      {
        id: "driver-1",
        name: "Driver One",
        phone: "+1111111111",
        vehicleCapacity: 4,
      },
      {
        id: "driver-2",
        name: "Driver Two",
        phone: "+2222222222",
        vehicleCapacity: 6,
      },
    ])
    setCurrentStep(3)
  }

  // Step 4: Generate itinerary
  const generateItinerary = () => {
    setIsLoading(true)

    // Simulate processing time
    setTimeout(() => {
      // Group guests by pickup location
      const guestsByLocation: Record<string, typeof sampleCsvData> = {}

      sampleCsvData.forEach((guest) => {
        if (!guestsByLocation[guest.pickupLocation]) {
          guestsByLocation[guest.pickupLocation] = []
        }
        guestsByLocation[guest.pickupLocation].push(guest)
      })

      // Sort locations by round trip time (descending)
      const sortedLocations = locationTimings
        .sort((a, b) => b.roundTripMinutes - a.roundTripMinutes)
        .map((timing) => timing.location)

      // Generate itinerary items
      const newItinerary: any[] = []
      let currentDriverIndex = 0

      sortedLocations.forEach((location) => {
        const guests = guestsByLocation[location] || []
        const remainingGuests = [...guests]

        while (remainingGuests.length > 0) {
          // If we have drivers
          if (drivers.length > 0) {
            const driver = drivers[currentDriverIndex % drivers.length]
            currentDriverIndex++

            // Calculate how many guests this driver can take
            let currentCapacity = driver.vehicleCapacity
            const assignedGuests: typeof remainingGuests = []

            // Assign guests to this driver until capacity is reached
            while (currentCapacity > 0 && remainingGuests.length > 0) {
              const guest = remainingGuests[0]
              const guestCount = Number.parseInt(guest.numberOfGuests.toString()) || 1

              if (guestCount <= currentCapacity) {
                assignedGuests.push(guest)
                currentCapacity -= guestCount
                remainingGuests.shift()
              } else {
                // If this guest has too many people, skip for now
                break
              }
            }

            if (assignedGuests.length > 0) {
              // Calculate total guests
              const totalGuests = assignedGuests.reduce(
                (sum, guest) => sum + (Number.parseInt(guest.numberOfGuests.toString()) || 1),
                0,
              )

              // Create an itinerary item
              newItinerary.push({
                id: `itinerary-${Date.now()}-${Math.random()}`,
                driverId: driver.id,
                driverName: driver.name,
                driverPhone: driver.phone,
                pickupLocation: location,
                pickupTime: assignedGuests[0].arrivalTime, // Simplified
                guests: assignedGuests.map((g) => ({
                  name: g.name,
                  numberOfGuests: Number.parseInt(g.numberOfGuests.toString()) || 1,
                })),
                totalGuests,
                roundTripMinutes: locationTimings.find((lt) => lt.location === location)?.roundTripMinutes || 60,
              })
            }
          }
        }
      })

      setItinerary(newItinerary)
      setIsLoading(false)
      setCurrentStep(4)
    }, 1500)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Wedding Travel System Test Case</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={`step-${currentStep}`} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="step-1">Step 1: CSV Upload</TabsTrigger>
            <TabsTrigger value="step-2">Step 2: Data Review</TabsTrigger>
            <TabsTrigger value="step-3">Step 3: Drivers</TabsTrigger>
            <TabsTrigger value="step-4">Step 4: Itinerary</TabsTrigger>
          </TabsList>

          <TabsContent value="step-1" className="space-y-4">
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-4">Sample CSV Data</h3>
              <ScrollArea className="h-[300px]">
                <pre className="text-xs">{JSON.stringify(sampleCsvData, null, 2)}</pre>
              </ScrollArea>
              <Button onClick={loadSampleData} className="mt-4">
                Load Sample Data
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="step-2" className="space-y-4">
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
              <Button onClick={addSampleDrivers} className="mt-4" disabled={locationTimings.length === 0}>
                Continue to Drivers
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="step-3" className="space-y-4">
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
              <Button onClick={generateItinerary} className="mt-4" disabled={drivers.length === 0 || isLoading}>
                {isLoading ? "Generating..." : "Generate Itinerary"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="step-4" className="space-y-4">
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-4">Generated Itinerary</h3>
              {itinerary.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No itinerary generated yet</div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {itinerary.map((item, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="font-medium">Pickup: {item.pickupLocation}</div>
                            <div className="text-sm text-muted-foreground">
                              Time: {item.pickupTime} | Round-trip: {item.roundTripMinutes} minutes
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{item.driverName}</div>
                            <div className="text-sm text-muted-foreground">{item.driverPhone}</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="font-medium">Guests ({item.totalGuests} total):</div>
                          <ul className="list-disc list-inside">
                            {item.guests.map((guest: any, guestIndex: number) => (
                              <li key={guestIndex} className="text-sm">
                                {guest.name} ({guest.numberOfGuests} {guest.numberOfGuests > 1 ? "people" : "person"})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
