"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Star,
  Download,
  Eye,
  Users,
  TrendingUp,
  Briefcase,
  Heart,
  Zap,
  Filter,
  CheckCircle,
  Play,
} from "lucide-react"

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: "marketing" | "sales" | "hr" | "operations" | "customer-service" | "finance"
  author: string
  rating: number
  downloads: number
  lastUpdated: string
  tags: string[]
  complexity: "beginner" | "intermediate" | "advanced"
  estimatedTime: string
  preview: {
    steps: string[]
    triggers: string[]
    actions: string[]
  }
  featured?: boolean
}

const templates: WorkflowTemplate[] = [
  {
    id: "1",
    name: "New Customer Onboarding",
    description:
      "Automatically welcome new customers with personalized emails, task assignments, and follow-up sequences",
    category: "customer-service",
    author: "AGENTS OS Team",
    rating: 4.8,
    downloads: 1247,
    lastUpdated: "2 days ago",
    tags: ["onboarding", "email", "automation", "customer-success"],
    complexity: "beginner",
    estimatedTime: "15 min setup",
    preview: {
      steps: ["New customer signup", "Send welcome email", "Create onboarding tasks", "Schedule follow-up"],
      triggers: ["Webhook: New signup", "Email received"],
      actions: ["Send email", "Create task", "Update CRM"],
    },
    featured: true,
  },
  {
    id: "2",
    name: "Content Creation Pipeline",
    description:
      "Streamline content creation from ideation to publication with approval workflows and social media scheduling",
    category: "marketing",
    author: "ContentPro",
    rating: 4.6,
    downloads: 892,
    lastUpdated: "1 week ago",
    tags: ["content", "social-media", "approval", "scheduling"],
    complexity: "intermediate",
    estimatedTime: "30 min setup",
    preview: {
      steps: ["Content brief", "Draft creation", "Review & approval", "Schedule publication"],
      triggers: ["Schedule: Weekly", "Task completed"],
      actions: ["Create task", "Send for review", "Post to social"],
    },
  },
  {
    id: "3",
    name: "Lead Qualification & Follow-up",
    description: "Automatically qualify leads, assign to sales reps, and trigger personalized follow-up sequences",
    category: "sales",
    author: "SalesForce Pro",
    rating: 4.9,
    downloads: 2156,
    lastUpdated: "3 days ago",
    tags: ["lead-qualification", "sales", "crm", "follow-up"],
    complexity: "intermediate",
    estimatedTime: "25 min setup",
    preview: {
      steps: ["Lead capture", "Qualification scoring", "Assignment", "Follow-up sequence"],
      triggers: ["Form submission", "Email reply"],
      actions: ["Score lead", "Assign to rep", "Send email"],
    },
    featured: true,
  },
  {
    id: "4",
    name: "Employee Onboarding Checklist",
    description: "Complete new hire onboarding with document collection, account setup, and training schedules",
    category: "hr",
    author: "HR Solutions",
    rating: 4.7,
    downloads: 634,
    lastUpdated: "5 days ago",
    tags: ["hr", "onboarding", "training", "documentation"],
    complexity: "beginner",
    estimatedTime: "20 min setup",
    preview: {
      steps: ["New hire data", "Document requests", "Account creation", "Training schedule"],
      triggers: ["New hire added", "Document uploaded"],
      actions: ["Send email", "Create accounts", "Schedule training"],
    },
  },
  {
    id: "5",
    name: "Weekly Performance Reports",
    description: "Generate and distribute automated weekly performance reports to stakeholders",
    category: "operations",
    author: "Analytics Team",
    rating: 4.5,
    downloads: 445,
    lastUpdated: "1 week ago",
    tags: ["reporting", "analytics", "weekly", "stakeholders"],
    complexity: "advanced",
    estimatedTime: "45 min setup",
    preview: {
      steps: ["Data collection", "Report generation", "Review", "Distribution"],
      triggers: ["Schedule: Weekly Friday"],
      actions: ["Generate report", "Send email", "Update dashboard"],
    },
  },
  {
    id: "6",
    name: "Customer Support Ticket Routing",
    description: "Intelligently route support tickets based on priority, category, and agent availability",
    category: "customer-service",
    author: "Support Pro",
    rating: 4.4,
    downloads: 789,
    lastUpdated: "4 days ago",
    tags: ["support", "routing", "priority", "automation"],
    complexity: "intermediate",
    estimatedTime: "35 min setup",
    preview: {
      steps: ["Ticket received", "Category detection", "Priority assignment", "Agent routing"],
      triggers: ["Email received", "Form submission"],
      actions: ["Categorize", "Assign priority", "Route to agent"],
    },
  },
]

export function TemplateMarketplace() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all")
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)

  const categories = [
    { id: "all", label: "All Categories", icon: <Zap className="w-4 h-4" /> },
    { id: "marketing", label: "Marketing", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "sales", label: "Sales", icon: <Briefcase className="w-4 h-4" /> },
    { id: "hr", label: "HR", icon: <Users className="w-4 h-4" /> },
    { id: "customer-service", label: "Customer Service", icon: <Heart className="w-4 h-4" /> },
    { id: "operations", label: "Operations", icon: <CheckCircle className="w-4 h-4" /> },
    { id: "finance", label: "Finance", icon: <TrendingUp className="w-4 h-4" /> },
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesComplexity = selectedComplexity === "all" || template.complexity === selectedComplexity

    return matchesSearch && matchesCategory && matchesComplexity
  })

  const featuredTemplates = templates.filter((t) => t.featured)

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "default"
      case "intermediate":
        return "secondary"
      case "advanced":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category)
    return cat?.icon || <Zap className="w-4 h-4" />
  }

  const handleInstallTemplate = (template: WorkflowTemplate) => {
    console.log("Installing template:", template.name)
    // Simulate template installation
  }

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="font-pixel text-xs">
            ← Back to Marketplace
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="font-pixel text-xs">
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button onClick={() => handleInstallTemplate(selectedTemplate)} className="font-pixel text-xs">
              <Download className="w-4 h-4 mr-1" />
              Install Template
            </Button>
          </div>
        </div>

        {/* Template Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(selectedTemplate.category)}
                    <span>{selectedTemplate.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-pixel text-sm">{selectedTemplate.rating}</span>
                    </div>
                    <Badge variant={getComplexityColor(selectedTemplate.complexity)} className="font-pixel text-xs">
                      {selectedTemplate.complexity}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{selectedTemplate.description}</p>

                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="font-pixel text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-pixel text-xs text-muted-foreground">Downloads</div>
                    <div className="font-pixel">{selectedTemplate.downloads.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-pixel text-xs text-muted-foreground">Setup Time</div>
                    <div className="font-pixel">{selectedTemplate.estimatedTime}</div>
                  </div>
                  <div>
                    <div className="font-pixel text-xs text-muted-foreground">Updated</div>
                    <div className="font-pixel">{selectedTemplate.lastUpdated}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-sm">Workflow Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="steps">
                  <TabsList className="font-pixel">
                    <TabsTrigger value="steps" className="text-xs">
                      STEPS
                    </TabsTrigger>
                    <TabsTrigger value="triggers" className="text-xs">
                      TRIGGERS
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="text-xs">
                      ACTIONS
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="steps" className="space-y-3 mt-4">
                    {selectedTemplate.preview.steps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-pixel text-xs">
                          {index + 1}
                        </div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="triggers" className="space-y-2 mt-4">
                    {selectedTemplate.preview.triggers.map((trigger, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm">{trigger}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-2 mt-4">
                    {selectedTemplate.preview.actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
                        <Play className="w-4 h-4 text-primary" />
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-sm">Template Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-pixel text-xs text-muted-foreground">Author</div>
                  <div className="text-sm">{selectedTemplate.author}</div>
                </div>
                <div>
                  <div className="font-pixel text-xs text-muted-foreground">Category</div>
                  <div className="text-sm capitalize">{selectedTemplate.category.replace("-", " ")}</div>
                </div>
                <div>
                  <div className="font-pixel text-xs text-muted-foreground">Complexity</div>
                  <Badge variant={getComplexityColor(selectedTemplate.complexity)} className="font-pixel text-xs">
                    {selectedTemplate.complexity}
                  </Badge>
                </div>
                <div>
                  <div className="font-pixel text-xs text-muted-foreground">Rating</div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= selectedTemplate.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm ml-2">({selectedTemplate.rating})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-pixel">
              <CardHeader>
                <CardTitle className="font-pixel text-sm">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Gmail integration</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Slack workspace</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>CRM system</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-2xl text-primary">Template Marketplace</h1>
          <p className="text-muted-foreground">Pre-built workflows for common business processes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="font-pixel text-xs">
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10 font-clean border-pixel"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-pixel rounded font-pixel text-xs bg-background"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            value={selectedComplexity}
            onChange={(e) => setSelectedComplexity(e.target.value)}
            className="px-3 py-2 border border-pixel rounded font-pixel text-xs bg-background"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="featured">
        <TabsList className="font-pixel">
          <TabsTrigger value="featured" className="text-xs">
            FEATURED
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs">
            ALL TEMPLATES
          </TabsTrigger>
          <TabsTrigger value="popular" className="text-xs">
            POPULAR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.map((template) => (
              <Card key={template.id} className="border-pixel cursor-pointer hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="font-pixel text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(template.category)}
                      <span className="truncate">{template.name}</span>
                    </div>
                    {template.featured && <Badge className="font-pixel text-xs">Featured</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{template.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>{template.downloads}</span>
                    </div>
                    <Badge variant={getComplexityColor(template.complexity)} className="font-pixel text-xs">
                      {template.complexity}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="font-pixel text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="font-pixel text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1 font-pixel text-xs"
                      variant="outline"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button onClick={() => handleInstallTemplate(template)} className="flex-1 font-pixel text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="border-pixel cursor-pointer hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="font-pixel text-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(template.category)}
                      <span className="truncate">{template.name}</span>
                    </div>
                    {template.featured && <Badge className="font-pixel text-xs">Featured</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{template.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>{template.downloads}</span>
                    </div>
                    <Badge variant={getComplexityColor(template.complexity)} className="font-pixel text-xs">
                      {template.complexity}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="font-pixel text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="font-pixel text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1 font-pixel text-xs"
                      variant="outline"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button onClick={() => handleInstallTemplate(template)} className="flex-1 font-pixel text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates
              .sort((a, b) => b.downloads - a.downloads)
              .map((template) => (
                <Card
                  key={template.id}
                  className="border-pixel cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <CardHeader>
                    <CardTitle className="font-pixel text-sm flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(template.category)}
                        <span className="truncate">{template.name}</span>
                      </div>
                      {template.featured && <Badge className="font-pixel text-xs">Featured</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>{template.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{template.downloads}</span>
                      </div>
                      <Badge variant={getComplexityColor(template.complexity)} className="font-pixel text-xs">
                        {template.complexity}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="font-pixel text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="font-pixel text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setSelectedTemplate(template)}
                        className="flex-1 font-pixel text-xs"
                        variant="outline"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button onClick={() => handleInstallTemplate(template)} className="flex-1 font-pixel text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Install
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
