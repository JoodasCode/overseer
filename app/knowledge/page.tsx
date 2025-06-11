"use client"

import { SharedLayout } from '@/components/shared/SharedLayout'
import { Plus, Search, Book, FileText, Brain, Star, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const knowledgeItems = [
  {
    id: 1,
    title: "Product Documentation",
    description: "Complete product specifications and user manuals",
    category: "Documentation",
    type: "Document",
    size: "2.4 MB",
    lastUpdated: "2 hours ago",
    views: 145,
    tags: ["product", "documentation", "manual"]
  },
  {
    id: 2,
    title: "Customer Support Guidelines",
    description: "Best practices for handling customer inquiries",
    category: "Support",
    type: "Guide",
    size: "1.2 MB",
    lastUpdated: "1 day ago",
    views: 89,
    tags: ["support", "guidelines", "customer"]
  },
  {
    id: 3,
    title: "Marketing Strategy 2024",
    description: "Annual marketing plan and campaign strategies",
    category: "Marketing",
    type: "Strategy",
    size: "5.1 MB",
    lastUpdated: "3 days ago",
    views: 234,
    tags: ["marketing", "strategy", "2024"]
  },
  {
    id: 4,
    title: "API Integration Examples",
    description: "Code examples and integration patterns",
    category: "Development",
    type: "Code",
    size: "800 KB",
    lastUpdated: "1 week ago",
    views: 156,
    tags: ["api", "integration", "examples"]
  },
  {
    id: 5,
    title: "Team Meeting Notes",
    description: "Weekly team sync notes and action items",
    category: "Meetings",
    type: "Notes",
    size: "450 KB",
    lastUpdated: "2 days ago",
    views: 67,
    tags: ["meetings", "notes", "team"]
  },
  {
    id: 6,
    title: "Security Protocols",
    description: "Company security policies and procedures",
    category: "Security",
    type: "Policy",
    size: "1.8 MB",
    lastUpdated: "5 days ago",
    views: 201,
    tags: ["security", "protocols", "policy"]
  }
]

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Documentation": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "Support": return "bg-green-500/10 text-green-600 border-green-500/20"
    case "Marketing": return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    case "Development": return "bg-orange-500/10 text-orange-600 border-orange-500/20"
    case "Meetings": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "Security": return "bg-red-500/10 text-red-600 border-red-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Document": return <FileText className="h-4 w-4" />
    case "Guide": return <Book className="h-4 w-4" />
    case "Strategy": return <Brain className="h-4 w-4" />
    case "Code": return <FileText className="h-4 w-4" />
    case "Notes": return <FileText className="h-4 w-4" />
    case "Policy": return <FileText className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

export default function KnowledgePage() {
  const totalItems = knowledgeItems.length
  const totalViews = knowledgeItems.reduce((sum, item) => sum + item.views, 0)
  const recentItems = knowledgeItems.filter(item => 
    item.lastUpdated.includes('hour') || item.lastUpdated.includes('day')
  ).length

  return (
    <SharedLayout title="Knowledge Base" description="Manage and access your team's knowledge">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Knowledge articles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">All time views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentItems}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">Active categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                className="pl-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="meetings">Meetings</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Knowledge
          </Button>
        </div>

        {/* Knowledge Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {knowledgeItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                  </div>
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size</span>
                      <div className="font-medium">{item.size}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Views</span>
                      <div className="font-medium">{item.views}</div>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Updated</span>
                    <div className="font-medium">{item.lastUpdated}</div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SharedLayout>
  )
} 