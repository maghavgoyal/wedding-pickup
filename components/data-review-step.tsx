"use client"

// Update imports - remove unused components if any after changes
import { useState, useEffect } from "react" // Remove useState, useEffect if not needed
import { useWorkflow } from "@/context/workflow-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Remove Input, Label, Tabs, TabsContent, TabsList, TabsTrigger if no longer used
import { ScrollArea } from "@/components/ui/scroll-area"

// Update the DataReviewStep component to remove location and capacity sections
export const DataReviewStep = () => {
  // Remove unused context values
  const { csvData, setCurrentStep } = useWorkflow()

  // Remove state and useEffect related to locations and capacity
  // const [uniqueLocations, setUniqueLocations] = useState<string[]>([])
  // useEffect(() => { ... }, [csvData, locationTimings.length, setLocationTimings])
  // const handleTimeChange = (...) => { ... }
  // const handleCapacityChange = (...) => { ... }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in"> {/* Added fade-in animation wrapper */}
        <Card className="wedding-card"> {/* Added wedding-card class */}
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Guest Data Review</CardTitle>
            <CardDescription>Review the imported guest data. Click "Continue" when ready.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Remove Tabs structure, directly render the Guest List table */}
            <ScrollArea className="h-[500px] rounded-md border"> {/* Increased height */}
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {/* <TableHead>Email</TableHead> */}
                    <TableHead>Phone</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Arrival Date</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead className="text-right">Guests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.length > 0 ? (
                    csvData.map((guest, index) => (
                      <TableRow key={index} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium">{guest.name || "-"}</TableCell>
                        {/* <TableCell>{guest.email || "-"}</TableCell> */}
                        <TableCell>{guest.phone || "-"}</TableCell>
                        <TableCell>{guest.pickupLocation || "-"}</TableCell>
                        <TableCell>{guest.arrivalDate || "-"}</TableCell>
                        <TableCell>{guest.arrivalTime || "-"}</TableCell>
                        <TableCell className="text-right">{guest.numberOfGuests ?? 1}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No guest data loaded. Please go back and upload a CSV.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            {/* Removed TabsContent for locations and capacity */}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep("upload")}>
              Back to Upload
            </Button>
            <Button onClick={() => setCurrentStep("itinerary")}
              disabled={csvData.length === 0}
            >
              Continue to Itinerary
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
