'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface NavbarProps {
  username?: string
}

export default function Navbar({ username: initialUsername }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const username =
    initialUsername || (typeof window !== 'undefined' ? localStorage.getItem('username') ?? '' : '')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!userId) return

    const fetchUnreadCount = async () => {
      const res = await api
        .get<{ count: number }>(`/api/notifications/user/${userId}/unread/count`)
        .catch(() => null)
      if (res) setUnreadCount(res.data.count)
    }

    fetchUnreadCount()
  }, [pathname])

  const initial = username ? username.charAt(0).toUpperCase() : 'U'

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
    }
    router.push('/')
  }

  return (
    <header className="w-full max-w-2xl mx-auto mb-6">
      <div className="card-glass px-5 py-3.5 flex items-center justify-between shadow-lg">
        {/* Logotipo / Marca */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-accent-orange/30 group-hover:scale-105 transition-transform">
            <Image src="/fotoApp.png" alt="Finanzas" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-wide text-base group-hover:text-accent-orange transition-colors">
              Finanzas
            </span>
            <span className="text-[10px] text-white/40 font-mono tracking-wider uppercase">
              Splitwise App
            </span>
          </div>
        </Link>

        {/* Acciones de navegación */}
        <div className="flex items-center gap-3">
          {/* Botón Mis Grupos */}
          <Link
            href="/groups"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              pathname === '/groups' || (pathname?.startsWith('/groups/') && pathname !== '/groups/new')
                ? 'bg-accent-orange text-white shadow-accent-orange/20'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Mis grupos</span>
            <span className="sm:hidden">Grupos</span>
          </Link>

          {/* Botón Nuevo Grupo */}
          <Link
            href="/groups/new"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              pathname === '/groups/new'
                ? 'bg-accent-orange text-white shadow-accent-orange/20'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>+</span>
            <span className="hidden sm:inline">Nuevo grupo</span>
          </Link>

          {/* Botón Amigos */}
          <Link
            href="/friends"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              pathname === '/friends'
                ? 'bg-accent-orange text-white shadow-accent-orange/20'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>Amigos</span>
          </Link>

          {/* Botón Pagos */}
          <Link
            href="/settlements"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              pathname?.startsWith('/settlements')
                ? 'bg-accent-orange text-white shadow-accent-orange/20'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>Pagos</span>
          </Link>

          {/* Botón Categorías */}
          <Link
            href="/categories"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              pathname?.startsWith('/categories')
                ? 'bg-accent-orange text-white shadow-accent-orange/20'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>Categorías</span>
          </Link>

          {/* Botón Avatar de Perfil */}
          <Link
            href="/profile"
            title="Ver mi perfil"
            className={`relative p-0.5 rounded-full transition-all group ${
              pathname === '/profile'
                ? 'ring-2 ring-accent-orange shadow-lg shadow-accent-orange/30 scale-105'
                : 'hover:ring-2 hover:ring-white/40'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent-blue to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden border border-white/20">
              {initial}
            </div>
            {/* Indicador de estado online */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0F1B2D] rounded-full"></span>
          </Link>

          {/* Botón Notificaciones */}
          <Link
            href="/notifications"
            title="Ver notificaciones"
            className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              pathname === '/notifications'
                ? 'bg-accent-orange text-white shadow-accent-orange/20'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>🔔</span>
            <span className="hidden sm:inline">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Salir */}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 text-white/40 hover:text-red-400 transition-colors ml-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
