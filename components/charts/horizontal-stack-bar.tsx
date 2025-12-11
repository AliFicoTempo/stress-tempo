"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartData } from '@/types'

interface HorizontalStackBarProps {
  data: ChartData[]
}

export default function HorizontalStackBar({ data }: HorizontalStackBarProps) {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    Terkirim: item.terkirim,
    Gagal: item.gagal,
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar 
          dataKey="Terkirim" 
          stackId="a" 
          fill="#10b981"
          name="Terkirim"
          radius={[0, 0, 4, 4]}
        />
        <Bar 
          dataKey="Gagal" 
          stackId="a" 
          fill="#ef4444"
          name="Gagal"
          radius={[0, 0, 4, 4]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}