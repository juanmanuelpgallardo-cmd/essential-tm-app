'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"

type Ingreso = {
  id: string
  cliente_id: string
  monto_total: number
  forma_pago: string
  notas_pago: string | null
  creado_el: string
  clientes: { nombre: string } | null
}

type Totales = {
  efectivo: number
  bizum: number
  tarjeta: number
  general: number
  hoy: number
  mes: number
}

export default function PanelIngresos() {
  const router = useRouter()
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [totales, setTotales] = useState<Totales>({ efectivo: 0, bizum: 0, tarjeta: 0, general: 0, hoy: 0, mes: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error: err } = await supabase
          .from('ingresos_caja')
          .select('*, clientes(nombre)')
          .order('creado_el', { ascending: false })
          .limit(100)

        if (err) throw err

        const lista = (data || []) as Ingreso[]
        setIngresos(lista)

        const hoy = new Date()
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

        const totalesCalc = lista.reduce(
          (acc, ing) => {
            const monto = Number(ing.monto_total) || 0
            acc.general += monto
            if (ing.forma_pago === 'Efectivo') acc.efectivo += monto
            if (ing.forma_pago === 'Bizum') acc.bizum += monto
            if (ing.forma_pago === 'Tarjeta') acc.tarjeta += monto

            const fecha = new Date(ing.creado_el)
            if (fecha.toDateString() === hoy.toDateString()) acc.hoy += monto
            if (fecha >= inicioMes) acc.mes += monto

            return acc
          },
          { efectivo: 0, bizum: 0, tarjeta: 0, general: 0, hoy: 0, mes: 0 }
        )

        setTotales(totalesCalc)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar ingresos')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const formatear = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E8E4D9]">
        <p className="text-[#8A9A8A]">Cargando ingresos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8E4D9] p-4">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push('/')} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0">Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E8E4D9] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cabecera */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#3A5A40]">Panel de Ingresos</h1>
            <Button variant="outline" onClick={() => router.push('/')} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0">
              Volver
            </Button>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 text-center">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Hoy</p>
            <p className="text-2xl font-bold text-[#1F2937]">{formatear(totales.hoy)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 text-center">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Este mes</p>
            <p className="text-2xl font-bold text-[#1F2937]">{formatear(totales.mes)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 text-center">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Total general</p>
            <p className="text-2xl font-bold text-[#1F2937]">{formatear(totales.general)}</p>
          </div>
        </div>

        {/* Desglose por método de pago */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 border-l-4 border-l-[#7A9A7A]">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Efectivo</p>
            <p className="text-xl font-bold text-[#1F2937]">{formatear(totales.efectivo)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 border-l-4 border-l-[#5B8DEF]">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Bizum</p>
            <p className="text-xl font-bold text-[#1F2937]">{formatear(totales.bizum)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 border-l-4 border-l-[#D4A373]">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Tarjeta</p>
            <p className="text-xl font-bold text-[#1F2937]">{formatear(totales.tarjeta)}</p>
          </div>
        </div>

        {/* Historial de pagos */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3A5A40] mb-5">Historial de pagos</h2>

          {ingresos.length === 0 ? (
            <p className="text-[#8A9A8A] text-center py-8">No hay pagos registrados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-[#8A9A8A]">
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Monto</th>
                    <th className="pb-3 font-medium">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos.map((ing) => (
                    <tr key={ing.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 text-[#5A6B5A]">
                        {new Date(ing.creado_el).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 font-medium text-[#1F2937]">
                        {ing.clientes?.nombre || '—'}
                      </td>
                      <td className="py-3 font-semibold text-[#1F2937]">
                        {formatear(Number(ing.monto_total))}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ing.forma_pago === 'Efectivo' ? 'bg-[#EDF0EA] text-[#7A9A7A]' :
                          ing.forma_pago === 'Bizum' ? 'bg-[#E8EEFA] text-[#5B8DEF]' :
                          'bg-[#FCF4EB] text-[#D4A373]'
                        }`}>
                          {ing.forma_pago}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
