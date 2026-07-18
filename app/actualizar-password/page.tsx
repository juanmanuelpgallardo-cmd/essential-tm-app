'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function ActualizarPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (error) {
            setError('El enlace ha expirado o no es válido. Solicita uno nuevo.')
          } else {
            setReady(true)
          }
        })
      } else {
        setReady(true)
      }
    } else {
      setReady(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-4">Contraseña actualizada</h1>
          <p className="text-muted-foreground mb-6">
            Tu contraseña se ha cambiado correctamente. Serás redirigido al inicio de sesión...
          </p>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Nueva contraseña</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          className="border p-2 mb-4 w-full rounded"
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <input
          className="border p-2 mb-4 w-full rounded"
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        {!ready && (
          <p className="text-muted-foreground text-sm mb-4">Verificando enlace...</p>
        )}
        <Button type="submit" className="w-full mb-4" disabled={loading || !ready}>
          {loading ? 'Actualizando...' : 'Cambiar contraseña'}
        </Button>
      </form>
      <Link href="/login" className="text-sm underline">Volver al inicio de sesión</Link>
    </div>
  )
}
