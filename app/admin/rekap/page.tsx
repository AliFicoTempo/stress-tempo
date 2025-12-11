'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/ui/sidebar'
import ShipmentTable from '@/components/tables/shipment-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Search, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Shipment } from '@/types'

export default function RekapPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    fetchShipments()
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

  const fetchShipments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/shipments?${params}`)
      const data = await response.json()

      if (data.success) {
        setShipments(data.shipments)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data rekap',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/shipments?${params}`)
      const data = await response.json()

      if (data.success) {
        const csvData = convertToCSV(data.shipments)
        downloadCSV(csvData, 'rekap-shipment.csv')
        toast({
          title: 'Berhasil',
          description: 'Data berhasil diexport',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal export data',
        variant: 'destructive',
      })
    }
  }

  const convertToCSV = (data: Shipment[]) => {
    const headers = ['No', 'Nama Driver', 'Tanggal', 'Shipment ID', 'Jumlah Toko', 'Terkirim', 'Gagal', 'Alasan']
    const rows = data.map((item, index) => [
      index + 1,
      item.nama_lengkap,
      format(new Date(item.tanggal), 'dd/MM/yyyy'),
      item.shipment_id,
      item.jumlah_toko,
      item.terkirim,
      item.gagal,
      item.alasan || ''
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
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
          <h1 className="text-3xl font-bold text-gray-800">Rekap Shipment</h1>
          <p className="text-gray-600 mt-2">
            Lihat dan kelola seluruh data shipment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
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
                      format(dateRange.from, "PPP", { locale: id })
                    ) : (
                      "Dari tanggal"
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
                      format(dateRange.to, "PPP", { locale: id })
                    ) : (
                      "Sampai tanggal"
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
            <label className="text-sm font-medium text-gray-700">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan nama driver, shipment, atau tanggal..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Export Data</label>
            <Button
              onClick={handleExport}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Data Shipment</h3>
              <div className="text-sm text-gray-500">
                Total: {shipments.length} data
              </div>
            </div>
          </div>
          <ShipmentTable
            shipments={shipments}
            userRole="admin"
            onRefresh={fetchShipments}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  )
}