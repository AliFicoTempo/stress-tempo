"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  userRole: 'admin' | 'regular'
  currentUser: any
  shipmentData?: any
}

export default function ShipmentModal({
  isOpen,
  onClose,
  onSubmit,
  userRole,
  currentUser,
  shipmentData,
}: ShipmentModalProps) {
  const { toast } = useToast()
  const [drivers, setDrivers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<Date>()
  
  const [formData, setFormData] = useState({
    user_id: '',
    nama_lengkap: '',
    tanggal: '',
    shipment_id: '',
    jumlah_toko: '',
    terkirim: '',
    gagal: 0,
    alasan: '',
  })

  // Pre-fill form jika edit mode
  useEffect(() => {
    if (shipmentData) {
      setFormData({
        user_id: shipmentData.user_id.toString(),
        nama_lengkap: shipmentData.nama_lengkap,
        tanggal: shipmentData.tanggal,
        shipment_id: shipmentData.shipment_id,
        jumlah_toko: shipmentData.jumlah_toko.toString(),
        terkirim: shipmentData.terkirim.toString(),
        gagal: shipmentData.gagal,
        alasan: shipmentData.alasan || '',
      })
      setDate(new Date(shipmentData.tanggal))
    } else {
      // Reset form untuk add mode
      setFormData({
        user_id: userRole === 'regular' ? currentUser?.user_id?.toString() : '',
        nama_lengkap: userRole === 'regular' ? currentUser?.nama_lengkap : '',
        tanggal: '',
        shipment_id: '',
        jumlah_toko: '',
        terkirim: '',
        gagal: 0,
        alasan: '',
      })
      setDate(undefined)
    }
  }, [shipmentData, userRole, currentUser])

  useEffect(() => {
    if (isOpen && userRole === 'admin') {
      fetchDrivers()
    }
  }, [isOpen, userRole])

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

  const calculateGagal = () => {
    const jumlah = parseInt(formData.jumlah_toko) || 0
    const terkirim = parseInt(formData.terkirim) || 0
    return Math.max(0, jumlah - terkirim)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'jumlah_toko' || field === 'terkirim') {
        updated.gagal = calculateGagal()
      }
      return updated
    })
  }

  const handleDriverSelect = (userId: string) => {
    const selectedDriver = drivers.find(d => d.user_id.toString() === userId)
    if (selectedDriver) {
      setFormData(prev => ({
        ...prev,
        user_id: selectedDriver.user_id.toString(),
        nama_lengkap: selectedDriver.nama_lengkap,
      }))
    }
  }

  const validateForm = () => {
    if (!date && !formData.tanggal) {
      toast({
        title: 'Error',
        description: 'Tanggal harus diisi',
        variant: 'destructive',
      })
      return false
    }

    if (!formData.shipment_id || formData.shipment_id.length !== 10) {
      toast({
        title: 'Error',
        description: 'Shipment ID harus 10 digit',
        variant: 'destructive',
      })
      return false
    }

    if (!formData.jumlah_toko || parseInt(formData.jumlah_toko) <= 0) {
      toast({
        title: 'Error',
        description: 'Jumlah toko harus diisi dan lebih dari 0',
        variant: 'destructive',
      })
      return false
    }

    const terkirim = parseInt(formData.terkirim)
    const jumlah = parseInt(formData.jumlah_toko)
    if (terkirim > jumlah) {
      toast({
        title: 'Error',
        description: 'Terkirim tidak boleh lebih dari jumlah toko',
        variant: 'destructive',
      })
      return false
    }

    const gagal = calculateGagal()
    if (gagal > 0 && !formData.alasan.trim()) {
      toast({
        title: 'Error',
        description: 'Alasan harus diisi jika ada pengiriman gagal',
        variant: 'destructive',
      })
      return false
    }

    if (userRole === 'admin' && !formData.user_id) {
      toast({
        title: 'Error',
        description: 'Nama Driver harus dipilih',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        tanggal: format(date || new Date(), 'yyyy-MM-dd'),
        gagal: calculateGagal(),
        jumlah_toko: parseInt(formData.jumlah_toko),
        terkirim: parseInt(formData.terkirim),
        user_id: parseInt(formData.user_id),
      }

      const url = shipmentData 
        ? `/api/shipments/${shipmentData.id}`
        : '/api/shipments'
      
      const method = shipmentData ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: shipmentData ? 'Data Diperbarui' : 'Data Disimpan',
          description: shipmentData 
            ? 'Shipment berhasil diperbarui' 
            : 'Shipment berhasil disimpan',
        })
        onSubmit()
        onClose()
        
        // Reset form
        if (!shipmentData) {
          setFormData({
            user_id: userRole === 'regular' ? currentUser?.user_id?.toString() : '',
            nama_lengkap: userRole === 'regular' ? currentUser?.nama_lengkap : '',
            tanggal: '',
            shipment_id: '',
            jumlah_toko: '',
            terkirim: '',
            gagal: 0,
            alasan: '',
          })
          setDate(undefined)
        }
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Gagal menyimpan data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {shipmentData ? 'EDIT SHIPMENT HARIAN' : 'SHIPMENT HARIAN'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {userRole === 'admin' ? (
            <div className="space-y-2">
              <Label htmlFor="driver">Nama Driver *</Label>
              <Select
                value={formData.user_id}
                onValueChange={handleDriverSelect}
                disabled={!!shipmentData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.user_id} value={driver.user_id.toString()}>
                      {driver.nama_lengkap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {shipmentData && (
                <p className="text-xs text-gray-500 mt-1">
                  Driver tidak dapat diubah pada mode edit
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Nama Driver</Label>
              <Input
                value={formData.nama_lengkap}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Tanggal *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipment_id">Shipment ID *</Label>
            <Input
              id="shipment_id"
              placeholder="10 digit angka"
              maxLength={10}
              value={formData.shipment_id}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                handleInputChange('shipment_id', value)
              }}
              disabled={!!shipmentData}
            />
            {shipmentData && (
              <p className="text-xs text-gray-500 mt-1">
                Shipment ID tidak dapat diubah
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jumlah_toko">Jumlah Toko *</Label>
            <Input
              id="jumlah_toko"
              type="number"
              min="0"
              placeholder="0"
              value={formData.jumlah_toko}
              onChange={(e) => handleInputChange('jumlah_toko', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terkirim">Terkirim *</Label>
            <Input
              id="terkirim"
              type="number"
              min="0"
              max={formData.jumlah_toko}
              placeholder="0"
              value={formData.terkirim}
              onChange={(e) => handleInputChange('terkirim', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gagal">Gagal</Label>
            <Input
              id="gagal"
              type="number"
              readOnly
              value={calculateGagal()}
              className="bg-gray-50"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="alasan">
              Alasan {calculateGagal() > 0 && '*'}
            </Label>
            <Input
              id="alasan"
              placeholder={
                calculateGagal() > 0
                  ? "Harus diisi karena ada pengiriman gagal"
                  : "Opsional jika tidak ada pengiriman gagal"
              }
              value={formData.alasan}
              onChange={(e) => handleInputChange('alasan', e.target.value)}
              required={calculateGagal() > 0}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {shipmentData ? 'Memperbarui...' : 'Menyimpan...'}
              </>
            ) : shipmentData ? 'Perbarui' : 'Simpan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}