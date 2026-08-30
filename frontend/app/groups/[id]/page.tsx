'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'

interface UserResponse {
  id: number
  username: string
  email: string
}

interface GroupResponse {
  id: number
  name: string
  members: UserResponse[]
}

interface UserBalanceResponse {
  userId: number
  username: string
  netBalance: number
}

interface SettlementSuggestionResponse {
  fromUserId: number
  fromUsername: string
  toUserId: number
  toUsername: string
  amount: number
}

interface GroupBalanceResponse {
  groupId: number
  balances: UserBalanceResponse[]
  suggestedSettlements: SettlementSuggestionResponse[]
}

type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED'

interface SettlementResponse {
  id: number
  groupId: number
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

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const groupId = Number(id)
  const router = useRouter()

  const currentUserId = Number(typeof window !== 'undefined' ? localStorage.getItem('userId') : NaN)
  const [group, setGroup] = useState<GroupResponse | null>(null)
  const [balances, setBalances] = useState<UserBalanceResponse[]>([])
  const [suggestions, setSuggestions] = useState<SettlementSuggestionResponse[]>([])
  const [settlements, setSettlements] = useState<SettlementResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [paidToId, setPaidToId] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [actioningId, setActioningId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchAll = async () => {
    try {
      const [groupsRes, balanceRes, settlementsRes] = await Promise.allSettled([
        api.get<GroupResponse[]>('/api/groups'),
        api.get<GroupBalanceResponse>(`/api/groups/${groupId}/balance`),
        api.get<SettlementResponse[]>(`/api/settlements/group/${groupId}`),
      ])

      if (groupsRes.status === 'fulfilled') {
        const found = groupsRes.value.data.find((g) => g.id === groupId) ?? null
        setGroup(found)
        if (!found) setNotFound(true)
      }
      if (balanceRes.status === 'fulfilled') {
        setBalances(balanceRes.value.data.balances)
        setSuggestions(balanceRes.value.data.suggestedSettlements)
      }
      if (settlementsRes.status === 'fulfilled') {
        setSettlements(settlementsRes.value.data)
      }
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

    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, groupId])

  const otherMembers = (group?.members ?? []).filter((m) => m.id !== currentUserId)

  const prefillFromSuggestion = (s: SettlementSuggestionResponse) => {
    setPaidToId(s.toUserId)
    setAmount(String(s.amount))
    setErrorMsg('')
  }

  const handleSubmit = async () => {
    if (!paidToId) {
      setErrorMsg('Elegí a quién le pagás')
      return
    }
    if (paidToId === currentUserId) {
      setErrorMsg('No podés registrar un pago a vos mismo')
      return
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('El monto debe ser mayor a cero')
      return
    }

    setErrorMsg('')
    setSubmitting(true)

    try {
      await api.post('/api/settlements', {
        groupId,
        paidToId,
        amount: Number(amount),
        notes: notes.trim() || undefined,
      })
      setPaidToId('')
      setAmount('')
      setNotes('')
      await fetchAll()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMsg(message ?? 'No se pudo registrar el pago. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async (settlementId: number) => {
    setActionError('')
    setActioningId(settlementId)
    try {
      await api.put(`/api/settlements/${settlementId}/confirm`)
      await fetchAll()
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
      await fetchAll()
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

  if (notFound) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
        <Navbar />
        <div className="card-glass p-6 text-center text-white/50 text-sm">
          No encontramos este grupo o no sos miembro de él.
          <div className="mt-4">
            <Link href="/groups" className="text-accent-blue hover:underline">
              Volver a mis grupos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mySuggestions = suggestions.filter((s) => s.fromUserId === currentUserId)

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <Navbar />

      <div className="flex items-center gap-2">
        <Link href="/groups" className="text-white/40 hover:text-white text-sm transition-colors">
          ‹ Mis grupos
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-white">{group?.name}</h1>

      {/* Balances */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Balances</p>
        <div className="flex flex-col gap-2">
          {balances.map((b) => (
            <div key={b.userId} className="card-glass px-4 py-3 flex items-center justify-between">
              <p className="text-white text-sm">
                {b.userId === currentUserId ? 'Vos' : b.username}
              </p>
              <p
                className={`font-semibold text-sm ${
                  b.netBalance > 0 ? 'text-emerald-400' : b.netBalance < 0 ? 'text-red-400' : 'text-white/50'
                }`}
              >
                {b.netBalance > 0 ? '+' : ''}${Number(b.netBalance).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sugerencias para saldar */}
      {mySuggestions.length > 0 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Sugerencias para saldar</p>
          <div className="flex flex-col gap-2">
            {mySuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => prefillFromSuggestion(s)}
                className="card-glass px-4 py-3 flex items-center justify-between hover:border-accent-orange/40 transition-colors text-left"
              >
                <span className="text-white text-sm">
                  Pagar a <strong>{s.toUsername}</strong>
                </span>
                <span className="text-accent-orange font-semibold text-sm">
                  ${Number(s.amount).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulario para registrar un pago */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Registrar un pago</p>
        <form
          className="card-glass-strong p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!submitting) handleSubmit()
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="paid-to" className="text-white/40 text-xs uppercase tracking-widest">
              Pagarle a
            </label>
            <select
              id="paid-to"
              value={paidToId}
              onChange={(e) => setPaidToId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
            >
              <option value="" className="bg-[#1E3A5F]">Elegí un miembro</option>
              {otherMembers.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#1E3A5F]">{m.username}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="settlement-amount" className="text-white/40 text-xs uppercase tracking-widest">
              Monto
            </label>
            <input
              id="settlement-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="settlement-notes" className="text-white/40 text-xs uppercase tracking-widest">
              Notas (opcional)
            </label>
            <input
              id="settlement-notes"
              type="text"
              placeholder="Ej: Transferencia Mercado Pago"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={submitting || otherMembers.length === 0}
              className={`w-full bg-accent-orange text-white text-sm font-semibold rounded-xl px-4 py-3 text-center transition-colors ${
                submitting || otherMembers.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-accent-orange-light cursor-pointer'
              }`}
            >
              {submitting ? 'Registrando...' : 'Registrar pago'}
            </button>
            {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
          </div>
        </form>
      </div>

      {/* Historial de pagos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/40 text-xs uppercase tracking-widest">Historial de pagos</p>
          <Link href="/settlements" className="text-accent-blue hover:underline text-xs">
            Ver todos mis pagos
          </Link>
        </div>
        {actionError && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
        {settlements.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">Todavía no hay pagos registrados en este grupo</p>
        ) : (
          <div className="flex flex-col gap-2">
            {settlements.map((s) => (
              <div key={s.id} className="card-glass px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white text-sm">
                    {s.paidBy.username} → {s.paidTo.username}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyles[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white/40 text-xs">
                    {new Date(s.createdAt).toLocaleDateString('es-AR')}
                    {s.notes ? ` • ${s.notes}` : ''}
                  </p>
                  <p className="text-accent-orange font-semibold text-sm">
                    ${Number(s.amount).toFixed(2)} {s.currency}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
