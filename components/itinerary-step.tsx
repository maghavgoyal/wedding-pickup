"use client"

import { useState, useEffect } from "react"
import { useWorkflow } from "@/context/workflow-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export const ItineraryStep = () => {
  const { 
    csvData, 
    setCurrentStep, 
    locationTimings, 
    setLocationTimings,
    drivers, 
    setDrivers, 
    itinerary,
    setItinerary, 
    selectedCsvFile
  } = useWorkflow()

  const defaultNewDriverCapacity = 4;
  const [newDriver, setNewDriver] = useState({ name: "", phone: "", vehicleCapacity: defaultNewDriverCapacity })
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingDriver, setEditingDriver] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("locations")

  useEffect(() => {
    if (csvData && csvData.length > 0 && locationTimings.length === 0) {
      const locations = [...new Set(csvData.map((guest) => guest.pickupLocation))]
        .filter(location => location && location.trim() !== '')
      
      if (locations.length > 0) {
         setLocationTimings(
           locations.map((location) => ({
             location,
             roundTripMinutes: 60,
           })),
         )
      }
    }
  }, [csvData, locationTimings.length, setLocationTimings])

  const handleTimeChange = (location: string, minutes: number) => {
    setLocationTimings(
      locationTimings.map((timing) =>
        timing.location === location ? { ...timing, roundTripMinutes: minutes } : timing,
      ),
    )
  }

  const updateDriver = (driverId: string, updates: Partial<Omit<typeof newDriver, 'vehicleCapacity'> & { vehicleCapacity?: number | string }>) => {
    const capacityUpdate = updates.vehicleCapacity !== undefined
      ? { vehicleCapacity: Math.max(1, Number(updates.vehicleCapacity) || 1) }
      : {};

    setDrivers(drivers.map(driver =>
      driver.id === driverId
        ? { 
            ...driver, 
            name: updates.name ?? driver.name,
            phone: updates.phone ?? driver.phone,
            ...capacityUpdate
          }
        : driver
    ))
    if (updates.name !== undefined || updates.phone !== undefined) {
        setEditingDriver(null)
    }
  }

  const addDriver = () => {
     if (newDriver.name && newDriver.phone) {
       const newDriverWithId = {
         ...newDriver,
         id: `driver-${Date.now()}`,
         vehicleCapacity: Math.max(1, Number(newDriver.vehicleCapacity) || 1),
       }
       setDrivers([...drivers, newDriverWithId])
       setNewDriver({ name: "", phone: "", vehicleCapacity: defaultNewDriverCapacity })
     }
   }

  const removeDriver = (id: string) => {
     setDrivers(drivers.filter((driver) => driver.id !== id))
   }

  const generateItinerary = () => {
    if (!selectedCsvFile) {
      console.error("No CSV file selected to generate itinerary for.");
      // TODO: Add user-facing error handling (e.g., a toast notification)
      return;
    }
    setIsGenerating(true)
    setTimeout(() => {
      const guestsByLocation: Record<string, typeof csvData> = {}
      csvData.forEach((guest) => {
        const location = guest.pickupLocation || "Unknown Location";
        if (!guestsByLocation[location]) {
          guestsByLocation[location] = []
        }
        guestsByLocation[location].push(guest)
      })
       const sortedLocations = Object.keys(guestsByLocation).sort((a, b) => {
         const timeA = locationTimings.find(t => t.location === a)?.roundTripMinutes || 0;
         const timeB = locationTimings.find(t => t.location === b)?.roundTripMinutes || 0;
         return timeB - timeA; 
       });

      const newItinerary: any[] = []
      let currentDriverIndex = 0

      sortedLocations.forEach((location) => {
         if (location === "Unknown Location") {
           console.warn("Skipping itinerary generation for guests with Unknown Location");
           return; 
         }
        const guests = guestsByLocation[location] || []
        const remainingGuests = [...guests]
        while (remainingGuests.length > 0) {
          if (drivers.length > 0) {
            const driver = drivers[currentDriverIndex % drivers.length]
            currentDriverIndex++
            let currentCapacity = driver.vehicleCapacity
            const assignedGuests: typeof remainingGuests = []
            while (currentCapacity > 0 && remainingGuests.length > 0) {
              const guest = remainingGuests[0]
              const guestCount = Number.parseInt(guest.numberOfGuests?.toString()) || 1
              if (guestCount <= currentCapacity) {
                assignedGuests.push(guest)
                currentCapacity -= guestCount
                remainingGuests.shift()
              } else {
                break
              }
            }
            if (assignedGuests.length > 0) {
              const totalGuests = assignedGuests.reduce( (sum, guest) => sum + (Number.parseInt(guest.numberOfGuests?.toString()) || 1), 0 )
               const firstGuest = assignedGuests[0];
               const arrivalDate = firstGuest?.arrivalDate || "Date Pending";
               const arrivalTime = firstGuest?.arrivalTime || "Time Pending";
               // Generate a stable ID for itinerary items if needed for future updates
               const itineraryItemId = `itinerary-${driver.id}-${location}-${arrivalTime}`.replace(/[^a-zA-Z0-9-_]/g, '');
              newItinerary.push({
                id: itineraryItemId, // Use a more stable ID
                driverId: driver.id,
                pickupLocation: location,
                 pickupTime: arrivalTime, 
                 arrivalDate: arrivalDate, 
                 guests: assignedGuests.map((g) => ({
                   name: g.name,
                   numberOfGuests: Number.parseInt(g.numberOfGuests?.toString()) || 1,
                   arrivalDate: g.arrivalDate, 
                   arrivalTime: g.arrivalTime,
                 })),
                totalGuests,
              })
            }
           } else {
             // Handle case with no drivers (if necessary based on requirements)
             // For now, assuming drivers are required to generate itinerary
             console.warn("No drivers available to assign guests.");
             // Optionally break or handle this case differently
             break; // Exit loop for this location if no drivers
           }
        }
      })

      // --- Persistence Logic --- 
      try {
        const savedState = {
          csvData,
          locationTimings,
          drivers,
          itinerary: newItinerary
        };
        localStorage.setItem(`weddingPickup_${selectedCsvFile}`, JSON.stringify(savedState));
        
        // Update the list of saved CSVs
        const savedCsvListKey = 'weddingPickup_savedCsvs';
        const savedCsvs = JSON.parse(localStorage.getItem(savedCsvListKey) || '[]');
        if (!savedCsvs.includes(selectedCsvFile)) {
          savedCsvs.push(selectedCsvFile);
          localStorage.setItem(savedCsvListKey, JSON.stringify(savedCsvs));
        }
        console.log(`State saved for ${selectedCsvFile}`);
      } catch (error) {
        console.error(`Failed to save state for ${selectedCsvFile} to localStorage:`, error);
        // Handle potential storage errors (e.g., quota exceeded)
        // TODO: Add user notification if saving fails
      }
      // --- End Persistence Logic --- 

      setItinerary(newItinerary)
      setIsGenerating(false)
      setCurrentStep("view_itinerary") 
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <Card className="wedding-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Configure Itinerary Settings</CardTitle>
            <CardDescription>Set pickup location times and manage drivers before generating the itinerary.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="locations">Pickup Locations</TabsTrigger>
                <TabsTrigger value="drivers">Manage Drivers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="locations" className="mt-6">
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-2">Pickup Location Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estimated round-trip times (in minutes) from the venue.
                  </p>
                  {locationTimings.length > 0 ? (
                    <ScrollArea className="h-60 pr-3">
                      <div className="space-y-3">
                        {locationTimings.map((timing, index) => (
                          <div key={index} className="flex items-center justify-between gap-4 p-2 rounded hover:bg-gray-100 border-b last:border-b-0">
                            <Label 
                              htmlFor={`location-${index}`} 
                              className="flex-1 font-semibold text-sm truncate text-primary cursor-pointer" 
                              title={timing.location}
                            >
                              {timing.location}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`time-${index}`}
                                type="number"
                                min="1"
                                value={timing.roundTripMinutes}
                                onChange={(e) => handleTimeChange(timing.location, Number.parseInt(e.target.value) || 0)}
                                className="w-20 h-8 text-right transition-colors duration-200 focus:border-primary focus:ring-1 focus:ring-primary/50"
                              />
                              <span className="text-xs text-muted-foreground">min</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pickup locations found in guest data yet.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="drivers" className="mt-6">
                <div className="rounded-md border">
                  <h3 className="text-lg font-medium p-4 border-b">Manage Drivers</h3>
                  <div className="p-4 border-b space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                      <div>
                        <Label htmlFor="new-driver-name">Driver Name</Label>
                        <Input id="new-driver-name" placeholder="Enter name" value={newDriver.name} onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="new-driver-phone">Phone Number</Label>
                        <Input id="new-driver-phone" placeholder="Enter phone" value={newDriver.phone} onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="new-driver-capacity">Capacity</Label>
                        <Input id="new-driver-capacity" type="number" min="1" value={newDriver.vehicleCapacity} onChange={(e) => setNewDriver({ ...newDriver, vehicleCapacity: Math.max(1, Number(e.target.value) || 1) })} className="w-20" />
                      </div>
                      <Button onClick={addDriver} disabled={!newDriver.name || !newDriver.phone} size="sm" className="self-end">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Driver
                      </Button>
                    </div>
                  </div>

                  {drivers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No drivers added yet. Add drivers above.
                    </div>
                  ) : (
                    <ScrollArea className="h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Vehicle Capacity</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {drivers.map((driver) => (
                            <TableRow key={driver.id}>
                              <TableCell className="font-medium">{driver.name}</TableCell>
                              <TableCell>{driver.phone}</TableCell>
                              <TableCell>{driver.vehicleCapacity}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => console.log('Edit driver:', driver.id)} > 
                                    <span className="sr-only">Edit</span> 
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeDriver(driver.id)}> 
                                    <span className="sr-only">Delete</span><Trash2 className="h-4 w-4" /> 
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setCurrentStep("review")}>
              Back to Review
            </Button>
            <Button 
              onClick={generateItinerary} 
              disabled={isGenerating || drivers.length === 0 || locationTimings.length === 0}
              className="min-w-[200px]"
            >
              {isGenerating ? "Generating..." : "Generate & View Itinerary"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
