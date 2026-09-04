'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'

interface UserResponse {
  id: number
  username: string
  email: string
}

type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED'

interface SettlementResponse {
  id: number
  groupId: number | null
  paidBy: UserResponse
  paidTo: UserResponse
  amount: number
  currency: string
  status: SettlementStatus
  notes: string | null
  settledAt: string | null
  createdAt: string
  updatedAt: string
}

const statusStyles: Record<SettlementStatus, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const statusLabels: Record<SettlementStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
}

export default function SettlementsPage() {
  const router = useRouter()
  const currentUserId = Number(typeof window !== 'undefined' ? localStorage.getItem('userId') : NaN)
  const [settlements, setSettlements] = useState<SettlementResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [actioningId, setActioningId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchSettlements = async () => {
    try {
      const res = await api.get<SettlementResponse[]>(`/api/settlements/user/${currentUserId}`)
      setSettlements(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    fetchSettlements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleConfirm = async (settlementId: number) => {
    setActionError('')
    setActioningId(settlementId)
    try {
      await api.put(`/api/settlements/${settlementId}/confirm`)
      await fetchSettlements()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(message ?? 'No se pudo confirmar el pago.')
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (settlementId: number) => {
    setActionError('')
    setActioningId(settlementId)
    try {
      await api.put(`/api/settlements/${settlementId}/reject`)
      await fetchSettlements()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(message ?? 'No se pudo rechazar el pago.')
    } finally {
      setActioningId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <Navbar />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Mis pagos</h1>
        <Link
          href="/settlements/new"
          className="bg-accent-orange text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-accent-orange-light transition-colors"
        >
          + Registrar pago
        </Link>
      </div>

      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {settlements.length === 0 ? (
        <div className="card-glass p-6 flex flex-col items-center gap-3 text-center">
          <p className="text-white/50 text-sm">Todavía no registraste ni recibiste ningún pago.</p>
          <Link
            href="/settlements/new"
            className="bg-accent-orange text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-accent-orange-light transition-colors"
          >
            Registrar mi primer pago
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {settlements.map((s) => {
            const youPaid = s.paidBy.id === currentUserId
            return (
              <div key={s.id} className="card-glass px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white text-sm">
                    {youPaid ? (
                      <>
                        Le pagaste a <strong>{s.paidTo.username}</strong>
                      </>
                    ) : (
                      <>
                        <strong>{s.paidBy.username}</strong> te pagó
                      </>
                    )}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusStyles[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white/40 text-xs">
                    {new Date(s.createdAt).toLocaleDateString('es-AR')}
                    {s.notes ? ` • ${s.notes}` : ''}
                  </p>
                  <p className={`font-semibold text-sm ${youPaid ? 'text-red-400' : 'text-emerald-400'}`}>
                    {youPaid ? '-' : '+'}${Number(s.amount).toFixed(2)} {s.currency}
                  </p>
                </div>

                {s.status === 'PENDING' && s.paidTo.id === currentUserId && (
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirm(s.id)}
                      disabled={actioningId === s.id}
                      className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl px-3 py-2 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actioningId === s.id ? 'Procesando...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(s.id)}
                      disabled={actioningId === s.id}
                      className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl px-3 py-2 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actioningId === s.id ? 'Procesando...' : 'Rechazar'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
