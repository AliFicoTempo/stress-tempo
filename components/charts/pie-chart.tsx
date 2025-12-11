"use client"

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartData } from '@/types'

interface PieChartProps {
  data: ChartData[]
}

export default function PieChart({ data }: PieChartProps) {
  const totalTerkirim = data.reduce((sum, item) => sum + item.terkirim, 0)
  const totalGagal = data.reduce((sum, item) => sum + item.gagal, 0)

  const pieData = [
    { name: 'Terkirim', value: totalTerkirim },
    { name: 'Gagal', value: totalGagal },
  ]

  const COLORS = ['#10b981', '#ef4444']

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsPieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [value, 'Jumlah']}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}