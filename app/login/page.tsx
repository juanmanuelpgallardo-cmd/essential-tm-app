'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

const perfiles = [
  { nombre: 'Teresa', rol: 'Masajista', email: 'teresa.masajes@essentialtm.com', inicial: 'T' },
  { nombre: 'Miky', rol: 'Masajista', email: 'miky.masajes@essentialtm.com', inicial: 'M' },
  { nombre: 'Juanma', rol: 'Técnico', email: 'juanma.tecnico@essentialtm.com', inicial: 'J' },
]

export default function LoginPage() {
  const router = useRouter()
  const passwordRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const seleccionarPerfil = useCallback((e: string) => {
    setEmail(e)
    setError(null)
    setTimeout(() => passwordRef.current?.focus(), 100)
  }, [])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Selecciona un perfil primero'); return }
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/clientes')
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [email, password, router])

  return (
    <div className="min-h-screen bg-[#E8E4D9] flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">

        {/* Título */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#3A5A40] tracking-tight">Essential TM</h1>
          <p className="text-[#8A9A8A] text-sm mt-1">Selecciona tu perfil para acceder</p>
        </div>

        {/* Tarjetas de perfil */}
        <div className="space-y-3">
          {perfiles.map((p) => (
            <button
              key={p.email}
              onClick={() => seleccionarPerfil(p.email)}
              className={`w-full flex items-center gap-4 bg-white rounded-2xl shadow-sm p-4 border border-gray-100 text-left transition hover:shadow-md ${
                email === p.email ? 'ring-2 ring-[#C99470]' : ''
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-[#EDF0EA] flex items-center justify-center text-[#3A5A40] font-bold text-lg shrink-0">
                {p.inicial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#3A5A40]">{p.nombre}</p>
                <p className="text-xs text-[#8A9A8A]">{p.rol}</p>
              </div>
              {email === p.email && (
                <span className="text-[#C99470] text-lg">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Formulario de contraseña */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
          <input
            type="email"
            value={email}
            readOnly
            className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#5A6B5A] focus:outline-none"
            placeholder="Perfil seleccionado"
            tabIndex={-1}
          />
          <input
            ref={passwordRef}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || !email}
            className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
          />
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-[#C99470] hover:bg-[#B88363] text-white border-0 py-3 text-sm font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Link
            href="/recuperar-password"
            className="block text-center text-sm text-[#C99470] hover:text-[#B88363] transition"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </form>

        {/* Volver */}
        <Link href="/" className="block text-center text-sm text-[#5C6B73] hover:text-[#4A5A63] transition">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}