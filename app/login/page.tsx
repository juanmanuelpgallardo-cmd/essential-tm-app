'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <input
          className="border p-2 mb-4 w-full rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          className="border p-2 mb-4 w-full rounded"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        <Button type="submit" className="w-full mb-4" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
        <Link href="/recuperar-password" className="text-sm text-blue-600 hover:underline text-center block">
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
      <Link href="/" className="text-sm underline mt-4">Volver al inicio</Link>
      <p className="text-sm text-muted-foreground mt-6">
        ¿Necesitas ayuda? Escríbenos a:{' '}
        <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="underline">
          {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  )
}