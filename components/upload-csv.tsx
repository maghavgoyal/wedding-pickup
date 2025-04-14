"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { processCSV } from "@/lib/actions"

export function UploadCSV() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setError(null)
    } else {
      setFile(null)
      setError("Please select a valid CSV file")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setProgress(0)
      setError(null)
      setSuccess(false)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 200)

      // Process the CSV file
      const formData = new FormData()
      formData.append("file", file)

      await processCSV(formData)

      clearInterval(progressInterval)
      setProgress(100)
      setSuccess(true)

      // Refresh the page data after successful upload
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      setError("Failed to process the CSV file. Please try again.")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full gap-1.5">
        <Label htmlFor="csv" className="text-sm font-medium">
          Upload CSV File
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="csv"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              className="wedding-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-wedding-100 file:text-wedding-700 hover:file:bg-wedding-200"
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="gap-2 bg-wedding-500 hover:bg-wedding-600 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-glow"
          >
            {uploading ? (
              <>Processing</>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV file containing guest information and Google Drive links to travel documents.
        </p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploading and processing...</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-wedding-gradient" />
          <p className="text-xs text-muted-foreground animate-pulse">Fetching documents from Google Drive...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-mint-50 border-mint-200">
          <CheckCircle2 className="h-4 w-4 text-mint-600" />
          <AlertTitle className="text-mint-800">Success</AlertTitle>
          <AlertDescription className="text-mint-700">
            CSV file processed successfully. Guest information has been updated.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border p-4 bg-gray-50">
        <div className="flex items-center gap-2">
          <FileUp className="h-5 w-5 text-wedding-500" />
          <span className="font-medium">CSV Format Requirements</span>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>Your CSV file should include the following columns:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Guest Name</li>
            <li>Email</li>
            <li>Phone Number</li>
            <li>Number of Travelers</li>
            <li>Google Drive Link (to travel documents)</li>
            <li>Special Notes (optional)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
