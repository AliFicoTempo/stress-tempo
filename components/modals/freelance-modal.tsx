"use client"

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Smartphone } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Driver {
  user_id: string
  nama_lengkap: string
  role: string
}

interface FreelanceModalProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
}

export default function FreelanceModal({ isOpen, onClose, userRole }: FreelanceModalProps) {
  const { toast } = useToast()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingDrivers, setIsFetchingDrivers] = useState(false)
  const [date, setDate] = useState<Date>()

  const [formData, setFormData] = useState({
    nama_freelance: '',
    user_id: '',
    nama_lengkap: '',
    tanggal: '',
    shipment_id: '',
    jumlah_toko: '',
    terkirim: '',
    gagal: 0,
    alasan: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchDrivers()
    }
  }, [isOpen])

  const fetchDrivers = async () => {
    try {
      setIsFetchingDrivers(true)
      console.log('🚀 Fetching drivers...')
      
      const response = await fetch('/api/users/drivers')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        const driversData = data.drivers || []
        setDrivers(driversData)
        
        if (driversData.length === 0) {
          toast({
            title: 'Info',
            description: 'Tidak ada driver tersedia',
            variant: 'default',
          })
        }
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Gagal mengambil data driver',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('❌ Error fetching drivers:', error)
      toast({
        title: 'Connection Error',
        description: 'Tidak dapat mengambil data driver',
        variant: 'destructive',
      })
    } finally {
      setIsFetchingDrivers(false)
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
    const selectedDriver = drivers.find(d => d.user_id?.toString() === userId)
    
    if (selectedDriver) {
      setFormData(prev => ({
        ...prev,
        user_id: selectedDriver.user_id,
        nama_lengkap: selectedDriver.nama_lengkap,
      }))
    }
  }

  const validateForm = () => {
    if (!formData.nama_freelance.trim()) {
      toast({
        title: 'Error',
        description: 'Nama Freelance harus diisi',
        variant: 'destructive',
      })
      return false
    }

    if (!formData.user_id) {
      toast({
        title: 'Error',
        description: 'Nama Driver harus dipilih',
        variant: 'destructive',
      })
      return false
    }

    if (!date) {
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

    const jumlahToko = parseInt(formData.jumlah_toko)
    if (!formData.jumlah_toko || jumlahToko <= 0) {
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

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        tanggal: format(date!, 'yyyy-MM-dd'),
        gagal: calculateGagal(),
        jumlah_toko: parseInt(formData.jumlah_toko),
        terkirim: parseInt(formData.terkirim),
        nama_freelance: formData.nama_freelance.trim(),
      }

      const response = await fetch('/api/shipments/freelance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Data freelance shipment berhasil disimpan',
        })
        onClose()
        setFormData({
          nama_freelance: '',
          user_id: '',
          nama_lengkap: '',
          tanggal: '',
          shipment_id: '',
          jumlah_toko: '',
          terkirim: '',
          gagal: 0,
          alasan: '',
        })
        setDate(undefined)
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Gagal menyimpan data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan pada server',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 📱 RESPONSIVE DIALOG: Full screen di mobile, max width di desktop */}
      <DialogContent className="
        max-h-[90vh] 
        overflow-y-auto
        w-[95vw] 
        max-w-lg 
        md:max-w-2xl
        p-4 
        md:p-6
        mx-auto
        my-4
      ">
        
        {/* 📱 HEADER RESPONSIVE */}
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="
              text-xl 
              md:text-2xl 
              font-bold
              flex items-center gap-2
            ">
              <Smartphone className="hidden md:inline h-5 w-5" />
              SHIPMENT FREELANCE
            </DialogTitle>
            {/* 🔘 CLOSE BUTTON UNTUK MOBILE */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden h-8 w-8"
            >
              ✕
            </Button>
          </div>
          <DialogDescription className="text-sm md:text-base">
            Tambahkan data shipment untuk driver freelance
          </DialogDescription>
        </DialogHeader>

        {/* 📱 FORM GRID RESPONSIVE */}
        <div className="
          grid 
          grid-cols-1 
          md:grid-cols-2 
          gap-4 
          py-4
          max-h-[60vh]
          overflow-y-auto
          pr-2
        ">
          
          {/* 👤 NAMA FREELANCE */}
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="nama_freelance" className="text-sm md:text-base">
              Nama Freelance *
            </Label>
            <Input
              id="nama_freelance"
              placeholder="Nama freelance"
              value={formData.nama_freelance}
              onChange={e => handleInputChange('nama_freelance', e.target.value)}
              className="h-10 md:h-11 text-sm md:text-base"
            />
          </div>

          {/* 🚗 DRIVER SELECT */}
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="driver" className="text-sm md:text-base">
              Nama Driver *
            </Label>
            <Select 
              onValueChange={handleDriverSelect}
              disabled={isFetchingDrivers}
            >
              <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                <SelectValue placeholder={
                  isFetchingDrivers ? "Memuat..." : "Pilih Driver"
                } />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {isFetchingDrivers ? (
                  <SelectItem value="loading" disabled>
                    Memuat data driver...
                  </SelectItem>
                ) : drivers.length === 0 ? (
                  <SelectItem value="no-data" disabled>
                    Tidak ada driver
                  </SelectItem>
                ) : (
                  drivers.map(driver => (
                    <SelectItem 
                      key={driver.user_id} 
                      value={driver.user_id.toString()}
                      className="text-sm md:text-base"
                    >
                      {driver.nama_lengkap}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 📅 TANGGAL */}
          <div className="space-y-1 md:space-y-2">
            <Label className="text-sm md:text-base">Tanggal *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-10 md:h-11 justify-start text-left font-normal text-sm md:text-base",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 🆔 SHIPMENT ID */}
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="shipment_id" className="text-sm md:text-base">
              Shipment ID *
            </Label>
            <Input
              id="shipment_id"
              placeholder="10 digit angka"
              maxLength={10}
              value={formData.shipment_id}
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '')
                handleInputChange('shipment_id', value)
              }}
              className="h-10 md:h-11 text-sm md:text-base"
            />
          </div>

          {/* 🏪 JUMLAH TOKO */}
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="jumlah_toko" className="text-sm md:text-base">
              Jumlah Toko *
            </Label>
            <Input
              id="jumlah_toko"
              type="number"
              min="0"
              placeholder="0"
              value={formData.jumlah_toko}
              onChange={e => handleInputChange('jumlah_toko', e.target.value)}
              className="h-10 md:h-11 text-sm md:text-base"
            />
          </div>

          {/* 📦 TERKIRIM */}
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="terkirim" className="text-sm md:text-base">
              Terkirim *
            </Label>
            <Input
              id="terkirim"
              type="number"
              min="0"
              max={formData.jumlah_toko}
              placeholder="0"
              value={formData.terkirim}
              onChange={e => handleInputChange('terkirim', e.target.value)}
              className="h-10 md:h-11 text-sm md:text-base"
            />
          </div>

          {/* ❌ GAGAL */}
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="gagal" className="text-sm md:text-base">
              Gagal
            </Label>
            <Input
              id="gagal"
              type="number"
              readOnly
              value={calculateGagal()}
              className="h-10 md:h-11 text-sm md:text-base bg-gray-50"
            />
          </div>

          {/* 📝 ALASAN (FULL WIDTH) */}
          <div className="md:col-span-2 space-y-1 md:space-y-2">
            <Label htmlFor="alasan" className="text-sm md:text-base">
              Alasan {calculateGagal() > 0 && '*'}
            </Label>
            <Input
              id="alasan"
              placeholder="Opsional jika tidak ada pengiriman gagal"
              value={formData.alasan}
              onChange={e => handleInputChange('alasan', e.target.value)}
              required={calculateGagal() > 0}
              className="h-10 md:h-11 text-sm md:text-base"
            />
          </div>
        </div>

        {/* 📱 FOOTER BUTTONS RESPONSIVE */}
        <div className="
          flex 
          flex-col-reverse 
          md:flex-row 
          justify-end 
          gap-3 
          pt-6 
          border-t
          mt-4
        ">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="
              h-11 md:h-10
              text-sm md:text-base
              w-full md:w-auto
              order-2 md:order-1
            "
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="
              bg-blue-600 hover:bg-blue-700
              h-11 md:h-10
              text-sm md:text-base
              w-full md:w-auto
              order-1 md:order-2
            "
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}