'use client'

import { useEffect, useState } from 'react'
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

export default function NewGroupPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [friends, setFriends] = useState<UserResponse[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const currentUserId = Number(localStorage.getItem('userId'))

    const fetchFriends = async () => {
      try {
        const res = await api.get<FriendshipResponse[]>('/api/friendships/friends')
        const accepted = res.data
          .filter((f) => f.status === 'ACCEPTED')
          .map((f) => (f.requester.id === currentUserId ? f.addressee : f.requester))
        setFriends(accepted)
      } catch {
        setFriends([])
      } finally {
        setLoadingFriends(false)
      }
    }

    fetchFriends()
  }, [])

  const toggleFriend = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Ponele un nombre al grupo')
      return
    }

    setErrorMsg('')
    setSubmitting(true)

    try {
      const res = await api.post('/api/groups', { name: name.trim() })
      const groupId = res.data.id

      for (const memberId of selectedIds) {
        await api.post(`/api/groups/${groupId}/members/${memberId}`)
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMsg(message ?? 'No se pudo crear el grupo. Intentá de nuevo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <Navbar />
      <h1 className="text-xl font-semibold text-white">Nuevo grupo</h1>

      <form
        className="card-glass-strong p-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!submitting) handleSubmit()
        }}
      >
        {/* Nombre del grupo */}
        <div className="flex flex-col gap-2">
          <label htmlFor="group-name" className="text-white/40 text-xs uppercase tracking-widest">
            Nombre del grupo
          </label>
          <input
            id="group-name"
            type="text"
            placeholder="Ej: Vacaciones, Departamento..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
          />
        </div>

        {/* Miembros (amigos) */}
        <div className="flex flex-col gap-3">
          <p className="text-white/40 text-xs uppercase tracking-widest">Invitar amigos (opcional)</p>

          {loadingFriends ? (
            <p className="text-white/40 text-sm">Cargando amigos...</p>
          ) : friends.length === 0 ? (
            <p className="text-white/40 text-sm">
              Todavía no tenés amigos agregados. Podés crear el grupo igual y sumar gente después.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {friends.map((friend) => (
                <label
                  key={friend.id}
                  className="card-glass px-4 py-3 flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span className="text-white text-sm">{friend.username}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full bg-accent-orange text-white text-sm font-semibold rounded-xl px-4 py-3 text-center transition-colors ${
              submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent-orange-light cursor-pointer'
            }`}
          >
            {submitting ? 'Creando...' : 'Crear grupo'}
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        </div>
      </form>
    </div>
  )
}
