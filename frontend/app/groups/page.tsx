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

interface GroupBalanceResponse {
  groupId: number
  balances: UserBalanceResponse[]
  suggestedSettlements: unknown[]
}

interface GroupWithBalance extends GroupResponse {
  myBalance: number | null
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    const currentUserId = Number(localStorage.getItem('userId'))

    const fetchGroups = async () => {
      try {
        const groupsRes = await api.get<GroupResponse[]>('/api/groups')
        const baseGroups = groupsRes.data

        const balanceResults = await Promise.allSettled(
          baseGroups.map((g) => api.get<GroupBalanceResponse>(`/api/groups/${g.id}/balance`))
        )

        const withBalances: GroupWithBalance[] = baseGroups.map((g, idx) => {
          const result = balanceResults[idx]
          const myBalance =
            result.status === 'fulfilled'
              ? result.value.data.balances.find((b) => b.userId === currentUserId)?.netBalance ?? 0
              : null
          return { ...g, myBalance }
        })

        setGroups(withBalances)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [router])

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
        <h1 className="text-xl font-semibold text-white">Mis grupos</h1>
        <Link
          href="/groups/new"
          className="bg-accent-orange text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-accent-orange-light transition-colors"
        >
          + Nuevo grupo
        </Link>
      </div>

      {groups.length === 0 ? (
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
                <h2 className="text-white font-bold text-base tracking-tight">{group.name}</h2>
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
  )
}
