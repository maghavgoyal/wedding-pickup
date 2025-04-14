"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  FileDown,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  Share2,
  User,
} from "lucide-react"
import { useWorkflow } from "@/context/workflow-context"

// Type for a unique pickup
interface UniquePickup {
  id: string
  driver: any
  location: string
  date: string
  time: string
  guests: any[]
}

export function CommunicationStep() {
  const { guestData, driverAssignments, drivers } = useWorkflow()
  const [activeTab, setActiveTab] = useState("itineraries")
  const [creatingGroup, setCreatingGroup] = useState<string | null>(null)
  const [createdGroups, setCreatedGroups] = useState<string[]>([])

  // Get assigned guests for each driver
  const driverItineraries = Object.entries(driverAssignments).map(([driverId, guestIds]) => {
    const driver = drivers.find((d) => d.id === driverId)
    const guests = guestIds.map((id) => guestData?.find((g) => g.id === id)).filter(Boolean)

    return {
      driver,
      guests,
    }
  })

  // Create unique pickups based on driver, location, and date
  const uniquePickups: UniquePickup[] = []

  driverItineraries.forEach(({ driver, guests }) => {
    // Group guests by location and date
    const pickupGroups: Record<string, any[]> = {}

    guests?.forEach((guest) => {
      const date = formatDate(guest.arrivalTime)
      const location = guest.arrivalLocation
      const key = `${location}-${date}`

      if (!pickupGroups[key]) {
        pickupGroups[key] = []
      }

      pickupGroups[key].push(guest)
    })

    // Create unique pickup for each group
    Object.entries(pickupGroups).forEach(([key, groupGuests], index) => {
      const [location, date] = key.split("-")
      const time = formatTimeRange(groupGuests)

      uniquePickups.push({
        id: `${driver?.id}-${key}-${index}`,
        driver,
        location,
        date,
        time,
        guests: groupGuests,
      })
    })
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTimeRange = (guests: any[]) => {
    if (!guests || guests.length === 0) return "N/A"

    const times = guests.map((g) => new Date(g.arrivalTime).getTime())
    const earliest = new Date(Math.min(...times))
    const latest = new Date(Math.max(...times))

    if (earliest.getTime() === latest.getTime()) {
      return formatTime(earliest.toString())
    }

    return `${formatTime(earliest.toString())} - ${formatTime(latest.toString())}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const handleCreateWhatsAppGroup = (pickupId: string) => {
    setCreatingGroup(pickupId)

    // Simulate creating WhatsApp group
    setTimeout(() => {
      setCreatedGroups((prev) => [...prev, pickupId])
      setCreatingGroup(null)
    }, 1500)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="wedding-card">
        <CardHeader>
          <CardTitle>Driver Itineraries & Communication</CardTitle>
          <CardDescription>View driver itineraries and set up communication channels for each pickup</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger
                value="itineraries"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
              >
                Driver Itineraries
              </TabsTrigger>
              <TabsTrigger
                value="communication"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
              >
                Communication Setup
              </TabsTrigger>
            </TabsList>
            <TabsContent value="itineraries" className="pt-4">
              <div className="space-y-6">
                {driverItineraries.length > 0 ? (
                  driverItineraries.map(({ driver, guests }) => (
                    <Card key={driver?.id} className="wedding-card overflow-hidden">
                      <div className="p-4 border-b bg-lavender-50 border-lavender-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-white rounded-full">
                              <Car className="h-5 w-5 text-lavender-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{driver?.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {driver?.vehicle} • {driver?.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 rounded-full border-gray-200 hover:bg-white hover:text-lavender-500"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Print</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 rounded-full border-gray-200 hover:bg-white hover:text-lavender-500"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 rounded-full border-gray-200 hover:bg-white hover:text-lavender-500"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Share</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-0">
                        <div className="p-4">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Pickup Schedule</h4>
                          <div className="space-y-4">
                            {guests
                              ?.sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime())
                              .map((guest) => (
                                <div key={guest.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                                  <div className="p-2 bg-white rounded-full border">
                                    <Clock className="h-4 w-4 text-wedding-500" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium">{guest.guestName}</h5>
                                      <Badge className="bg-wedding-100 text-wedding-700 rounded-full">
                                        {guest.travelers} travelers
                                      </Badge>
                                    </div>
                                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{formatDate(guest.arrivalTime)}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{formatTime(guest.arrivalTime)}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span>{guest.arrivalLocation}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <User className="h-3.5 w-3.5" />
                                        <span>
                                          {guest.flightNumber || guest.trainNumber || guest.busNumber || "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No driver itineraries have been generated yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="communication" className="pt-4">
              <div className="space-y-6">
                <Alert className="bg-gold-50 border-gold-200">
                  <MessageSquare className="h-4 w-4 text-gold-600" />
                  <AlertTitle className="text-gold-800">WhatsApp Group Setup</AlertTitle>
                  <AlertDescription className="text-gold-700">
                    Create WhatsApp groups for each unique pickup to facilitate easy communication between the driver,
                    admin, and guests.
                  </AlertDescription>
                </Alert>

                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Guests</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniquePickups.map((pickup) => (
                        <TableRow key={pickup.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <div className="font-medium">{pickup.driver?.name}</div>
                            <div className="text-xs text-muted-foreground">{pickup.driver?.vehicle}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{pickup.location}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{pickup.date}</div>
                            <div className="text-xs text-muted-foreground">{pickup.time}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {pickup.guests?.slice(0, 2).map((guest) => (
                                <div key={guest.id} className="text-sm">
                                  {guest.guestName}
                                </div>
                              ))}
                              {(pickup.guests?.length || 0) > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{(pickup.guests?.length || 0) - 2} more
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {createdGroups.includes(pickup.id) ? (
                              <Badge className="bg-mint-100 text-mint-700 rounded-full px-2.5 py-0.5 font-medium gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Created</span>
                              </Badge>
                            ) : (
                              <Badge className="bg-wedding-100 text-wedding-700 rounded-full px-2.5 py-0.5 font-medium">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              disabled={creatingGroup === pickup.id || createdGroups.includes(pickup.id)}
                              onClick={() => handleCreateWhatsAppGroup(pickup.id)}
                              className={`gap-1 rounded-full ${
                                createdGroups.includes(pickup.id)
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-mint-500 hover:bg-mint-600 text-white"
                              }`}
                            >
                              {creatingGroup === pickup.id ? (
                                <span className="animate-pulse">Creating...</span>
                              ) : createdGroups.includes(pickup.id) ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Created</span>
                                </>
                              ) : (
                                <>
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>Create Group</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {uniquePickups.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No pickups found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
