'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT'

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

interface CategoryResponse {
  id: number
  name: string
  icon: string | null
}

interface ParticipantState {
  userId: number
  username: string
  included: boolean
  value: string // porcentaje o monto exacto, según splitType
}

export default function NewExpensePage() {
  const router = useRouter()

  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ARS')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [groupId, setGroupId] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [paidById, setPaidById] = useState<number | ''>(() => {
    if (typeof window === 'undefined') return ''
    return Number(localStorage.getItem('userId')) || ''
  })
  const [splitType, setSplitType] = useState<SplitType>('EQUAL')
  const [participants, setParticipants] = useState<ParticipantState[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [groupsRes, categoriesRes] = await Promise.allSettled([
          api.get('/api/groups'),
          api.get('/api/categories'),
        ])
        if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value.data)
        if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === groupId) ?? null,
    [groups, groupId]
  )

  // Al cambiar de grupo, reseteamos los participantes a todos los miembros
  const handleGroupChange = (value: string) => {
    const id = value ? Number(value) : ''
    setGroupId(id)

    const group = groups.find((g) => g.id === id) ?? null
    setParticipants(
      group
        ? group.members.map((m) => ({
            userId: m.id,
            username: m.username,
            included: true,
            value: '',
          }))
        : []
    )
  }

  const includedParticipants = participants.filter((p) => p.included)

  const percentageSum = includedParticipants.reduce(
    (acc, p) => acc + (Number(p.value) || 0),
    0
  )
  const exactSum = includedParticipants.reduce(
    (acc, p) => acc + (Number(p.value) || 0),
    0
  )

  const toggleParticipant = (userId: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, included: !p.included } : p))
    )
  }

  const updateParticipantValue = (userId: number, value: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, value } : p))
    )
  }

  const validate = (): string | null => {
    if (!description.trim()) return 'Falta la descripción'
    if (!amount || Number(amount) <= 0) return 'El monto debe ser mayor a cero'
    if (!groupId) return 'Elegí un grupo'
    if (!paidById) return 'Elegí quién pagó'
    if (includedParticipants.length === 0) return 'Elegí al menos un participante'

    if (splitType === 'PERCENTAGE' && Math.abs(percentageSum - 100) > 0.01) {
      return `Los porcentajes deben sumar 100% (actual: ${percentageSum.toFixed(2)}%)`
    }
    if (splitType === 'EXACT' && Math.abs(exactSum - Number(amount)) > 0.01) {
      return `Los montos exactos deben sumar $${Number(amount).toFixed(2)} (actual: $${exactSum.toFixed(2)})`
    }
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

    const customValues: Record<number, number> = {}
    if (splitType !== 'EQUAL') {
      for (const p of includedParticipants) {
        customValues[p.userId] = Number(p.value) || 0
      }
    }

    try {
      await api.post('/api/expenses', {
        description,
        amount: Number(amount),
        currency,
        splitType,
        groupId,
        categoryId: categoryId || null,
        date,
        paidById,
        participantIds: includedParticipants.map((p) => p.userId),
        customValues,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMsg(message ?? 'No se pudo guardar el gasto. Intentá de nuevo.')
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
      <h1 className="text-xl font-semibold text-white">Nuevo gasto</h1>

      {groups.length === 0 ? (
        <div className="card-glass p-6 text-center text-white/50 text-sm">
          Todavía no sos miembro de ningún grupo. Creá o unite a uno antes de cargar un gasto.
        </div>
      ) : (
        <div className="card-glass-strong p-6 flex flex-col gap-5">

          {/* Descripción + monto */}
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Descripción (ej: Cena)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
            />
            <div className="flex gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
              />
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                className="w-20 bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm text-center outline-none focus:border-accent-orange transition-colors"
              />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
            />
          </div>

          {/* Grupo + categoría */}
          <div className="flex flex-col gap-3">
            <select
              value={groupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
            >
              <option value="" className="bg-[#1E3A5F]">Elegí un grupo</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#1E3A5F]">{g.name}</option>
              ))}
            </select>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
            >
              <option value="" className="bg-[#1E3A5F]">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1E3A5F]">
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pagador */}
          {selectedGroup && (
            <div className="flex flex-col gap-2">
              <p className="text-white/40 text-xs uppercase tracking-widest">¿Quién pagó?</p>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent-orange transition-colors"
              >
                {selectedGroup.members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#1E3A5F]">{m.username}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de división */}
          {selectedGroup && (
            <div className="flex flex-col gap-3">
              <p className="text-white/40 text-xs uppercase tracking-widest">¿Cómo se divide?</p>
              <div className="flex gap-2">
                {(['EQUAL', 'PERCENTAGE', 'EXACT'] as SplitType[]).map((type) => (
                  <div
                    key={type}
                    onClick={() => setSplitType(type)}
                    className={`flex-1 text-center text-sm rounded-xl px-3 py-2 cursor-pointer select-none transition-colors ${
                      splitType === type
                        ? 'bg-accent-orange text-white font-semibold'
                        : 'bg-white/10 text-white/50 hover:bg-white/15'
                    }`}
                  >
                    {type === 'EQUAL' ? 'Partes iguales' : type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto exacto'}
                  </div>
                ))}
              </div>

              {/* Participantes, dinámico según splitType */}
              <div className="flex flex-col gap-2">
                {participants.map((p) => (
                  <div key={p.userId} className="card-glass px-4 py-3 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.included}
                        onChange={() => toggleParticipant(p.userId)}
                        className="accent-orange-500 w-4 h-4"
                      />
                      <span className="text-white text-sm">{p.username}</span>
                    </label>

                    {p.included && splitType === 'PERCENTAGE' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          value={p.value}
                          onChange={(e) => updateParticipantValue(p.userId, e.target.value)}
                          className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm text-right outline-none focus:border-accent-orange"
                        />
                        <span className="text-white/40 text-sm">%</span>
                      </div>
                    )}

                    {p.included && splitType === 'EXACT' && (
                      <div className="flex items-center gap-1">
                        <span className="text-white/40 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={p.value}
                          onChange={(e) => updateParticipantValue(p.userId, e.target.value)}
                          className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm text-right outline-none focus:border-accent-orange"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {splitType === 'PERCENTAGE' && (
                <p className={`text-xs text-right ${Math.abs(percentageSum - 100) > 0.01 ? 'text-red-400' : 'text-green-500'}`}>
                  Total: {percentageSum.toFixed(2)}% / 100%
                </p>
              )}
              {splitType === 'EXACT' && (
                <p className={`text-xs text-right ${Math.abs(exactSum - Number(amount || 0)) > 0.01 ? 'text-red-400' : 'text-green-500'}`}>
                  Total: ${exactSum.toFixed(2)} / ${Number(amount || 0).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-3">
            <div
              onClick={submitting ? undefined : handleSubmit}
              className={`w-full bg-accent-orange text-white text-sm font-semibold rounded-xl px-4 py-3 text-center transition-colors select-none ${
                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent-orange-light cursor-pointer'
              }`}
            >
              {submitting ? 'Guardando...' : 'Guardar gasto'}
            </div>
            {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
