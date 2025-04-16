"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileUp, Upload, AlertCircle, CheckCircle2, FileText, Clock, Calendar, ArrowLeft, History, Loader2 } from "lucide-react"
import { useWorkflow } from "@/context/workflow-context"
import { parseCSVData, processGuestTickets } from "@/lib/guest-parser"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Mock previously uploaded CSV files
const previousUploads = [
  { id: "1", name: "Smith-Johnson Wedding Guests.csv", date: "2023-05-15", guests: 42 },
  { id: "2", name: "Williams-Brown Wedding Guests.csv", date: "2023-06-02", guests: 28 },
  { id: "3", name: "Davis-Miller Wedding Guests.csv", date: "2023-06-10", guests: 35 },
]

export function CsvUploadStep() {
  const {
    setCurrentStep,
    setSelectedCsvFile,
    setGuestData,
    setCsvData,
    savedCsvFiles,
    loadSavedState,
    resetWorkflow
  } = useWorkflow()

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loadingPrevious, setLoadingPrevious] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<Array<{ guest: string; status: string; error?: string; details?: string }>>([])
  
  // State to manage which view is shown: initial choice, new upload, or previous upload
  const [uploadMode, setUploadMode] = useState<'initial' | 'new' | 'previous'>('initial')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        resetWorkflow()
        setFile(selectedFile)
        setError(null)
        setSuccess(false)
        setProcessingStatus([])
      } else {
        setFile(null)
        setError("Please select a valid CSV file. The file must have a .csv extension.")
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setProgress(0)
      setError(null)
      setSuccess(false)
      setProcessingStatus([])

      // Read the CSV file
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const csvContent = event.target?.result as string
          if (!csvContent || !csvContent.trim()) {
            throw new Error("CSV file is empty or could not be read.")
          }

          const lines = csvContent.split('\n')
          if (lines.length < 2) {
            throw new Error("CSV must contain a header row and at least one guest row.")
          }

          // Parse the CSV data
          const guests = parseCSVData(csvContent)
          if (guests.length === 0) {
            throw new Error("No valid guest data found in the CSV file.")
          }

          // IMPORTANT: Set raw CSV data first for persistence saving
          setCsvData(guests) 
          setSelectedCsvFile(file.name) // Set the filename early

          setProcessingStatus(guests.map(g => ({ 
            guest: g.name || 'Unknown Guest', 
            status: 'pending',
            details: `Phone: ${g.phone || 'Not provided'}`
          })))
          
          // Start progress updates
          const progressInterval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 95) {
                clearInterval(progressInterval)
                return 95
              }
              return prev + 5
            })
          }, 200)

          // Process each guest's tickets (Assuming this step is for display/review only)
          // The raw `guests` data is already set in context for itinerary generation
          const processedGuestDisplayData = await Promise.all(
            guests.map(async (guest, index) => {
              try {
                setProcessingStatus(prev => 
                  prev.map(p => p.guest === guest.name ? { 
                    ...p, 
                    status: 'processing',
                    details: `Processing ticket information...`
                  } : p)
                )
                
                // Update progress based on guest processing
                setProgress(Math.min(95, Math.floor((index / guests.length) * 90)))
                const processedGuest = await processGuestTickets(guest) // This might be redundant if driveLink processing isn't needed for itinerary
                
                setProcessingStatus(prev => 
                  prev.map(p => p.guest === guest.name ? { 
                    ...p, 
                    status: processedGuest.pickupLocation ? 'complete' : 'warning',
                    error: !processedGuest.pickupLocation ? 'No ticket found' : undefined,
                    details: processedGuest.pickupLocation ? 
                      `Pickup: ${processedGuest.pickupLocation}, Arrival: ${processedGuest.arrivalDate} at ${processedGuest.arrivalTime}` :
                      'No ticket information found. Please check the Drive link.'
                  } : p)
                )
                
                return processedGuest // Return the processed data for display
              } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
                setProcessingStatus(prev => 
                  prev.map(p => p.guest === guest.name ? { 
                    ...p, 
                    status: 'error',
                    error: errorMessage,
                    details: `Failed to process ticket. ${errorMessage}`
                  } : p)
                )
                return guest // Return original guest on error
              }
            })
          )

          // Use the potentially enhanced data for the guestData state (for review step display)
          setGuestData(processedGuestDisplayData);

          const failedGuests = processedGuestDisplayData.filter(g => !g.pickupLocation)
          if (failedGuests.length > 0) {
            setError(`Warning: ${failedGuests.length} guest(s) are missing ticket information. Review recommended.`)
          }

          clearInterval(progressInterval)
          setProgress(100)
          setSuccess(true)

          // Move to the next step after a short delay
          setTimeout(() => {
            setCurrentStep("review")
          }, 1500)
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
          setError(`Failed to process the CSV file: ${errorMessage}`)
          setUploading(false)
          setProgress(0)
        }
      }

      reader.onerror = (error) => {
        setError("Failed to read the CSV file.")
        setUploading(false)
        setProgress(0)
      }

      reader.readAsText(file)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to process the CSV file: ${errorMessage}`)
      setUploading(false)
      setProgress(0)
    }
  }

  const handleSelectPrevious = async (filename: string) => {
    setLoadingPrevious(filename) // Show loading indicator for this file
    setError(null)
    setSuccess(false)
    setFile(null)
    try {
      await loadSavedState(filename); // Call the function from context
      // loadSavedState will handle setting the current step and data
    } catch (err) {
      setError(`Failed to load saved state for ${filename}. Please try again or upload fresh.`);
      console.error("Error in handleSelectPrevious:", err);
    } finally {
      setLoadingPrevious(null) // Hide loading indicator
    }
  }

  const renderInitialChoice = () => (
    <Card className="wedding-card text-center">
      <CardHeader>
        <CardTitle>Guest List Source</CardTitle>
        <CardDescription>How would you like to provide the guest list?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4 justify-center items-center p-6">
        <Button size="lg" onClick={() => setUploadMode('new')} className="w-full sm:w-auto">
          <Upload className="mr-2 h-5 w-5" />
          Upload New CSV
        </Button>
        {savedCsvFiles.length > 0 && (
          <Button size="lg" variant="outline" onClick={() => setUploadMode('previous')} className="w-full sm:w-auto">
            <History className="mr-2 h-5 w-5" />
            Use Previous Upload
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderNewUpload = () => (
    <Card className="wedding-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Upload New Guest List</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { resetWorkflow(); setUploadMode('initial'); }} className="text-xs text-muted-foreground">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back
          </Button>
        </div>
        <CardDescription>
          Upload a CSV file containing guest information (Name, Phone, Pickup Location, # Guests, Arrival Date, Arrival Time).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="csv" className="text-sm font-medium">
            Select CSV File
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="csv"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Button variant="outline" asChild className="w-full justify-start text-muted-foreground">
                <div>
                  <FileUp className="mr-2 h-4 w-4" />
                  {file ? (
                    <span className="font-medium text-primary truncate" title={file.name}>{file.name}</span>
                  ) : (
                    "Choose CSV File..."
                  )}
                </div>
              </Button>
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading} className="min-w-[120px]">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading ? "Processing..." : "Process File"}
            </Button>
          </div>
        </div>

        {uploading && <Progress value={progress} className="w-full h-2" />}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              CSV processed successfully! Moving to the next step...
            </AlertDescription>
          </Alert>
        )}
        
        {processingStatus.length > 0 && (
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-2">Processing Details:</h4>
            <ScrollArea className="h-[200px] border rounded-md p-2 bg-gray-50/50">
              <div className="space-y-1">
                {processingStatus.map((item, index) => (
                  <TooltipProvider key={index} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-xs p-1 rounded hover:bg-gray-100">
                          <span className="truncate pr-2">{item.guest}</span>
                          <span className={`flex items-center gap-1 font-medium 
                            ${item.status === 'complete' ? 'text-green-600' : 
                              item.status === 'pending' ? 'text-gray-500' : 
                              item.status === 'processing' ? 'text-blue-600 animate-pulse' : 
                              item.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {item.status === 'pending' && <Clock className="h-3 w-3" />}
                            {item.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                            {item.status === 'complete' && <CheckCircle2 className="h-3 w-3" />}
                            {item.status === 'warning' && <AlertCircle className="h-3 w-3" />}
                            {item.status === 'error' && <AlertCircle className="h-3 w-3" />}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs break-words text-xs">
                        <p>{item.details || 'No details available.'}</p>
                        {item.error && <p className="text-red-600 mt-1">Error: {item.error}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPreviousUploads = () => (
    <Card className="wedding-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Use Previous Upload</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setUploadMode('initial')} className="text-xs text-muted-foreground">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back
          </Button>
        </div>
        <CardDescription>Select a previously processed CSV file to load its data and itinerary.</CardDescription>
      </CardHeader>
      <CardContent>
        {savedCsvFiles.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No previously saved CSV files found.</p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {savedCsvFiles.map((filename) => (
                <Button
                  key={filename}
                  variant="outline"
                  className="w-full justify-start h-auto py-2 px-3 text-left flex items-center gap-3"
                  onClick={() => handleSelectPrevious(filename)}
                  disabled={loadingPrevious === filename}
                >
                  {loadingPrevious === filename ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={`flex-1 truncate font-medium ${loadingPrevious === filename ? 'text-muted-foreground' : 'text-primary'}`}>
                    {filename}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {uploadMode === 'initial' && renderInitialChoice()}
        {uploadMode === 'new' && renderNewUpload()}
        {uploadMode === 'previous' && renderPreviousUploads()}
      </div>
    </div>
  )
}
