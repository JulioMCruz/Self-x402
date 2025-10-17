"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, User, Wallet } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/selfx402-logo.png" alt="Selfx402" width={140} height={40} className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/catalog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Catalog
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              My Dashboard
            </Link>
            <Link
              href="/for-vendors"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              For Vendors
            </Link>
            <Link
              href="/vendor/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Vendor Dashboard
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/vendor/profile">Vendor Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/vendor/dashboard">Vendor Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
