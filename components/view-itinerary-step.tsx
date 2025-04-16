"use client"

import { useState } from "react";
import { useWorkflow } from "@/context/workflow-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Keep if needed for other display
import { Input } from "@/components/ui/input"; // Keep if needed
import { Label } from "@/components/ui/label"; // Keep if needed
import { Car, MapPin, Calendar, Clock, MessageSquare, CheckCircle2, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ViewItineraryStep() {
  const { itinerary, drivers, setCurrentStep } = useWorkflow();

  // State for WhatsApp group creation (copied from previous iteration)
  const [creatingGroup, setCreatingGroup] = useState<string | null>(null);
  const [createdGroups, setCreatedGroups] = useState<string[]>([]);

  // Function to handle WhatsApp group creation (copied from previous iteration)
  const handleCreateWhatsAppGroup = (pickupId: string) => {
    setCreatingGroup(pickupId);
    console.log(`Simulating WhatsApp group creation for pickup: ${pickupId}`);
    // TODO: Replace simulation with actual API call to backend /api/whatsapp/create-group
    setTimeout(() => {
      setCreatedGroups((prev) => [...prev, pickupId]);
      setCreatingGroup(null);
      console.log(`Simulated group created for pickup: ${pickupId}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <Card className="wedding-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Generated Itinerary</CardTitle>
            <CardDescription>Review the generated pickup schedule and create communication groups.</CardDescription>
          </CardHeader>
          <CardContent>
            {itinerary.length === 0 ? (
              <div className="rounded-md border p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Itinerary Available</h3>
                <p className="text-muted-foreground mb-4">
                  Go back to the previous step to configure and generate an itinerary.
                </p>
                <Button variant="outline" onClick={() => setCurrentStep("itinerary")}>
                  Back to Configuration
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px] rounded-md border">
                <div className="p-4 space-y-6">
                  {itinerary.map((item) => {
                    const driver = drivers.find((d) => d.id === item.driverId) || {
                      name: "Unassigned",
                      phone: "N/A",
                    };
                    return (
                      <Card key={item.id} className="wedding-card overflow-hidden">
                        <CardHeader className="p-4 border-b bg-lavender-50 border-lavender-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-full shadow-sm">
                                <Car className="h-6 w-6 text-lavender-500" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-base">{driver.name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {driver.phone}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 rounded-full border-gray-200 hover:bg-white hover:text-lavender-500"
                                onClick={() => handleCreateWhatsAppGroup(item.id)}
                                disabled={creatingGroup === item.id || createdGroups.includes(item.id)}
                              >
                                {createdGroups.includes(item.id) ? (
                                  <> <CheckCircle2 className="h-3.5 w-3.5" /> <span>Group Created</span> </>
                                ) : creatingGroup === item.id ? (
                                  <span className="animate-pulse">Creating...</span>
                                ) : (
                                  <> <MessageSquare className="h-3.5 w-3.5" /> <span>Create WhatsApp Group</span> </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Location:</span>
                                <span>{item.pickupLocation}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Arrival Date:</span>
                                <span>{item.arrivalDate}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Arrival Time:</span>
                                <span>{item.pickupTime}</span>
                              </div>
                            </div>
                            <div className="border-t pt-3">
                              <h4 className="text-sm font-semibold mb-2">Guests ({item.totalGuests})</h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {item.guests.map((guest, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{guest.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {guest.numberOfGuests} {guest.numberOfGuests > 1 ? "guests" : "guest"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter className="flex justify-start border-t pt-4">
             {/* Add a back button to return to configuration */}
             <Button variant="outline" onClick={() => setCurrentStep("itinerary")}>
               Back to Configuration
             </Button>
             {/* Maybe add a "Finish" or "Export" button here later */}
           </CardFooter>
        </Card>
      </div>
    </div>
  );
} 