"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressStepper } from "@/components/progress-stepper"
import { CsvUploadStep } from "@/components/csv-upload-step"
import { DataReviewStep } from "@/components/data-review-step"
import { ItineraryStep } from "@/components/itinerary-step"
import { ViewItineraryStep } from "@/components/view-itinerary-step"
import { WorkflowProvider, useWorkflow } from "@/context/workflow-context"
import { Heart } from "lucide-react"

function DashboardContent() {
  const { currentStep } = useWorkflow()

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="relative bg-wedding-gradient py-12 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 bg-repeat"></div>
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
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
            <CardTitle>Wedding Travel Workflow</CardTitle>
            <CardDescription>Follow these steps to manage guest travel arrangements for your wedding</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressStepper />
          </CardContent>
        </Card>

        {currentStep === "upload" && <CsvUploadStep />}
        {currentStep === "review" && <DataReviewStep />}
        {currentStep === "itinerary" && <ItineraryStep />}
        {currentStep === "view_itinerary" && <ViewItineraryStep />}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <WorkflowProvider>
      <DashboardContent />
    </WorkflowProvider>
  )
}
