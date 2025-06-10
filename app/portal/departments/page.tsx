import React from 'react'

export default function DepartmentsPage() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="text-muted-foreground">Pre-grouped agent types (Comms, HR, Ops, Product)</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🗣️ Communications</h3>
            <p className="text-sm text-muted-foreground">Strategic communication, PR, and content creation agents</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">👥 Human Resources</h3>
            <p className="text-sm text-muted-foreground">HR management, recruitment, and employee relations</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">⚙️ Operations</h3>
            <p className="text-sm text-muted-foreground">Process automation, logistics, and operational efficiency</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🚀 Product</h3>
            <p className="text-sm text-muted-foreground">Product management, development, and strategy</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">💰 Finance</h3>
            <p className="text-sm text-muted-foreground">Financial analysis, budgeting, and reporting</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📊 Analytics</h3>
            <p className="text-sm text-muted-foreground">Data analysis, insights, and business intelligence</p>
          </div>
        </div>
      </div>
    </div>
  )
} 