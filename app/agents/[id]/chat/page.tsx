"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/shared/SharedLayout'
import { 
  Send, 
  MoreVertical, 
  Settings, 
  Brain, 
  History,
  ArrowLeft,
  Loader2,
  Bot,
  User,
  Zap,
  Clock,
  Target,
  Users,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/lib/hooks/use-toast"
import { createClient } from '@/lib/supabase/client'
import { getAgentAvatarUrl } from '@/lib/dicebear-avatar'

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
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata?: any
}

interface Memory {
  id: string
  type: 'learning' | 'preference' | 'context' | 'goal'
  content: string
  category: string
  importance_score: number
  created_at: string
}

export default async function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await params

  return <AgentChatContent agentId={agentId} />
}

function AgentChatContent({ agentId }: { agentId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (agentId) {
      fetchAgentData()
      fetchMessages()
      fetchMemories()
    }
  }, [agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchAgentData = async () => {
    try {
      // Check if database is enabled
      const { config } = await import('@/lib/config')
      
      if (!config.ENABLE_DATABASE) {
        // Use mock agent data
        const mockAgents = [
          {
            id: '1',
            name: 'Alex',
            role: 'Strategic Coordinator',
            description: 'Develops strategic plans and coordinates complex projects with systematic precision.',
            avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=alex&size=100`,
            status: 'active' as const,
            personality: 'Strategic, methodical, and analytical. Alex approaches challenges with a systematic mindset.',
            tools: ['Strategy Planning', 'Project Coordination', 'Analytics'],
            stats: {
              total_tasks_completed: 87,
              efficiency_score: 94,
              last_active: new Date().toISOString()
            }
          },
          {
            id: '2', 
            name: 'Dana',
            role: 'Creative Assistant',
            description: 'Brings innovative visual solutions and creative problem-solving to every challenge.',
            avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=dana&size=100`,
            status: 'active' as const,
            personality: 'Creative, energetic, and visually-oriented. Dana loves turning ideas into beautiful realities.',
            tools: ['Visual Design', 'Creative Writing', 'Brainstorming'],
            stats: {
              total_tasks_completed: 76,
              efficiency_score: 91,
              last_active: new Date().toISOString()
            }
          },
          {
            id: '3',
            name: 'Riley', 
            role: 'Data Analyst',
            description: 'Transforms complex data into actionable insights and evidence-based recommendations.',
            avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=riley&size=100`,
            status: 'idle' as const,
            personality: 'Analytical, precise, and data-driven. Riley finds patterns and meaning in numbers.',
            tools: ['Data Analysis', 'Statistics', 'Reporting'],
            stats: {
              total_tasks_completed: 93,
              efficiency_score: 96,
              last_active: new Date().toISOString()
            }
          },
          {
            id: '4',
            name: 'Jamie',
            role: 'Team Coordinator', 
            description: 'Facilitates seamless collaboration and maintains team harmony across all projects.',
            avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=jamie&size=100`,
            status: 'collaborating' as const,
            personality: 'Collaborative, empathetic, and team-focused. Jamie excels at bringing people together.',
            tools: ['Team Management', 'Communication', 'Conflict Resolution'],
            stats: {
              total_tasks_completed: 68,
              efficiency_score: 89,
              last_active: new Date().toISOString()
            }
          },
          {
            id: '5',
            name: 'Toby',
            role: 'Support Coordinator',
            description: 'Provides rapid response support and efficient coordination for urgent matters.',
            avatar_url: `https://api.dicebear.com/9.x/croodles/svg?seed=toby&size=100`,
            status: 'active' as const,
            personality: 'Quick, responsive, and action-oriented. Toby thrives under pressure and rapid response scenarios.',
            tools: ['Rapid Response', 'Support Coordination', 'Crisis Management'],
            stats: {
              total_tasks_completed: 112,
              efficiency_score: 88,
              last_active: new Date().toISOString()
            }
          }
        ]
        
        const foundAgent = mockAgents.find(a => a.id === agentId)
        if (foundAgent) {
          setAgent(foundAgent)
        } else {
          toast({
            title: "Agent Not Found",
            description: "The requested agent doesn't exist.",
            variant: "destructive"
          })
          router.push('/agents')
        }
        return
      }

      // Real database fetch
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to chat with agents.",
          variant: "destructive"
        })
        router.push('/auth/signin')
        return
      }

      const { data, error } = await supabase
        .from('portal_agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        toast({
          title: "Agent Not Found",
          description: "The requested agent doesn't exist or you don't have access.",
          variant: "destructive"
        })
        router.push('/agents')
        return
      }

      setAgent(data)
    } catch (error) {
      console.error('Error fetching agent:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      // Check if database is enabled
      const { config } = await import('@/lib/config')
      
      if (!config.ENABLE_DATABASE) {
        // Use empty messages for mock mode
        setMessages([])
        return
      }

      const { data, error } = await supabase
        .from('portal_agent_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemories = async () => {
    try {
      // Check if database is enabled
      const { config } = await import('@/lib/config')
      
      if (!config.ENABLE_DATABASE) {
        // Use empty memories for mock mode
        setMemories([])
        return
      }

      const { data, error } = await supabase
        .from('portal_agent_memory')
        .select('*')
        .eq('agent_id', agentId)
        .order('importance_score', { ascending: false })
        .limit(20)

      if (error) throw error

      setMemories(data || [])
    } catch (error) {
      console.error('Error fetching memories:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending || !agent) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)
    setIsStreaming(true)
    setStreamingMessage('')

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      // Send to chat API (use the same endpoint as the floating chat widget)
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.slice(-5).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Add assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          created_at: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, assistantMessage])
        setStreamingMessage('')
        setIsStreaming(false)
        
        toast({
          title: "Response received",
          description: `${agent.name} responded successfully.`,
        })
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsStreaming(false)
      setStreamingMessage('')
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
      
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id))
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "idle": return "bg-yellow-500"
      case "offline": return "bg-gray-500"
      case "collaborating": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <SharedLayout title="Chat" description="Loading agent...">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SharedLayout>
    )
  }

  if (!agent) {
    return (
      <SharedLayout title="Chat" description="Agent not found">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested agent doesn't exist.</p>
            <Button onClick={() => router.push('/agents')}>
              Back to Agents
            </Button>
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/agents')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name.toLowerCase()}&size=100`}
                      alt={agent.name} 
                    />
                    <AvatarFallback>
                      {agent.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(agent.status)}`} />
                </div>
                
                <div>
                  <h1 className="font-semibold">{agent.name}</h1>
                  <p className="text-sm text-muted-foreground">{agent.role}</p>
                </div>
                
                <Badge variant="outline" className="capitalize">
                  {agent.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Memory Panel */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    Memory
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Agent Memory</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-full mt-6">
                    <div className="space-y-4">
                      {memories.map((memory) => (
                        <Card key={memory.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {memory.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(memory.created_at)}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm">{memory.content}</p>
                            {memory.category && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Category: {memory.category}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {memories.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No memories yet</p>
                          <p className="text-xs">Start chatting to build agent memory</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Agent Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <History className="h-4 w-4 mr-2" />
                    Chat History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Zap className="h-4 w-4 mr-2" />
                    Change Mode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && !isStreaming && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-muted-foreground">
                  Ask {agent.name} anything. They&apos;re here to help with {agent.role.toLowerCase()} tasks.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage 
                      src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name.toLowerCase()}&size=100`}
                      alt={agent.name} 
                    />
                    <AvatarFallback className="text-xs">
                      {agent.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.created_at)}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Streaming Message */}
            {isStreaming && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage 
                    src={`https://api.dicebear.com/9.x/croodles/svg?seed=${agent.name.toLowerCase()}&size=100`}
                    alt={agent.name} 
                  />
                  <AvatarFallback className="text-xs">
                    {agent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="rounded-lg px-4 py-2 max-w-[70%] bg-muted">
                  <p className="text-sm whitespace-pre-wrap">
                    {streamingMessage}
                    <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-card p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                placeholder={`Message ${agent.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="min-h-[44px] max-h-32 resize-none"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                size="icon"
                className="h-11 w-11"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <p>Press Enter to send, Shift+Enter for new line</p>
              <p>{input.length}/2000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 