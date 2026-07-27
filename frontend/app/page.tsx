'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const response = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('userId', String(response.data.userId))
      localStorage.setItem('username', response.data.username)
      router.push('/dashboard')
    } catch {
      setErrorMsg('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-glass-strong w-full max-w-sm p-8 flex flex-col gap-6">

        {/* Logo + título */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">💸</span>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-accent-orange">Finanzas</span>
            <span className="text-white"> App</span>
          </h1>
          <p className="text-white/50 text-sm">Iniciar sesión</p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-accent-orange transition-colors"
          />
        </div>

        {/* Botón */}
        <div className="flex flex-col gap-3">
          <div
            onClick={loading ? undefined : handleSubmit}
            className={`w-full bg-accent-orange text-white text-sm font-semibold rounded-xl px-4 py-3 text-center transition-colors select-none ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-accent-orange-light cursor-pointer'
            }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </div>
          {errorMsg && (
            <p className="text-red-400 text-sm text-center mt-2">{errorMsg}</p>
          )}
          <p className="text-center text-sm text-white/40">
            ¿No tenés cuenta?{' '}
            <span
              onClick={() => router.push('/register')}
              className="text-accent-blue cursor-pointer hover:underline"
            >
              Registrate
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}
