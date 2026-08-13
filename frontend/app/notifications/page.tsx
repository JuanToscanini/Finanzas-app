'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'

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
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const userId = localStorage.getItem('userId')

    const fetchNotifications = async () => {
      try {
        const res = await api.get<NotificationResponse[]>(`/api/notifications/user/${userId}`)
        setNotifications(res.data)
      } catch {
        setErrorMsg('No pudimos cargar tus notificaciones. Intentá de nuevo más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [router])

  const markAsRead = async (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
    try {
      await api.put(`/api/notifications/${notificationId}/read`)
    } catch {
      // La notificación puede haber quedado marcada visualmente aunque falle la sincronización con el backend
    }
  }

  const handleItemClick = (notification: NotificationResponse) => {
    if (notification.isRead) return
    markAsRead(notification.id)
  }

  const handleMarkAllAsRead = async () => {
    const userId = localStorage.getItem('userId')
    setMarkingAll(true)
    try {
      await api.put(`/api/notifications/user/${userId}/read-all`)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {
      setErrorMsg('No se pudieron marcar todas las notificaciones como leídas.')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

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
        <h1 className="text-xl font-semibold text-white">Notificaciones</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors ${
              markingAll
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            {markingAll ? 'Marcando...' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      {notifications.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-6">Todavía no tenés notificaciones</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const itemClasses = `card-glass px-4 py-3 flex items-start gap-3 border-l-4 transition-colors ${
              n.isRead
                ? 'border-l-transparent opacity-60'
                : 'border-l-accent-orange bg-accent-orange/5'
            }`

            const content = (
              <>
                {!n.isRead && (
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-accent-orange shrink-0" />
                )}
                <div className="flex flex-col gap-1 flex-1">
                  <p className={`text-sm ${n.isRead ? 'text-white/60' : 'text-white'}`}>{n.message}</p>
                  <p className="text-white/40 text-xs">
                    {new Date(n.createdAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </>
            )

            if (n.referenceType === 'GROUP' && n.referenceId) {
              return (
                <Link
                  key={n.id}
                  href={`/groups/${n.referenceId}`}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id)
                  }}
                  className={itemClasses}
                >
                  {content}
                </Link>
              )
            }

            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleItemClick(n)}
                className={`${itemClasses} text-left w-full`}
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
