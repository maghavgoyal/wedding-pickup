"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Menu, User, X } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-wedding-500 fill-wedding-500" />
            <span className="text-xl font-bold wedding-gradient-text">WeddingTravel</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-wedding-500 transition-colors">
            Dashboard
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-wedding-500 transition-colors">
            Events
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-wedding-500 transition-colors">
            Drivers
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-wedding-500 transition-colors">
            Settings
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8 border-2 border-wedding-200">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="bg-lavender-100 text-lavender-700">WP</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-wedding-500 fill-wedding-500" />
              <span className="text-xl font-bold wedding-gradient-text">WeddingTravel</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-col gap-4 p-4">
            <Link href="/" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
              Dashboard
            </Link>
            <Link href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
              Events
            </Link>
            <Link href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
              Drivers
            </Link>
            <Link href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
              Settings
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
