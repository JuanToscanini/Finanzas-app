'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM'

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

interface CategoryResponse {
  id: number
  name: string
  icon: string | null
}

export default function NewExpensePage() {
  const router = useRouter()

  const [friends, setFriends] = useState<UserResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('UYU')
  const [splitType, setSplitType] = useState<SplitType>('EQUAL')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [groupId, setGroupId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [participantIds, setParticipantIds] = useState<number[]>([])
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const currentUserId = Number(localStorage.getItem('userId'))

    const fetchOptions = async () => {
      try {
        const [friendsRes, categoriesRes] = await Promise.allSettled([
          api.get<FriendshipResponse[]>('/api/friendships/friends'),
          api.get<CategoryResponse[]>('/api/categories'),
        ])

        if (friendsRes.status === 'fulfilled') {
          const accepted = friendsRes.value.data
            .filter((f) => f.status === 'ACCEPTED')
            .map((f) => (f.requester.id === currentUserId ? f.addressee : f.requester))
          setFriends(accepted)
        }
        if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [router])

  const toggleParticipant = (userId: number) => {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const validate = (): string | null => {
    if (!description.trim()) return 'Falta la descripción'
    if (!amount || Number(amount) <= 0) return 'El monto debe ser mayor a cero'
    if (participantIds.length === 0) return 'Elegí al menos un participante'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setErrorMsg(validationError)
      return
    }

    setErrorMsg('')
    setSubmitting(true)

    try {
      await api.post('/api/expenses', {
        description,
        amount: parseFloat(amount),
        currency,
        splitType,
        date,
        categoryId: categoryId || undefined,
        participantIds,
        notes: notes || undefined,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMsg(message ?? 'No se pudo registrar el gasto. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingOptions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm">Cargando...</p>
      </div>
    )
  }

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
        <h1 className="text-xl font-semibold text-white">Nuevo gasto</h1>
      </div>

      <form
        className="card-glass-strong p-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!submitting) handleSubmit()
        }}
      >
        {/* Descripción */}
        <input
          type="text"
          placeholder="Ej: Cena del viernes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
        />

        {/* Monto + moneda */}
        <div className="flex gap-3">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-28 bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
          >
            <option value="UYU" className="bg-[#1E3A5F]">UYU</option>
            <option value="USD" className="bg-[#1E3A5F]">USD</option>
            <option value="EUR" className="bg-[#1E3A5F]">EUR</option>
          </select>
        </div>

        {/* Categoría */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
        >
          <option value="" className="bg-[#1E3A5F]">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#1E3A5F]">
              {c.icon ? `${c.icon} ` : ''}{c.name}
            </option>
          ))}
        </select>

        {/* Cómo dividir */}
        <select
          value={splitType}
          onChange={(e) => setSplitType(e.target.value as SplitType)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
        >
          <option value="EQUAL" className="bg-[#1E3A5F]">En partes iguales</option>
          <option value="PERCENTAGE" className="bg-[#1E3A5F]">Por porcentaje</option>
          <option value="CUSTOM" className="bg-[#1E3A5F]">Personalizado</option>
        </select>

        {/* Participantes */}
        <div className="flex flex-col gap-2">
          <p className="text-white/40 text-xs uppercase tracking-widest">Participantes</p>
          {friends.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">No tenés amigos agregados aún</p>
          ) : (
            <div className="flex flex-col gap-2">
              {friends.map((friend) => (
                <label
                  key={friend.id}
                  className="card-glass px-4 py-3 flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={participantIds.includes(friend.id)}
                    onChange={() => toggleParticipant(friend.id)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span className="text-white text-sm">{friend.username}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        <textarea
          placeholder="Notas adicionales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors resize-none"
        />

        {/* Fecha */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
        />

        {/* Submit */}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full bg-accent-orange text-white text-sm font-semibold rounded-xl px-4 py-3 text-center transition-colors ${
              submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent-orange-light cursor-pointer'
            }`}
          >
            {submitting ? 'Registrando...' : 'Registrar gasto'}
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        </div>
      </form>
    </div>
  )
}
