"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

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
}

export type WorkflowStep = "upload" | "review" | "itinerary" | "communication"

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

  // New properties
  locationTimings: LocationTiming[]
  setLocationTimings: (timings: LocationTiming[]) => void
  driverCapacity: DriverCapacity
  setDriverCapacity: (capacity: DriverCapacity) => void
  drivers: Driver[]
  setDrivers: (drivers: Driver[]) => void
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

  // Add new state variables
  const [locationTimings, setLocationTimings] = useState<LocationTiming[]>([])
  const [driverCapacity, setDriverCapacity] = useState<DriverCapacity>({ maxPassengers: 4 })
  const [drivers, setDrivers] = useState<Driver[]>([])

  return (
    <WorkflowContext.Provider
      value={{
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
        // Add new state variables to the context value
        locationTimings,
        setLocationTimings,
        driverCapacity,
        setDriverCapacity,
        drivers,
        setDrivers,
      }}
    >
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
