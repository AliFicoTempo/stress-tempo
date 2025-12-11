'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function PerformaDriverPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [performaData, setPerformaData] = useState<any[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    fetchPerformaData()
  }, [dateRange])

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

  const fetchPerformaData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/shipments/performa?${params}`)
      const data = await response.json()

      if (data.success) {
        setPerformaData(data.performa)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data performa',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Data dummy untuk demo
  const demoData = [
    { driver: 'Budi Santoso', total: 180, terkirim: 170, gagal: 10, persentase: 94.4 },
    { driver: 'Sari Dewi', total: 165, terkirim: 155, gagal: 10, persentase: 93.9 },
    { driver: 'Agus Wijaya', total: 175, terkirim: 165, gagal: 10, persentase: 94.3 },
    { driver: 'Admin Utama', total: 250, terkirim: 230, gagal: 20, persentase: 92.0 },
  ]

  const chartData = demoData.map(driver => ({
    name: driver.driver,
    'Terkirim': driver.terkirim,
    'Gagal': driver.gagal,
  }))

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
          <h1 className="text-3xl font-bold text-gray-800">Performa Driver</h1>
          <p className="text-gray-600 mt-2">
            Analisis performa dan produktivitas driver
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
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
            <label className="text-sm font-medium text-gray-700">Statistik</label>
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {demoData.length}
                  </div>
                  <div className="text-sm text-gray-500">Total Driver</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {demoData.reduce((sum, d) => sum + d.terkirim, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Terkirim</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Performa Driver</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Terkirim" fill="#10b981" />
                  <Bar dataKey="Gagal" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoData.sort((a, b) => b.persentase - a.persentase).map((driver, index) => (
                  <div key={driver.driver} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{driver.driver}</div>
                        <div className="text-sm text-gray-500">
                          {driver.terkirim} terkirim, {driver.gagal} gagal
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {driver.persentase}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detail Performa Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left">Driver</th>
                    <th className="py-3 px-4 text-left">Total Shipment</th>
                    <th className="py-3 px-4 text-left">Terkirim</th>
                    <th className="py-3 px-4 text-left">Gagal</th>
                    <th className="py-3 px-4 text-left">Persentase</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demoData.map((driver) => (
                    <tr key={driver.driver} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{driver.driver}</td>
                      <td className="py-3 px-4">{driver.total}</td>
                      <td className="py-3 px-4 text-green-600">{driver.terkirim}</td>
                      <td className="py-3 px-4 text-red-600">{driver.gagal}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                driver.persentase >= 95 ? 'bg-green-500' :
                                driver.persentase >= 90 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${driver.persentase}%` }}
                            ></div>
                          </div>
                          <span>{driver.persentase}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          driver.persentase >= 95 ? 'bg-green-100 text-green-800' :
                          driver.persentase >= 90 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {driver.persentase >= 95 ? 'Excellent' :
                           driver.persentase >= 90 ? 'Good' :
                           'Need Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}