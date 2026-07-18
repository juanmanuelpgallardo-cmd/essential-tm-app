'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [imagenes, setImagenes] = useState<{ id: string; url_imagen: string; descripcion: string | null }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [montoTotal, setMontoTotal] = useState('')
  const [formaPago, setFormaPago] = useState('Efectivo')
  const [registrandoPago, setRegistrandoPago] = useState(false)

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

  useEffect(() => {
    if (!cliente) return
    const loadImagenes = async () => {
      const { data } = await supabase
        .from('imagenes_cliente')
        .select('id, url_imagen, descripcion')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
      if (data) setImagenes(data)
    }
    loadImagenes()
  }, [cliente])

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
        .upload(path, file, {
          contentType: file.type || 'image/png',
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('fotos-pacientes')
        .getPublicUrl(path)

      const { data: newImg, error: dbError } = await supabase
        .from('imagenes_cliente')
        .insert({
          cliente_id: cliente.id,
          url_imagen: urlData.publicUrl,
          descripcion: file.name,
        })
        .select('id, url_imagen, descripcion')
        .single()
      if (dbError) throw dbError

      setImagenes((prev) => [newImg, ...prev])
      setSuccess('Imagen subida correctamente')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }, [file, cliente])

  const handleWhatsApp = useCallback(() => {
    if (!cliente?.telefono) {
      setError('El cliente no tiene teléfono registrado')
      return
    }
    const telefono = cliente.telefono.replace(/\s+/g, '').replace(/^\+?34/, '')
    const mensaje = encodeURIComponent(
      `Hola ${cliente.nombre}, te confirmo tu próxima cita en Essential TM. Quedamos pendientes. Un saludo.`
    )
    window.open(`https://wa.me/34${telefono}?text=${mensaje}`, '_blank')
  }, [cliente])

  const handleRegistrarPago = useCallback(async () => {
    if (!cliente) return
    const monto = parseFloat(montoTotal)
    if (isNaN(monto) || monto <= 0) {
      setError('Introduce un monto válido')
      return
    }
    setRegistrandoPago(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: dbError } = await supabase
        .from('ingresos_caja')
        .insert({
          cliente_id: cliente.id,
          monto_total: monto,
          forma_pago: formaPago,
        })
      if (dbError) throw dbError
      setSuccess('Pago registrado correctamente')
      setMontoTotal('')
      setFormaPago('Efectivo')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago')
    } finally {
      setRegistrandoPago(false)
    }
  }, [cliente, montoTotal, formaPago])

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
    <div className="min-h-screen bg-[#F5F7F0] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Cabecera */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#2C3E2D]">{cliente.nombre}</h1>
            <div className="flex gap-2">
              {cliente.telefono && (
                <Button
                  onClick={handleWhatsApp}
                  className="bg-[#25D366] hover:bg-[#1DA851] text-white border-0"
                >
                  Confirmar Cita por WhatsApp
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push('/')}>
                Volver
              </Button>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>
        )}
        {success && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl p-4">{success}</p>
        )}

        {/* Datos del cliente */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2C3E2D] mb-5">Datos del cliente</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Nombre completo</label>
              <input
                className="border border-[#DDE3D8] rounded-lg p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888] focus:border-transparent transition"
                value={cliente.nombre}
                onChange={(e) => handleFieldChange('nombre', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Teléfono</label>
                <input
                  className="border border-[#DDE3D8] rounded-lg p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888] focus:border-transparent transition"
                  value={cliente.telefono || ''}
                  onChange={(e) => handleFieldChange('telefono', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Email</label>
                <input
                  className="border border-[#DDE3D8] rounded-lg p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888] focus:border-transparent transition"
                  type="email"
                  value={cliente.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Notas privadas</label>
              <textarea
                className="border border-[#DDE3D8] rounded-lg p-3 w-full text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#8BA888] focus:border-transparent transition resize-y"
                value={cliente.notas_privadas || ''}
                onChange={(e) => handleFieldChange('notas_privadas', e.target.value)}
              />
            </div>

            <Button type="submit" disabled={saving} className="bg-[#2C3E2D] hover:bg-[#1A2B1B] text-white border-0">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </div>

        {/* Cierre de consulta */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2C3E2D] mb-5">Cierre de consulta</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Monto total (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="border border-[#DDE3D8] rounded-lg p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA888] focus:border-transparent transition"
                placeholder="0.00"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                disabled={registrandoPago}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Forma de pago</label>
              <select
                className="border border-[#DDE3D8] rounded-lg p-3 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8BA888] focus:border-transparent transition"
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                disabled={registrandoPago}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Bizum">Bizum</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>
          </div>
          <Button onClick={handleRegistrarPago} disabled={!montoTotal || registrandoPago} className="bg-[#7A9A7A] hover:bg-[#6A8A6A] text-white border-0">
            {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
          </Button>
        </div>

        {/* Subir imagen */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2C3E2D] mb-5">Subir imagen</h2>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
              className="text-sm text-[#5A6B5A] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#EDF0EA] file:text-[#2C3E2D] hover:file:bg-[#DDE3D8] transition"
            />
            <Button onClick={handleUpload} disabled={!file || uploading} variant="outline">
              {uploading ? 'Subiendo...' : 'Subir foto'}
            </Button>
          </div>

          {imagenes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#5A6B5A] mb-3">Fotos subidas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagenes.map((img) => (
                  <div key={img.id} className="border border-[#DDE3D8] rounded-lg overflow-hidden bg-white">
                    <img
                      src={img.url_imagen}
                      alt={img.descripcion || 'Foto'}
                      className="w-full h-36 object-cover"
                    />
                    {img.descripcion && (
                      <p className="text-xs text-[#8A9A8A] p-2 truncate">{img.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
