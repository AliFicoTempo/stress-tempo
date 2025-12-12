"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChartData } from '@/types'

interface HorizontalStackBarProps {
  data: ChartData[]
  onBarClick?: (date: string, type: 'terkirim' | 'gagal') => void
  onDateClick?: (date: string) => void
  activeFilter?: { date?: string; type?: string }
}

export default function HorizontalStackBar({ 
  data, 
  onBarClick, 
  onDateClick,
  activeFilter 
}: HorizontalStackBarProps) {
  const chartData = data.map(item => ({
    date: item.date,
    Terkirim: item.terkirim,
    Gagal: item.gagal,
    total: item.terkirim + item.gagal,
    isFiltered: item.isFiltered || false,
    filteredByType: item.filteredByType || null
  }))

  const handleBarClick = (data: any, index: number, type: 'Terkirim' | 'Gagal') => {
    if (onBarClick) {
      const date = data.date
      const metricType = type.toLowerCase() as 'terkirim' | 'gagal'
      onBarClick(date, metricType)
    }
  }

  const handleBarSectionClick = (data: any) => {
    if (onDateClick) {
      onDateClick(data.date)
    }
  }

  const isBarActive = (date: string, type: string) => {
    return activeFilter?.date === date && activeFilter?.type === type.toLowerCase()
  }

  const isDateFiltered = (date: string) => {
    return data.find(item => item.date === date && item.isFiltered)
  }

  const getFilterTypeForDate = (date: string) => {
    const item = data.find(item => item.date === date)
    return item?.filteredByType || null
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = label
      const filtered = isDateFiltered(date)
      const filterType = getFilterTypeForDate(date)
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">Tanggal: {date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
          {filtered && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-blue-600 font-medium">
                ⚡ Filter aktif: {filterType || 'tanggal'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Klik lagi untuk menghapus filter
              </p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}/${date.getMonth() + 1}`
            }}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Background bar untuk klik tanggal */}
          <Bar 
            dataKey="total"
            fill="transparent"
            cursor="pointer"
            onClick={handleBarSectionClick}
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`background-${index}`}
                fill="transparent"
                stroke={isDateFiltered(entry.date) ? "#3b82f6" : "transparent"}
                strokeWidth={isDateFiltered(entry.date) ? 2 : 0}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Bar>
          
          {/* Bar Terkirim */}
          <Bar 
            dataKey="Terkirim" 
            stackId="a" 
            fill="#10b981"
            cursor="pointer"
            onClick={(data, index) => handleBarClick(data, index, 'Terkirim')}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`terkirim-${index}`}
                fill={
                  isBarActive(entry.date, 'terkirim') ? "#059669" : 
                  isDateFiltered(entry.date) && getFilterTypeForDate(entry.date) === 'terkirim' ? "#059669" :
                  "#10b981"
                }
                style={{ 
                  cursor: 'pointer',
                  opacity: isBarActive(entry.date, 'terkirim') || 
                          (isDateFiltered(entry.date) && getFilterTypeForDate(entry.date) === 'terkirim') ? 
                          1 : 0.8
                }}
              />
            ))}
          </Bar>
          
          {/* Bar Gagal */}
          <Bar 
            dataKey="Gagal" 
            stackId="a" 
            fill="#ef4444"
            cursor="pointer"
            onClick={(data, index) => handleBarClick(data, index, 'Gagal')}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`gagal-${index}`}
                fill={
                  isBarActive(entry.date, 'gagal') ? "#dc2626" : 
                  isDateFiltered(entry.date) && getFilterTypeForDate(entry.date) === 'gagal' ? "#dc2626" :
                  "#ef4444"
                }
                style={{ 
                  cursor: 'pointer',
                  opacity: isBarActive(entry.date, 'gagal') || 
                          (isDateFiltered(entry.date) && getFilterTypeForDate(entry.date) === 'gagal') ? 
                          1 : 0.8
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {activeFilter?.date && (
        <div className="absolute top-0 right-0 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm border border-blue-200 flex items-center gap-2">
          <span className="text-blue-500">⚡</span>
          Filter: {activeFilter.date} 
          {activeFilter.type && (
            <span className="bg-blue-100 px-2 py-0.5 rounded text-xs">
              {activeFilter.type}
            </span>
          )}
        </div>
      )}
    </div>
  )
}