"use client"

import { useState } from "react"
import { useWorkflow } from "@/context/workflow-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2 } from "lucide-react"

// Define a type for the itinerary
interface ItineraryItem {
  id: string
  driverId: string
  pickupLocation: string
  pickupTime: string
  guests: {
    name: string
    numberOfGuests: number
  }[]
  totalGuests: number
}

export const ItineraryStep = () => {
  const { csvData, setCurrentStep, locationTimings, driverCapacity, drivers, setDrivers } = useWorkflow()

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [newDriver, setNewDriver] = useState({ name: "", phone: "", vehicleCapacity: driverCapacity.maxPassengers })
  const [isGenerating, setIsGenerating] = useState(false)

  // Function to add a new driver
  const addDriver = () => {
    if (newDriver.name && newDriver.phone) {
      const newDriverWithId = {
        ...newDriver,
        id: `driver-${Date.now()}`,
        vehicleCapacity: Number.parseInt(newDriver.vehicleCapacity.toString()) || driverCapacity.maxPassengers,
      }

      setDrivers([...drivers, newDriverWithId])
      setNewDriver({ name: "", phone: "", vehicleCapacity: driverCapacity.maxPassengers })
    }
  }

  // Function to remove a driver
  const removeDriver = (id: string) => {
    setDrivers(drivers.filter((driver) => driver.id !== id))
  }

  // Function to generate the itinerary
  const generateItinerary = () => {
    setIsGenerating(true)

    // Simulate a loading state
    setTimeout(() => {
      // This is a simplified algorithm for demonstration
      // In a real application, you would need a more sophisticated algorithm

      // Group guests by pickup location
      const guestsByLocation: Record<string, typeof csvData> = {}

      csvData.forEach((guest) => {
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
      const newItinerary: ItineraryItem[] = []
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
                // In a real app, you might want to split the group
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
                pickupLocation: location,
                pickupTime: assignedGuests[0].arrivalTime, // Simplified
                guests: assignedGuests.map((g) => ({
                  name: g.name,
                  numberOfGuests: Number.parseInt(g.numberOfGuests.toString()) || 1,
                })),
                totalGuests,
              })
            }
          } else {
            // If no drivers, create placeholder itinerary items
            const guest = remainingGuests[0]
            newItinerary.push({
              id: `itinerary-${Date.now()}-${Math.random()}`,
              driverId: "placeholder",
              pickupLocation: location,
              pickupTime: guest.arrivalTime,
              guests: [
                {
                  name: guest.name,
                  numberOfGuests: Number.parseInt(guest.numberOfGuests.toString()) || 1,
                },
              ],
              totalGuests: Number.parseInt(guest.numberOfGuests.toString()) || 1,
            })
            remainingGuests.shift()
          }
        }
      })

      setItinerary(newItinerary)
      setIsGenerating(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Itinerary Generation</CardTitle>
          <CardDescription>Manage drivers and generate pickup itineraries</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="drivers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="drivers">Manage Drivers</TabsTrigger>
              <TabsTrigger value="itinerary">View Itinerary</TabsTrigger>
            </TabsList>

            <TabsContent value="drivers" className="space-y-4">
              <div className="mb-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Pickup Location Information</h3>
                  <p className="text-sm text-muted-foreground">
                    The following round-trip times will be used to calculate the itinerary:
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {locationTimings.map((timing, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md border p-2">
                        <span>{timing.location}</span>
                        <span className="font-medium">{timing.roundTripMinutes} minutes</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Driver Capacity</h3>
                  <p className="text-sm text-muted-foreground">
                    Each driver can accommodate up to {driverCapacity.maxPassengers} passengers per trip.
                  </p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="text-lg font-medium mb-4">Add Drivers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="driver-name">Driver Name</Label>
                    <Input
                      id="driver-name"
                      value={newDriver.name}
                      onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                      placeholder="Enter driver name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-phone">Phone Number</Label>
                    <Input
                      id="driver-phone"
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle-capacity">Vehicle Capacity</Label>
                    <Input
                      id="vehicle-capacity"
                      type="number"
                      min="1"
                      value={newDriver.vehicleCapacity}
                      onChange={(e) =>
                        setNewDriver({
                          ...newDriver,
                          vehicleCapacity: Number.parseInt(e.target.value) || driverCapacity.maxPassengers,
                        })
                      }
                    />
                  </div>
                </div>
                <Button className="mt-4" onClick={addDriver} disabled={!newDriver.name || !newDriver.phone}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Driver
                </Button>
              </div>

              <div className="rounded-md border">
                <h3 className="text-lg font-medium p-4 border-b">Current Drivers</h3>
                {drivers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No drivers added yet. Add drivers above to create an itinerary.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Vehicle Capacity</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>{driver.name}</TableCell>
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>{driver.vehicleCapacity}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeDriver(driver.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="flex justify-center mt-6">
                <Button onClick={generateItinerary} disabled={isGenerating} className="w-full max-w-md">
                  {isGenerating ? "Generating..." : "Generate Itinerary"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-4">
              {itinerary.length === 0 ? (
                <div className="rounded-md border p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">No Itinerary Generated Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add drivers and generate an itinerary to see the pickup schedule.
                  </p>
                  <Button onClick={() => generateItinerary()} disabled={isGenerating}>
                    {isGenerating ? "Generating..." : "Generate Itinerary"}
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px] rounded-md border">
                  <div className="p-4 space-y-6">
                    {itinerary.map((item) => {
                      const driver = drivers.find((d) => d.id === item.driverId) || {
                        name: "Unassigned",
                        phone: "N/A",
                      }

                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <CardHeader className="bg-primary/10 py-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="text-lg">Pickup: {item.pickupLocation}</CardTitle>
                                <CardDescription>
                                  Time: {item.pickupTime} | Total Guests: {item.totalGuests}
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{driver.name}</p>
                                <p className="text-sm text-muted-foreground">{driver.phone}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Guest Name</TableHead>
                                  <TableHead className="text-right">Number of Guests</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {item.guests.map((guest, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{guest.name}</TableCell>
                                    <TableCell className="text-right">{guest.numberOfGuests}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            Back
          </Button>
          <Button onClick={() => setCurrentStep(3)} disabled={itinerary.length === 0}>
            Continue to Communication
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
