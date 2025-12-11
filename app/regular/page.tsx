'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/ui/sidebar'
import Cardboard from '@/components/ui/cardboard'
import HorizontalStackBar from '@/components/charts/horizontal-stack-bar'
import PieChart from '@/components/charts/pie-chart'
import ShipmentTable from '@/components/tables/shipment-table'
import ShipmentModal from '@/components/modals/shipment-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { CardboardData, ChartData, Shipment } from '@/types'

export default function RegularDashboard() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [cardboardData, setCardboardData] = useState<CardboardData>({
    hk: 0,
    hke: 0,
    hkne: 0,
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    fetchDashboardData()
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
    }
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/shipments/dashboard')
      const data = await response.json()

      if (data.success) {
        setCardboardData(data.cardboard)
        setChartData(data.chartData)
        setShipments(data.shipments)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data dashboard',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShipmentSubmit = () => {
    fetchDashboardData()
    setIsModalOpen(false)
  }

  if (!user) {
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
          <h1 className="text-3xl font-bold text-gray-800">
            Selamat Datang, {user.nama_lengkap}
          </h1>
          <p className="text-gray-600 mt-2">
            Dashboard Driver - Shipment Tracking System
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="mb-8 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Input Shipment
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Cardboard title="HK" value={cardboardData.hk} description="Hari Kerja" />
          <Cardboard title="HKE" value={cardboardData.hke} description="Hari Kerja Efektif" />
          <Cardboard title="HKNE" value={cardboardData.hkne} description="Hari Kerja Tidak Efektif" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Distribusi Harian</h3>
            <HorizontalStackBar data={chartData} />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Perbandingan Total</h3>
            <PieChart data={chartData} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Rekap Shipment Saya</h3>
          </div>
          <ShipmentTable
            shipments={shipments}
            userRole="regular"
            onRefresh={fetchDashboardData}
            isLoading={isLoading}
          />
        </div>
      </main>

      <ShipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleShipmentSubmit}
        userRole="regular"
        currentUser={user}
      />
    </div>
  )
}