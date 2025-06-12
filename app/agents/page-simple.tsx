"use client"

import { useState, useEffect } from 'react'
import { SharedLayout } from '@/components/shared/SharedLayout'

export default function AgentsPageSimple() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Starting...')

  useEffect(() => {
    console.log('🚀 Simple useEffect triggered')
    setMessage('useEffect ran!')
    
    setTimeout(() => {
      console.log('🏁 Setting loading to false')
      setLoading(false)
      setMessage('Loading complete!')
    }, 2000)
  }, [])

  console.log('🔍 Component rendering, loading:', loading)

  if (loading) {
    return (
      <SharedLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Simple test: {message}</p>
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold">✅ Agents Page Working!</h1>
        <p>Message: {message}</p>
      </div>
    </SharedLayout>
  )
} 