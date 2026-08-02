'use client'

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, TooltipItem } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export interface MonthlyStat {
  year: number
  month: number
  label: string // "2026-03"
  total: number
}

function formatMonthLabel(label: string): string {
  const [year, month] = label.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
}

export default function MonthlyBarChart({ stats }: { stats: MonthlyStat[] }) {
  if (stats.length === 0 || stats.every((s) => s.total === 0)) {
    return <p className="text-white/40 text-sm text-center py-6">Todavía no hay gastos para graficar</p>
  }

  const data = {
    labels: stats.map((s) => formatMonthLabel(s.label)),
    datasets: [
      {
        data: stats.map((s) => s.total),
        backgroundColor: '#FF7A45',
        hoverBackgroundColor: '#FF9466',
        borderRadius: 4,
        maxBarThickness: 32,
      },
    ],
  }

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => ` $${(ctx.raw as number).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.08)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
      },
    },
  }

  return <Bar data={data} options={options} />
}
