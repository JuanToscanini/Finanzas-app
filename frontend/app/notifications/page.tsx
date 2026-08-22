'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface NotificationResponse {
  id: number
  userId: number
  type: string
  message: string
  isRead: boolean
  referenceId: number | null
  referenceType: string | null
  createdAt: string
  updatedAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const currentUserId = Number(typeof window !== 'undefined' ? localStorage.getItem('userId') : NaN)

  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [markingAll, setMarkingAll] = useState(false)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchData = async () => {
    try {
      const [notificationsRes, unreadRes] = await Promise.allSettled([
        api.get<NotificationResponse[]>(`/api/notifications/user/${currentUserId}`),
        api.get<{ count: number }>(`/api/notifications/user/${currentUserId}/unread/count`),
      ])

      if (notificationsRes.status === 'fulfilled') setNotifications(notificationsRes.value.data)
      if (unreadRes.status === 'fulfilled') setUnreadCount(unreadRes.value.data.count)
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

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleMarkAllAsRead = async () => {
    setActionError('')
    setMarkingAll(true)
    try {
      await api.put(`/api/notifications/user/${currentUserId}/read-all`)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(message ?? 'No se pudieron marcar todas como leídas.')
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    setActionError('')
    setMarkingId(notificationId)
    try {
      await api.put(`/api/notifications/${notificationId}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(message ?? 'No se pudo marcar la notificación como leída.')
    } finally {
      setMarkingId(null)
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
      <div className="grid grid-cols-3 items-center card-glass px-5 py-3.5">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="justify-self-start text-white/60 hover:text-white text-sm transition-colors"
        >
          ← Volver
        </button>
        <h1 className="justify-self-center text-lg font-semibold text-white">Notificaciones</h1>
        <button
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={markingAll || unreadCount === 0}
          className={`justify-self-end text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors ${
            markingAll || unreadCount === 0
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
          }`}
        >
          {markingAll ? 'Marcando...' : 'Marcar todas'}
        </button>
      </div>

      {unreadCount > 0 && (
        <p className="text-accent-orange text-sm font-medium -mt-3">
          Tenés {unreadCount} sin leer
        </p>
      )}

      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {notifications.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-10">No tenés notificaciones 🔔</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card-glass px-4 py-3 flex items-start justify-between gap-3 ${
                n.isRead ? 'bg-white/5' : 'bg-white/10'
              }`}
            >
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm">{n.message}</p>
                  {!n.isRead && (
                    <span className="bg-accent-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      Nueva
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs">{n.type}</p>
                <p className="text-white/40 text-xs">
                  {new Date(n.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>

              {n.isRead ? (
                <span className="text-white/30 text-sm shrink-0">✓</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(n.id)}
                  disabled={markingId === n.id}
                  className="bg-white/10 text-white/80 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {markingId === n.id ? 'Marcando...' : 'Marcar leída'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
