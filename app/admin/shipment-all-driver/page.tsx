'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function ShipmentAllDriverPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [shipments, setShipments] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    fetchDrivers()
  }, [])

  useEffect(() => {
    fetchShipments()
  }, [dateRange, searchQuery, selectedDriver])

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

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/users/drivers')
      const data = await response.json()
      if (data.success) {
        setDrivers(data.drivers)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const fetchShipments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      if (searchQuery) params.append('search', searchQuery)
      if (selectedDriver !== 'all') params.append('driver', selectedDriver)

      const response = await fetch(`/api/shipments?${params}`)
      const data = await response.json()

      if (data.success) {
        setShipments(data.shipments)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data shipment',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Data dummy untuk demo
  const demoData = [
    { 
      id: 1, 
      driver: 'Budi Santoso', 
      date: '2025-12-01', 
      shipment: 'SHIP0012025', 
      stores: 35, 
      delivered: 34, 
      failed: 1, 
      reason: 'Penerima tidak ada' 
    },
    { 
      id: 2, 
      driver: 'Sari Dewi', 
      date: '2025-12-01', 
      shipment: 'SHIP2012025', 
      stores: 30, 
      delivered: 29, 
      failed: 1, 
      reason: 'Cuaca buruk' 
    },
    { 
      id: 3, 
      driver: 'Agus Wijaya', 
      date: '2025-12-01', 
      shipment: 'SHIP3012025', 
      stores: 28, 
      delivered: 27, 
      failed: 1, 
      reason: 'Jam operasional' 
    },
    { 
      id: 4, 
      driver: 'Budi Santoso', 
      date: '2025-12-02', 
      shipment: 'SHIP1022025', 
      stores: 42, 
      delivered: 41, 
      failed: 1, 
      reason: 'Toko tutup sementara' 
    },
    { 
      id: 5, 
      driver: 'Sari Dewi', 
      date: '2025-12-02', 
      shipment: 'SHIP2022025', 
      stores: 35, 
      delivered: 35, 
      failed: 0, 
      reason: '' 
    },
  ]

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy', { locale: id })
    } catch {
      return dateString
    }
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
      
      <main className="lg:ml-64 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shipment All Driver</h1>
          <p className="text-gray-600 mt-2">
            Monitor seluruh shipment dari semua driver
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Rentang Tanggal</label>
            <div className="flex gap-2">
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
                      "Dari"
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
                      "Sampai"
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Driver</label>
            <select
              className="w-full h-10 px-3 py-2 border rounded-md bg-background"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="all">Semua Driver</option>
              {drivers.map((driver) => (
                <option key={driver.user_id} value={driver.user_id}>
                  {driver.nama_lengkap}
                </option>
              ))}
            </select>
          </div>

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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Aksi</label>
            <Button
              onClick={fetchShipments}
              className="w-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              Terapkan Filter
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Shipment Semua Driver</CardTitle>
              <div className="text-sm text-gray-500">
                Menampilkan {demoData.length} data
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left">No.</th>
                    <th className="py-3 px-4 text-left">Driver</th>
                    <th className="py-3 px-4 text-left">Tanggal</th>
                    <th className="py-3 px-4 text-left">Shipment ID</th>
                    <th className="py-3 px-4 text-left">Jumlah Toko</th>
                    <th className="py-3 px-4 text-left">Terkirim</th>
                    <th className="py-3 px-4 text-left">Gagal</th>
                    <th className="py-3 px-4 text-left">Alasan</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demoData.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{item.driver}</td>
                      <td className="py-3 px-4">{formatDate(item.date)}</td>
                      <td className="py-3 px-4 font-mono">{item.shipment}</td>
                      <td className="py-3 px-4">{item.stores}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">{item.delivered}</td>
                      <td className={`py-3 px-4 ${item.failed > 0 ? 'text-red-600 font-semibold' : ''}`}>
                        {item.failed}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">{item.reason || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.failed === 0 ? 'bg-green-100 text-green-800' :
                          item.failed <= 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.failed === 0 ? 'Selesai' :
                           item.failed <= 2 ? 'Ada Kendala' :
                           'Perlu Perhatian'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!isLoading && demoData.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Tidak ada data shipment
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistik Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Shipment:</span>
                  <span className="font-semibold">15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Berhasil:</span>
                  <span className="font-semibold text-green-600">142</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gagal:</span>
                  <span className="font-semibold text-red-600">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-semibold text-blue-600">94.7%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Driver Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {drivers.slice(0, 3).map((driver) => (
                  <div key={driver.user_id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span>{driver.nama_lengkap}</span>
                    <span className="text-sm text-green-600">● Online</span>
                  </div>
                ))}
                {drivers.length > 3 && (
                  <div className="text-center text-sm text-gray-500">
                    +{drivers.length - 3} driver lainnya
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipment Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {demoData.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm">
                    <div className="font-medium">{item.driver}</div>
                    <div className="text-gray-500">
                      {formatDate(item.date)} • {item.shipment}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}