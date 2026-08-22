'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface CategoryResponse {
  id: number
  name: string
  icon: string | null
  color: string | null
  isDefault: boolean
  createdById: number | null
  createdAt: string
  updatedAt: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await api.get<CategoryResponse[]>('/api/categories')
      setCategories(res.data)
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

    fetchCategories()
  }, [router])

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que querés eliminar esta categoría?')) return

    setActionError('')
    setDeletingId(id)
    try {
      await api.delete(`/api/categories/${id}`)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setActionError(message ?? 'No se pudo eliminar la categoría.')
    } finally {
      setDeletingId(null)
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
        <h1 className="justify-self-center text-lg font-semibold text-white">Categorías</h1>
        <button
          type="button"
          onClick={() => router.push('/categories/new')}
          className="justify-self-end bg-accent-orange text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-accent-orange-light transition-colors"
        >
          Nueva +
        </button>
      </div>

      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {categories.length === 0 ? (
        <div className="card-glass p-6 text-center text-white/50 text-sm">
          No tenés categorías creadas aún
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <div key={category.id} className="card-glass px-4 py-3 flex items-center gap-3">
              <span className="text-xl shrink-0 w-8 text-center">{category.icon || '📂'}</span>

              <span
                className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                style={{ backgroundColor: category.color || '#9CA3AF' }}
              />

              <span className="text-white text-sm font-medium flex-1 truncate">{category.name}</span>

              {!category.isDefault && (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/categories/${category.id}/edit`)}
                    className="bg-white/10 text-white/80 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-white/20 hover:text-white transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    disabled={deletingId === category.id}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === category.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
