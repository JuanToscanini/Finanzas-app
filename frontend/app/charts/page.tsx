'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface ExpenseResponse {
  id: number
  description: string
  amount: number
  currency: string
  categoryId: number | null
  date: string
}

interface SplitResponse {
  id: number
  expenseId: number
  expenseDescription: string | null
  paidByUserId: number | null
  amount: number
  isSettled: boolean
}

interface CategoryResponse {
  id: number
  name: string
  icon: string | null
}

interface CategoryGroup {
  categoryId: number | null
  name: string
  total: number
}

interface MonthGroup {
  key: string
  label: string
  total: number
}

export default function ChartsPage() {
  const router = useRouter()

  const [expenses, setExpenses] = useState<ExpenseResponse[]>([])
  const [unsettledSplits, setUnsettledSplits] = useState<SplitResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const userId = localStorage.getItem('userId')

    const fetchAll = async () => {
      try {
        const [expensesRes, unsettledRes, categoriesRes] = await Promise.allSettled([
          api.get<ExpenseResponse[]>(`/api/expenses/user/${userId}`),
          api.get<SplitResponse[]>(`/api/splits/user/${userId}/unsettled`),
          api.get<CategoryResponse[]>('/api/categories'),
        ])

        if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value.data)
        if (unsettledRes.status === 'fulfilled') setUnsettledSplits(unsettledRes.value.data)
        if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [router])

  const categoryName = (categoryId: number | null): string => {
    if (!categoryId) return 'Sin categoría'
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : 'Sin categoría'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">Cargando estadísticas...</p>
      </div>
    )
  }

  const totalGastado = expenses.reduce((acc, e) => acc + Number(e.amount), 0)
  const deudaPendiente = unsettledSplits.reduce((acc, s) => acc + Number(s.amount), 0)

  const categoryGroups: CategoryGroup[] = Object.values(
    expenses.reduce((acc, e) => {
      const key = e.categoryId ?? 'none'
      if (!acc[key]) {
        acc[key] = { categoryId: e.categoryId, name: categoryName(e.categoryId), total: 0 }
      }
      acc[key].total += Number(e.amount)
      return acc
    }, {} as Record<string | number, CategoryGroup>)
  ).sort((a, b) => b.total - a.total)

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const monthGroups: MonthGroup[] = Object.values(
    expenses.reduce((acc, e) => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!acc[key]) {
        const label = d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
        acc[key] = { key, label, total: 0 }
      }
      acc[key].total += Number(e.amount)
      return acc
    }, {} as Record<string, MonthGroup>)
  ).sort((a, b) => a.key.localeCompare(b.key))

  const maxCategoryTotal = categoryGroups.length > 0 ? categoryGroups[0].total : 0
  const maxMonthTotal = monthGroups.length > 0 ? Math.max(...monthGroups.map((m) => m.total)) : 0

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="absolute left-0 text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Volver
        </button>
        <h1 className="text-xl font-semibold text-white">Estadísticas</h1>
      </div>

      {expenses.length === 0 ? (
        <p className="text-white/50 text-sm text-center py-12">
          Todavía no tenés gastos registrados 📊
        </p>
      ) : (
        <>
          {/* Resumen general */}
          <div className="flex flex-col gap-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">Resumen general</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="card-glass p-4 flex flex-col gap-1">
                <p className="text-white/40 text-xs">Total gastado</p>
                <p className="text-accent-orange text-lg font-semibold">
                  ${totalGastado.toFixed(2)}
                </p>
              </div>
              <div className="card-glass p-4 flex flex-col gap-1">
                <p className="text-white/40 text-xs">Deuda pendiente</p>
                <p className="text-red-400 text-lg font-semibold">
                  ${deudaPendiente.toFixed(2)}
                </p>
              </div>
              <div className="card-glass p-4 flex flex-col gap-1">
                <p className="text-white/40 text-xs">Gastos registrados</p>
                <p className="text-accent-blue text-lg font-semibold">{expenses.length}</p>
              </div>
            </div>
          </div>

          {/* Gastos por categoría */}
          <div className="flex flex-col gap-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">Gastos por categoría</p>
            <div className="card-glass-strong p-5 flex flex-col gap-4">
              {categoryGroups.map((group) => {
                const pct = maxCategoryTotal > 0 ? (group.total / totalGastado) * 100 : 0
                return (
                  <div key={group.categoryId ?? 'none'} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">{group.name}</span>
                      <span className="text-white/60">${group.total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-orange rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-white/40 text-xs w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Últimos 5 gastos */}
          <div className="flex flex-col gap-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">Últimos 5 gastos</p>
            <div className="flex flex-col gap-2">
              {recentExpenses.map((e) => (
                <div key={e.id} className="card-glass px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <p className="text-white text-sm font-medium">{e.description}</p>
                    <p className="text-white/40 text-xs">
                      {new Date(e.date).toLocaleDateString('es-AR')} · {categoryName(e.categoryId)}
                    </p>
                  </div>
                  <p className="text-accent-orange text-sm font-semibold shrink-0">
                    ${Number(e.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Evolución mensual */}
          <div className="flex flex-col gap-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">Evolución mensual</p>
            <div className="card-glass-strong p-5 flex flex-col gap-4">
              {monthGroups.map((month) => {
                const pct = maxMonthTotal > 0 ? (month.total / maxMonthTotal) * 100 : 0
                return (
                  <div key={month.key} className="flex items-center gap-3">
                    <span className="text-white/60 text-xs w-16 shrink-0 capitalize">{month.label}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-orange rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white/60 text-xs w-20 text-right shrink-0">
                      ${month.total.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
