'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/actualizar-password`,
      })
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-4">Revisa tu correo</h1>
          <p className="text-muted-foreground mb-6">
            Te hemos enviado un enlace a <strong>{email}</strong> para restablecer tu contraseña.
          </p>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Recuperar contraseña</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <p className="text-sm text-muted-foreground mb-4">
          Ingresa tu email y te enviaremos instrucciones para crear una nueva contraseña.
        </p>
        <input
          className="border p-2 mb-4 w-full rounded"
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        <Button type="submit" className="w-full mb-4" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </Button>
      </form>
      <Link href="/login" className="text-sm underline">Volver al inicio de sesión</Link>
    </div>
  )
}
