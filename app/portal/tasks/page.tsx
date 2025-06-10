'use client'

import React from 'react'

export default function TasksPage() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-muted-foreground">Task dashboard (assigned/to review/complete)</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📋 Assigned</h3>
            <p className="text-sm text-muted-foreground">Tasks currently assigned to agents</p>
            <div className="mt-4 text-2xl font-bold">0</div>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">👀 To Review</h3>
            <p className="text-sm text-muted-foreground">Completed tasks awaiting review</p>
            <div className="mt-4 text-2xl font-bold">0</div>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">✅ Complete</h3>
            <p className="text-sm text-muted-foreground">Tasks that have been completed</p>
            <div className="mt-4 text-2xl font-bold">0</div>
          </div>
        </div>
        
        <div className="text-center text-muted-foreground mt-8">
          Task management system coming soon...
        </div>
      </div>
    </div>
  )
} 