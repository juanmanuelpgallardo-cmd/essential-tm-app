'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"

type Paciente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  historia_clinica: string | null
  notas: string | null
}

export default function FichaPaciente() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [paciente, setPaciente] = useState<Paciente | null>(null)
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
          .from('pacientes')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        setPaciente(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar paciente')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleFieldChange = useCallback((field: keyof Paciente, value: string) => {
    setPaciente((prev) => prev ? { ...prev, [field]: value || null } : prev)
  }, [])

  const handleSave = useCallback(async () => {
    if (!paciente) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('pacientes')
        .update({
          nombre: paciente.nombre,
          telefono: paciente.telefono,
          email: paciente.email,
          historia_clinica: paciente.historia_clinica,
          notas: paciente.notas,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paciente.id)
      if (error) throw error
      setSuccess('Datos guardados correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [paciente])

  const handleUpload = useCallback(async () => {
    if (!file || !paciente) return
    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `${paciente.id}/${crypto.randomUUID()}.${ext}`

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
          paciente_id: paciente.id,
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
  }, [file, paciente])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando ficha...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Paciente no encontrado</h1>
        <Button onClick={() => router.push('/')}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{paciente.nombre}</h1>
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
            value={paciente.nombre}
            onChange={(e) => handleFieldChange('nombre', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              className="border p-2 w-full rounded"
              value={paciente.telefono || ''}
              onChange={(e) => handleFieldChange('telefono', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="border p-2 w-full rounded"
              type="email"
              value={paciente.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Historia clínica</label>
          <textarea
            className="border p-2 w-full rounded min-h-[100px]"
            value={paciente.historia_clinica || ''}
            onChange={(e) => handleFieldChange('historia_clinica', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            className="border p-2 w-full rounded min-h-[100px]"
            value={paciente.notas || ''}
            onChange={(e) => handleFieldChange('notas', e.target.value)}
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
