'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import BodyMap from './BodyMap'

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  sexo: string | null
  tipo_tratamiento: string | null
  recomendaciones_proxima: string | null
  aparatologia: string | null
  suplementacion_prozis: string | null
  notas_privadas: string | null
  creado_el: string
}

const tiposTratamiento = ['Descontracturante', 'Relajante', 'Deportivo', 'Drenaje Linfático']

const aparatologiaOptions = [
  'Pistola de Percusión',
  'Presoterapia',
  'Radiofrecuencia/Tecar',
  'Ventosas (Cupping)',
]

const prozisOptions = [
  'Colágeno + Magnesio (Cuidado Articular)',
  'Proteína Whey (Recuperación Muscular)',
  'Creatina Monohidrato (Fuerza y Rendimiento)',
  'Omega 3 / Multivitamínico (Antiinflamatorio)',
]

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

  const [aparatologiaSeleccion, setAparatologiaSeleccion] = useState<string[]>([])
  const [prozisSuplemento, setProzisSuplemento] = useState('')
  const [prozisIndicacion, setProzisIndicacion] = useState('')

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
        if (data.aparatologia) {
          setAparatologiaSeleccion(data.aparatologia.split(',').filter(Boolean))
        }
        if (data.suplementacion_prozis) {
          try {
            const parsed = JSON.parse(data.suplementacion_prozis)
            setProzisSuplemento(parsed.suplemento || '')
            setProzisIndicacion(parsed.indicacion || '')
          } catch {
            setProzisSuplemento(data.suplementacion_prozis)
          }
        }
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
          sexo: cliente.sexo,
          tipo_tratamiento: cliente.tipo_tratamiento,
          recomendaciones_proxima: cliente.recomendaciones_proxima,
          aparatologia: aparatologiaSeleccion.length > 0 ? aparatologiaSeleccion.join(',') : null,
          suplementacion_prozis: prozisSuplemento ? JSON.stringify({ suplemento: prozisSuplemento, indicacion: prozisIndicacion }) : null,
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
  }, [cliente, aparatologiaSeleccion, prozisSuplemento, prozisIndicacion])

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
    const soloDigitos = cliente.telefono.replace(/\D/g, '')
    const codigoPais = soloDigitos.startsWith('34') ? '' : '34'
    const telefono = `${codigoPais}${soloDigitos}`
    let textoWhatsApp = `Hola ${cliente.nombre}, te saludamos de Essential TM. Te confirmamos tu sesión de hoy.`
    if (prozisSuplemento) {
      textoWhatsApp += `\n\n💊 Recomendación Prozis para tu recuperación: ${prozisSuplemento}${prozisIndicacion ? ` - ${prozisIndicacion}` : ''}`
    }
    const mensaje = encodeURIComponent(textoWhatsApp)
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank')
  }, [cliente, prozisSuplemento, prozisIndicacion])

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
      <div className="flex items-center justify-center min-h-screen bg-[#E8E4D9]">
        <p className="text-[#8A9A8A] text-sm">Cargando ficha...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8E4D9] p-4">
        <h1 className="text-2xl font-bold text-[#3A5A40] mb-4">Cliente no encontrado</h1>
        <Button onClick={() => router.push('/')}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E8E4D9] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Cabecera */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {cliente.sexo && (
                <span className="text-xl">{cliente.sexo === 'Hombre' ? '♂' : '♀'}</span>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#3A5A40]">{cliente.nombre}</h1>
                {cliente.tipo_tratamiento && (
                  <span className="inline-block mt-1 px-3 py-0.5 bg-[#C99470]/10 text-[#C99470] rounded-full text-xs font-medium">
                    {cliente.tipo_tratamiento}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {cliente.telefono && (
                <Button
                  onClick={handleWhatsApp}
                  className="bg-[#25D366] hover:bg-[#1DA851] text-white border-0 text-sm font-medium"
                >
                  Confirmar Cita por WhatsApp
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push('/')} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0">
                Volver
              </Button>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-2xl p-4">{error}</p>
        )}
        {success && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-2xl p-4">{success}</p>
        )}

        {/* Fila: Datos del cliente + Mapa Anatómico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datos del cliente */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-[#3A5A40] mb-5">Datos del cliente</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Nombre completo</label>
                  <input
                    className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
                    value={cliente.nombre}
                    onChange={(e) => handleFieldChange('nombre', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Teléfono</label>
                  <input
                    className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
                    value={cliente.telefono || ''}
                    onChange={(e) => handleFieldChange('telefono', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Email</label>
                  <input
                    className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
                    type="email"
                    value={cliente.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Selector de Sexo */}
              <div>
                <label className="block text-sm font-medium text-[#5A6B5A] mb-2">Sexo</label>
                <div className="flex gap-3">
                  {['Hombre', 'Mujer'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleFieldChange('sexo', cliente.sexo === s ? '' : s)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition ${
                        cliente.sexo === s
                          ? 'bg-[#C99470] text-white border-[#C99470] shadow-sm'
                          : 'bg-gray-50 text-[#5A6B5A] border-gray-200 hover:border-[#C99470] hover:text-[#C99470]'
                      }`}
                    >
                      <span className="text-base">{s === 'Hombre' ? '♂' : '♀'}</span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Notas privadas</label>
                <textarea
                  className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] placeholder:text-[#9CA3AF] min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition resize-y"
                  value={cliente.notas_privadas || ''}
                  onChange={(e) => handleFieldChange('notas_privadas', e.target.value)}
                />
              </div>

              <Button type="submit" disabled={saving} className="bg-[#C99470] hover:bg-[#B88363] text-white border-0 text-sm font-medium">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          </div>

          {/* Mapa Anatómico */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <BodyMap sexo={cliente.sexo || 'Mujer'} />
          </div>
        </div>

        {/* Tratamiento Actual */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3A5A40] mb-5">Tratamiento Actual</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Tipo de tratamiento</label>
              <select
                className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
                value={cliente.tipo_tratamiento || ''}
                onChange={(e) => handleFieldChange('tipo_tratamiento', e.target.value)}
              >
                <option value="">Seleccionar tratamiento...</option>
                {tiposTratamiento.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Recomendaciones próxima consulta</label>
              <textarea
                className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] placeholder:text-[#9CA3AF] min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition resize-y"
                placeholder="Ej: Realizar estiramientos diarios, aplicar calor local, evitar esfuerzos..."
                value={cliente.recomendaciones_proxima || ''}
                onChange={(e) => handleFieldChange('recomendaciones_proxima', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Aparatología */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3A5A40] mb-5">Aparatología</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aparatologiaOptions.map((opt) => {
              const checked = aparatologiaSeleccion.includes(opt)
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                    checked
                      ? 'bg-[#C99470]/5 border-[#C99470]'
                      : 'bg-gray-50 border-gray-200 hover:border-[#C99470]'
                  }`}
                >
                  <div
                    onClick={() => {
                      setAparatologiaSeleccion((prev) =>
                        prev.includes(opt) ? prev.filter((a) => a !== opt) : [...prev, opt]
                      )
                    }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${
                      checked
                        ? 'bg-[#C99470] border-[#C99470] text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${checked ? 'text-[#C99470]' : 'text-[#5A6B5A]'}`}>
                    {opt}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Suplementación Prozis */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
          <div className="flex items-start justify-between mb-5">
            <h2 className="text-lg font-semibold text-[#3A5A40]">Suplementación Prozis</h2>
            <span className="px-2.5 py-1 bg-[#111827] text-white text-[10px] font-bold uppercase tracking-wider rounded-md leading-relaxed">
              PROZIS PARTNER
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Producto recomendado</label>
              <select
                className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent focus:bg-white transition"
                value={prozisSuplemento}
                onChange={(e) => setProzisSuplemento(e.target.value)}
              >
                <option value="">Seleccionar suplemento...</option>
                {prozisOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Indicación de uso</label>
              <input
                className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent focus:bg-white transition"
                placeholder="según indicaciones"
                value={prozisIndicacion}
                onChange={(e) => setProzisIndicacion(e.target.value)}
              />
            </div>
          </div>

          {prozisSuplemento && (
            <div className="mt-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#111827] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">{prozisSuplemento}</p>
                {prozisIndicacion && (
                  <p className="text-xs text-[#5A6B5A] mt-0.5">Uso: {prozisIndicacion}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cierre de consulta */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3A5A40] mb-5">Cierre de consulta</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Monto total (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
                placeholder="0.00"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                disabled={registrandoPago}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A6B5A] mb-1.5">Forma de pago</label>
              <select
                className="border border-gray-200 bg-gray-50 rounded-lg p-3 w-full text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#C99470] focus:border-transparent focus:bg-white transition"
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
          <Button onClick={handleRegistrarPago} disabled={!montoTotal || registrandoPago} className="bg-[#C99470] hover:bg-[#B88363] text-white border-0 text-sm font-medium">
            {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
          </Button>
        </div>

        {/* Subir imagen */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3A5A40] mb-5">Subir imagen</h2>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
              className="text-sm text-[#5A6B5A] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#C99470] file:text-white hover:file:bg-[#B88363] transition"
            />
            <Button onClick={handleUpload} disabled={!file || uploading} variant="outline" className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0 text-sm font-medium">
              {uploading ? 'Subiendo...' : 'Subir foto'}
            </Button>
          </div>

          {imagenes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#5A6B5A] mb-3">Fotos subidas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagenes.map((img) => (
                  <div key={img.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
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
