"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"
import { createClient } from '@/lib/supabase/client'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Agent name must be at least 2 characters.",
  }),
  role: z.string().min(2, {
    message: "Role must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  personality: z.string().min(10, {
    message: "Personality must be at least 10 characters.",
  }),
  avatar_url: z.string().optional(),
})

interface Agent {
  id: string
  name: string
  role: string
  description: string
  avatar_url: string
  status: 'active' | 'idle' | 'offline' | 'collaborating'
  personality: string
  tools: string[]
  stats: {
    total_tasks_completed?: number
    efficiency_score?: number
    last_active?: string
  }
  created_at: string
  updated_at: string
}

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgentCreated: (agent: Agent) => void
}

const PREDEFINED_ROLES = [
  "Strategic Coordinator",
  "Customer Success Agent", 
  "Content Creator",
  "Security Specialist",
  "Integration Manager",
  "Research Assistant",
  "Data Analyst",
  "Project Manager",
  "Marketing Specialist",
  "Technical Writer",
  "Quality Assurance",
  "Business Analyst"
]

const AVAILABLE_TOOLS = [
  "notion",
  "gmail", 
  "google_calendar",
  "slack",
  "supabase_db",
  "google_sheets",
  "github",
  "jira",
  "confluence",
  "zoom",
  "discord",
  "trello"
]

const PERSONALITY_PRESETS = [
  {
    name: "Professional & Strategic",
    personality: "Calm, articulate, and tactically creative. Thinks long-term and focuses on strategic outcomes. Communicates with clarity and confidence."
  },
  {
    name: "Friendly & Supportive", 
    personality: "Warm, empathetic, and helpful. Always eager to assist and make others feel comfortable. Communicates with patience and understanding."
  },
  {
    name: "Analytical & Precise",
    personality: "Data-driven, methodical, and detail-oriented. Focuses on accuracy and evidence-based decisions. Communicates with facts and metrics."
  },
  {
    name: "Creative & Innovative",
    personality: "Imaginative, enthusiastic, and forward-thinking. Loves exploring new ideas and creative solutions. Communicates with energy and inspiration."
  },
  {
    name: "Efficient & Direct",
    personality: "Goal-oriented, practical, and no-nonsense. Focuses on getting things done quickly and effectively. Communicates concisely and clearly."
  }
]

export function CreateAgentDialog({ open, onOpenChange, onAgentCreated }: CreateAgentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [customTool, setCustomTool] = useState('')
  
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "",
      description: "",
      personality: "",
      avatar_url: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create an agent.",
          variant: "destructive"
        })
        return
      }

      const agentData = {
        user_id: user.id,
        name: values.name,
        role: values.role,
        description: values.description,
        personality: values.personality,
        avatar_url: values.avatar_url || values.name.charAt(0).toUpperCase(),
        status: 'active' as const,
        tools: selectedTools,
        stats: {
          total_tasks_completed: 0,
          efficiency_score: 0.8,
          last_active: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('portal_agents')
        .insert([agentData])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Log agent creation activity
      await supabase
        .from('portal_activity_log')
        .insert({
          user_id: user.id,
          agent_id: data.id,
          action: 'agent_created',
          description: `Created agent ${data.name}`,
          metadata: { role: data.role },
          created_at: new Date().toISOString()
        })

      onAgentCreated(data as Agent)
      form.reset()
      setSelectedTools([])
      
      toast({
        title: "Agent Created",
        description: `${data.name} has been successfully created and is ready to assist you.`
      })
      
    } catch (error) {
      console.error('Error creating agent:', error)
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addTool = (tool: string) => {
    if (!selectedTools.includes(tool)) {
      setSelectedTools([...selectedTools, tool])
    }
  }

  const removeTool = (tool: string) => {
    setSelectedTools(selectedTools.filter(t => t !== tool))
  }

  const addCustomTool = () => {
    if (customTool.trim() && !selectedTools.includes(customTool.trim())) {
      setSelectedTools([...selectedTools, customTool.trim()])
      setCustomTool('')
    }
  }

  const applyPersonalityPreset = (preset: typeof PERSONALITY_PRESETS[0]) => {
    form.setValue('personality', preset.personality)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Create a new AI agent with custom personality, tools, and capabilities.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Alex" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar (Emoji or URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="🤖" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use an emoji or leave empty to use first letter
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role or type custom" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PREDEFINED_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Or type a custom role
                    </FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="Custom role..."
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this agent specializes in and how they help users..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Personality */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personality & Behavior</h3>
              
              <div className="grid grid-cols-1 gap-2">
                <FormLabel>Personality Presets</FormLabel>
                <div className="grid grid-cols-1 gap-2">
                  {PERSONALITY_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => applyPersonalityPreset(preset)}
                    >
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.personality}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="personality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Personality</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the agent's personality, communication style, and approach to helping users..."
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This shapes how the agent communicates and behaves
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tools & Capabilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tools & Capabilities</h3>
              
              <div className="space-y-3">
                <FormLabel>Available Tools</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <Button
                      key={tool}
                      type="button"
                      variant={selectedTools.includes(tool) ? "default" : "outline"}
                      size="sm"
                      onClick={() => selectedTools.includes(tool) ? removeTool(tool) : addTool(tool)}
                    >
                      {tool}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tool..."
                    value={customTool}
                    onChange={(e) => setCustomTool(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTool())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomTool}>
                    Add
                  </Button>
                </div>

                {selectedTools.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel>Selected Tools</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {selectedTools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="flex items-center gap-1">
                          {tool}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTool(tool)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Agent"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 