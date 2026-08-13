'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'

interface UserProfile {
  id?: number
  username: string
  email: string
  createdAt?: string
}

interface ExpenseResponse {
  id: number
  description: string
  amount: number
  date: string
}

interface GroupMemberResponse {
  id: number
  username: string
  email: string
}

interface GroupResponse {
  id: number
  name: string
  members: GroupMemberResponse[]
}

interface UserBalanceResponse {
  userId: number
  username: string
  netBalance: number
}

interface GroupBalanceResponse {
  groupId: number
  balances: UserBalanceResponse[]
  suggestedSettlements: unknown[]
}

interface GroupWithBalance extends GroupResponse {
  myBalance: number | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'groups' | 'activity' | 'settings'>('groups')
  const [profileLoadFailed, setProfileLoadFailed] = useState(false)
  const [realExpenseCount, setRealExpenseCount] = useState<number | null>(null)
  const [groups, setGroups] = useState<GroupWithBalance[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const storedUsername = localStorage.getItem('username')
    const storedEmail = localStorage.getItem('email') || `${storedUsername || 'usuario'}@finanzas.app`
    const userId = localStorage.getItem('userId')

    const fetchUser = async () => {
      try {
        const res = await api.get('/api/users/me')
        setUser(res.data)
      } catch {
        setProfileLoadFailed(true)
        setUser({
          username: storedUsername || 'Usuario',
          email: storedEmail,
        })
      } finally {
        setLoading(false)
      }
    }

    const fetchExpenseCount = async () => {
      try {
        const res = await api.get<ExpenseResponse[]>(`/api/expenses/user/${userId}`)
        setRealExpenseCount(res.data.length)
      } catch {
        setRealExpenseCount(null)
      }
    }

    const fetchGroups = async () => {
      try {
        const groupsRes = await api.get<GroupResponse[]>('/api/groups')
        const baseGroups = groupsRes.data
        const numericUserId = Number(userId)

        const balanceResults = await Promise.allSettled(
          baseGroups.map((g) => api.get<GroupBalanceResponse>(`/api/groups/${g.id}/balance`))
        )

        const withBalances: GroupWithBalance[] = baseGroups.map((g, idx) => {
          const result = balanceResults[idx]
          const myBalance =
            result.status === 'fulfilled'
              ? result.value.data.balances.find((b) => b.userId === numericUserId)?.netBalance ?? 0
              : null
          return { ...g, myBalance }
        })

        setGroups(withBalances)
      } catch {
        setGroups([])
      } finally {
        setGroupsLoading(false)
      }
    }

    const fetchUnreadNotifications = async () => {
      try {
        const res = await api.get<{ count: number }>(`/api/notifications/user/${userId}/unread/count`)
        setUnreadNotifications(res.data.count)
      } catch {
        setUnreadNotifications(0)
      }
    }

    fetchUser()
    fetchExpenseCount()
    fetchGroups()
    fetchUnreadNotifications()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-sm animate-pulse">Cargando perfil...</p>
      </div>
    )
  }

  const username = user?.username || 'Usuario'
  const email = user?.email || `${username.toLowerCase()}@finanzas.app`
  const initial = username.charAt(0).toUpperCase()

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : null

  const totalBalance = groups.reduce((acc, g) => acc + (g.myBalance ?? 0), 0)
  const totalGroupsCount = groups.length
  const gastosTotales = realExpenseCount ?? 0

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
      {/* Navbar global */}
      <Navbar username={username} />

      {/* Aviso si no se pudo cargar el perfil real */}
      {profileLoadFailed && (
        <div className="card-glass px-4 py-3 flex items-center gap-2.5 border border-amber-500/30 bg-amber-500/10">
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-amber-200 text-xs">
            No pudimos cargar tu perfil desde el servidor. Estás viendo datos guardados en este dispositivo.
          </p>
        </div>
      )}

      {/* Tarjeta Perfil Principal / Avatar Header */}
      <div className="card-glass p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-orange/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Avatar grande */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-orange via-amber-500 to-accent-blue flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-accent-orange/20 border-2 border-white/30">
            {initial}
          </div>
          <button
            title="Cambiar foto de perfil"
            className="absolute bottom-0 right-0 w-7 h-7 bg-white/20 hover:bg-accent-orange text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 transition-colors shadow-md"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Info usuario */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{username}</h1>
          </div>
          <p className="text-white/60 text-sm">{email}</p>
          <p className="text-white/40 text-xs mt-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{memberSince ? `Miembro desde ${memberSince}` : 'Fecha de alta no disponible'}</span>
          </p>
        </div>

        {/* Botón de acción rápido */}
        <div className="w-full sm:w-auto">
          <button
            onClick={() => alert('Función de edición de perfil disponible próximamente')}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-white/15"
          >
            Editar perfil
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas de balance */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-glass p-4 flex flex-col items-center justify-center text-center gap-1">
          <p className="text-white/40 text-[11px] uppercase tracking-wider font-mono">Balance Neto</p>
          <p className={`text-xl font-extrabold ${totalBalance > 0 ? 'text-emerald-400' : totalBalance < 0 ? 'text-red-400' : 'text-white/80'}`}>
            {totalBalance > 0 ? `+$${totalBalance.toLocaleString('es-AR')}` : `$${totalBalance.toLocaleString('es-AR')}`}
          </p>
        </div>
        <div className="card-glass p-4 flex flex-col items-center justify-center text-center gap-1">
          <p className="text-white/40 text-[11px] uppercase tracking-wider font-mono">Grupos</p>
          <p className="text-accent-orange text-xl font-extrabold">{totalGroupsCount}</p>
        </div>
        <div className="card-glass p-4 flex flex-col items-center justify-center text-center gap-1">
          <p className="text-white/40 text-[11px] uppercase tracking-wider font-mono">Gastos Totales</p>
          <p className="text-accent-blue text-xl font-extrabold">{gastosTotales}</p>
        </div>
      </div>

      {/* Tabs de Navegación del Perfil */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 gap-1">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'groups'
              ? 'bg-accent-orange text-white shadow-md shadow-accent-orange/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Mis Grupos</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'activity'
              ? 'bg-accent-orange text-white shadow-md shadow-accent-orange/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Actividad</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-accent-orange text-white shadow-md shadow-accent-orange/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Ajustes</span>
        </button>
      </div>

      {/* SECCIÓN 1: MIS GRUPOS */}
      {activeTab === 'groups' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2">
              Mis Grupos de Gastos
            </h2>
            <span className="text-xs text-white/40 font-mono">
              {groups.length} {groups.length === 1 ? 'grupo activo' : 'grupos activos'}
            </span>
          </div>

          {groupsLoading ? (
            <p className="text-white/40 text-sm text-center py-6">Cargando grupos...</p>
          ) : groups.length === 0 ? (
            <div className="card-glass p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-white/50 text-sm">Todavía no sos parte de ningún grupo.</p>
              <Link
                href="/groups/new"
                className="bg-accent-orange text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-accent-orange-light transition-colors"
              >
                Crear mi primer grupo
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="card-glass p-5 flex items-center justify-between gap-4 hover:border-white/30 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-white font-bold text-base tracking-tight">{group.name}</h3>
                    <p className="text-white/40 text-xs">
                      {group.members.length} {group.members.length === 1 ? 'integrante' : 'integrantes'}
                    </p>
                  </div>

                  {group.myBalance === null ? (
                    <span className="text-white/30 text-xs">Sin datos</span>
                  ) : group.myBalance > 0 ? (
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      Te deben ${group.myBalance.toFixed(2)}
                    </span>
                  ) : group.myBalance < 0 ? (
                    <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-500/30">
                      Debés ${Math.abs(group.myBalance).toFixed(2)}
                    </span>
                  ) : (
                    <span className="bg-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/15">
                      Al día
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: ACTIVIDAD RESUMIDA */}
      {activeTab === 'activity' && (
        <div className="card-glass p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
            Resumen de Actividad
          </h2>
          <div className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2">
            Datos de ejemplo — el registro real de actividad todavía está en desarrollo.
          </div>
          <div className="flex flex-col gap-3 text-sm text-white/70">
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium text-xs">Pago saldado en &quot;Asado&quot;</p>
                <p className="text-[11px] text-white/40">Pagaste $14.000 a Agustin • Hace 2 días</p>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-orange/20 text-accent-orange flex items-center justify-center shrink-0 border border-accent-orange/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium text-xs">Cargaste un gasto en &quot;Vacaciones&quot;</p>
                <p className="text-[11px] text-white/40">Supermercado $32.500 • Hace 3 días</p>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/20 text-accent-blue flex items-center justify-center shrink-0 border border-accent-blue/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium text-xs">Te uniste a &quot;Departamento&quot;</p>
                <p className="text-[11px] text-white/40">Invitado por Lucas • Hace 1 semana</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: AJUSTES / CONFIGURACIÓN DE CUENTA */}
      {activeTab === 'settings' && (
        <div className="card-glass p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
            Opciones de Cuenta
          </h2>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/notifications')}
              className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="flex items-center gap-2">
                  Notificaciones y Alertas
                  {unreadNotifications > 0 && (
                    <span className="bg-accent-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {unreadNotifications}
                    </span>
                  )}
                </span>
              </div>
              <span className="text-white/40">›</span>
            </button>

            <button className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Cambiar Contraseña</span>
              </div>
              <span className="text-white/40">›</span>
            </button>

            <button className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Moneda preferida (ARS / USD)</span>
              </div>
              <span className="text-white/40 font-mono text-[11px]">ARS ($)</span>
            </button>

            <button className="w-full text-left p-3.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-between transition-colors mt-2">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar sesión</span>
              </div>
              <span>›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
