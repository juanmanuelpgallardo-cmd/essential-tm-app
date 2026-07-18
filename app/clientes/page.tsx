'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  creado_el: string
}

export default function ListaClientes() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newTelefono, setNewTelefono] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)

  const loadClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, email, creado_el')
        .order('creado_el', { ascending: false })
      if (error) throw error
      setClientes(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNombre.trim()) return
    setCreating(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nombre: newNombre.trim(),
          telefono: newTelefono.trim() || null,
          email: newEmail.trim() || null,
        })
        .select('id, nombre, telefono, email, creado_el')
        .single()
      if (error) throw error
      setClientes((prev) => [data, ...prev])
      setNewNombre('')
      setNewTelefono('')
      setNewEmail('')
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente')
    } finally {
      setCreating(false)
    }
  }, [newNombre, newTelefono, newEmail])

  const handleDelete = useCallback(async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre} y todos sus datos?`)) return
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      setClientes((prev) => prev.filter((p) => p.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={() => router.push('/')}>Volver al inicio</Button>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3 mb-4">{error}</p>
      )}

      <Button onClick={() => setShowForm(!showForm)} className="mb-6">
        {showForm ? 'Cancelar' : 'Nuevo cliente'}
      </Button>

      {showForm && (
        <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-3 bg-muted/30">
          <input
            className="border p-2 w-full rounded"
            placeholder="Nombre *"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            required
            disabled={creating}
          />
          <input
            className="border p-2 w-full rounded"
            placeholder="Teléfono"
            value={newTelefono}
            onChange={(e) => setNewTelefono(e.target.value)}
            disabled={creating}
          />
          <input
            className="border p-2 w-full rounded"
            placeholder="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={creating}
          />
          <Button type="submit" disabled={creating || !newNombre.trim()}>
            {creating ? 'Creando...' : 'Crear cliente'}
          </Button>
        </form>
      )}

      {clientes.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No hay clientes registrados. Crea el primero.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-2 font-medium">Nombre</th>
                <th className="pb-2 font-medium">Teléfono</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Registro</th>
                <th className="pb-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="py-3">
                    <Link href={`/clientes/${p.id}`} className="text-blue-600 hover:underline font-medium">
                      {p.nombre}
                    </Link>
                  </td>
                  <td className="py-3 text-sm">{p.telefono || '-'}</td>
                  <td className="py-3 text-sm">{p.email || '-'}</td>
                  <td className="py-3 text-sm">
                    {new Date(p.creado_el).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="xs" onClick={() => router.push(`/clientes/${p.id}`)}>
                        Abrir
                      </Button>
                      <Button variant="destructive" size="xs" onClick={() => handleDelete(p.id, p.nombre)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
