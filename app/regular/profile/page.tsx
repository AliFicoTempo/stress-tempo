'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegularProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole="regular" userName={user.nama_lengkap} />
      
      <main className="lg:ml-64 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Profile Driver</h1>
          <p className="text-gray-600 mt-2">
            Informasi pribadi driver
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Driver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nama Lengkap</p>
              <p className="font-medium">{user.nama_lengkap}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{user.role}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}