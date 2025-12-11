"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import { Shipment } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { format, isSunday } from 'date-fns'
import { id } from 'date-fns/locale'

interface ShipmentTableProps {
  shipments: Shipment[]
  userRole: 'admin' | 'regular'
  onRefresh: () => void
  isLoading: boolean
}

export default function ShipmentTable({ shipments, userRole, onRefresh, isLoading }: ShipmentTableProps) {
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<keyof Shipment>('tanggal')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const rowsPerPage = 15

  const sortedShipments = [...shipments].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    if (sortField === 'tanggal') {
      aValue = new Date(a.tanggal).getTime()
      bValue = new Date(b.tanggal).getTime()
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const totalPages = Math.ceil(sortedShipments.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedShipments = sortedShipments.slice(startIndex, startIndex + rowsPerPage)

  const handleSort = (field: keyof Shipment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return

    try {
      const response = await fetch(`/api/shipments/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Data shipment berhasil dihapus',
        })
        onRefresh()
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM/yyyy', { locale: id })
    } catch {
      return dateString
    }
  }

  const isRowSunday = (dateString: string) => {
    try {
      return isSunday(new Date(dateString))
    } catch {
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (sortedShipments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Tidak ada data shipment
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                No.
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSort('nama_lengkap')}
                  className="font-semibold"
                >
                  Nama Lengkap
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">Nama Freelance</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSort('tanggal')}
                  className="font-semibold"
                >
                  Tanggal
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">Shipment</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSort('jumlah_toko')}
                  className="font-semibold"
                >
                  Jumlah Toko
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSort('terkirim')}
                  className="font-semibold"
                >
                  Terkirim
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSort('gagal')}
                  className="font-semibold"
                >
                  Gagal
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">Alasan</TableHead>
              <TableHead className="w-32 font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedShipments.map((shipment, index) => (
              <TableRow
                key={shipment.id}
                className={isRowSunday(shipment.tanggal) ? 'sunday-row' : ''}
              >
                <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                <TableCell className="font-medium">{shipment.nama_lengkap}</TableCell>
                <TableCell>{shipment.nama_freelance || '-'}</TableCell>
                <TableCell>{formatDate(shipment.tanggal)}</TableCell>
                <TableCell className="font-mono">{shipment.shipment_id}</TableCell>
                <TableCell>{shipment.jumlah_toko}</TableCell>
                <TableCell className="text-green-600 font-semibold">{shipment.terkirim}</TableCell>
                <TableCell className={shipment.gagal > 0 ? 'text-red-600 font-semibold' : ''}>
                  {shipment.gagal}
                </TableCell>
                <TableCell className="max-w-xs truncate">{shipment.alasan || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        toast({
                          title: "Info",
                          description: "Fitur edit akan segera tersedia",
                        })
                      }}
                      title="Edit"
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(shipment.id)}
                      title="Hapus"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1} - {Math.min(startIndex + rowsPerPage, sortedShipments.length)} dari {sortedShipments.length} data
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(pageNum)}
                  className="h-8 w-8"
                >
                  {pageNum}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}