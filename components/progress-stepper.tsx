"use client"

import { Check } from "lucide-react"
import { useWorkflow, type WorkflowStep } from "@/context/workflow-context"

interface StepProps {
  step: WorkflowStep
  label: string
  index: number
}

export function ProgressStepper() {
  const { currentStep } = useWorkflow()

  const steps = [
    { step: "upload" as WorkflowStep, label: "Upload CSV" },
    { step: "review" as WorkflowStep, label: "Review Data" },
    { step: "itinerary" as WorkflowStep, label: "Generate Itineraries" },
    { step: "communication" as WorkflowStep, label: "Setup Communication" },
  ]

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <Step key={step.step} step={step.step} label={step.label} index={index} />
        ))}
      </div>
    </div>
  )
}

function Step({ step, label, index }: StepProps) {
  const { currentStep } = useWorkflow()

  const steps: WorkflowStep[] = ["upload", "review", "itinerary", "communication"]
  const currentIndex = steps.indexOf(currentStep)

  let status: "completed" | "active" | "pending" = "pending"

  if (steps.indexOf(step) < currentIndex) {
    status = "completed"
  } else if (steps.indexOf(step) === currentIndex) {
    status = "active"
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        {index > 0 && (
          <div
            className={`absolute -left-[7.5rem] top-1/2 h-0.5 w-[7rem] -translate-y-1/2 ${
              status === "pending" ? "bg-gray-200" : "bg-mint-500"
            }`}
          />
        )}
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
            status === "completed" ? "step-completed" : status === "active" ? "step-active" : "step-pending"
          }`}
        >
          {status === "completed" ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <span className="text-sm font-medium">{index + 1}</span>
          )}
        </div>
        {index < steps.length - 1 && (
          <div
            className={`absolute -right-[7.5rem] top-1/2 h-0.5 w-[7rem] -translate-y-1/2 ${
              status === "pending" || status === "active" ? "bg-gray-200" : "bg-mint-500"
            }`}
          />
        )}
      </div>
      <span
        className={`mt-2 text-xs font-medium ${
          status === "completed" ? "text-mint-700" : status === "active" ? "text-wedding-700" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  )
}
