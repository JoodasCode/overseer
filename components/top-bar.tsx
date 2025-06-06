"use client"

import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TopBar() {
  return (
    <div className="border-b border-pixel bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6 space-x-4">
        <div className="flex-1">
          <div className="relative max-w-sm search-enhanced">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents, tasks, docs, automations..."
              className="pl-10 pr-12 font-clean text-sm border-pixel"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="font-clean text-sm">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="font-clean text-sm">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
