'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/ui/sidebar'
import Cardboard from '@/components/ui/cardboard'
import HorizontalStackBar from '@/components/charts/horizontal-stack-bar'
import PieChart from '@/components/charts/pie-chart'
import ShipmentTable from '@/components/tables/shipment-table'
import ShipmentModal from '@/components/modals/shipment-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { CardboardData, ChartData, Shipment } from '@/types'

export default function AdminDashboard() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [cardboardData, setCardboardData] = useState<CardboardData>({
    hk: 0,
    hke: 0,
    hkne: 0,
    totalDp: 0,        // 🆕 Tambah state untuk data baru
    totalTerkirim: 0,  // 🆕
    totalGagal: 0      // 🆕
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange, searchQuery])

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
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/shipments/dashboard?${params}`)
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
      <Sidebar userRole="admin" userName={user.nama_lengkap} />
      
      <main className="pr-0 lg:pr-64 transition-all duration-300 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Selamat Datang, {user.nama_lengkap}
          </h1>
          <p className="text-gray-600 mt-2">
            Dashboard Admin - Shipment Tracking System
          </p>
        </div>

        {/* Tombol Input Shipment di Header */}
        <div className="mb-8">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Input Shipment
          </Button>
        </div>

        {/* 🆕 Cardboard Section - 6 Cards Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {/* Existing Cards */}
          <Cardboard title="HK" value={cardboardData.hk} description="Hari Kerja" />
          <Cardboard title="HKE" value={cardboardData.hke} description="Hari Kerja Efektif" />
          <Cardboard title="HKNE" value={cardboardData.hkne} description="Shipment Freelance" />
          
          {/* 🆕 New Cards */}
          <Cardboard 
            title="Total DP" 
            value={cardboardData.totalDp} 
            description="Jumlah Total Toko" 
          />
          <Cardboard 
            title="Total Terkirim" 
            value={cardboardData.totalTerkirim} 
            description="Pengiriman Berhasil" 
          />
          <Cardboard 
            title="Total Gagal" 
            value={cardboardData.totalGagal} 
            description="Pengiriman Gagal" 
          />
        </div>

        {/* Charts Section - Horizontal chart dengan scroll */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Distribusi Harian</h3>
              <div className="text-sm text-gray-500">
                Scroll horizontal untuk melihat lebih banyak data
              </div>
            </div>
            <HorizontalStackBar data={chartData} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Perbandingan Total</h3>
              <PieChart data={chartData} />
            </div>
          </div>
        </div>

        {/* FILTER SECTION - SAMA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h3 className="text-lg font-semibold mb-4">Filter Data</h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Rentang Tanggal - From */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Dari Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      format(dateRange.from, "dd/MM/yyyy")
                    ) : (
                      "Pilih tanggal"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Rentang Tanggal - To */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sampai Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? (
                      format(dateRange.to, "dd/MM/yyyy")
                    ) : (
                      "Pilih tanggal"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Pencarian */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari shipment..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tombol Reset Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Aksi</label>
              <div className="flex gap-2">
                <Button
                  onClick={fetchDashboardData}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Terapkan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateRange({})
                    setSearchQuery('')
                  }}
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Info Filter Aktif */}
          {(dateRange.from || dateRange.to || searchQuery) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  Filter aktif: 
                  {dateRange.from && ` Dari ${format(dateRange.from, "dd/MM/yyyy")}`}
                  {dateRange.to && ` Sampai ${format(dateRange.to, "dd/MM/yyyy")}`}
                  {searchQuery && ` Pencarian: "${searchQuery}"`}
                </div>
                <span className="text-sm font-medium text-blue-800">
                  {shipments.length} data ditemukan
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tabel Section */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rekap Shipment</h3>
              <div className="text-sm text-gray-500">
                Total: {shipments.length} data
              </div>
            </div>
          </div>
          <ShipmentTable
            shipments={shipments}
            userRole="admin"
            onRefresh={fetchDashboardData}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Shipment Modal */}
      <ShipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleShipmentSubmit}
        userRole="admin"
        currentUser={user}
      />
    </div>
  )
}