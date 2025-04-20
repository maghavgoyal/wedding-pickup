"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

// Define interfaces for our data types
interface LocationInfo {
  name: string
  roundTripTime: number // in minutes
}

interface DriverInfo {
  id: string
  name: string
  phone: string
  vehicle: string
  capacity: number
  availability: string[]
}

interface Guest {
  name: string
  pickupLocation: string
  numberOfGuests: number
  arrivalDate: string
  arrivalTime: string
}

// Add these new types and state variables to the context

// Add these interfaces after the GuestData interface
export interface LocationTiming {
  location: string
  roundTripMinutes: number
}

export interface DriverCapacity {
  maxPassengers: number
}

export interface Driver {
  id: string
  name: string
  phone: string
  vehicleCapacity: number
  availability?: string
}

export interface ItineraryItem {
  id: string
  driverId: string
  pickupLocation: string
  pickupTime: string
  arrivalDate: string
  guests: {
    name: string
    numberOfGuests: number
  }[]
  totalGuests: number
}

export type WorkflowStep = "upload" | "review" | "itinerary" | "view_itinerary"

// Update the WorkflowContextType interface to include the new state variables
interface WorkflowContextType {
  // Existing properties
  currentStep: WorkflowStep
  setCurrentStep: (step: WorkflowStep) => void
  csvData: any[]
  setCsvData: (data: any[]) => void
  selectedFile: File | null
  setSelectedFile: (file: File | null) => void
  selectedCsvFile: string | null
  setSelectedCsvFile: (filename: string | null) => void
  guestData: any[] | null
  setGuestData: (data: any[] | null) => void
  driverAssignments: Record<string, string[]>
  setDriverAssignments: (assignments: Record<string, string[]>) => void
  locationTimings: LocationTiming[]
  setLocationTimings: (timings: LocationTiming[]) => void
  driverCapacity: DriverCapacity
  setDriverCapacity: (capacity: DriverCapacity) => void
  drivers: Driver[]
  setDrivers: (drivers: Driver[]) => void
  // Add itinerary state
  itinerary: ItineraryItem[]
  setItinerary: (items: ItineraryItem[]) => void
  savedCsvFiles: string[]
  handleFileUpload: (file: File) => void
  resetWorkflow: () => void
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

// Update the WorkflowProvider component to include the new state variables
export const WorkflowProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload")
  const [csvData, setCsvData] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCsvFile, setSelectedCsvFile] = useState<string | null>(null)
  const [guestData, setGuestData] = useState<any[] | null>(null)
  const [driverAssignments, setDriverAssignments] = useState<Record<string, string[]>>({})
  const [locationTimings, setLocationTimings] = useState<LocationTiming[]>([])
  const [driverCapacity, setDriverCapacity] = useState<DriverCapacity>({ maxPassengers: 4 })
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [savedCsvFiles, setSavedCsvFiles] = useState<string[]>([])

  // Save state whenever it changes
  useEffect(() => {
    if (selectedCsvFile) {
      try {
        const stateToSave = {
          csvData,
          guestData,
          driverAssignments,
          locationTimings,
          driverCapacity,
          drivers,
          itinerary,
          currentStep
        }
        localStorage.setItem(`weddingPickup_${selectedCsvFile}`, JSON.stringify(stateToSave))
        
        // Update the list of saved CSVs
        const savedCsvs = JSON.parse(localStorage.getItem('weddingPickup_savedCsvs') || '[]')
        if (!savedCsvs.includes(selectedCsvFile)) {
          savedCsvs.push(selectedCsvFile)
          localStorage.setItem('weddingPickup_savedCsvs', JSON.stringify(savedCsvs))
          setSavedCsvFiles(savedCsvs)
        }
      } catch (error) {
        console.error("Error saving state:", error)
      }
    }
  }, [selectedCsvFile, csvData, guestData, driverAssignments, locationTimings, driverCapacity, drivers, itinerary, currentStep])

  // Load saved CSV files on mount
  useEffect(() => {
    try {
      const savedCsvs = JSON.parse(localStorage.getItem('weddingPickup_savedCsvs') || '[]')
      setSavedCsvFiles(savedCsvs)
    } catch (error) {
      console.error("Error loading saved CSV files:", error)
      setSavedCsvFiles([])
    }
  }, [])

  // Load saved state when a CSV file is selected
  useEffect(() => {
    if (selectedCsvFile) {
      try {
        const savedState = localStorage.getItem(`weddingPickup_${selectedCsvFile}`)
        if (savedState) {
          const parsedState = JSON.parse(savedState)
          
          // Validate and set each piece of state
          if (Array.isArray(parsedState.csvData)) {
            setCsvData(parsedState.csvData)
          }
          if (Array.isArray(parsedState.guestData)) {
            setGuestData(parsedState.guestData)
          }
          if (typeof parsedState.driverAssignments === 'object') {
            setDriverAssignments(parsedState.driverAssignments)
          }
          if (Array.isArray(parsedState.locationTimings)) {
            setLocationTimings(parsedState.locationTimings)
          }
          if (typeof parsedState.driverCapacity === 'object') {
            setDriverCapacity(parsedState.driverCapacity)
          }
          if (Array.isArray(parsedState.drivers)) {
            setDrivers(parsedState.drivers)
          }
          if (Array.isArray(parsedState.itinerary)) {
            setItinerary(parsedState.itinerary)
          }
          if (parsedState.currentStep) {
            setCurrentStep(parsedState.currentStep)
          }
        }
      } catch (error) {
        console.error("Error loading saved state:", error)
        // Reset to initial state if loading fails
        resetWorkflow()
      }
    }
  }, [selectedCsvFile])

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const guest: Guest = {
          name: values[headers.indexOf('name')] || '',
          pickupLocation: values[headers.indexOf('pickupLocation')] || '',
          numberOfGuests: parseInt(values[headers.indexOf('numberOfGuests')] || '1', 10),
          arrivalDate: values[headers.indexOf('arrivalDate')] || '',
          arrivalTime: values[headers.indexOf('arrivalTime')] || '',
        }
        return guest
      })

      setCsvData(data)
      setSelectedCsvFile(file.name)
      setCurrentStep("review")
    }
    reader.readAsText(file)
  }

  const resetWorkflow = () => {
    setCsvData([])
    setGuestData(null)
    setDriverAssignments({})
    setLocationTimings([])
    setDriverCapacity({ maxPassengers: 4 })
    setDrivers([])
    setItinerary([])
    setSelectedCsvFile(null)
    setCurrentStep("upload")
  }

  const value = {
    currentStep,
    setCurrentStep,
    csvData,
    setCsvData,
    selectedFile,
    setSelectedFile,
    selectedCsvFile,
    setSelectedCsvFile,
    guestData,
    setGuestData,
    driverAssignments,
    setDriverAssignments,
    locationTimings,
    setLocationTimings,
    driverCapacity,
    setDriverCapacity,
    drivers,
    setDrivers,
    itinerary,
    setItinerary,
    savedCsvFiles,
    handleFileUpload,
    resetWorkflow,
  }

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider")
  }
  return context
}
