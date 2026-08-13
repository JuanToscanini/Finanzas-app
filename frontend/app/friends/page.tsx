'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'

interface UserResponse {
  id: number
  username: string
  email: string
  avatarUrl: string | null
  preferredCurrency: string
  createdAt: string
}

interface FriendshipResponse {
  id: number
  requester: UserResponse
  addressee: UserResponse
  status: string
}

export default function FriendsPage() {
  const router = useRouter()
  const currentUserId = Number(typeof window !== 'undefined' ? localStorage.getItem('userId') : NaN)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResponse[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searched, setSearched] = useState(false)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [sentIds, setSentIds] = useState<number[]>([])

  const [friends, setFriends] = useState<FriendshipResponse[]>([])
  const [pending, setPending] = useState<FriendshipResponse[]>([])
  const [sent, setSent] = useState<FriendshipResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [actioningId, setActioningId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchLists = async () => {
    try {
      const [friendsRes, pendingRes, sentRes] = await Promise.allSettled([
        api.get<FriendshipResponse[]>('/api/friendships/friends'),
        api.get<FriendshipResponse[]>('/api/friendships/pending'),
        api.get<FriendshipResponse[]>('/api/friendships/sent'),
      ])

      if (friendsRes.status === 'fulfilled') setFriends(friendsRes.value.data)
      if (pendingRes.status === 'fulfilled') setPending(pendingRes.value.data)
      if (sentRes.status === 'fulfilled') setSent(sentRes.value.data)
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

    fetchLists()
  }, [router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setSearchError('')
    setSearching(true)
    setSearched(true)

    try {
      const res = await api.get<UserResponse[]>('/api/users/search', {
        params: { query: query.trim() },
      })
      setResults(res.data)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSearchError(message ?? 'No se pudo buscar usuarios. Intentá de nuevo.')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (userId: number) => {
    setSendingId(userId)
    setSearchError('')
    try {
      await api.post(`/api/friendships/request/${userId}`)
      setSentIds((prev) => [...prev, userId])
      await fetchLists()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSearchError(message ?? 'No se pudo enviar la solicitud.')
    } finally {
      setSendingId(null)
    }
  }

  const handleAccept = async (friendshipId: number) => {
    setActionError('')
    setActioningId(friendshipId)
    try {
      await api.put(`/api/friendships/${friendshipId}/accept`)
      await fetchLists()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(message ?? 'No se pudo aceptar la solicitud.')
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (friendshipId: number) => {
    setActionError('')
    setActioningId(friendshipId)
    try {
      await api.delete(`/api/friendships/${friendshipId}/reject`)
      await fetchLists()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(message ?? 'No se pudo rechazar la solicitud.')
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

      <h1 className="text-xl font-semibold text-white">Amigos</h1>

      {/* Buscador */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Buscar usuarios</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre de usuario o email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className={`bg-accent-orange text-white text-sm font-semibold rounded-xl px-5 py-3 transition-colors ${
              searching || !query.trim()
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-accent-orange-light cursor-pointer'
            }`}
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searchError && <p className="text-red-400 text-sm mt-2">{searchError}</p>}

        {searched && !searching && (
          <div className="flex flex-col gap-2 mt-3">
            {results.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No encontramos usuarios con ese criterio</p>
            ) : (
              results.map((u) => (
                <div key={u.id} className="card-glass px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <p className="text-white text-sm font-medium">{u.username}</p>
                    <p className="text-white/40 text-xs">{u.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendRequest(u.id)}
                    disabled={sendingId === u.id || sentIds.includes(u.id)}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0 ${
                      sentIds.includes(u.id)
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : sendingId === u.id
                        ? 'bg-accent-orange/50 text-white cursor-not-allowed'
                        : 'bg-accent-orange text-white hover:bg-accent-orange-light cursor-pointer'
                    }`}
                  >
                    {sentIds.includes(u.id) ? 'Enviada' : sendingId === u.id ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {/* Solicitudes recibidas */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Solicitudes recibidas</p>
        {pending.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">No tenés solicitudes pendientes</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((f) => (
              <div key={f.id} className="card-glass px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <p className="text-white text-sm font-medium">{f.requester.username}</p>
                  <p className="text-white/40 text-xs">{f.requester.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAccept(f.id)}
                    disabled={actioningId === f.id}
                    className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl px-3 py-2 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(f.id)}
                    disabled={actioningId === f.id}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl px-3 py-2 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitudes enviadas */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Solicitudes enviadas</p>
        {sent.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">No enviaste solicitudes</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sent.map((f) => (
              <div key={f.id} className="card-glass px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <p className="text-white text-sm font-medium">{f.addressee.username}</p>
                  <p className="text-white/40 text-xs">{f.addressee.email}</p>
                </div>
                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 shrink-0">
                  Pendiente
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mis amigos */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Mis amigos</p>
        {friends.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">Todavía no tenés amigos agregados</p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => {
              const friend = f.requester.id === currentUserId ? f.addressee : f.requester
              return (
                <div key={f.id} className="card-glass px-4 py-3 flex flex-col">
                  <p className="text-white text-sm font-medium">{friend.username}</p>
                  <p className="text-white/40 text-xs">{friend.email}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
