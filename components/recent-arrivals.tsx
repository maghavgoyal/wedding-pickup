"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Download, Eye, FileText, MoreHorizontal, Search, UserCheck } from "lucide-react"
import { mockArrivals } from "@/lib/mock-data"

interface RecentArrivalsProps {
  showAll?: boolean
}

export function RecentArrivals({ showAll = false }: RecentArrivalsProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter arrivals based on search term
  const filteredArrivals = mockArrivals.filter(
    (arrival) =>
      arrival.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arrival.arrivalLocation.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Show only 5 most recent arrivals if not showing all
  const displayedArrivals = showAll ? filteredArrivals : filteredArrivals.slice(0, 5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {showAll && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guests or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 wedding-input"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 rounded-full border-gray-200 hover:bg-gray-50 hover:text-wedding-500"
              >
                <span>Filter</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem>All Arrivals</DropdownMenuItem>
              <DropdownMenuItem>Unassigned Only</DropdownMenuItem>
              <DropdownMenuItem>Assigned Only</DropdownMenuItem>
              <DropdownMenuItem>Today's Arrivals</DropdownMenuItem>
              <DropdownMenuItem>Tomorrow's Arrivals</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 rounded-full border-gray-200 hover:bg-gray-50 hover:text-wedding-500"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Arrival</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedArrivals.map((arrival) => (
              <TableRow key={arrival.id} className="hover:bg-gray-50/50">
                <TableCell className="font-medium">
                  {arrival.guestName}
                  <div className="text-xs text-muted-foreground">{arrival.travelers} travelers</div>
                </TableCell>
                <TableCell>{formatDate(arrival.arrivalTime)}</TableCell>
                <TableCell>{arrival.arrivalLocation}</TableCell>
                <TableCell>
                  {arrival.driverAssigned ? (
                    <Badge className="bg-mint-100 text-mint-700 rounded-full px-2.5 py-0.5 font-medium">Assigned</Badge>
                  ) : (
                    <Badge className="bg-wedding-100 text-wedding-700 rounded-full px-2.5 py-0.5 font-medium">
                      Unassigned
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <Eye className="h-4 w-4 text-wedding-500" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <FileText className="h-4 w-4 text-lavender-500" />
                        <span>View Documents</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <UserCheck className="h-4 w-4 text-mint-600" />
                        <span>Assign Driver</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {displayedArrivals.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No arrivals found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
