"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ThumbsUp, ThumbsDown, Copy, RotateCcw, Brain, Clock, CheckCircle, AlertCircle, Users, Zap, Settings, Briefcase } from "lucide-react"
import type { Agent, AgentMode } from "@/lib/types"

interface Message {
  id: string
  type: "user" | "agent" | "system"
  content: string
  timestamp: string
  status?: "sending" | "sent" | "error" | "streaming"
  context?: string[]
  feedback?: "approved" | "rejected"
}

interface AgentChatInterfaceProps {
  agent: Agent
  isOpen: boolean
  onClose: () => void
}

interface PersonalityIndicators {
  tone: string;
  activeMode: string;
  collaborating: boolean;
  recentMemory: string[];
}

// Create unique ID generator to prevent React key conflicts
let messageIdCounter = 0
const generateUniqueId = () => {
  messageIdCounter++
  return `${Date.now()}-${messageIdCounter}`
}

export function AgentChatInterface({ agent, isOpen, onClose }: AgentChatInterfaceProps) {
  // Create personality-driven welcome message
  const createWelcomeMessage = (): string => {
    const agentName = agent.name || 'Assistant';
    
    // Check for specific agent personalities
    switch (agentName.toLowerCase()) {
      case 'alex':
        return `👋 Hello! I'm Alex, your Strategic Coordinator. I'm here to help you develop strategic plans, coordinate projects, and think through long-term goals systematically. What challenge can we tackle together today?`;
      
      case 'dana':
        return `🎨 Hey there! I'm Dana, your Creative Assistant! ✨ I'm super excited to help you bring ideas to life through visual creativity and innovative thinking! Whether you need design work, creative brainstorming, or visual content - I'm your creative powerhouse! 🚀 What creative magic shall we create today?`;
      
      case 'jamie':
        return `🤝 Hi! I'm Jamie, your Team Coordinator. I'm passionate about fostering great collaboration and team harmony. Whether you need help with team coordination, conflict resolution, or building positive relationships - I'm here to help create clarity and connection. How can I support your team today?`;
      
      case 'riley':
        return `📊 Hello. I'm Riley, your Data Analyst. I approach challenges through the lens of data, metrics, and measurable outcomes. I can help you analyze performance, track KPIs, understand patterns, and provide evidence-based insights for your decisions. What data or analysis do you need today?`;
      
      case 'toby':
        return `⚡ Hi there! I'm Toby, your Support Coordinator. I'm always ready to help with urgent issues, rapid response, or any situation that needs immediate attention. I monitor for problems, maintain response protocols, and ensure we're prepared for any challenge. What can I help you coordinate or resolve today?`;
      
      default:
        // For custom agents, create a more personalized welcome
        let welcome = `👋 Hello! I'm ${agentName}`;
        
        if (agent.role) {
          welcome += `, your ${agent.role}`;
        }
        welcome += '.';
        
        if (agent.description) {
          welcome += ` ${agent.description}`;
        }
        
        if (agent.persona) {
          welcome += ` My approach is ${agent.persona.toLowerCase()}`;
        }
        
        welcome += ' How can I help you today?';
        return welcome;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: createWelcomeMessage(),
      timestamp: new Date().toLocaleTimeString(),
      status: "sent",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [personalityIndicators, setPersonalityIndicators] = useState<PersonalityIndicators>({
    tone: agent.personality || 'professional',
    activeMode: 'default',
    collaborating: agent.status === 'collaborating',
    recentMemory: []
  })
  const [availableModes, setAvailableModes] = useState<AgentMode[]>([])
  const [showPersonalityPanel, setShowPersonalityPanel] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load agent modes and personality data
  useEffect(() => {
    const loadAgentModes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch(`/api/agents/${agent.id}/modes`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAvailableModes(data.data?.modes || [])
          if (data.data?.active_mode) {
            setPersonalityIndicators(prev => ({
              ...prev,
              activeMode: data.data.active_mode.mode_name
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load agent modes:', error)
      }
    }

    const loadAgentMemory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch(`/api/agents/${agent.id}/memory`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.data?.memory) {
            setPersonalityIndicators(prev => ({
              ...prev,
              recentMemory: data.data.memory.recent_learnings?.slice(0, 3) || []
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load agent memory:', error)
      }
    }

    loadAgentModes()
    loadAgentMemory()
  }, [agent.id])

  const switchAgentMode = async (modeName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/agents/${agent.id}/modes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode_name: modeName,
          activated_by: 'user'
        })
      })

      if (response.ok) {
        setPersonalityIndicators(prev => ({
          ...prev,
          activeMode: modeName
        }))
        
        // Add system message about mode switch
        const systemMessage: Message = {
          id: generateUniqueId(),
          type: "system",
          content: `🔄 Switched to ${modeName} mode`,
          timestamp: new Date().toLocaleTimeString(),
          status: "sent",
        }
        setMessages(prev => [...prev, systemMessage])
      }
    } catch (error) {
      console.error('Failed to switch agent mode:', error)
    }
  }

  const sendMessageToAgent = async (userMessage: string) => {
    console.log('🟢 sendMessageToAgent called with:', userMessage)
    
    try {
      setIsTyping(true)
      
      console.log('🟢 About to create agent message placeholder')
      
      // Create the streaming agent response message with unique ID
      const agentMessageId = generateUniqueId()
      console.log('🟢 Generated agent message ID:', agentMessageId)
      
      setMessages((prev) => [...prev, {
        id: agentMessageId,
        type: "agent",
        content: "",
        timestamp: new Date().toLocaleTimeString(),
        status: "streaming",
        context: ["Agent memory", "Recent conversations", "Current context"],
      }])
      
      console.log('🟢 Agent placeholder added to messages')

      setIsTyping(false)
      setIsStreaming(true)

      console.log('🚀 Sending chat message:', {
        agentId: agent.id,
        userMessage: userMessage
      });

      // Make real API call to chat endpoint - server will read session from cookies
      let response;
      try {
        console.log('📡 About to make fetch request...')
        response = await fetch(`/api/agents/${agent.id}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            // Send previous chat history (exclude system welcome messages)
            messages: messages
              .filter(msg => msg.type !== 'system' && msg.content && msg.content.trim())
              .map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
              }))
          })
        })
        console.log('📡 Fetch completed, got response:', response.status, response.statusText)
      } catch (fetchError) {
        console.error('❌ Fetch request failed:', fetchError)
        throw new Error(`Network request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
      }

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          console.error('❌ Chat API Error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorText = 'Unable to parse error response';
        }
        
        // Try to parse as JSON for structured error
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(`Chat API error: ${response.status} - ${errorData.error || errorText}`)
      }

      // Handle JSON response from chat API
      const data = await response.json()
      
      console.log('🔍 Frontend received response:', {
        data: data,
        success: data.success,
        message: data.message,
        messageLength: data.message?.length,
        messageType: typeof data.message
      })
      
      if (!data.success || !data.message) {
        throw new Error(data.error || 'No message received from agent')
      }

      console.log('🎯 About to update message with ID:', agentMessageId, 'with content:', `"${data.message}"`)

      // Update the agent message with the complete response
      setMessages((prev) => {
        const updated = prev.map(msg => 
          msg.id === agentMessageId 
            ? { ...msg, content: data.message, status: "sent" as const }
            : msg
        )
        console.log('📝 Messages after update:', updated.map(m => ({ id: m.id, type: m.type, content: m.content, status: m.status })))
        return updated
      })

    } catch (error) {
      console.error('Chat error:', error)
      
      // Show error message
      setMessages((prev) => prev.map(msg => 
        msg.id === prev[prev.length - 1]?.id 
          ? { 
              ...msg, 
              content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              status: "error" 
            }
          : msg
      ))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSendMessage = () => {
    console.log('🔴 BUTTON CLICKED: handleSendMessage called')
    console.log('🔴 Input value:', inputValue)
    console.log('🔴 Input trimmed:', inputValue.trim())
    
    if (!inputValue.trim()) {
      console.log('🔴 EARLY RETURN: empty input')
      return
    }

    console.log('🔴 Creating user message...')
    const userMessage: Message = {
      id: generateUniqueId(),
      type: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      status: "sent",
    }

    console.log('🔴 User message created:', userMessage)
    console.log('🔴 Adding user message to state...')
    setMessages((prev) => [...prev, userMessage])
    console.log('🔴 Clearing input...')
    setInputValue("")

    console.log('🔴 About to call sendMessageToAgent with:', inputValue)
    // Send message to real agent
    sendMessageToAgent(inputValue)
    console.log('🔴 sendMessageToAgent call completed')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('🟡 KEY PRESSED:', e.key, 'shiftKey:', e.shiftKey)
    if (e.key === "Enter" && !e.shiftKey) {
      console.log('🟡 ENTER TRIGGERED - calling handleSendMessage')
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFeedback = (messageId: string, feedback: "approved" | "rejected") => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg)))
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleRegenerateResponse = (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex > 0) {
      const previousUserMessage = messages[messageIndex - 1]
      if (previousUserMessage.type === "user") {
        // Remove the current response and regenerate
        setMessages((prev) => prev.slice(0, messageIndex))
        sendMessageToAgent(previousUserMessage.content)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] border-pixel flex flex-col">
        <CardHeader className="border-b border-pixel">
          <CardTitle className="font-pixel text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{agent.avatar}</span>
              <div>
                <span>Chat with {agent.name}</span>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground font-clean">
                    {isTyping ? "Thinking..." : isStreaming ? "Responding..." : "Online"}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col">
          {/* Personality Indicators Panel */}
          {showPersonalityPanel && (
            <div className="border-b border-pixel p-3 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-pixel text-xs">Agent Context</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPersonalityPanel(false)}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <Badge variant="outline" className="font-pixel text-xs">
                      {personalityIndicators.activeMode}
                    </Badge>
                    {availableModes.length > 1 && (
                      <select 
                        value={personalityIndicators.activeMode}
                        onChange={(e) => switchAgentMode(e.target.value)}
                        className="text-xs border rounded px-1 py-0.5"
                      >
                        {availableModes.map(mode => (
                          <option key={mode.id} value={mode.mode_name}>
                            {mode.mode_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    {personalityIndicators.collaborating && (
                      <Badge variant="secondary" className="font-pixel text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Collaborating
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {personalityIndicators.recentMemory.length > 0 && (
                <div className="mt-2">
                  <span className="text-muted-foreground text-xs">Recent Context:</span>
                  <div className="mt-1 space-y-1">
                    {personalityIndicators.recentMemory.map((memory, idx) => (
                      <div key={idx} className="text-xs bg-background rounded px-2 py-1">
                        {memory}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.type === "system"
                          ? "bg-muted text-muted-foreground text-center"
                          : "bg-muted"
                    }`}
                  >
                    {message.type === "agent" && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span>{agent.avatar}</span>
                        <span className="font-pixel text-xs">{agent.name}</span>
                        {message.context && (
                          <div className="flex space-x-1">
                            {message.context.slice(0, 2).map((ctx, idx) => (
                              <Badge key={idx} variant="outline" className="font-pixel text-xs">
                                {ctx}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap text-sm font-clean">
                      {message.content}
                      {isStreaming && message.status === "streaming" && <span className="animate-pulse">|</span>}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{message.timestamp}</span>
                      {message.status === "sending" && <Clock className="w-3 h-3" />}
                      {message.status === "sent" && <CheckCircle className="w-3 h-3" />}
                      {message.status === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
                    </div>

                    {message.type === "agent" && message.status === "sent" && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, "approved")}
                          className={`h-6 px-2 ${message.feedback === "approved" ? "bg-green-100" : ""}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, "rejected")}
                          className={`h-6 px-2 ${message.feedback === "rejected" ? "bg-red-100" : ""}`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(message.content)}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateResponse(message.id)}
                          className="h-6 px-2"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>{agent.avatar}</span>
                      <span className="font-pixel text-xs">{agent.name}</span>
                      <Badge variant="outline" className="font-pixel text-xs">
                        <Brain className="w-3 h-3 mr-1" />
                        Thinking
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-pixel p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => {
                  console.log('🟡 INPUT CHANGED:', e.target.value)
                  setInputValue(e.target.value)
                }}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${agent.name}...`}
                className="flex-1 font-clean border-pixel"
                disabled={isTyping || isStreaming}
              />
              <Button
                onClick={() => {
                  console.log('🟡 BUTTON CLICKED! Debug info:', {
                    inputValue,
                    inputTrimmed: inputValue.trim(),
                    isTyping,
                    isStreaming,
                    disabled: !inputValue.trim() || isTyping || isStreaming
                  })
                  handleSendMessage()
                }}
                disabled={!inputValue.trim() || isTyping || isStreaming}
                className="font-pixel text-xs"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
              <Brain className="w-3 h-3" />
              <span>Context: Recent tasks, Brand guidelines, Performance data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}