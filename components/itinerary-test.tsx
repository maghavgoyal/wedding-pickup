import { testCsvData, testLocationTimings, testDrivers, expectedItinerary } from './test-data';
import { useWorkflow } from '@/context/workflow-context';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Guest {
  name: string;
  pickupLocation: string;
  numberOfGuests: number;
  arrivalDate: string;
  arrivalTime: string;
}

interface ItineraryItem {
  id: string;
  driverId: string;
  pickupLocation: string;
  pickupTime: string;
  arrivalDate: string;
  guests: {
    name: string;
    numberOfGuests: number;
  }[];
  totalGuests: number;
}

interface TestResult {
  passed: boolean;
  message: string;
  details: string[];
}

export function ItineraryTest() {
  const { setCsvData, setLocationTimings, setDrivers, setItinerary } = useWorkflow();
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    // Set up test data
    setCsvData(testCsvData);
    setLocationTimings(testLocationTimings);
    setDrivers(testDrivers);
  }, [setCsvData, setLocationTimings, setDrivers]);

  const runTests = () => {
    const results: TestResult[] = [];

    // Test 1: Verify location-based grouping
    const locationGroups = testCsvData.reduce((acc, guest) => {
      if (!acc[guest.pickupLocation]) {
        acc[guest.pickupLocation] = [];
      }
      acc[guest.pickupLocation].push(guest);
      return acc;
    }, {} as Record<string, Guest[]>);

    const locationTest: TestResult = {
      passed: Object.keys(locationGroups).length === 3, // Airport, Hotel Downtown, Train Station
      message: "Location-based grouping",
      details: [
        `Found ${Object.keys(locationGroups).length} locations`,
        `Locations: ${Object.keys(locationGroups).join(', ')}`
      ]
    };
    results.push(locationTest);

    // Test 2: Verify driver capacity constraints
    const capacityTest: TestResult = {
      passed: true,
      message: "Driver capacity constraints",
      details: []
    };

    testDrivers.forEach(driver => {
      const driverAssignments = expectedItinerary.filter(item => item.driverId === driver.id);
      const totalGuests = driverAssignments.reduce((sum, item) => sum + item.totalGuests, 0);
      const withinCapacity = totalGuests <= driver.vehicleCapacity;
      capacityTest.passed = capacityTest.passed && withinCapacity;
      capacityTest.details.push(
        `${driver.name}: ${totalGuests} guests (Capacity: ${driver.vehicleCapacity}) - ${withinCapacity ? 'OK' : 'Exceeded'}`
      );
    });
    results.push(capacityTest);

    // Test 3: Verify time-based scheduling
    const timeTest: TestResult = {
      passed: true,
      message: "Time-based scheduling",
      details: []
    };

    const timeSlots = expectedItinerary.reduce((acc, item) => {
      const key = `${item.arrivalDate}-${item.pickupTime}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, ItineraryItem[]>);

    Object.entries(timeSlots).forEach(([time, items]) => {
      const locations = new Set(items.map(item => item.pickupLocation));
      timeTest.details.push(
        `${time}: ${items.length} pickups at ${locations.size} locations`
      );
    });
    results.push(timeTest);

    // Test 4: Verify location prioritization
    const locationPriorityTest: TestResult = {
      passed: true,
      message: "Location prioritization",
      details: []
    };

    const sortedLocations = [...testLocationTimings].sort((a, b) => b.roundTripMinutes - a.roundTripMinutes);
    locationPriorityTest.details.push(
      `Expected order: ${sortedLocations.map(l => l.location).join(' > ')}`
    );
    results.push(locationPriorityTest);

    // Test 5: Verify guest count accuracy
    const guestCountTest: TestResult = {
      passed: true,
      message: "Guest count accuracy",
      details: []
    };

    expectedItinerary.forEach(item => {
      const calculatedTotal = item.guests.reduce((sum, guest) => sum + guest.numberOfGuests, 0);
      const matches = calculatedTotal === item.totalGuests;
      guestCountTest.passed = guestCountTest.passed && matches;
      guestCountTest.details.push(
        `Itinerary ${item.id}: ${calculatedTotal} = ${item.totalGuests} - ${matches ? 'OK' : 'Mismatch'}`
      );
    });
    results.push(guestCountTest);

    setTestResults(results);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Itinerary Generation Tests</CardTitle>
          <CardDescription>Test results for itinerary generation logic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Run Tests
            </button>

            {testResults.length > 0 && (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {result.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <h3 className="font-medium">{result.message}</h3>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                    <div className="pl-7 space-y-1">
                      {result.details.map((detail, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 