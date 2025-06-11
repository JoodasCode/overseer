"use client"

import { useState, useEffect } from 'react'
import { SharedLayout } from '@/components/shared/SharedLayout'
import { Plus, Search, Book, FileText, Brain, Star, Eye, Download, Upload, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface KnowledgeItem {
  id: string
  title: string
  content: string
  file_path?: string
  file_type: string
  tags: string[]
  user_id: string
  created_at: string
  updated_at: string
  metadata?: {
    size?: number
    views?: number
    category?: string
  }
}

// Mock data for demonstration
const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: "1",
    title: "Agent Communication Best Practices",
    content: "Guidelines for effective communication between AI agents and team members. This document covers protocols for status updates, task delegation, and conflict resolution...",
    file_type: "text/markdown",
    tags: ["communication", "guidelines", "agents"],
    user_id: "demo-user",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    metadata: {
      size: 2048,
      views: 156,
      category: "Documentation"
    }
  },
  {
    id: "2",
    title: "Crisis Management Protocol",
    content: "Step-by-step procedures for handling system emergencies and critical incidents. Includes escalation procedures, communication templates, and recovery checklists...",
    file_type: "application/pdf",
    tags: ["crisis", "emergency", "protocol", "toby"],
    user_id: "demo-user",
    created_at: "2024-01-14T14:20:00Z",
    updated_at: "2024-01-14T14:20:00Z",
    metadata: {
      size: 1536000,
      views: 89,
      category: "Security"
    }
  },
  {
    id: "3",
    title: "Visual Design Guidelines",
    content: "Brand guidelines and design principles for creating consistent visual content. Includes color palettes, typography, logo usage, and template resources...",
    file_type: "text/plain",
    tags: ["design", "branding", "visual", "dana"],
    user_id: "demo-user",
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:15:00Z",
    metadata: {
      size: 3072,
      views: 234,
      category: "Marketing"
    }
  },
  {
    id: "4",
    title: "Data Analytics Framework",
    content: "Comprehensive framework for analyzing performance metrics and generating insights. Covers data collection, processing pipelines, and reporting standards...",
    file_type: "application/vnd.ms-excel",
    tags: ["analytics", "data", "metrics", "riley"],
    user_id: "demo-user",
    created_at: "2024-01-12T16:45:00Z",
    updated_at: "2024-01-12T16:45:00Z",
    metadata: {
      size: 512000,
      views: 127,
      category: "Analytics"
    }
  },
  {
    id: "5",
    title: "API Integration Guide",
    content: "Technical documentation for integrating with external APIs and services. Includes authentication methods, rate limiting, error handling, and code examples...",
    file_type: "text/markdown",
    tags: ["api", "integration", "development"],
    user_id: "demo-user",
    created_at: "2024-01-11T11:30:00Z",
    updated_at: "2024-01-11T11:30:00Z",
    metadata: {
      size: 4096,
      views: 78,
      category: "Development"
    }
  },
  {
    id: "6",
    title: "Team Meeting Notes - Q1 Planning",
    content: "Notes from quarterly planning session including goals, objectives, and action items. Strategic initiatives for Q1 2024 and resource allocation decisions...",
    file_type: "text/plain",
    tags: ["meetings", "planning", "q1", "strategy"],
    user_id: "demo-user",
    created_at: "2024-01-10T13:00:00Z",
    updated_at: "2024-01-10T13:00:00Z",
    metadata: {
      size: 1024,
      views: 165,
      category: "Meetings"
    }
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
    case "Analytics": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

const getTypeIcon = (type: string) => {
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
  if (type.includes('doc') || type.includes('excel')) return <FileText className="h-4 w-4 text-blue-500" />
  if (type.includes('image')) return <FileText className="h-4 w-4 text-green-500" />
  if (type.includes('text') || type.includes('markdown')) return <FileText className="h-4 w-4 text-gray-500" />
  return <FileText className="h-4 w-4" />
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} days ago`
  return date.toLocaleDateString()
}

export default function KnowledgePage() {
  const { toast } = useToast()
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    tags: '',
    category: 'Documentation'
  })

  useEffect(() => {
    // Simulate loading delay for realism
    const timer = setTimeout(() => {
      setKnowledgeItems(mockKnowledgeItems)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newItem: KnowledgeItem = {
        id: Date.now().toString(),
        title: uploadForm.title || file.name,
        content: uploadForm.content || "File content preview will be available after processing...",
        file_type: file.type,
        tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        user_id: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          size: file.size,
          category: uploadForm.category,
          views: 0
        }
      }

      setKnowledgeItems(prev => [newItem, ...prev])

      toast({
        title: "File Uploaded",
        description: "Your file has been added to the knowledge base."
      })

      setUploadDialogOpen(false)
      setUploadForm({ title: '', content: '', tags: '', category: 'Documentation' })

    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCreateTextEntry = async () => {
    if (!uploadForm.title || !uploadForm.content) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content.",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      
      // Simulate creation delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newItem: KnowledgeItem = {
        id: Date.now().toString(),
        title: uploadForm.title,
        content: uploadForm.content,
        file_type: "text/plain",
        tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        user_id: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          size: uploadForm.content.length,
          category: uploadForm.category,
          views: 0
        }
      }

      setKnowledgeItems(prev => [newItem, ...prev])

      toast({
        title: "Entry Created",
        description: "Your text entry has been added to the knowledge base."
      })

      setUploadDialogOpen(false)
      setUploadForm({ title: '', content: '', tags: '', category: 'Documentation' })

    } catch (error) {
      console.error('Error creating text entry:', error)
      toast({
        title: "Creation Error",
        description: "Failed to create entry. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      // Simulate delete delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setKnowledgeItems(prev => prev.filter(item => item.id !== id))

      toast({
        title: "Item Deleted",
        description: "Knowledge item has been removed."
      })

    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Delete Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || 
                           item.metadata?.category?.toLowerCase() === categoryFilter.toLowerCase()
    
    const matchesType = typeFilter === 'all' || item.file_type.includes(typeFilter)
    
    return matchesSearch && matchesCategory && matchesType
  })

  const totalItems = knowledgeItems.length
  const totalViews = knowledgeItems.reduce((sum, item) => sum + (item.metadata?.views || 0), 0)
  const recentItems = knowledgeItems.filter(item => {
    const createdAt = new Date(item.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdAt > weekAgo
  }).length

  const categories = Array.from(new Set(knowledgeItems.map(item => item.metadata?.category).filter(Boolean)))

  if (loading) {
    return (
      <SharedLayout title="Knowledge Base" description="Manage and access your team's knowledge">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </SharedLayout>
    )
  }

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
              <div className="text-2xl font-bold">{categories.length}</div>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category!.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="doc">Document</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Knowledge</DialogTitle>
                <DialogDescription>
                  Upload a file or create a text entry for your knowledge base.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter title..."
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={uploadForm.category} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Meetings">Meetings</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    placeholder="tag1, tag2, tag3"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content (for text entries)</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter content..."
                    rows={4}
                    value={uploadForm.content}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Or upload a file</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx"
                    disabled={uploading}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTextEntry} disabled={uploading}>
                  {uploading ? "Creating..." : "Create Text Entry"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Knowledge Items Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No knowledge items found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' 
                  ? "Try adjusting your search filters"
                  : "Start building your knowledge base by adding some content"
                }
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.file_type)}
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <CardDescription className="line-clamp-3">
                    {item.content}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{formatFileSize(item.metadata?.size)}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {item.metadata?.views || 0}
                        </span>
                      </div>
                      <span>{formatDate(item.created_at)}</span>
                    </div>

                    {item.metadata?.category && (
                      <Badge className={getCategoryColor(item.metadata.category)}>
                        {item.metadata.category}
                      </Badge>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SharedLayout>
  )
} 