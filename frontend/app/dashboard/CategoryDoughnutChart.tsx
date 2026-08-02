'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

// Paleta categórica validada (CVD + contraste) contra el fondo oscuro de la app.
// Se usa como fallback para categorías sin color propio.
const FALLBACK_PALETTE = [
  '#3987e5', // azul
  '#d95926', // naranja
  '#199e70', // aqua
  '#c98500', // amarillo
  '#d55181', // magenta
  '#008300', // verde
  '#9085e9', // violeta
  '#e66767', // rojo
]

const MAX_SLICES = 7

export interface CategoryStat {
  categoryId: number | null
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  total: number
}

function isValidHex(color: string | null): color is string {
  return !!color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
}

export default function CategoryDoughnutChart({ stats }: { stats: CategoryStat[] }) {
  const sorted = [...stats].sort((a, b) => b.total - a.total)
  const visible = sorted.slice(0, MAX_SLICES)
  const rest = sorted.slice(MAX_SLICES)

  const slices =
    rest.length > 0
      ? [
          ...visible,
          {
            categoryId: null,
            categoryName: 'Otras categorías',
            categoryIcon: null,
            categoryColor: null,
            total: rest.reduce((acc, s) => acc + s.total, 0),
          },
        ]
      : visible

  const total = slices.reduce((acc, s) => acc + s.total, 0)

  if (slices.length === 0 || total === 0) {
    return <p className="text-white/40 text-sm text-center py-6">Todavía no hay gastos para graficar</p>
  }

  const colors = slices.map((s, i) =>
    isValidHex(s.categoryColor) ? s.categoryColor : FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]
  )

  const data = {
    labels: slices.map((s) => (s.categoryIcon ? `${s.categoryIcon} ${s.categoryName}` : s.categoryName)),
    datasets: [
      {
        data: slices.map((s) => s.total),
        backgroundColor: colors,
        borderColor: '#0F1B2D',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255,255,255,0.7)',
          usePointStyle: true,
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) => {
            const value = ctx.raw as number
            const pct = total > 0 ? (value / total) * 100 : 0
            return ` $${value.toFixed(2)} (${pct.toFixed(1)}%)`
          },
        },
      },
    },
    cutout: '65%',
  }

  return <Doughnut data={data} options={options} />
}
