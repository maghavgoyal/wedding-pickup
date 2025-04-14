"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, CalendarIcon, Filter } from "lucide-react"
import { ArrivalChart } from "@/components/arrival-chart"
import { mockArrivals } from "@/lib/mock-data"

export function Overview() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState("day")

  // Filter arrivals based on selected date
  const filteredArrivals = mockArrivals.filter((arrival) => {
    if (!date) return true

    const arrivalDate = new Date(arrival.arrivalTime)
    return arrivalDate.toDateString() === date.toDateString()
  })

  // Count arrivals by location
  const arrivalsByLocation = filteredArrivals.reduce(
    (acc, arrival) => {
      acc[arrival.arrivalLocation] = (acc[arrival.arrivalLocation] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <Card className="wedding-card lg:col-span-5">
        <CardHeader>
          <CardTitle>Arrival Overview</CardTitle>
          <CardDescription>Visual overview of guest arrivals by date and location</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="chart"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
                >
                  Chart
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
                >
                  Summary
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full border-gray-200 hover:bg-gray-50 hover:text-wedding-500"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full border-gray-200 hover:bg-gray-50 hover:text-wedding-500"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
            <TabsContent value="chart" className="pt-2">
              <div className="h-[300px]">
                <ArrivalChart />
              </div>
            </TabsContent>
            <TabsContent value="summary">
              <div className="rounded-xl border bg-gray-50/50">
                <div className="grid grid-cols-3 gap-4 p-4">
                  <div className="bg-white p-4 rounded-xl shadow-soft">
                    <h4 className="text-sm font-medium text-gray-500">Total Arrivals</h4>
                    <div className="text-2xl font-bold text-wedding-500">{filteredArrivals.length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-soft">
                    <h4 className="text-sm font-medium text-gray-500">Assigned</h4>
                    <div className="text-2xl font-bold text-lavender-500">
                      {filteredArrivals.filter((a) => a.driverAssigned).length}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-soft">
                    <h4 className="text-sm font-medium text-gray-500">Unassigned</h4>
                    <div className="text-2xl font-bold text-mint-600">
                      {filteredArrivals.filter((a) => !a.driverAssigned).length}
                    </div>
                  </div>
                </div>
                <div className="border-t p-4">
                  <h4 className="mb-3 text-sm font-medium">Arrivals by Location</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(arrivalsByLocation).map(([location, count]) => {
                      let badgeClass = ""
                      if (location === "Airport") badgeClass = "bg-wedding-100 text-wedding-700"
                      else if (location === "Train Station") badgeClass = "bg-lavender-100 text-lavender-700"
                      else badgeClass = "bg-mint-100 text-mint-700"

                      return (
                        <Badge
                          key={location}
                          variant="outline"
                          className={`flex gap-1 items-center ${badgeClass} rounded-full px-3 py-1`}
                        >
                          {location} <span className="bg-white rounded-full px-1.5 py-0.5 text-xs ml-1">{count}</span>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card className="wedding-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Arrival Calendar</CardTitle>
          <CardDescription>Select a date to view arrivals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Tabs defaultValue="day" onValueChange={setView} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="day"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
                >
                  Day
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-wedding-500 data-[state=active]:shadow-sm"
                >
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="rounded-xl border p-3 bg-gray-50/50">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="mx-auto"
                classNames={{
                  day_selected: "bg-wedding-500 text-white hover:bg-wedding-600 focus:bg-wedding-600",
                  day_today: "bg-lavender-100 text-lavender-700",
                }}
              />
            </div>
            <div className="mt-2 grid gap-1">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-wedding-500" />
                <span className="text-sm font-medium">
                  {date
                    ? date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a date"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-wedding-500">{filteredArrivals.length}</span> arrivals scheduled
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
