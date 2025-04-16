"use client"

import { Check } from "lucide-react"
import { useWorkflow, type WorkflowStep } from "@/context/workflow-context"

interface StepProps {
  step: WorkflowStep
  label: string
  index: number
  totalSteps: number
}

export function ProgressStepper() {
  const { currentStep } = useWorkflow()

  const steps = [
    { step: "upload" as WorkflowStep, label: "Upload CSV" },
    { step: "review" as WorkflowStep, label: "Review Data" },
    { step: "itinerary" as WorkflowStep, label: "Configure Itinerary" },
    { step: "view_itinerary" as WorkflowStep, label: "View Itinerary" },
  ]

  return (
    <div className="w-full py-6">
      <div className="flex items-start justify-around">
        {steps.map((step, index) => (
          <Step key={step.step} step={step.step} label={step.label} index={index} totalSteps={steps.length} />
        ))}
      </div>
    </div>
  )
}

function Step({ step, label, index, totalSteps }: StepProps) {
  const { currentStep, setCurrentStep } = useWorkflow()

  const steps: WorkflowStep[] = ["upload", "review", "itinerary", "view_itinerary"]
  const currentIndex = steps.indexOf(currentStep)

  let status: "completed" | "active" | "pending" = "pending"

  if (steps.indexOf(step) < currentIndex) {
    status = "completed"
  } else if (steps.indexOf(step) === currentIndex) {
    status = "active"
  }

  const isClickable = status === "completed"

  const handleStepClick = () => {
    if (isClickable) {
      setCurrentStep(step)
    }
  }

  const connectorWidth = totalSteps > 1 ? `calc((100% - ${totalSteps * 2.5}rem) / ${totalSteps - 1} / 2 - 1.25rem)` : '0rem'

  return (
    <button 
      onClick={handleStepClick}
      disabled={!isClickable}
      className={`flex flex-col items-center flex-1 text-center ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
      aria-label={`Go to step ${index + 1}: ${label}`}
    >
      <div className="relative flex items-center justify-center w-full mb-2">
        {index > 0 && (
          <div
            style={{ width: connectorWidth, left: `calc(50% - ${connectorWidth} - 1.25rem)` }}
            className={`absolute top-5 h-0.5 -translate-y-1/2 transition-colors duration-300 ${
              status === "pending" ? "bg-gray-200" : "bg-mint-500"
            }`}
          />
        )}
        <div
          className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 flex-shrink-0 ${
            status === "completed" ? "step-completed group-hover:bg-mint-600 group-hover:border-mint-700" : status === "active" ? "step-active" : "step-pending"
          }`}
        >
          {status === "completed" ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <span className={`text-sm font-medium transition-colors duration-300 ${status === 'active' ? 'text-wedding-700' : 'text-gray-500'}`}>{index + 1}</span>
          )}
        </div>
        {index < totalSteps - 1 && (
          <div
            style={{ width: connectorWidth, right: `calc(50% - ${connectorWidth} - 1.25rem)` }}
            className={`absolute top-5 h-0.5 -translate-y-1/2 transition-colors duration-300 ${
              currentIndex > index ? "bg-mint-500" : "bg-gray-200"
            }`}
          />
        )}
      </div>
      <span
        className={`text-xs font-medium text-center transition-colors duration-300 ${
          status === "completed" ? "text-mint-700 group-hover:text-mint-800" : status === "active" ? "text-wedding-700" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </button>
  )
}
