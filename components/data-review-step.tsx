"use client"

// Update imports to include the new components and hooks we'll need
import { useState, useEffect } from "react"
import { useWorkflow } from "@/context/workflow-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

// Update the DataReviewStep component to include the new sections
export const DataReviewStep = () => {
  const { csvData, setCurrentStep, locationTimings, setLocationTimings, driverCapacity, setDriverCapacity } =
    useWorkflow()

  // State for the new driver being added
  const [newDriver, setNewDriver] = useState({ name: "", phone: "", vehicleCapacity: 4 })

  // Extract unique locations from the CSV data
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([])

  useEffect(() => {
    if (csvData.length > 0) {
      const locations = [...new Set(csvData.map((guest) => guest.pickupLocation))]
      setUniqueLocations(locations)

      // Initialize location timings if they don't exist
      if (locationTimings.length === 0) {
        setLocationTimings(
          locations.map((location) => ({
            location,
            roundTripMinutes: 60, // Default to 60 minutes
          })),
        )
      }
    }
  }, [csvData, locationTimings.length, setLocationTimings])

  // Handle updating round trip time for a location
  const handleTimeChange = (location: string, minutes: number) => {
    setLocationTimings(
      locationTimings.map((timing) =>
        timing.location === location ? { ...timing, roundTripMinutes: minutes } : timing,
      ),
    )
  }

  // Handle updating driver capacity
  const handleCapacityChange = (maxPassengers: number) => {
    setDriverCapacity({ maxPassengers })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Guest Data Review</CardTitle>
          <CardDescription>Review the imported guest data and make any necessary adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="guests" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="guests">Guest List</TabsTrigger>
              <TabsTrigger value="locations">Pickup Locations</TabsTrigger>
              <TabsTrigger value="capacity">Driver Capacity</TabsTrigger>
            </TabsList>

            <TabsContent value="guests" className="space-y-4">
              <ScrollArea className="h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Arrival Date</TableHead>
                      <TableHead>Arrival Time</TableHead>
                      <TableHead>Guests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((guest, index) => (
                      <TableRow key={index}>
                        <TableCell>{guest.name}</TableCell>
                        <TableCell>{guest.email}</TableCell>
                        <TableCell>{guest.phone}</TableCell>
                        <TableCell>{guest.pickupLocation}</TableCell>
                        <TableCell>{guest.arrivalDate}</TableCell>
                        <TableCell>{guest.arrivalTime}</TableCell>
                        <TableCell>{guest.numberOfGuests}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-medium mb-4">Round-Trip Times from Venue</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please specify the estimated round-trip time (in minutes) from the venue to each pickup location. This
                  helps us calculate how many pickups each driver can handle.
                </p>

                <div className="space-y-4">
                  {locationTimings.map((timing, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`location-${index}`}>Location</Label>
                        <Input id={`location-${index}`} value={timing.location} disabled />
                      </div>
                      <div className="w-32">
                        <Label htmlFor={`time-${index}`}>Round-Trip (min)</Label>
                        <Input
                          id={`time-${index}`}
                          type="number"
                          min="1"
                          value={timing.roundTripMinutes}
                          onChange={(e) => handleTimeChange(timing.location, Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="capacity" className="space-y-4">
              <div className="rounded-md border p-4">
                <h3 className="text-lg font-medium mb-4">Driver Capacity Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please specify the maximum number of guests each driver can accommodate in their vehicle.
                </p>

                <div className="w-full max-w-sm">
                  <Label htmlFor="max-passengers">Maximum Passengers per Vehicle</Label>
                  <Input
                    id="max-passengers"
                    type="number"
                    min="1"
                    value={driverCapacity.maxPassengers}
                    onChange={(e) => handleCapacityChange(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(0)}>
            Back
          </Button>
          <Button onClick={() => setCurrentStep(2)}>Continue to Itinerary</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
