'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@supabase/supabase-js';
import { 
  MessageSquare, 
  Brain, 
  Users, 
  Send, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Share2
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  department_type?: string;
  status: string;
}

interface Message {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  message_type: string;
  content: string;
  read_at?: string;
  created_at: string;
  from_agent: Agent;
  to_agent: Agent;
}

interface SharedMemory {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  memory_type: string;
  content: string;
  context?: string;
  context_expires_at?: string;
  created_at: string;
  from_agent: Agent;
  to_agent: Agent;
}

interface CollaborationData {
  agent: Agent;
  messages: Message[];
  sharedMemory: SharedMemory[];
  departmentAgents: Agent[];
  statistics: {
    totalMessages: number;
    messagesSent: number;
    messagesReceived: number;
    memoryShared: number;
    memoryReceived: number;
    activeCollaborators: number;
  };
}

interface AgentCollaborationPanelProps {
  agent: Agent;
  onClose: () => void;
}

export default function AgentCollaborationPanel({ agent, onClose }: AgentCollaborationPanelProps) {
  const [collaborationData, setCollaborationData] = useState<CollaborationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('messages');
  
  // Message sending state
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [messageType, setMessageType] = useState('collaboration');
  const [sending, setSending] = useState(false);
  
  // Memory sharing state
  const [newMemory, setNewMemory] = useState('');
  const [memoryType, setMemoryType] = useState('context');
  const [memoryContext, setMemoryContext] = useState('');
  const [memoryExpires, setMemoryExpires] = useState('');
  const [sharing, setSharing] = useState(false);

  // Load collaboration data
  useEffect(() => {
    loadCollaborationData();
  }, [agent.id]);

  const loadCollaborationData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/agents/${agent.id}/collaborate`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborationData(data.data);
      }
    } catch (error) {
      console.error('Failed to load collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRecipient) return;

    try {
      setSending(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/agents/${agent.id}/collaborate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'message',
          to_agent_id: selectedRecipient,
          content: newMessage,
          message_type: messageType,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedRecipient('');
        await loadCollaborationData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const shareMemory = async () => {
    if (!newMemory.trim() || !selectedRecipient) return;

    try {
      setSharing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/agents/${agent.id}/collaborate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'share_memory',
          to_agent_id: selectedRecipient,
          content: newMemory,
          memory_type: memoryType,
          context: memoryContext || null,
          expires_in_hours: memoryExpires ? parseInt(memoryExpires) : null,
        }),
      });

      if (response.ok) {
        setNewMemory('');
        setMemoryContext('');
        setMemoryExpires('');
        setSelectedRecipient('');
        await loadCollaborationData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to share memory:', error);
    } finally {
      setSharing(false);
    }
  };

  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(`/api/agents/${agent.id}/collaborate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          message_ids: messageIds,
        }),
      });

      await loadCollaborationData(); // Refresh data
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Agent Collaboration</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!collaborationData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Agent Collaboration</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load collaboration data
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadMessages = collaborationData.messages.filter(m => 
    m.to_agent_id === agent.id && !m.read_at
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Agent Collaboration - {agent.name}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </CardTitle>
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {collaborationData.statistics.totalMessages}
            </div>
            <div className="text-xs text-muted-foreground">Total Messages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {collaborationData.statistics.messagesSent}
            </div>
            <div className="text-xs text-muted-foreground">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {collaborationData.statistics.messagesReceived}
            </div>
            <div className="text-xs text-muted-foreground">Received</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {collaborationData.statistics.memoryShared}
            </div>
            <div className="text-xs text-muted-foreground">Memory Shared</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {collaborationData.statistics.activeCollaborators}
            </div>
            <div className="text-xs text-muted-foreground">Collaborators</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Shared Memory</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Send</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {collaborationData.messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet. Start collaborating with your team!
                  </div>
                ) : (
                  collaborationData.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        message.to_agent_id === agent.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.from_agent.avatar} />
                        <AvatarFallback>
                          {message.from_agent.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {message.from_agent.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {message.message_type}
                            </Badge>
                            {message.to_agent_id === agent.id && !message.read_at && (
                              <Badge variant="destructive" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(message.created_at)}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm mt-1 text-gray-700">
                          {message.content}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            To: {message.to_agent.name}
                          </span>
                          {message.to_agent_id === agent.id && !message.read_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markMessagesAsRead([message.id])}
                              className="text-xs h-6"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="memory" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {collaborationData.sharedMemory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No shared memory yet. Share context with your team!
                  </div>
                ) : (
                  collaborationData.sharedMemory.map((memory) => (
                    <div
                      key={memory.id}
                      className={`p-3 rounded-lg border ${
                        memory.to_agent_id === agent.id
                          ? 'bg-purple-50 border-purple-200'
                          : 'bg-indigo-50 border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={memory.from_agent.avatar} />
                            <AvatarFallback className="text-xs">
                              {memory.from_agent.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {memory.from_agent.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {memory.memory_type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(memory.created_at)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {memory.content}
                      </p>
                      
                      {memory.context && (
                        <div className="text-xs text-muted-foreground bg-background rounded px-2 py-1 mb-2">
                          Context: {memory.context}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>To: {memory.to_agent.name}</span>
                        {memory.context_expires_at && (
                          <div className="flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Expires: {formatTimeAgo(memory.context_expires_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="send" className="mt-4">
            <div className="space-y-4">
              {/* Recipient Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Send to:
                </label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborationData.departmentAgents.map((teamAgent) => (
                      <SelectItem key={teamAgent.id} value={teamAgent.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={teamAgent.avatar} />
                            <AvatarFallback className="text-xs">
                              {teamAgent.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{teamAgent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {teamAgent.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="message">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="message">Send Message</TabsTrigger>
                  <TabsTrigger value="memory">Share Memory</TabsTrigger>
                </TabsList>

                <TabsContent value="message" className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Message Type:
                    </label>
                    <Select value={messageType} onValueChange={setMessageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collaboration">Collaboration</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="request">Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Message:
                    </label>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || !selectedRecipient || sending}
                    className="w-full"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </TabsContent>

                <TabsContent value="memory" className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Memory Type:
                    </label>
                    <Select value={memoryType} onValueChange={setMemoryType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="context">Context</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="preference">Preference</SelectItem>
                        <SelectItem value="goal">Goal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Memory Content:
                    </label>
                    <Textarea
                      value={newMemory}
                      onChange={(e) => setNewMemory(e.target.value)}
                      placeholder="What would you like to share?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Context (optional):
                    </label>
                    <Textarea
                      value={memoryContext}
                      onChange={(e) => setMemoryContext(e.target.value)}
                      placeholder="Additional context or notes..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Expires in (hours, optional):
                    </label>
                    <Select value={memoryExpires} onValueChange={setMemoryExpires}>
                      <SelectTrigger>
                        <SelectValue placeholder="Never expires" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={shareMemory} 
                    disabled={!newMemory.trim() || !selectedRecipient || sharing}
                    className="w-full"
                  >
                    {sharing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Share2 className="w-4 h-4 mr-2" />
                    )}
                    Share Memory
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 