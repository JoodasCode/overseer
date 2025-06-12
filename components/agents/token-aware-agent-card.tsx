'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Zap, AlertTriangle, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Agent {
  id: string
  name: string
  description: string
  role: string
  avatar_url?: string
  status: 'active' | 'idle' | 'offline'
  efficiency_score: number
  level_xp: number
}

interface TokenUsage {
  tokensRemaining: number
  tokensUsed: number
  tokenQuota: number
}

interface TokenAwareAgentCardProps {
  agent: Agent
  tokenUsage: TokenUsage
  averageTokensPerChat?: number
  popularityRank?: number
}

export function TokenAwareAgentCard({ 
  agent, 
  tokenUsage, 
  averageTokensPerChat = 1,
  popularityRank 
}: TokenAwareAgentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  
  const canChat = tokenUsage.tokensRemaining > 0
  const tokensLow = tokenUsage.tokensRemaining < 50
  const estimatedChats = Math.floor(tokenUsage.tokensRemaining / averageTokensPerChat)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'idle': return 'Idle'
      case 'offline': return 'Offline'
      default: return 'Unknown'
    }
  }

  const handleChatClick = () => {
    if (canChat) {
      router.push(`/agents/${agent.id}/chat`)
    } else {
      router.push('/settings?tab=billing')
    }
  }

  return (
    <Card 
      className={`relative transition-all duration-200 cursor-pointer ${
        isHovered && canChat ? 'shadow-lg scale-[1.02]' : 'shadow-sm'
      } ${
        !canChat ? 'opacity-60 grayscale' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleChatClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={agent.avatar_url} 
                  alt={agent.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                  {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(agent.status)}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {agent.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {agent.role}
              </CardDescription>
            </div>
          </div>

          {/* Popularity Rank */}
          {popularityRank && popularityRank <= 5 && (
            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
              #{popularityRank}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Agent Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {agent.description}
        </p>

        {/* Agent Metrics */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span>Level {Math.floor(agent.level_xp / 100)}</span>
            <span>•</span>
            <span>{agent.efficiency_score}% Efficiency</span>
          </div>
          <span className="capitalize">{getStatusText(agent.status)}</span>
        </div>

        {/* Token Usage Info */}
        {tokensLow && canChat && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <span className="text-xs text-yellow-700">
              ~{estimatedChats} chats remaining
            </span>
          </div>
        )}

        {/* Chat Button */}
        <Button 
          className={`w-full ${
            canChat 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!canChat}
          onClick={(e) => {
            e.stopPropagation()
            handleChatClick()
          }}
        >
          {canChat ? (
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Start Chat</span>
              <div className="flex items-center space-x-1 text-xs opacity-75">
                <Zap className="w-3 h-3" />
                <span>{averageTokensPerChat}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Upgrade to Chat</span>
            </div>
          )}
        </Button>
      </CardContent>

      {/* Hover Overlay */}
      {isHovered && canChat && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-10 rounded-lg pointer-events-none" />
      )}
    </Card>
  )
} 