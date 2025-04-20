"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileUp, Upload, AlertCircle, CheckCircle2, FileText, Clock, Calendar, ArrowLeft } from "lucide-react"
import { useWorkflow } from "@/context/workflow-context"
import { parseCSVData, processGuestTickets } from "@/lib/guest-parser"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function CsvUploadStep() {
  const { 
    setCurrentStep, 
    setSelectedCsvFile, 
    setGuestData, 
    setCsvData,
    savedCsvFiles,
    handleFileUpload
  } = useWorkflow()
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedPrevious, setSelectedPrevious] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<Array<{ guest: string; status: string; error?: string; details?: string }>>([])
  const [uploadMode, setUploadMode] = useState<'initial' | 'new' | 'previous'>('initial')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setError(null)
        setSelectedPrevious(null) // Clear previous selection if new file is chosen
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
          if (!csvContent) {
            throw new Error("Failed to read CSV file - file appears to be empty")
          }

          if (!csvContent.trim()) {
            throw new Error("The CSV file is empty. Please check the file and try again.")
          }

          const lines = csvContent.split('\n')
          if (lines.length < 2) {
            throw new Error("The CSV file must contain at least a header row and one guest row.")
          }

          // Parse the CSV data
          const guests = parseCSVData(csvContent)
          
          if (guests.length === 0) {
            throw new Error("No guest data was found in the CSV file. Please check the file format.")
          }

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

          // Process each guest's tickets
          const processedGuests = await Promise.all(
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
                const processedGuest = await processGuestTickets(guest)
                
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
                
                return processedGuest
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
                return guest
              }
            })
          )

          const failedGuests = processedGuests.filter(g => !g.pickupLocation)
          if (failedGuests.length > 0) {
            setError(`Warning: ${failedGuests.length} guest(s) are missing ticket information. You can still proceed, but please review the details.`)
          }

          clearInterval(progressInterval)
          setProgress(100)
          setSuccess(true)

          // Save the initial state to localStorage
          const initialState = {
            csvData: processedGuests,
            guestData: processedGuests,
            locationTimings: [],
            drivers: [],
            itinerary: [],
            currentStep: "review"
          }
          localStorage.setItem(`weddingPickup_${file.name}`, JSON.stringify(initialState))
          
          // Update the list of saved files
          const savedCsvs = JSON.parse(localStorage.getItem('weddingPickup_savedCsvs') || '[]')
          if (!savedCsvs.includes(file.name)) {
            savedCsvs.push(file.name)
            localStorage.setItem('weddingPickup_savedCsvs', JSON.stringify(savedCsvs))
          }

          setSelectedCsvFile(file.name)
          setGuestData(processedGuests)
          setCsvData(processedGuests)

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
        setError("Failed to read the CSV file. The file may be corrupted or inaccessible.")
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

  const handleSelectPrevious = (filename: string) => {
    setSelectedPrevious(filename)
    setFile(null) // Clear new file if previous is selected
    
    // Load the saved state
    const savedState = localStorage.getItem(`weddingPickup_${filename}`)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        if (Array.isArray(parsedState.csvData)) {
          setCsvData(parsedState.csvData)
        }
        if (Array.isArray(parsedState.guestData)) {
          setGuestData(parsedState.guestData)
        }
        setSelectedCsvFile(filename)
        setCurrentStep("review")
      } catch (error) {
        console.error("Error loading saved state:", error)
        setError("Failed to load the saved guest list. Please try uploading again.")
      }
    } else {
      setError("Could not find the saved guest list. Please try uploading again.")
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
        <Button size="lg" variant="outline" onClick={() => setUploadMode('previous')} className="w-full sm:w-auto">
          <FileText className="mr-2 h-5 w-5" />
          Use Previous Upload
        </Button>
      </CardContent>
    </Card>
  );

  const renderNewUpload = () => (
    <Card className="wedding-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Upload New Guest List</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setUploadMode('initial')} className="text-xs text-muted-foreground">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back
          </Button>
        </div>
        <CardDescription>
          Upload a CSV file containing guest travel information and Google Drive links.
          The CSV must include columns for Name, Phone Number, and Drive link.
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
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="min-w-[100px]"
            >
              {uploading && progress < 100 ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant={error.startsWith('Warning:') ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.startsWith('Warning:') ? 'Warning' : 'Error'}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            {processingStatus.length > 0 && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50/50">
                <h4 className="text-sm font-medium mb-2 text-gray-600">Processing Guests...</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-3">
                    {processingStatus.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs p-2 rounded-md"
                        style={{
                          backgroundColor: item.status === 'error' ? '#fee2e2' : item.status === 'warning' ? '#fef3c7' : item.status === 'complete' ? '#dcfce7' : '#f3f4f6'
                        }}
                      >
                        <span className="font-medium truncate mr-2">{item.guest}</span>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                {item.status === 'pending' && <Clock className="h-3 w-3 text-gray-400" />}
                                {item.status === 'processing' && <Clock className="h-3 w-3 text-blue-500 animate-spin" />}
                                {item.status === 'complete' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                {item.status === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-600" />}
                                {item.status === 'error' && <AlertCircle className="h-3 w-3 text-red-600" />}
                                <span className="capitalize">{item.status}</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">
                                {item.error || item.details || item.status}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {success && !error?.startsWith('Warning:') && (
          <Alert variant="default">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Upload Successful!</AlertTitle>
            <AlertDescription className="text-green-600">
              Guest data processed. You will be moved to the next step shortly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderPreviousUploads = () => (
    <Card className="wedding-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Use Previous Guest List</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setUploadMode('initial')} className="text-xs text-muted-foreground">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back
          </Button>
        </div>
        <CardDescription>
          Select one of your previously uploaded guest lists to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {savedCsvFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No previous guest lists found.</p>
            <Button variant="outline" onClick={() => setUploadMode('new')} className="mt-4">
              Upload New Guest List
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {savedCsvFiles.map((filename) => {
                // Get the saved state to show guest count
                const savedState = localStorage.getItem(`weddingPickup_${filename}`);
                let guestCount = 0;
                if (savedState) {
                  try {
                    const parsedState = JSON.parse(savedState);
                    guestCount = parsedState.csvData?.length || 0;
                  } catch (e) {
                    console.error('Error parsing saved state:', e);
                  }
                }

                return (
                  <div
                    key={filename}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedPrevious === filename
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSelectPrevious(filename)}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 mt-1 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {guestCount} guests
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
