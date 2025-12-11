"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChartData } from '@/types'

interface HorizontalStackBarProps {
  data: ChartData[]
  onBarClick?: (date: string, type: 'terkirim' | 'gagal') => void
  activeFilter?: { date?: string; type?: string }
}

export default function HorizontalStackBar({ data, onBarClick, activeFilter }: HorizontalStackBarProps) {
  // Format data untuk stacked bar chart
  const chartData = data.map(item => ({
    date: item.date,
    Terkirim: item.terkirim,
    Gagal: item.gagal,
    total: item.terkirim + item.gagal
  }))

  const handleBarClick = (data: any, index: number, type: 'Terkirim' | 'Gagal') => {
    if (onBarClick) {
      const date = data.date
      const metricType = type.toLowerCase() as 'terkirim' | 'gagal'
      onBarClick(date, metricType)
    }
  }

  // Check if a bar is active
  const isBarActive = (date: string, type: string) => {
    return activeFilter?.date === date && activeFilter?.type === type.toLowerCase()
  }

  return (
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
        <Tooltip
          formatter={(value, name) => [`${value}`, name]}
          labelFormatter={(label) => `Tanggal: ${label}`}
          contentStyle={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Bar 
          dataKey="Terkirim" 
          stackId="a" 
          fill="#10b981"
          cursor="pointer"
          onClick={handleBarClick}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`terkirim-${index}`}
              fill={isBarActive(entry.date, 'terkirim') ? "#059669" : "#10b981"}
              style={{ 
                cursor: 'pointer',
                opacity: isBarActive(entry.date, 'terkirim') ? 1 : 0.8
              }}
            />
          ))}
        </Bar>
        <Bar 
          dataKey="Gagal" 
          stackId="a" 
          fill="#ef4444"
          cursor="pointer"
          onClick={handleBarClick}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`gagal-${index}`}
              fill={isBarActive(entry.date, 'gagal') ? "#dc2626" : "#ef4444"}
              style={{ 
                cursor: 'pointer',
                opacity: isBarActive(entry.date, 'gagal') ? 1 : 0.8
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}