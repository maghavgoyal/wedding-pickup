"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileUp, Upload, AlertCircle, CheckCircle2, FileText, Clock, Calendar } from "lucide-react"
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
  const { setCurrentStep, setSelectedCsvFile, setGuestData, setCsvData } = useWorkflow()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedPrevious, setSelectedPrevious] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<Array<{ guest: string; status: string; error?: string; details?: string }>>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setError(null)
        setSelectedPrevious(null)
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

  const handleSelectPrevious = (id: string) => {
    setSelectedPrevious(id)
    setFile(null)

    // Simulate loading data from previous upload
    setTimeout(() => {
      setSelectedCsvFile(previousUploads.find((upload) => upload.id === id)?.name || null)
      setGuestData([]) // Clear mock data usage
      setCurrentStep("review")
    }, 500)
  }

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="wedding-card">
          <CardHeader>
            <CardTitle>Upload New Guest List</CardTitle>
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
                  {uploading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Processing
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
                <p className="text-sm text-muted-foreground">
                  Processing guest information... {progress}%
                </p>
              </div>
            )}

            {processingStatus.length > 0 && (
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {processingStatus.map((status, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 rounded-lg border p-2">
                            {status.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                            {status.status === 'processing' && <Clock className="h-4 w-4 animate-spin text-blue-500" />}
                            {status.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {status.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                            {status.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                            <span className="flex-1">{status.guest}</span>
                            <span className="text-sm text-muted-foreground">
                              {status.status === 'complete' ? 'Complete' :
                               status.status === 'processing' ? 'Processing...' :
                               status.status === 'warning' ? 'Warning' :
                               status.status === 'error' ? 'Error' : 'Pending'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{status.details}</p>
                          {status.error && <p className="text-red-500">{status.error}</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </ScrollArea>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Guest list uploaded successfully. Moving to review...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="wedding-card">
          <CardHeader>
            <CardTitle>Previously Uploaded Files</CardTitle>
            <CardDescription>Select a previously uploaded guest list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previousUploads.map((upload) => (
                <div
                  key={upload.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedPrevious === upload.id
                      ? "border-wedding-300 bg-wedding-50"
                      : "border-gray-200 hover:border-wedding-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectPrevious(upload.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-lavender-100 rounded-lg">
                      <FileText className="h-6 w-6 text-lavender-500" />
                    </div>
                    <div>
                      <p className="font-medium">{upload.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{upload.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{upload.guests} guests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-full ${
                      selectedPrevious === upload.id ? "bg-wedding-500 text-white" : "text-wedding-500"
                    }`}
                  >
                    {selectedPrevious === upload.id ? "Selected" : "Select"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {uploading && processingStatus.length > 0 && (
          <Card className="wedding-card">
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
              <CardDescription>
                Current status of guest data processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {processingStatus.map((status, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {status.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                        {status.status === 'processing' && <FileUp className="h-4 w-4 text-blue-500 animate-pulse" />}
                        {status.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {status.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        <span>{status.guest}</span>
                      </div>
                      <div className="text-sm">
                        {status.error && (
                          <span className="text-red-500">{status.error}</span>
                        )}
                        {!status.error && (
                          <span className={
                            status.status === 'complete' ? 'text-green-500' :
                            status.status === 'processing' ? 'text-blue-500' :
                            'text-gray-500'
                          }>
                            {status.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
