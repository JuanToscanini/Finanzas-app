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

interface FriendshipResponse {
  id: number
  requester: UserResponse
  addressee: UserResponse
  status: string
}

interface GroupResponse {
  id: number
  name: string
  members: UserResponse[]
}

export default function NewSettlementPage() {
  const router = useRouter()
  const currentUserId = Number(typeof window !== 'undefined' ? localStorage.getItem('userId') : NaN)

  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [friends, setFriends] = useState<UserResponse[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [groupId, setGroupId] = useState<number | ''>('')
  const [paidToId, setPaidToId] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('UYU')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const fetchData = async () => {
      try {
        const [groupsRes, friendsRes] = await Promise.allSettled([
          api.get<GroupResponse[]>('/api/groups'),
          api.get<FriendshipResponse[]>('/api/friendships/friends'),
        ])

        if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value.data)
        if (friendsRes.status === 'fulfilled') {
          const accepted = friendsRes.value.data
            .filter((f) => f.status === 'ACCEPTED')
            .map((f) => (f.requester.id === currentUserId ? f.addressee : f.requester))
          setFriends(accepted)
        }
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const selectedGroup = groups.find((g) => g.id === groupId) ?? null
  const friendIds = new Set(friends.map((f) => f.id))
  const recipients = selectedGroup
    ? selectedGroup.members.filter((m) => m.id !== currentUserId && friendIds.has(m.id))
    : []

  const handleGroupChange = (value: string) => {
    setGroupId(value ? Number(value) : '')
    setPaidToId('')
    setErrorMsg('')
  }

  const handleSubmit = async () => {
    if (!groupId) {
      setErrorMsg('Elegí un grupo')
      return
    }
    if (!paidToId) {
      setErrorMsg('Elegí a quién le pagás')
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
        currency,
        notes: notes.trim() || undefined,
      })
      router.push('/settlements')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMsg(message ?? 'No se pudo registrar el pago. Intentá de nuevo.')
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <Navbar />

      <div className="flex items-center gap-2">
        <Link href="/settlements" className="text-white/40 hover:text-white text-sm transition-colors">
          ‹ Mis pagos
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-white">Registrar un pago</h1>

      {groups.length === 0 ? (
        <div className="card-glass p-6 flex flex-col items-center gap-3 text-center">
          <p className="text-white/50 text-sm">
            Necesitás pertenecer a un grupo para registrar un pago.
          </p>
          <Link
            href="/groups/new"
            className="bg-accent-orange text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-accent-orange-light transition-colors"
          >
            Crear un grupo
          </Link>
        </div>
      ) : (
        <form
          className="card-glass-strong p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!submitting) handleSubmit()
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="settlement-group" className="text-white/40 text-xs uppercase tracking-widest">
              Grupo
            </label>
            <select
              id="settlement-group"
              value={groupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
            >
              <option value="" className="bg-[#1E3A5F]">Elegí un grupo</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#1E3A5F]">{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="paid-to" className="text-white/40 text-xs uppercase tracking-widest">
              Pagarle a
            </label>
            <select
              id="paid-to"
              value={paidToId}
              onChange={(e) => setPaidToId(e.target.value ? Number(e.target.value) : '')}
              disabled={!selectedGroup}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-[#1E3A5F]">
                {selectedGroup ? 'Elegí un amigo' : 'Elegí primero un grupo'}
              </option>
              {recipients.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#1E3A5F]">{m.username}</option>
              ))}
            </select>
            {selectedGroup && recipients.length === 0 && (
              <p className="text-white/40 text-xs">
                No tenés amigos en común con los miembros de este grupo.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-2 flex-1">
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
              <label htmlFor="settlement-currency" className="text-white/40 text-xs uppercase tracking-widest">
                Moneda
              </label>
              <select
                id="settlement-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-28 bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
              >
                <option value="UYU" className="bg-[#1E3A5F]">UYU</option>
                <option value="USD" className="bg-[#1E3A5F]">USD</option>
                <option value="EUR" className="bg-[#1E3A5F]">EUR</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="settlement-notes" className="text-white/40 text-xs uppercase tracking-widest">
              Notas (opcional)
            </label>
            <textarea
              id="settlement-notes"
              placeholder="Ej: Transferencia Mercado Pago"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full bg-accent-orange text-white text-sm font-semibold rounded-xl px-4 py-3 text-center transition-colors ${
                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent-orange-light cursor-pointer'
              }`}
            >
              {submitting ? 'Registrando...' : 'Registrar pago'}
            </button>
            {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
          </div>
        </form>
      )}
    </div>
  )
}
