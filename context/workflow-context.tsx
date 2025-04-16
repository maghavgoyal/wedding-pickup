"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

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
  maxPassengers: number // Consider if this is still needed or part of Driver
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
    // Added these from generation logic for completeness
    arrivalDate?: string 
    arrivalTime?: string
  }[]
  totalGuests: number
}

// Saved state structure in localStorage
interface SavedState {
  csvData: any[];
  locationTimings: LocationTiming[];
  drivers: Driver[];
  itinerary: ItineraryItem[];
}

export type WorkflowStep = "upload" | "review" | "itinerary" | "view_itinerary"

// Update the WorkflowContextType interface
interface WorkflowContextType {
  // Existing properties
  currentStep: WorkflowStep
  setCurrentStep: (step: WorkflowStep) => void
  csvData: any[] // Raw data from CSV for persistence & itinerary generation
  setCsvData: (data: any[]) => void
  guestData: any[] | null // Processed data (e.g., with ticket info) for review display
  setGuestData: (data: any[] | null) => void
  selectedFile: File | null
  setSelectedFile: (file: File | null) => void
  selectedCsvFile: string | null
  setSelectedCsvFile: (filename: string | null) => void
  locationTimings: LocationTiming[]
  setLocationTimings: (timings: LocationTiming[]) => void
  drivers: Driver[]
  setDrivers: (drivers: Driver[]) => void
  itinerary: ItineraryItem[]
  setItinerary: (items: ItineraryItem[]) => void

  // Persistence-related properties
  savedCsvFiles: string[];
  loadSavedState: (filename: string) => Promise<void>; // Make async to handle potential parsing/validation
  resetWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

const SAVED_CSV_LIST_KEY = 'weddingPickup_savedCsvs';
const getLocalStorageKey = (filename: string) => `weddingPickup_${filename}`;

export const WorkflowProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload")
  const [csvData, setCsvDataState] = useState<any[]>([])
  const [guestData, setGuestData] = useState<any[] | null>(null) // Add back guestData state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCsvFile, setSelectedCsvFile] = useState<string | null>(null)
  const [locationTimings, setLocationTimings] = useState<LocationTiming[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [savedCsvFiles, setSavedCsvFiles] = useState<string[]>([]);

  // Load the list of saved CSV files on mount
  useEffect(() => {
    try {
      const savedList = localStorage.getItem(SAVED_CSV_LIST_KEY);
      if (savedList) {
        setSavedCsvFiles(JSON.parse(savedList));
      }
    } catch (error) {
      console.error("Failed to load saved CSV list from localStorage:", error);
      // Optionally clear corrupted data
      // localStorage.removeItem(SAVED_CSV_LIST_KEY);
    }
  }, []);

  // Function to reset workflow state
  const resetWorkflow = useCallback(() => {
    setCsvDataState([]);
    setGuestData(null); // Reset guestData as well
    setLocationTimings([]);
    setDrivers([]);
    setItinerary([]);
    setSelectedFile(null);
    setSelectedCsvFile(null);
    setCurrentStep("upload"); // Reset to the beginning
    console.log("Workflow state reset");
  }, []);

  // Modified setCsvData to reset related state first
  const setCsvData = (data: any[]) => {
    // Reset config/itinerary when new CSV data is loaded
    setGuestData(null); // Also reset processed guest data
    setLocationTimings([]);
    setDrivers([]);
    setItinerary([]);
    setCsvDataState(data);
  };

  // Function to load saved state for a specific CSV file
  const loadSavedState = useCallback(async (filename: string) => {
    console.log(`Attempting to load state for ${filename}`);
    try {
      const savedDataString = localStorage.getItem(getLocalStorageKey(filename));
      if (savedDataString) {
        const savedState: SavedState = JSON.parse(savedDataString);
        
        // Basic validation (can be expanded)
        if (savedState && Array.isArray(savedState.csvData)) {
          setCsvDataState(savedState.csvData);
          setLocationTimings(savedState.locationTimings || []);
          setDrivers(savedState.drivers || []);
          setItinerary(savedState.itinerary || []);
          setSelectedCsvFile(filename);
          setSelectedFile(null); // Clear selected file as we loaded from storage

          // Determine the next step
          if (savedState.itinerary && savedState.itinerary.length > 0) {
            setCurrentStep("view_itinerary");
            console.log(`Loaded state for ${filename}, jumping to view itinerary.`);
          } else {
            setCurrentStep("itinerary"); // Go to config step if no itinerary yet
            console.log(`Loaded state for ${filename}, jumping to itinerary configuration.`);
          }
          return;
        } else {
          console.error(`Invalid saved state structure for ${filename}. Resetting.`);
          localStorage.removeItem(getLocalStorageKey(filename)); // Clean up corrupted data
          // Remove from saved list as well
          setSavedCsvFiles(prev => prev.filter(f => f !== filename));
          localStorage.setItem(SAVED_CSV_LIST_KEY, JSON.stringify(savedCsvFiles.filter(f => f !== filename)));
          resetWorkflow();
        }
      } else {
        console.warn(`No saved state found for ${filename}. Starting fresh.`);
        // If no state found, reset everything except the selected filename
        resetWorkflow();
        setSelectedCsvFile(filename);
        // You might want to trigger CSV parsing here if the file object is available
        // or expect the upload step to handle it.
      }
    } catch (error) {
      console.error(`Failed to load or parse state for ${filename}:`, error);
      // Optionally clear corrupted data and reset
      localStorage.removeItem(getLocalStorageKey(filename));
      setSavedCsvFiles(prev => prev.filter(f => f !== filename));
      localStorage.setItem(SAVED_CSV_LIST_KEY, JSON.stringify(savedCsvFiles.filter(f => f !== filename)));
      resetWorkflow();
    }
  }, [resetWorkflow, savedCsvFiles]); // Added savedCsvFiles dependency

  return (
    <WorkflowContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        csvData,
        setCsvData,
        guestData, // Expose guestData
        setGuestData, // Expose setGuestData
        selectedFile,
        setSelectedFile,
        selectedCsvFile,
        setSelectedCsvFile, // Keep this setter
        locationTimings,
        setLocationTimings,
        drivers,
        setDrivers,
        itinerary,
        setItinerary,
        
        // Persistence values
        savedCsvFiles,
        loadSavedState,
        resetWorkflow,
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
