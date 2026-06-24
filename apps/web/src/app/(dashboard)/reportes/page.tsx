'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { createClient }     from '@/lib/supabase/client'
import { TablaReporte }     from '@/components/reportes/TablaReporte'
import { ReportesSkeleton } from '@/components/ui/skeletons/ReportesSkeleton'
import { formatCurrency }   from '@/lib/utils'

type VentaDia = {
  fecha:   string
  total:   number
  tickets: number
}

type ProductoTop = {
  nombre:         string
  total_vendido:  number
  total_ingresos: number
}

type VentaCajero = {
  cajero:  string
  tickets: number
  total:   number
}

type ResumenSucursal = {
  sucursal: string
  tickets:  number
  total:    number
}

type Sucursal = {
  id:     string
  nombre: string
}

const PERIODOS = [
  { label: 'Últimos 7 días',  dias: 7  },
  { label: 'Últimos 30 días', dias: 30 },
  { label: 'Últimos 90 días', dias: 90 },
]

export default function ReportesPage() {
  const [loading,          setLoading]          = useState(true)
  const [periodo,          setPeriodo]          = useState(30)
  const [sucursales,       setSucursales]       = useState<Sucursal[]>([])
  const [sucursalId,       setSucursalId]       = useState('')
  const [ventasDia,        setVentasDia]        = useState<VentaDia[]>([])
  const [productosTop,     setProductosTop]     = useState<ProductoTop[]>([])
  const [ventasCajero,     setVentasCajero]     = useState<VentaCajero[]>([])
  const [resumenSucursales, setResumenSucursales] = useState<ResumenSucursal[]>([])
  const [totalPeriodo,     setTotalPeriodo]     = useState(0)
  const [ticketsPeriodo,   setTicketsPeriodo]   = useState(0)
  const [dropdownAbierto,  setDropdownAbierto]  = useState(false)
  const supabaseRef = useRef(createClient())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  useEffect(() => {
    let activo = true
    async function init() {
      const supabase = supabaseRef.current
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('sucursal_id')
        .eq('id', user.id)
        .single()

      if (perfil?.sucursal_id && activo) {
        setSucursalId(perfil.sucursal_id)
      }

      const { data: sucs } = await supabase
        .from('sucursales')
        .select('id, nombre')
        .eq('activa', true)
        .order('nombre')
      if (activo && sucs) setSucursales(sucs)
    }
    init()
    return () => { activo = false }
  }, [])

 useEffect(() => {
  if (!sucursalId) return
  let activo = true

  async function cargar() {
    setLoading(true)
    const supabase = supabaseRef.current

    try {
      const [dias, top, cajero, global] = await Promise.all([
        supabase.rpc('get_ventas_por_dia',     { p_sucursal_id: sucursalId, p_dias: periodo }),
        supabase.rpc('get_productos_top',      { p_sucursal_id: sucursalId, p_dias: periodo }),
        supabase.rpc('get_ventas_por_cajero',  { p_sucursal_id: sucursalId, p_dias: periodo }),
        supabase.rpc('get_resumen_sucursales', { p_dias: periodo }),
      ])

      if (!activo) return

      if (dias.data)   setVentasDia(dias.data as VentaDia[])
      if (top.data)    setProductosTop(top.data as ProductoTop[])
      if (cajero.data) setVentasCajero(cajero.data as VentaCajero[])
      if (global.data) setResumenSucursales(global.data as ResumenSucursal[])

      const totalSum   = (dias.data as VentaDia[] ?? []).reduce((a, b) => a + Number(b.total), 0)
      const ticketsSum = (dias.data as VentaDia[] ?? []).reduce((a, b) => a + Number(b.tickets), 0)
      setTotalPeriodo(totalSum)
      setTicketsPeriodo(ticketsSum)
    } finally {
      if (activo) setLoading(false)
    }
  }

  cargar()
  return () => { activo = false }
}, [sucursalId, periodo])

  if (loading && ventasDia.length === 0) return <ReportesSkeleton />

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Reportes</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Análisis de ventas e inventario
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl">
          {PERIODOS.map(p => (
            <button
              key={p.dias}
              onClick={() => setPeriodo(p.dias)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                periodo === p.dias
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownAbierto(v => !v)}
            className="flex items-center justify-between gap-2 px-3 py-2 border
                       border-border rounded-xl text-sm bg-surface text-text-primary
                       hover:bg-hover transition-colors min-w-44"
          >
            {sucursales.find(s => s.id === sucursalId)?.nombre ?? 'Seleccionar sucursal'}
            <ChevronDown
              size={15}
              className={`text-text-tertiary transition-transform duration-200 shrink-0 ${
                dropdownAbierto ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div
            className={`absolute top-full left-0 right-0 mt-1.5 bg-surface border
                        border-border rounded-xl shadow-lg z-20 overflow-hidden
                        origin-top transition-all duration-150 ${
              dropdownAbierto
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <div className="py-1 max-h-60 overflow-y-auto">
              {sucursales.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSucursalId(s.id)
                    setDropdownAbierto(false)
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                             text-sm text-text-primary hover:bg-hover transition-colors text-left"
                >
                  {s.nombre}
                  {sucursalId === s.id && (
                    <Check size={14} className="text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs del período */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary mb-1">Total vendido</p>
          <p className="text-2xl font-semibold text-text-primary font-mono">
            {formatCurrency(totalPeriodo)}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary mb-1">Tickets emitidos</p>
          <p className="text-2xl font-semibold text-text-primary font-mono">
            {ticketsPeriodo.toLocaleString('es-MX')}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary mb-1">Ticket promedio</p>
          <p className="text-2xl font-semibold text-text-primary font-mono">
            {ticketsPeriodo > 0
              ? formatCurrency(totalPeriodo / ticketsPeriodo)
              : '$0.00'}
          </p>
        </div>
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <TablaReporte
          titulo="Ventas por día"
          columnas={[
            { key: 'fecha',   label: 'Fecha'   },
            { key: 'tickets', label: 'Tickets', align: 'right', format: 'number' },
            { key: 'total',   label: 'Total',   align: 'right', format: 'currency' },
          ]}
          datos={ventasDia as unknown as Record<string, unknown>[]}
        />

        <TablaReporte
          titulo="Productos más vendidos"
          columnas={[
            { key: 'nombre',         label: 'Producto'  },
            { key: 'total_vendido',  label: 'Cantidad', align: 'right', format: 'number'   },
            { key: 'total_ingresos', label: 'Ingresos', align: 'right', format: 'currency' },
          ]}
          datos={productosTop as unknown as Record<string, unknown>[]}
        />

        <TablaReporte
          titulo="Ventas por cajero"
          columnas={[
            { key: 'cajero',  label: 'Cajero'  },
            { key: 'tickets', label: 'Tickets', align: 'right', format: 'number'   },
            { key: 'total',   label: 'Total',   align: 'right', format: 'currency' },
          ]}
          datos={ventasCajero as unknown as Record<string, unknown>[]}
        />

        <TablaReporte
          titulo="Comparativa por sucursal"
          columnas={[
            { key: 'sucursal', label: 'Sucursal' },
            { key: 'tickets',  label: 'Tickets',  align: 'right', format: 'number'   },
            { key: 'total',    label: 'Total',     align: 'right', format: 'currency' },
          ]}
          datos={resumenSucursales as unknown as Record<string, unknown>[]}
        />

      </div>
    </div>
  )
}