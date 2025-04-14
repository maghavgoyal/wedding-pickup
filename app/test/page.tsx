import { TestCase } from "@/components/test-case"
import { WorkflowProvider } from "@/context/workflow-context"

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Wedding Travel System - Test Case</h1>
      <WorkflowProvider>
        <TestCase />
      </WorkflowProvider>
    </div>
  )
}
