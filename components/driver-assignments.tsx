"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Calendar, Car, CheckCircle2, Clock, FileDown, MapPin, Printer, Users } from "lucide-react"
import { mockArrivals, mockDrivers } from "@/lib/mock-data"

export function DriverAssignments() {
  const [selectedDate, setSelectedDate] = useState<string>("all")
  const [selectedDriver, setSelectedDriver] = useState<string>("")

  // Group arrivals by date
  const arrivalsByDate = mockArrivals.reduce(
    (acc, arrival) => {
      const date = new Date(arrival.arrivalTime).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })

      if (!acc[date]) {
        acc[date] = []
      }

      acc[date].push(arrival)
      return acc
    },
    {} as Record<string, typeof mockArrivals>,
  )

  // Filter arrivals based on selected date
  const filteredArrivals = selectedDate === "all" ? mockArrivals : arrivalsByDate[selectedDate] || []

  // Group arrivals by location
  const arrivalsByLocation = filteredArrivals.reduce(
    (acc, arrival) => {
      if (!acc[arrival.arrivalLocation]) {
        acc[arrival.arrivalLocation] = []
      }

      acc[arrival.arrivalLocation].push(arrival)
      return acc
    },
    {} as Record<string, typeof mockArrivals>,
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="date-filter" className="text-sm font-medium">
            Filter by Date
          </Label>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger id="date-filter" className="wedding-input">
              <SelectValue placeholder="Select a date" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Dates</SelectItem>
              {Object.keys(arrivalsByDate).map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="driver-filter" className="text-sm font-medium">
            Assign Driver
          </Label>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger id="driver-filter" className="wedding-input">
              <SelectValue placeholder="Select a driver" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="select-driver">Select a driver</SelectItem>
              {mockDrivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="by-location" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger
            value="by-location"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
          >
            By Location
          </TabsTrigger>
          <TabsTrigger
            value="by-time"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
          >
            By Time
          </TabsTrigger>
        </TabsList>
        <TabsContent value="by-location" className="pt-4">
          <div className="grid gap-4">
            {Object.entries(arrivalsByLocation).length > 0 ? (
              Object.entries(arrivalsByLocation).map(([location, arrivals]) => {
                let headerClass = ""
                let iconClass = ""

                if (location === "Airport") {
                  headerClass = "bg-wedding-50 border-wedding-100"
                  iconClass = "text-wedding-500"
                } else if (location === "Train Station") {
                  headerClass = "bg-lavender-50 border-lavender-100"
                  iconClass = "text-lavender-500"
                } else {
                  headerClass = "bg-mint-50 border-mint-100"
                  iconClass = "text-mint-600"
                }

                return (
                  <Card key={location} className="wedding-card overflow-hidden">
                    <div className={`p-4 border-b ${headerClass}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className={`h-5 w-5 ${iconClass}`} />
                          <h3 className="font-semibold">{location}</h3>
                          <Badge variant="outline" className={`ml-2 rounded-full ${headerClass} border-0`}>
                            {arrivals.length} arrivals
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 rounded-full border-gray-200 hover:bg-white hover:text-wedding-500"
                        >
                          <Car className="h-3.5 w-3.5" />
                          <span>Assign All</span>
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {arrivals.map((arrival) => (
                          <div key={arrival.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                            <div>
                              <div className="font-medium">{arrival.guestName}</div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{formatTime(arrival.arrivalTime)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>{arrival.travelers} travelers</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {arrival.driverAssigned ? (
                                <Badge className="bg-mint-100 text-mint-700 rounded-full px-2.5 py-0.5 font-medium gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Assigned</span>
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={!selectedDriver}
                                  className="gap-1 bg-wedding-500 hover:bg-wedding-600 text-white rounded-full"
                                >
                                  <Car className="h-3.5 w-3.5" />
                                  <span>Assign</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-xl border">
                <AlertCircle className="h-12 w-12 text-wedding-200 mx-auto mb-3" />
                <p className="text-muted-foreground">No arrivals found for the selected date</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="by-time" className="pt-4">
          <div className="space-y-4">
            {selectedDate !== "all" ? (
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl border">
                <Calendar className="h-5 w-5 text-wedding-500" />
                <h3 className="font-semibold">{selectedDate}</h3>
              </div>
            ) : null}

            {filteredArrivals.length > 0 ? (
              <div className="rounded-xl border overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 p-4 font-medium border-b bg-gray-50">
                  <div>Guest</div>
                  <div>Time</div>
                  <div>Location</div>
                  <div>Action</div>
                </div>
                <div className="divide-y">
                  {filteredArrivals
                    .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime())
                    .map((arrival) => (
                      <div
                        key={arrival.id}
                        className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 p-4 items-center hover:bg-gray-50/50"
                      >
                        <div>
                          <div className="font-medium">{arrival.guestName}</div>
                          <div className="text-sm text-muted-foreground">{arrival.travelers} travelers</div>
                        </div>
                        <div className="text-sm whitespace-nowrap font-medium text-wedding-500">
                          {formatTime(arrival.arrivalTime)}
                        </div>
                        <div className="text-sm">{arrival.arrivalLocation}</div>
                        <div>
                          {arrival.driverAssigned ? (
                            <Badge className="bg-mint-100 text-mint-700 rounded-full px-2.5 py-0.5 font-medium gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Assigned</span>
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              disabled={!selectedDriver}
                              className="gap-1 bg-wedding-500 hover:bg-wedding-600 text-white rounded-full"
                            >
                              <Car className="h-3.5 w-3.5" />
                              <span>Assign</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-xl border">
                <AlertCircle className="h-12 w-12 text-wedding-200 mx-auto mb-3" />
                <p className="text-muted-foreground">No arrivals found for the selected date</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedDriver && (
        <div className="mt-6 border rounded-xl p-4 bg-gradient-to-r from-wedding-50 to-lavender-50 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-wedding-500" />
              <h3 className="font-semibold">
                Driver Itinerary: {mockDrivers.find((d) => d.id === selectedDriver)?.name}
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-full border-gray-200 hover:bg-white hover:text-wedding-500"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-full border-gray-200 hover:bg-white hover:text-wedding-500"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Download</span>
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Select arrivals to assign to this driver to generate an itinerary
          </div>
        </div>
      )}
    </div>
  )
}
