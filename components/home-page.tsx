'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Car, UserCheck } from "lucide-react"

interface HomePageProps {
  onSelectWorkflow: (workflow: 'transport' | 'id_check') => void;
}

export function HomePage({ onSelectWorkflow }: HomePageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl">Wedding Assistant</h1>
        <p className="mt-4 text-lg text-gray-600">Choose a task to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                 <Car className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold">Transportation Planning</CardTitle>
            </div>
            <CardDescription>Upload guest list, configure drivers, generate pickup itineraries, and manage communication.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full group" 
              onClick={() => onSelectWorkflow('transport')}
            >
              Start Planning <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary/10 rounded-full">
                 <UserCheck className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-xl font-semibold">ID Upload Verification</CardTitle>
            </div>
            <CardDescription>Check which guests have uploaded their identification documents to the designated Google Drive folder.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="secondary" 
              className="w-full group" 
              onClick={() => onSelectWorkflow('id_check')}
              // disabled // Disabled until implemented
            >
              Check IDs <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
             {/* <p className="text-xs text-center text-muted-foreground mt-2">Coming Soon</p> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 