"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ThumbsUp, ThumbsDown, Copy, RotateCcw, Brain, Clock, CheckCircle, AlertCircle } from "lucide-react"
import type { Agent } from "@/lib/types"

interface Message {
  id: string
  type: "user" | "agent" | "system"
  content: string
  timestamp: string
  status?: "sending" | "sent" | "error"
  context?: string[]
  feedback?: "approved" | "rejected"
}

interface AgentChatInterfaceProps {
  agent: Agent
  isOpen: boolean
  onClose: () => void
}

export function AgentChatInterface({ agent, isOpen, onClose }: AgentChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "system",
      content: `${agent.name} is ready to help! I have access to your recent tasks and remember our past conversations.`,
      timestamp: "Just now",
      context: ["Recent tasks", "Brand guidelines", "Past conversations"],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const simulateAgentResponse = (userMessage: string) => {
    setIsTyping(true)

    // Simulate thinking time
    setTimeout(() => {
      setIsTyping(false)
      setIsStreaming(true)

      // Simulate streaming response
      const responses = {
        draft: `Here's a LinkedIn post draft for Q2 growth:

🚀 Q2 Results: 47% revenue growth, 12k new customers, and our best quarter yet!

Key wins:
• Product launches exceeded targets by 23%
• Customer satisfaction hit 94% (new record!)
• Team expanded to 50+ amazing people

Big thanks to our customers who trust us to solve their biggest challenges. Q3, here we come! 💪

#growth #teamwork #Q2results`,
        newsletter: `Here's your newsletter draft:

Subject: "The Q2 wins that changed everything 🎯"

Hey [Name],

Q2 just wrapped and wow - what a quarter! Here are the highlights that matter most:

📈 47% revenue growth (our biggest quarter ever)
🎉 12,000 new customers joined our community  
⭐ 94% customer satisfaction score

But here's what I'm most excited about: the stories behind these numbers...

[Continue with customer success stories and Q3 preview]

Want me to adjust the tone or add specific metrics?`,
        default: `I understand you want help with that! Based on your recent tasks and our past conversations, I can:

• Draft content (social posts, newsletters, emails)
• Analyze performance data
• Suggest improvements to campaigns
• Help with strategy and planning

What specific task would you like me to tackle first?`,
      }

      const responseKey = userMessage.toLowerCase().includes("draft")
        ? "draft"
        : userMessage.toLowerCase().includes("newsletter")
          ? "newsletter"
          : "default"

      const response = responses[responseKey]

      // Simulate streaming by adding characters gradually
      let streamedContent = ""
      const chars = response.split("")
      let charIndex = 0

      const streamInterval = setInterval(() => {
        if (charIndex < chars.length) {
          streamedContent += chars[charIndex]

          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]

            if (lastMessage && lastMessage.type === "agent" && lastMessage.status === "streaming") {
              lastMessage.content = streamedContent
            } else {
              newMessages.push({
                id: Date.now().toString(),
                type: "agent",
                content: streamedContent,
                timestamp: new Date().toLocaleTimeString(),
                status: "streaming",
                context: ["Brand guidelines", "Recent campaigns", "Performance data"],
              })
            }

            return newMessages
          })

          charIndex++
        } else {
          clearInterval(streamInterval)
          setIsStreaming(false)

          // Mark as complete
          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.type === "agent") {
              lastMessage.status = "sent"
            }
            return newMessages
          })
        }
      }, 20) // Adjust speed here
    }, 1500)
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      status: "sent",
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate agent response
    simulateAgentResponse(inputValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
        simulateAgentResponse(previousUserMessage.content)
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
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${agent.name}...`}
                className="flex-1 font-clean border-pixel"
                disabled={isTyping || isStreaming}
              />
              <Button
                onClick={handleSendMessage}
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
