'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  notas_privadas: string | null
  creado_el: string
}

export default function FichaCliente() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        setCliente(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar cliente')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleFieldChange = useCallback((field: keyof Cliente, value: string) => {
    setCliente((prev) => prev ? { ...prev, [field]: value || null } : prev)
  }, [])

  const handleSave = useCallback(async () => {
    if (!cliente) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email,
          notas_privadas: cliente.notas_privadas,
        })
        .eq('id', cliente.id)
      if (error) throw error
      setSuccess('Datos guardados correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [cliente])

  const handleUpload = useCallback(async () => {
    if (!file || !cliente) return
    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `${cliente.id}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fotos-pacientes')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('fotos-pacientes')
        .getPublicUrl(path)

      const { error: dbError } = await supabase
        .from('imagenes_paciente')
        .insert({
          paciente_id: cliente.id,
          url_imagen: urlData.publicUrl,
          descripcion: file.name,
        })
      if (dbError) throw dbError

      setSuccess('Imagen subida correctamente')
      setFile(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }, [file, cliente])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando ficha...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Cliente no encontrado</h1>
        <Button onClick={() => router.push('/')}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
        <Button variant="outline" onClick={() => router.push('/')}>
          Volver
        </Button>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3 mb-4">{error}</p>
      )}
      {success && (
        <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded p-3 mb-4">{success}</p>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre completo</label>
          <input
            className="border p-2 w-full rounded"
            value={cliente.nombre}
            onChange={(e) => handleFieldChange('nombre', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              className="border p-2 w-full rounded"
              value={cliente.telefono || ''}
              onChange={(e) => handleFieldChange('telefono', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="border p-2 w-full rounded"
              type="email"
              value={cliente.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notas privadas</label>
          <textarea
            className="border p-2 w-full rounded min-h-[100px]"
            value={cliente.notas_privadas || ''}
            onChange={(e) => handleFieldChange('notas_privadas', e.target.value)}
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>

      <hr className="my-8" />

      <h2 className="text-xl font-bold mb-4">Subir imagen</h2>
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
        />
        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Subiendo...' : 'Subir foto'}
        </Button>
      </div>
    </div>
  )
}
