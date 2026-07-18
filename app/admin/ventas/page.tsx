'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"

type Producto = {
  id: string
  nombre: string
  precio: number
  stock: number
}

type Venta = {
  id: string
  producto_id: string
  cliente_id: string
  cantidad: number
  monto_total: number
  forma_pago: string
  vendedor_email: string
  creado_el: string
  productos_prozis: { nombre: string } | null
  clientes: { nombre: string } | null
}

type Resumen = {
  totalFacturado: number
  unidadesVendidas: number
}

export default function PanelVentas() {
  const router = useRouter()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [resumen, setResumen] = useState<Resumen>({ totalFacturado: 0, unidadesVendidas: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [ventasRes, productosRes] = await Promise.all([
          supabase
            .from('ventas_productos')
            .select('*, productos_prozis(nombre), clientes(nombre)')
            .order('creado_el', { ascending: false })
            .limit(200),
          supabase
            .from('productos_prozis')
            .select('*')
            .order('nombre', { ascending: true }),
        ])

        if (ventasRes.error) throw ventasRes.error
        if (productosRes.error) throw productosRes.error

        const listaVentas = (ventasRes.data || []) as Venta[]
        const listaProductos = (productosRes.data || []) as Producto[]

        setVentas(listaVentas)
        setProductos(listaProductos)

        const totalFacturado = listaVentas.reduce((sum, v) => sum + Number(v.monto_total), 0)
        const unidadesVendidas = listaVentas.reduce((sum, v) => sum + v.cantidad, 0)
        setResumen({ totalFacturado, unidadesVendidas })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const formatear = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

  const productosStockCero = productos.filter((p) => p.stock === 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E8E4D9]">
        <p className="text-[#8A9A8A] text-sm">Cargando ventas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E8E4D9] p-4">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push('/')} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0">
          Volver al inicio
        </Button>
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
              <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#3A5A40]">Panel Ventas Prozis</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/')} className="bg-[#5C6B73] hover:bg-[#4A5A63] text-white border-0">
              Volver
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-2xl p-4">{error}</p>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Total Facturado</p>
            <p className="text-2xl font-bold text-[#3A5A40]">{formatear(resumen.totalFacturado)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Unidades Vendidas</p>
            <p className="text-2xl font-bold text-[#3A5A40]">{resumen.unidadesVendidas}</p>
          </div>
          <div className={`rounded-2xl shadow-sm p-5 border ${productosStockCero.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <p className="text-xs font-medium text-[#8A9A8A] uppercase tracking-wide mb-1">Stock Crítico</p>
            {productosStockCero.length > 0 ? (
              <div>
                <p className="text-2xl font-bold text-red-600">{productosStockCero.length} producto{productosStockCero.length !== 1 ? 's' : ''}</p>
                <ul className="mt-2 space-y-1">
                  {productosStockCero.map((p) => (
                    <li key={p.id} className="text-xs text-red-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {p.nombre}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-lg font-bold text-[#3A5A40]">Sin incidencias</p>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3A5A40] mb-4">Inventario de Productos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[#8A9A8A]">
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Precio</th>
                  <th className="pb-3 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[#8A9A8A]">No hay productos registrados.</td>
                  </tr>
                ) : (
                  productos.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 font-medium text-[#1F2937]">{p.nombre}</td>
                      <td className="py-3 text-[#5A6B5A]">{formatear(p.precio)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : p.stock <= 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            p.stock === 0 ? 'bg-red-500' : p.stock <= 3 ? 'bg-amber-500' : 'bg-green-500'
                          }`} />
                          {p.stock === 0 ? 'Sin stock' : `${p.stock} uds`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de ventas */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3A5A40] mb-5">Historial de Ventas</h2>

          {ventas.length === 0 ? (
            <p className="text-[#8A9A8A] text-center py-8">No hay ventas registradas aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-[#8A9A8A]">
                    <th className="pb-3 font-medium whitespace-nowrap">Fecha</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Cliente</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Producto</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Cantidad</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Total</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Pago</th>
                    <th className="pb-3 font-medium whitespace-nowrap">Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 text-[#5A6B5A] whitespace-nowrap text-xs">
                        {new Date(v.creado_el).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 font-medium text-[#1F2937] whitespace-nowrap">
                        {v.clientes?.nombre || '—'}
                      </td>
                      <td className="py-3 text-[#5A6B5A] whitespace-nowrap">
                        {v.productos_prozis?.nombre || '—'}
                      </td>
                      <td className="py-3 text-[#5A6B5A] whitespace-nowrap">{v.cantidad}</td>
                      <td className="py-3 font-semibold text-[#1F2937] whitespace-nowrap">
                        {formatear(Number(v.monto_total))}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.forma_pago === 'Efectivo' ? 'bg-[#EDF0EA] text-[#7A9A7A]' :
                          v.forma_pago === 'Bizum' ? 'bg-[#E8EEFA] text-[#5B8DEF]' :
                          'bg-[#FCF4EB] text-[#D4A373]'
                        }`}>
                          {v.forma_pago}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-[#8A9A8A] whitespace-nowrap">{v.vendedor_email}</td>
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
