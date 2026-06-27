'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface UserResponse {
  id: number
  username: string
  email: string
}

interface SplitResponse {
  id: number
  expenseId: number
  amount: number
  isSettled: boolean
}

interface ExpenseResponse {
  id: number
  description: string
  amount: number
  currency: string
  date: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [splits, setSplits] = useState<SplitResponse[]>([])
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([])
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
        const [userRes, splitsRes, expensesRes] = await Promise.allSettled([
          api.get('/api/users/me'),
          api.get(`/api/splits/user/${userId}/unsettled`),
          api.get(`/api/expenses/user/${userId}`),
        ])

        if (userRes.status === 'fulfilled') setUser(userRes.value.data)
        if (splitsRes.status === 'fulfilled') setSplits(splitsRes.value.data)
        if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value.data)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    router.push('/')
  }

  const totalDebt = splits.reduce((acc, s) => acc + Number(s.amount), 0)
  const totalPaid = expenses.reduce((acc, e) => acc + Number(e.amount), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          Hola, <span className="text-accent-orange">{user?.username ?? 'Usuario'}</span> 👋
        </h1>
        <div
          onClick={handleLogout}
          className="text-sm text-white/50 hover:text-white cursor-pointer transition-colors"
        >
          Cerrar sesión
        </div>
      </div>

      {/* Balance */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Tu balance</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="card-glass p-4 flex flex-col gap-1">
            <p className="text-white/50 text-xs">Debés</p>
            <p className="text-red-400 text-2xl font-bold">${totalDebt.toFixed(2)}</p>
          </div>
          <div className="card-glass p-4 flex flex-col gap-1">
            <p className="text-white/50 text-xs">Pagaste</p>
            <p className="text-green-500 text-2xl font-bold">${totalPaid.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Deudas pendientes */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Deudas pendientes</p>
        {splits.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">¡Estás al día! 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {splits.map((split) => (
              <div key={split.id} className="card-glass px-4 py-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-white text-sm">Gasto sin nombre</p>
                  <span className="text-xs mt-1 inline-block bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full w-fit">
                    Pendiente
                  </span>
                </div>
                <p className="text-red-400 font-semibold">${Number(split.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gastos pagados */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Gastos que pagaste</p>
        {expenses.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">Todavía no registraste gastos</p>
        ) : (
          <div className="flex flex-col gap-2">
            {expenses.map((expense) => (
              <div key={expense.id} className="card-glass px-4 py-3 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="text-white text-sm">{expense.description}</p>
                  <p className="text-white/40 text-xs">
                    {new Date(expense.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <p className="text-accent-orange font-semibold">${Number(expense.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
