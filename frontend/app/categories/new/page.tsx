'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function NewCategoryPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#FF7A45')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('El nombre es obligatorio')
      return
    }

    setErrorMsg('')
    setSubmitting(true)

    try {
      await api.post('/api/categories', {
        name: name.trim(),
        icon: icon.trim() || undefined,
        color: color || undefined,
      })
      router.push('/categories')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrorMsg(message ?? 'No se pudo crear la categoría. Intentá de nuevo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push('/categories')}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          ← Volver
        </button>
      </div>

      <h1 className="text-xl font-semibold text-white">Nueva categoría</h1>

      <form
        className="card-glass-strong p-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!submitting) handleSubmit()
        }}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="category-name" className="text-white/40 text-xs uppercase tracking-widest">
            Nombre
          </label>
          <input
            id="category-name"
            type="text"
            placeholder="Ej: Comida, Transporte..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category-icon" className="text-white/40 text-xs uppercase tracking-widest">
            Ícono (opcional)
          </label>
          <input
            id="category-icon"
            type="text"
            placeholder="Ej: 🍕 o fa-food"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category-color" className="text-white/40 text-xs uppercase tracking-widest">
            Color (opcional)
          </label>
          <input
            id="category-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-11 bg-white/10 border border-white/20 rounded-xl cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full bg-accent-orange text-white text-sm font-semibold rounded-xl px-4 py-3 text-center transition-colors ${
              submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent-orange-light cursor-pointer'
            }`}
          >
            {submitting ? 'Creando...' : 'Crear categoría'}
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        </div>
      </form>
    </div>
  )
}
