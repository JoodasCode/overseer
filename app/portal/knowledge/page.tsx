import React from 'react'

export default function KnowledgePage() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge Base</h1>
          <p className="text-muted-foreground">Agent-shared documents and context memory</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📚 Shared Documents</h3>
            <p className="text-sm text-muted-foreground">Documents accessible by all agents</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🧠 Context Memory</h3>
            <p className="text-sm text-muted-foreground">Agent learning and conversation memory</p>
          </div>
        </div>
        
        <div className="text-center text-muted-foreground mt-8">
          Knowledge base system coming soon...
        </div>
      </div>
    </div>
  )
} 