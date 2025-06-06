"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  File,
  FileText,
  ImageIcon,
  Link,
  Trash2,
  CheckCircle,
  AlertCircle,
  Brain,
  Search,
  Plus,
  Download,
  Eye,
} from "lucide-react"
import type { Agent } from "@/lib/types"

interface KnowledgeItem {
  id: string
  name: string
  type: "document" | "url" | "text" | "image"
  size?: string
  status: "uploading" | "processing" | "ready" | "error"
  progress?: number
  uploadedAt: string
  category: string
  summary?: string
  error?: string
}

interface KnowledgeUploadProps {
  agent: Agent
}

export function KnowledgeUpload({ agent }: KnowledgeUploadProps) {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([
    {
      id: "1",
      name: "Brand Guidelines 2024.pdf",
      type: "document",
      size: "2.4 MB",
      status: "ready",
      uploadedAt: "2 hours ago",
      category: "Brand",
      summary: "Company brand guidelines including logo usage, colors, and tone of voice",
    },
    {
      id: "2",
      name: "Q2 Campaign Performance",
      type: "url",
      status: "ready",
      uploadedAt: "1 day ago",
      category: "Analytics",
      summary: "Dashboard showing Q2 marketing campaign metrics and KPIs",
    },
    {
      id: "3",
      name: "Product Launch Checklist",
      type: "text",
      status: "processing",
      progress: 65,
      uploadedAt: "5 min ago",
      category: "Process",
    },
  ])

  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const newItem: KnowledgeItem = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "document",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        status: "uploading",
        progress: 0,
        uploadedAt: "Just now",
        category: "Uncategorized",
      }

      setKnowledgeItems((prev) => [...prev, newItem])

      // Simulate upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          clearInterval(interval)
          setKnowledgeItems((prev) =>
            prev.map((item) => (item.id === newItem.id ? { ...item, status: "processing", progress: 0 } : item)),
          )

          // Simulate processing
          setTimeout(() => {
            setKnowledgeItems((prev) =>
              prev.map((item) =>
                item.id === newItem.id
                  ? {
                      ...item,
                      status: "ready",
                      progress: undefined,
                      summary: `Processed ${file.name} - Ready for agent training`,
                    }
                  : item,
              ),
            )
          }, 2000)
        } else {
          setKnowledgeItems((prev) => prev.map((item) => (item.id === newItem.id ? { ...item, progress } : item)))
        }
      }, 500)
    })
  }

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return

    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      name: urlInput,
      type: "url",
      status: "processing",
      progress: 50,
      uploadedAt: "Just now",
      category: "Web Content",
    }

    setKnowledgeItems((prev) => [...prev, newItem])
    setUrlInput("")

    // Simulate processing
    setTimeout(() => {
      setKnowledgeItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id
            ? {
                ...item,
                status: "ready",
                progress: undefined,
                summary: "Web content extracted and processed for training",
              }
            : item,
        ),
      )
    }, 3000)
  }

  const handleDelete = (id: string) => {
    setKnowledgeItems((prev) => prev.filter((item) => item.id !== id))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "uploading":
      case "processing":
        return <Brain className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <File className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "url":
        return <Link className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const filteredItems = knowledgeItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const readyCount = knowledgeItems.filter((item) => item.status === "ready").length
  const processingCount = knowledgeItems.filter(
    (item) => item.status === "processing" || item.status === "uploading",
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Knowledge Base</h1>
          <p className="text-muted-foreground">Train {agent.name} with your documents and data</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-pixel text-green-600">{readyCount}</span> ready
            {processingCount > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="font-pixel text-blue-600">{processingCount}</span> processing
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Knowledge Items</CardTitle>
            <Brain className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{knowledgeItems.length}</div>
            <p className="text-xs text-muted-foreground">Total items uploaded</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Training Progress</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">{Math.round((readyCount / knowledgeItems.length) * 100)}%</div>
            <p className="text-xs text-muted-foreground">Items processed</p>
          </CardContent>
        </Card>

        <Card className="border-pixel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-pixel text-xs">Agent Intelligence</CardTitle>
            <Brain className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-pixel">Level {agent.level}</div>
            <p className="text-xs text-muted-foreground">+{readyCount * 10} XP from knowledge</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload">
        <TabsList className="font-pixel">
          <TabsTrigger value="upload" className="text-xs">
            UPLOAD
          </TabsTrigger>
          <TabsTrigger value="manage" className="text-xs">
            MANAGE
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">
            CATEGORIES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Upload Area */}
          <Card className="border-pixel">
            <CardHeader>
              <CardTitle className="font-pixel text-sm">Add Knowledge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-pixel text-sm mb-2">Drop files here or click to upload</h3>
                <p className="text-xs text-muted-foreground mb-4">Supports PDF, TXT, DOC, CSV, and image files</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,.csv,.png,.jpg,.jpeg"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild className="font-pixel text-xs">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-1" />
                    Choose Files
                  </label>
                </Button>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label className="font-pixel text-xs">Add from URL</Label>
                <div className="flex space-x-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/document"
                    className="flex-1 font-clean border-pixel"
                  />
                  <Button onClick={handleUrlAdd} disabled={!urlInput.trim()} className="font-pixel text-xs">
                    <Link className="w-4 h-4 mr-1" />
                    Add URL
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge items..."
              className="pl-10 font-clean border-pixel"
            />
          </div>

          {/* Knowledge Items */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="border-pixel">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">{getTypeIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-pixel text-sm truncate">{item.name}</h4>
                          <Badge variant="outline" className="font-pixel text-xs">
                            {item.category}
                          </Badge>
                        </div>

                        {item.summary && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.summary}</p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{item.uploadedAt}</span>
                          {item.size && <span>{item.size}</span>}
                        </div>

                        {(item.status === "uploading" || item.status === "processing") &&
                          item.progress !== undefined && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-pixel">
                                  {item.status === "uploading" ? "Uploading" : "Processing"}
                                </span>
                                <span className="text-xs">{Math.round(item.progress)}%</span>
                              </div>
                              <Progress value={item.progress} className="h-1" />
                            </div>
                          )}

                        {item.error && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                            <p className="text-xs text-red-600">{item.error}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {getStatusIcon(item.status)}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Brand", "Analytics", "Process", "Web Content", "Uncategorized"].map((category) => {
              const categoryItems = knowledgeItems.filter((item) => item.category === category)
              return (
                <Card key={category} className="border-pixel">
                  <CardHeader>
                    <CardTitle className="font-pixel text-sm flex items-center justify-between">
                      {category}
                      <Badge variant="outline" className="font-pixel text-xs">
                        {categoryItems.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center space-x-2 text-sm">
                          {getTypeIcon(item.type)}
                          <span className="truncate flex-1">{item.name}</span>
                          {getStatusIcon(item.status)}
                        </div>
                      ))}
                      {categoryItems.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{categoryItems.length - 3} more items</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
