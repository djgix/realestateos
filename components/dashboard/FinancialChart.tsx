'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export interface ChartDataPoint {
  month: string
  income: number
  expenses: number
}

export function FinancialChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.07)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(val) => val === 0 ? '$0' : `$${val / 1000}k`}
            dx={-10}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Area type="monotone" dataKey="income" name="Income" stroke="#4f6ef7" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
          <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
