"use client"

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartData } from '@/types'

interface PieChartProps {
  data: ChartData[]
  onSliceClick?: (type: 'terkirim' | 'gagal') => void
  activeFilter?: { date?: string; type?: string }
}

export default function PieChart({ data, onSliceClick, activeFilter }: PieChartProps) {
  // Calculate totals
  const totalTerkirim = data.reduce((sum, item) => sum + item.terkirim, 0)
  const totalGagal = data.reduce((sum, item) => sum + item.gagal, 0)

  const pieData = [
    { name: 'Terkirim', value: totalTerkirim, color: '#10b981' },
    { name: 'Gagal', value: totalGagal, color: '#ef4444' }
  ]

  const handlePieClick = (data: any) => {
    if (onSliceClick && data && data.name) {
      const type = data.name.toLowerCase() as 'terkirim' | 'gagal'
      onSliceClick(type)
    }
  }

  const isSliceActive = (name: string) => {
    return activeFilter?.type === name.toLowerCase()
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          cursor="pointer"
          onClick={handlePieClick}
        >
          {pieData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={isSliceActive(entry.name) ? 
                (entry.name === 'Terkirim' ? "#059669" : "#dc2626") : 
                entry.color
              }
              style={{ 
                cursor: 'pointer',
                opacity: isSliceActive(entry.name) ? 1 : 0.8
              }}
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value}`, 'Jumlah']}
          contentStyle={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}