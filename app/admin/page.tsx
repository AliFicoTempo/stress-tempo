'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { 
  CalendarIcon, Search, Plus, Filter, X, ChevronDown, 
  ChevronUp, Download, RefreshCw, ChevronLeft, ChevronRight,
  MousePointerClick
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { CardboardData, ChartData, Shipment } from '@/types'

// Quick filter options
const QUICK_FILTERS = [
  { label: 'Hari Ini', days: 0 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: 'Bulan Ini', days: -1 },
]

// Cardboard mapping untuk filter
const CARDBOARD_FILTERS = [
  { id: 'hk', title: 'HK', description: 'Total Hari Kerja' },
  { id: 'hke', title: 'HKE', description: 'Hari Tanpa Freelance' },
  { id: 'hkne', title: 'HKNE', description: 'Hari Dengan Freelance' },
  { id: 'dp', title: 'Total DP', description: 'Jumlah Total Toko' },
  { id: 'terkirim', title: 'Total Terkirim', description: 'Pengiriman Berhasil' },
  { id: 'gagal', title: 'Total Gagal', description: 'Pengiriman Gagal' },
]

export default function AdminDashboard() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [cardboardData, setCardboardData] = useState<CardboardData>({
    hk: 0,
    hke: 0,
    hkne: 0,
    totalDp: 0,
    totalTerkirim: 0,
    totalGagal: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('')
  
  // 🆕 STATE UNTUK FITUR INTERAKTIF
  const [activeCardboardFilter, setActiveCardboardFilter] = useState<string>('')
  const [activeChartFilter, setActiveChartFilter] = useState<{date?: string, type?: string}>({})
  const [activeFilters, setActiveFilters] = useState<any>({})
  
  const cardboardScrollRef = useRef<HTMLDivElement>(null)
  const chartScrollRef = useRef<HTMLDivElement>(null)

  // Initialize with current month
  useEffect(() => {
    const today = new Date()
    setDateRange({
      from: startOfMonth(today),
      to: endOfMonth(today)
    })
    setActiveQuickFilter('Bulan Ini')
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [])

  // 🆕 FETCH DENGAN SEMUA FILTER
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      if (searchQuery) params.append('search', searchQuery)
      
      // 🆕 Tambahkan filter dari cardboard
      if (activeCardboardFilter) {
        params.append('filterByMetric', activeCardboardFilter)
      }
      
      // 🆕 Tambahkan filter dari chart
      if (activeChartFilter.date) {
        params.append('filterByDate', activeChartFilter.date)
      }
      if (activeChartFilter.type) {
        params.append('filterByType', activeChartFilter.type)
      }

      const response = await fetch(`/api/shipments/dashboard?${params}`)
      const data = await response.json()

      if (data.success) {
        setCardboardData(data.cardboard)
        setChartData(data.chartData)
        setShipments(data.shipments)
        setActiveFilters(data.activeFilters || {})
        
        // Show success toast dengan info filter
        const filterInfo = []
        if (activeCardboardFilter) filterInfo.push(`Filter: ${activeCardboardFilter}`)
        if (activeChartFilter.date) filterInfo.push(`Tanggal: ${format(new Date(activeChartFilter.date), 'dd/MM/yy')}`)
        if (activeChartFilter.type) filterInfo.push(`Tipe: ${activeChartFilter.type}`)
        
        if (filterInfo.length > 0) {
          toast({
            title: 'Filter Aktif',
            description: `${filterInfo.join(', ')} - ${data.shipments.length} data`,
          })
        }
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
  }, [dateRange, searchQuery, activeCardboardFilter, activeChartFilter, toast])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

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

  // 🆕 HANDLER UNTUK INTERAKSI CARDBOARD
  const handleCardboardClick = (cardboardId: string) => {
    if (activeCardboardFilter === cardboardId) {
      // Jika klik lagi, reset filter
      setActiveCardboardFilter('')
    } else {
      setActiveCardboardFilter(cardboardId)
    }
    setActiveChartFilter({}) // Reset chart filter
  }

  // 🆕 HANDLER UNTUK INTERAKSI CHART
  const handleChartClick = (date?: string, type?: string) => {
    if (activeChartFilter.date === date && activeChartFilter.type === type) {
      // Jika klik lagi, reset filter
      setActiveChartFilter({})
    } else {
      setActiveChartFilter({ date, type })
    }
    setActiveCardboardFilter('') // Reset cardboard filter
  }

  const handleQuickFilter = (filter: { label: string; days: number }) => {
    const today = new Date()
    let fromDate: Date
    let toDate: Date = today

    if (filter.days === -1) {
      fromDate = startOfMonth(today)
      toDate = endOfMonth(today)
    } else if (filter.days === 0) {
      fromDate = today
      toDate = today
    } else {
      fromDate = subDays(today, filter.days)
      toDate = today
    }

    setDateRange({ from: fromDate, to: toDate })
    setActiveQuickFilter(filter.label)
    setShowFilters(false)
    // Reset interactive filters
    setActiveCardboardFilter('')
    setActiveChartFilter({})
  }

  const handleShipmentSubmit = () => {
    fetchDashboardData()
    setIsModalOpen(false)
  }

  const handleExportData = () => {
    toast({
      title: 'Export Dimulai',
      description: 'Menyiapkan data untuk diunduh...',
    })
  }

  // 🆕 SCROLL FUNCTIONS UNTUK MOBILE
  const scrollCardboard = (direction: 'left' | 'right') => {
    if (cardboardScrollRef.current) {
      const scrollAmount = 300
      cardboardScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollChart = (direction: 'left' | 'right') => {
    if (chartScrollRef.current) {
      const scrollAmount = 200
      chartScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }
    return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole="admin" userName={user.nama_lengkap} />
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Dashboard</h1>
            <p className="text-xs text-gray-500">Admin - {user.nama_lengkap}</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="pt-16 lg:pt-6 lg:pr-64 transition-all duration-300 p-4 lg:p-6">
        {/* Header Section - Desktop */}
        <div className="hidden lg:block mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Dashboard Admin
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2">
                Shipment Tracking System - {user.nama_lengkap}
              </p>
            </div>
            
            {/* Action Buttons - Desktop */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Input Shipment
              </Button>
              <Button
                variant="outline"
                onClick={handleExportData}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={fetchDashboardData}
                disabled={isLoading}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* 🆕 SECTION 1: CARDBOARD DENGAN HORIZONTAL SCROLL (MOBILE) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Ringkasan Metrics
              {activeCardboardFilter && (
                <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Filter: {CARDBOARD_FILTERS.find(c => c.id === activeCardboardFilter)?.title}
                </span>
              )}
            </h2>
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
              <MousePointerClick className="h-3 w-3" />
              <span>Klik untuk filter data</span>
            </div>
          </div>
          
          {/* Container untuk horizontal scroll di mobile */}
          <div className="relative">
            {/* Scroll buttons untuk mobile */}
            <div className="lg:hidden absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow"
                onClick={() => scrollCardboard('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="lg:hidden absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow"
                onClick={() => scrollCardboard('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Cardboard Grid/Horizontal Scroll */}
            <div 
              ref={cardboardScrollRef}
              className={cn(
                "flex lg:grid",
                "lg:grid-cols-3 xl:grid-cols-6",
                "gap-3",
                "overflow-x-auto lg:overflow-visible",
                "scrollbar-hide", // Hide scrollbar
                "pb-2 lg:pb-0",
                "px-1 lg:px-0"
              )}
              style={{
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE/Edge
              }}
            >
              {/* Map cardboard data dengan handler click */}
              {CARDBOARD_FILTERS.map((card) => {
                const value = card.id === 'hk' ? cardboardData.hk :
                             card.id === 'hke' ? cardboardData.hke :
                             card.id === 'hkne' ? cardboardData.hkne :
                             card.id === 'dp' ? cardboardData.totalDp :
                             card.id === 'terkirim' ? cardboardData.totalTerkirim :
                             card.id === 'gagal' ? cardboardData.totalGagal : 0
                
                const isActive = activeCardboardFilter === card.id
                
                return (
                  <div 
                    key={card.id}
                    className={cn(
                      "flex-shrink-0 w-[280px] lg:w-auto lg:flex-shrink",
                      "cursor-pointer transition-transform",
                      isActive && "ring-2 ring-blue-500 ring-offset-2 rounded-xl",
                      "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                    onClick={() => handleCardboardClick(card.id)}
                  >
                    <Cardboard 
                      title={card.title}
                      value={value}
                      description={card.description}
                      className={cn(
                        isActive && "border-blue-500",
                        "h-full"
                      )}
                    />
                  </div>
                )
              })}
            </div>
            
            {/* Indicator untuk horizontal scroll di mobile */}
            <div className="lg:hidden text-center mt-2">
              <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <ChevronLeft className="h-3 w-3" />
                <span>Geser untuk melihat lebih banyak</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        {/* 🆕 SECTION 2: CHART DENGAN HORIZONTAL SCROLL (MOBILE) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Visualisasi Data
                {activeChartFilter.date && (
                  <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Filter: {format(new Date(activeChartFilter.date), 'dd/MM/yy')}
                    {activeChartFilter.type && ` - ${activeChartFilter.type}`}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Klik pada chart untuk filter data spesifik
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
              <MousePointerClick className="h-3 w-3" />
              <span>Klik bar/pie untuk filter</span>
            </div>
          </div>
          
          {/* Container untuk chart horizontal scroll */}
          <div className="space-y-6">
            {/* Horizontal Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-800">
                  Distribusi Harian Shipment
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => scrollChart('left')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => scrollChart('right')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Scrollable chart container */}
              <div 
                ref={chartScrollRef}
                className="overflow-x-auto scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <div className="min-w-[600px] lg:min-w-full">
                  <HorizontalStackBar 
                    data={chartData} 
                    onBarClick={(date, type) => handleChartClick(date, type)}
                    activeFilter={activeChartFilter}
                  />
                </div>
              </div>
              
              <div className="lg:hidden text-center mt-3">
                <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <ChevronLeft className="h-3 w-3" />
                  <span>Geser untuk melihat chart lengkap</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-800">
                  Perbandingan Total Shipment
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Terkirim</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">Gagal</span>
                  </div>
                </div>
              </div>
              
              <div className="h-64 lg:h-72">
                <PieChart 
                  data={chartData}
                  onSliceClick={(type) => handleChartClick(undefined, type)}
                  activeFilter={activeChartFilter}
                />
              </div>
            </div>
          </div>
        </div>
                {/* 🆕 SECTION 3: FILTER SECTION (DIBAWAH CHART) */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Filter Data</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="ml-2">Filter</span>
              </Button>
            </div>
            
            {/* Quick Filter Chips */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Filter Cepat:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((filter) => (
                  <Button
                    key={filter.label}
                    variant={activeQuickFilter === filter.label ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickFilter(filter)}
                    className={cn(
                      "rounded-full px-4",
                      activeQuickFilter === filter.label && "bg-blue-600"
                    )}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Advanced Filters (Collapsible di Mobile) */}
            <div className={cn(
              "transition-all duration-300",
              !showFilters && "lg:block hidden"
            )}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Rentang Tanggal - From */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Dari Tanggal</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-sm",
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
                    <PopoverContent className="w-auto p-0" align="start">
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
                          "w-full justify-start text-left font-normal text-sm",
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
                    <PopoverContent className="w-auto p-0" align="start">
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
                      className="pl-10 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Aksi</label>
                  <div className="flex gap-2">
                    <Button
                      onClick={fetchDashboardData}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                      disabled={isLoading}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Terapkan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDateRange({})
                        setSearchQuery('')
                        setActiveQuickFilter('')
                        setActiveCardboardFilter('')
                        setActiveChartFilter({})
                      }}
                      className="flex-1 text-sm"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reset All
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(dateRange.from || dateRange.to || searchQuery || activeCardboardFilter || activeChartFilter.date) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Filter aktif:</span>
                    {dateRange.from && ` Dari ${format(dateRange.from, "dd/MM/yyyy")}`}
                    {dateRange.to && ` Sampai ${format(dateRange.to, "dd/MM/yyyy")}`}
                    {searchQuery && ` Pencarian: "${searchQuery}"`}
                    {activeCardboardFilter && ` | Cardboard: ${CARDBOARD_FILTERS.find(c => c.id === activeCardboardFilter)?.title}`}
                    {activeChartFilter.date && ` | Chart: ${format(new Date(activeChartFilter.date), 'dd/MM/yy')}`}
                    {activeChartFilter.type && ` (${activeChartFilter.type})`}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                      {shipments.length} data
                    </span>
                    {(activeCardboardFilter || activeChartFilter.date) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setActiveCardboardFilter('')
                          setActiveChartFilter({})
                        }}
                      >
                        Clear Interactive
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🆕 SECTION 4: TABEL SECTION */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 lg:p-6 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-800">Rekap Shipment</h3>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">
                  Detail semua shipment berdasarkan filter
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700">
                  Total: <span className="text-blue-600 font-bold">{shipments.length}</span> data
                </div>
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px] lg:min-w-full">
              <ShipmentTable
                shipments={shipments}
                userRole="admin"
                onRefresh={fetchDashboardData}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Floating Action Button untuk Mobile */}
        <Button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
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