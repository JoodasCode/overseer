import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AgentCardSkeleton() {
  return (
    <Card className="border-pixel">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar skeleton */}
          <Skeleton className="w-12 h-12 rounded-full" />
          
          <div className="flex-1 space-y-3">
            {/* Name and role skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            
            {/* Status and level skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            
            {/* Tools skeleton */}
            <div className="flex flex-wrap gap-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center space-y-1">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
              <div className="text-center space-y-1">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
              <div className="text-center space-y-1">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-3 w-14 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AgentGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  )
} 