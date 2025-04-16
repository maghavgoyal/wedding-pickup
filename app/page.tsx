"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressStepper } from "@/components/progress-stepper"
import { CsvUploadStep } from "@/components/csv-upload-step"
import { DataReviewStep } from "@/components/data-review-step"
import { ItineraryStep } from "@/components/itinerary-step"
import { ViewItineraryStep } from "@/components/view-itinerary-step"
import { WorkflowProvider, useWorkflow } from "@/context/workflow-context"
import { HomePage } from "@/components/home-page"
import { Heart, UserCheck, Link as LinkIcon, FolderOpen, AlertCircle, Upload, History, FileText, ArrowLeft, CheckCircle, Loader2, FileUp, FileWarning, FileQuestion, ThumbsUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { parseCSVData } from "@/lib/guest-parser"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Define the structure for the ID Check workflow components (placeholder)
function IdCheckSetupStep({ onSetupComplete }: { onSetupComplete: () => void }) {
  const { 
    savedCsvFiles, 
    loadSavedState, 
    setSelectedCsvFile,
    setCsvData, 
    csvData,
    selectedCsvFile,
    resetWorkflow
  } = useWorkflow(); 
  
  const [error, setError] = useState<string | null>(null);
  const [loadingPrevious, setLoadingPrevious] = useState<string | null>(null);
  const [csvSourceMode, setCsvSourceMode] = useState<'choice' | 'new' | 'previous'>('choice');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploadingNew, setIsUploadingNew] = useState(false);

  const handleSelectPrevious = async (filename: string) => {
    setLoadingPrevious(filename);
    setError(null);
    try {
      await loadSavedState(filename);
      setCsvSourceMode('previous');
    } catch (err) {
      setError(`Failed to load ${filename}. Please try again.`);
      console.error(err);
    } finally {
      setLoadingPrevious(null);
    }
  };
  
  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        resetWorkflow();
        setNewFile(selectedFile);
        setError(null);
      } else {
        setNewFile(null);
        setError("Please select a valid CSV file (.csv extension).");
      }
    }
  };

  const handleProcessNewFile = async () => {
    if (!newFile) return;
    setIsUploadingNew(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvContent = event.target?.result as string;
          if (!csvContent || !csvContent.trim()) {
            throw new Error("CSV file is empty or cannot be read.");
          }
          const guests = parseCSVData(csvContent);
          if (guests.length === 0) {
            throw new Error("No valid guest data found in the CSV file.");
          }
          setCsvData(guests);
          setSelectedCsvFile(newFile.name);
          setIsUploadingNew(false);
          setCsvSourceMode('new');
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to parse CSV.");
          setIsUploadingNew(false);
          setSelectedCsvFile(null);
          setCsvData([]);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setIsUploadingNew(false);
      };
      reader.readAsText(newFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing file.");
      setIsUploadingNew(false);
    }
  };

  const handleProceed = () => {
    if (!selectedCsvFile || csvData.length === 0) {
      setError("Please select or upload a guest list CSV first.");
      return;
    }
    setError(null);
    console.log("Proceeding with ID Check:", { selectedCsvFile });
    onSetupComplete(); 
  };

  const renderCsvSourceChoice = () => (
    <div className="border p-4 rounded-md space-y-4">
        <Label className="font-medium block text-center">1. Guest List Source</Label>
        <CardDescription className="text-center">How would you like to provide the guest list?</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Button size="lg" onClick={() => setCsvSourceMode('new')} className="w-full sm:w-auto">
             <Upload className="mr-2 h-5 w-5" /> Upload New CSV
          </Button>
          {savedCsvFiles.length > 0 && (
            <Button size="lg" variant="outline" onClick={() => setCsvSourceMode('previous')} className="w-full sm:w-auto">
               <History className="mr-2 h-5 w-5" /> Use Previous Upload
            </Button>
          )}
        </div>
      </div>
  );

  const renderNewCsvUpload = () => (
    <div className="space-y-3 border p-4 rounded-md">
       <div className="flex justify-between items-center">
         <Label className="font-medium">1. Upload New Guest List</Label>
         <Button variant="ghost" size="sm" onClick={() => { resetWorkflow(); setCsvSourceMode('choice'); setNewFile(null); }} className="text-xs">
             <ArrowLeft className="mr-1 h-3 w-3" /> Back to Choice
         </Button>
       </div>
       <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="newCsvForIdCheck"
              type="file"
              accept=".csv"
              onChange={handleNewFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <Button variant="outline" asChild className="w-full justify-start text-muted-foreground">
              <div>
                <FileUp className="mr-2 h-4 w-4" />
                {newFile ? (
                  <span className="font-medium text-primary truncate" title={newFile.name}>{newFile.name}</span>
                ) : (
                  "Choose CSV File..."
                )}
              </div>
            </Button>
          </div>
          <Button onClick={handleProcessNewFile} disabled={!newFile || isUploadingNew} className="min-w-[120px]">
            {isUploadingNew ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            {isUploadingNew ? "Processing..." : "Use This File"}
          </Button>
       </div>
    </div>
  );

  const renderPreviousCsvSelection = () => (
     <div className="space-y-3 border p-4 rounded-md">
        <div className="flex justify-between items-center">
          <Label className="font-medium">1. Use Previous Guest List</Label>
          <Button variant="ghost" size="sm" onClick={() => setCsvSourceMode('choice')} className="text-xs">
              <ArrowLeft className="mr-1 h-3 w-3" /> Back to Choice
          </Button>
        </div>
        {savedCsvFiles.length > 0 ? (
           <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50/50">
             {savedCsvFiles.map((filename) => (
               <Button
                 key={filename}
                 variant="ghost"
                 className="w-full justify-start text-left text-sm h-auto py-1.5 px-2 flex items-center gap-2"
                 onClick={() => handleSelectPrevious(filename)}
                 disabled={loadingPrevious === filename}
               >
                 {loadingPrevious === filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                 {filename}
               </Button>
             ))}
           </div>
         ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No previously saved lists found.</p>
         )}
     </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>ID Check Setup</CardTitle>
        <CardDescription>Select the guest list to check against ID uploads.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {csvSourceMode === 'choice' && renderCsvSourceChoice()}
        
        {csvSourceMode === 'new' && !selectedCsvFile && renderNewCsvUpload()}
        
        {csvSourceMode === 'previous' && !selectedCsvFile && renderPreviousCsvSelection()}

        {selectedCsvFile && (
          <div className="p-3 border rounded-md bg-green-50 border-green-200 text-sm space-y-2">
             <Label className="font-medium block">1. Guest List Selected</Label>
             <div>Selected: <span className="font-semibold text-green-700">{selectedCsvFile}</span> ({csvData.length} guests)</div>
             <Button 
               variant="link"
               size="sm"
               className="h-auto p-0 text-xs"
               onClick={() => { resetWorkflow(); setCsvSourceMode('choice'); setNewFile(null); }}
             >
               Change Selection
             </Button>
           </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleProceed} 
          disabled={!selectedCsvFile || csvData.length === 0}
          className="w-full"
        >
          Proceed to Dashboard
        </Button>
      </CardContent>
    </Card>
  )
}

// --- Type Definitions (Ensure Guest includes driveLink) ---
type Guest = { name: string; driveLink?: string; [key: string]: any }; // Added optional driveLink
type DriveFile = { name: string; id: string }; // Keep for potential future use?
type ProcessingResult = { 
  status: 'verified' | 'missing_link' | 'missing_subfolder' | 'no_verifiable_file' | 'error'; 
  extractedName?: string | null; 
  message?: string; 
};
type ParsingError = { guest: Guest; error: string }; // Type for guests with failed link processing

// --- Updated ID Dashboard Step ---
function IdDashboardStep() {
  const { csvData } = useWorkflow();
  const guests: Guest[] = csvData || [];

  const [verifiedGuests, setVerifiedGuests] = useState<Guest[]>([]);
  const [missingGuests, setMissingGuests] = useState<Guest[]>([]);
  const [parsingErrors, setParsingErrors] = useState<ParsingError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    const processVerification = async () => {
      setIsLoading(true);
      setProcessingError(null);
      setVerifiedGuests([]);
      setMissingGuests([]);
      setParsingErrors([]);

      if (!guests || guests.length === 0) {
        setProcessingError("No guest list loaded.");
        setIsLoading(false);
        return;
      }

      const verified: Guest[] = [];
      const missing: Guest[] = [];
      const errors: ParsingError[] = [];

      try {
        const processingPromises = guests.map(async (guest) => {
          if (!guest.driveLink || guest.driveLink.trim() === "") {
            console.log(`Guest ${guest.name} missing driveLink.`);
            return { guest, result: { status: 'missing_link' } as ProcessingResult };
          }

          try {
            // --- Call the unified, parameterized backend endpoint --- 
            console.log(`Processing 'IDs' folder for guest: ${guest.name} (Link: ${guest.driveLink})`);
            const response = await fetch(
              `/api/process-guest-folder?driveLink=${encodeURIComponent(guest.driveLink)}&subfolderName=IDs&parsingGoal=extract_name&guestName=${encodeURIComponent(guest.name)}`
            );
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
              console.error(`API Error for ${guest.name}:`, errorData);
              return { guest, result: { status: 'error', message: errorData.message || `API Error ${response.status}` } as ProcessingResult };
            }

            const result: ProcessingResult = await response.json();
            console.log(`Result for ${guest.name}:`, result);
            return { guest, result };

          } catch (guestProcessingError) {
             console.error(`Client-side Error processing link for ${guest.name}:`, guestProcessingError);
             return { guest, result: { status: 'error', message: guestProcessingError instanceof Error ? guestProcessingError.message : "Client-side fetch error" } as ProcessingResult };
          }
        }); // End map guests

        // --- Wait for all guest processing promises --- 
        const results = await Promise.all(processingPromises);

        // --- Categorize results --- 
        results.forEach(({ guest, result }) => {
          if (result.status === 'verified' && result.extractedName?.toLowerCase() === guest.name.toLowerCase()) {
            verified.push(guest);
          } else if (result.status === 'missing_link') {
            missing.push(guest);
          } else {
            // Handle all other non-verified statuses as errors/issues
            let errorMessage = result.message || result.status; // Use message if available
            if (result.status === 'no_verifiable_file') errorMessage = "No verifiable ID found in 'IDs' folder.";
            if (result.status === 'missing_subfolder') errorMessage = "Could not find 'IDs' subfolder.";
            if (result.status === 'verified' && result.extractedName?.toLowerCase() !== guest.name.toLowerCase()){
              errorMessage = `Parsed name '${result.extractedName}' did not match guest name.`;
            }
             errors.push({ guest, error: errorMessage });
          }
        });

        // --- Update state --- 
        setVerifiedGuests(verified);
        setMissingGuests(missing);
        setParsingErrors(errors);

      } catch (error) { // Catch potential errors in Promise.all or setup
        console.error("Error during overall ID verification batch process:", error);
        setProcessingError(error instanceof Error ? error.message : "An unknown error occurred during processing.");
      } finally {
        setIsLoading(false);
      }
    };

    processVerification();
  }, [guests]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Processing ID verification...</span>
        </CardContent>
      </Card>
    );
  }

  if (processingError) {
     return (
      <Card>
         <CardContent className="p-6">
            <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Processing Error</AlertTitle>
               <AlertDescription>{processingError}</AlertDescription>
            </Alert>
         </CardContent>
      </Card>
     )
  }

  return (
    <div className="space-y-6">
       {/* 1. Verified Guests Table */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><ThumbsUp className="h-5 w-5 text-green-600"/> Verified Guests ({verifiedGuests.length})</CardTitle>
           <CardDescription>Guests whose ID uploads were found and their name was successfully verified from the document.</CardDescription>
         </CardHeader>
         <CardContent>
           {verifiedGuests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No verified guests yet.</p>
           ) : (
             <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Guest Name</TableHead>
                       {/* Add other relevant columns if needed from csvData */} 
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {verifiedGuests.map((guest, index) => (
                       <TableRow key={index}>
                         <TableCell className="font-medium">{guest.name}</TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
                </Table>
             </ScrollArea>
           )}
         </CardContent>
       </Card>

       {/* 2. Missing Link Table */} 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><FileWarning className="h-5 w-5 text-yellow-600"/> Missing Link ({missingGuests.length})</CardTitle>
           <CardDescription>Guests from the list who did not have a Google Drive link provided.</CardDescription>
         </CardHeader>
         <CardContent>
           {missingGuests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All guests have provided a link!</p>
           ) : (
             <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Guest Name</TableHead>
                       {/* Add other relevant columns */}
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {missingGuests.map((guest, index) => (
                       <TableRow key={index}>
                         <TableCell className="font-medium">{guest.name}</TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
                </Table>
             </ScrollArea>
            )}
         </CardContent>
       </Card>
       
       {/* 3. Processing Issues Table */} 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><FileQuestion className="h-5 w-5 text-orange-600"/> Processing Issues ({parsingErrors.length})</CardTitle>
           <CardDescription>Guests whose Drive link/folder had issues or whose ID could not be verified.</CardDescription>
         </CardHeader>
         <CardContent>
            {parsingErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No processing issues found.</p>
           ) : (
             <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Guest Name</TableHead>
                       <TableHead>Error / Reason</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {parsingErrors.map((item, index) => (
                       <TableRow key={index}>
                         <TableCell className="font-medium">{item.guest.name}</TableCell>
                         <TableCell>
                            <Badge variant="destructive">{item.error}</Badge>
                         </TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
                </Table>
             </ScrollArea>
            )}
         </CardContent>
       </Card>
    </div>
  )
}

function TransportationWorkflow({ goHome }: { goHome: () => void }) {
  const { currentStep } = useWorkflow()
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="relative bg-wedding-gradient py-12 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 bg-repeat"></div>
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4 mt-8">
            <Heart className="h-8 w-8 text-white fill-white animate-pulse-gentle" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Wedding Travel Manager</h1>
          </div>
          <p className="text-white/80 max-w-2xl">
            Streamline guest travel arrangements, assign drivers, and create communication channels for your special day
          </p>
        </div>
      </div>

      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 container mx-auto">
        <Card className="wedding-card">
          <CardHeader>
            <CardTitle>Transportation Planning Workflow</CardTitle>
            <CardDescription>Follow these steps to manage guest travel arrangements.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressStepper />
          </CardContent>
        </Card>

        {currentStep === "upload" && <CsvUploadStep />}
        {currentStep === "review" && <DataReviewStep />}
        {currentStep === "itinerary" && <ItineraryStep />}
        {currentStep === "view_itinerary" && <ViewItineraryStep />}

        <div className="mt-auto pt-8 text-center">
           <Button 
            variant="outline"
            size="sm"
            onClick={goHome}
            className="bg-white/80 hover:bg-white text-primary hover:text-primary backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home Selection
          </Button>
         </div>
      </main>
    </div>
  )
}

function IdCheckWorkflow({ goHome }: { goHome: () => void }) {
  const [idCheckStep, setIdCheckStep] = useState<'setup' | 'dashboard'>('setup');
  
  const handleSetupComplete = () => {
    setIdCheckStep('dashboard');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="relative bg-secondary/10 py-12 px-4 md:px-6 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4 mt-8">
            <UserCheck className="h-8 w-8 text-secondary-foreground" />
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground">ID Upload Verification</h1>
          </div>
          <p className="text-secondary-foreground/80 max-w-2xl">
            Check the status of guest ID uploads from Google Drive.
          </p>
        </div>
      </div>
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 container mx-auto">
         {idCheckStep === 'setup' && <IdCheckSetupStep onSetupComplete={handleSetupComplete} />}
         {idCheckStep === 'dashboard' && <IdDashboardStep />}

         <div className="mt-auto pt-8 text-center">
           <Button 
            variant="outline"
            size="sm"
            onClick={goHome}
            className="bg-white/80 hover:bg-white text-secondary-foreground hover:text-secondary-foreground backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home Selection
          </Button>
         </div>
      </main>
    </div>
  );
}

export default function AppController() {
  const [activeWorkflow, setActiveWorkflow] = useState<'home' | 'transport' | 'id_check'>('home');

  const selectWorkflow = (workflow: 'transport' | 'id_check') => {
    setActiveWorkflow(workflow);
  };

  // Function to navigate back to the home screen
  const goHome = () => {
    setActiveWorkflow('home');
  };

  // Render based on the active workflow
  if (activeWorkflow === 'home') {
    return <HomePage onSelectWorkflow={selectWorkflow} />;
  }

  if (activeWorkflow === 'transport') {
    // Wrap the TransportationWorkflow with its specific provider
    return (
      <WorkflowProvider>
        <TransportationWorkflow goHome={goHome} />
      </WorkflowProvider>
    );
  }

  if (activeWorkflow === 'id_check') {
    // Wrap the IDCheckWorkflow - might need its own provider later
    // For now, use the existing one if setup needs CSV loading
    return (
       <WorkflowProvider>
         <IdCheckWorkflow goHome={goHome} />
       </WorkflowProvider>
    );
  }

  return null; // Should not happen
}
