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
      <div className="flex items-center justify-center min-h-screen bg-[#E8E4D9]">
        <p className="text-[#8A9A8A] text-sm">Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E8E4D9] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cabecera */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#3A5A40]">Clientes</h1>
            <Button variant="outline" onClick={() => router.push('/')} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0">
              Volver al inicio
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-2xl p-4">{error}</p>
        )}

        <Button onClick={() => setShowForm(!showForm)} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white rounded-xl px-5 py-2.5 text-sm font-medium border-0">
          {showForm ? 'Cancelar' : 'Nuevo cliente'}
        </Button>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
            <input
              className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#3A5A40] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
              placeholder="Nombre *"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              required
              disabled={creating}
            />
            <input
              className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#3A5A40] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
              placeholder="Teléfono"
              value={newTelefono}
              onChange={(e) => setNewTelefono(e.target.value)}
              disabled={creating}
            />
            <input
              className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#3A5A40] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
              placeholder="Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={creating}
            />
            <Button type="submit" disabled={creating || !newNombre.trim()} className="w-full bg-[#C99470] hover:bg-[#B88363] text-white border-0 py-3 text-sm font-medium">
              {creating ? 'Creando...' : 'Crear cliente'}
            </Button>
          </form>
        )}

        {clientes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-[#8A9A8A] text-sm py-8">No hay clientes registrados. Crea el primero.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-[#8A9A8A]">
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Teléfono</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Registro</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3">
                        <Link href={`/clientes/${p.id}`} className="text-[#C99470] hover:underline font-medium">
                          {p.nombre}
                        </Link>
                      </td>
                      <td className="py-3 text-[#5A6B5A]">{p.telefono || '-'}</td>
                      <td className="py-3 text-[#5A6B5A]">{p.email || '-'}</td>
                      <td className="py-3 text-[#8A9A8A] text-xs">
                        {new Date(p.creado_el).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="xs" onClick={() => router.push(`/clientes/${p.id}`)} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0">
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
          </div>
        )}
      </div>
    </div>
  )
}
