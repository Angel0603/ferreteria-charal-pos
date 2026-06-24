'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, ChevronLeft, ChevronRight, CreditCard, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { Database } from '@repo/types'

type Cliente = Database['public']['Tables']['clientes']['Row']

type Movimiento = {
  id:          string
  tipo:        'cargo' | 'abono'
  monto:       number
  saldo_previo: number
  saldo_nuevo:  number
  notas:       string | null
  metodo_pago: string | null
  referencia:  string | null
  created_at:  string
}

const POR_PAGINA = 10

export default function ClienteDetallePage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params.id as string
  const supabaseRef = useRef(createClient())

  const [cliente,      setCliente]      = useState<Cliente | null>(null)
  const [movimientos,  setMovimientos]  = useState<Movimiento[]>([])
  const [loading,      setLoading]      = useState(true)
  const [pagina,       setPagina]       = useState(0)
  const [total,        setTotal]        = useState(0)

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  useEffect(() => {
    let activo = true
    async function cargar() {
      setLoading(true)
      const supabase = supabaseRef.current

      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single()

      if (!activo) return
      if (clienteData) setCliente(clienteData)

      const desde = pagina * POR_PAGINA
      const hasta = desde + POR_PAGINA - 1

      // Traer abonos
      const { data: abonos, count: countAbonos } = await supabase
        .from('abonos')
        .select('id, monto, saldo_previo, saldo_nuevo, notas, metodo_pago, created_at', { count: 'exact' })
        .eq('cliente_id', id)
        .order('created_at', { ascending: false })

      // Traer ventas a crédito
      const { data: cargos, count: countCargos } = await supabase
        .from('ventas_credito')
        .select('id, monto, saldo_previo, saldo_nuevo, created_at', { count: 'exact' })
        .eq('cliente_id', id)
        .order('created_at', { ascending: false })

      if (!activo) return

      // Combinar y ordenar cronológicamente
      const todos: Movimiento[] = [
        ...(abonos ?? []).map(a => ({
          id:           a.id,
          tipo:         'abono' as const,
          monto:        a.monto,
          saldo_previo: a.saldo_previo,
          saldo_nuevo:  a.saldo_nuevo,
          notas:        a.notas,
          metodo_pago:  a.metodo_pago,
          referencia:   null,
          created_at:   a.created_at,
        })),
        ...(cargos ?? []).map(c => ({
          id:           c.id,
          tipo:         'cargo' as const,
          monto:        c.monto,
          saldo_previo: c.saldo_previo,
          saldo_nuevo:  c.saldo_nuevo,
          notas:        null,
          metodo_pago:  null,
          referencia:   null,
          created_at:   c.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setTotal((countAbonos ?? 0) + (countCargos ?? 0))
      setMovimientos(todos.slice(desde, hasta + 1))
      setLoading(false)
    }

    cargar()
    return () => { activo = false }
  }, [id, pagina])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-tertiary text-sm">
        Cargando historial...
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
        <p className="text-sm">Cliente no encontrado</p>
        <button
          onClick={() => router.back()}
          className="mt-3 text-sm text-accent hover:underline"
        >
          Volver
        </button>
      </div>
    )
  }

  const totalAbonado = movimientos
    .filter(m => m.tipo === 'abono')
    .reduce((acc, m) => acc + m.monto, 0)

  const totalCargado = movimientos
    .filter(m => m.tipo === 'cargo')
    .reduce((acc, m) => acc + m.monto, 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-border text-text-secondary
                     hover:bg-hover transition-colors flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{cliente.nombre}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Historial de crédito
            {cliente.telefono && ` · ${cliente.telefono}`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={15} className="text-text-tertiary" />
            <p className="text-xs text-text-secondary">Saldo actual</p>
          </div>
          <p className={`text-2xl font-semibold font-mono ${
            cliente.saldo_credito > 0 ? 'text-danger' : 'text-success'
          }`}>
            {formatCurrency(cliente.saldo_credito)}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={15} className="text-text-tertiary" />
            <p className="text-xs text-text-secondary">Límite de crédito</p>
          </div>
          <p className="text-2xl font-semibold font-mono text-text-primary">
            {cliente.limite_credito > 0
              ? formatCurrency(cliente.limite_credito)
              : '—'}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-danger" />
            <p className="text-xs text-text-secondary">Total cargado</p>
          </div>
          <p className="text-2xl font-semibold font-mono text-danger">
            {formatCurrency(totalCargado)}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={15} className="text-success" />
            <p className="text-xs text-text-secondary">Total abonado</p>
          </div>
          <p className="text-2xl font-semibold font-mono text-success">
            {formatCurrency(totalAbonado)}
          </p>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-text-primary">Movimientos</h2>
        </div>

        {movimientos.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-text-tertiary">
            Sin movimientos registrados
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">Fecha</th>
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">Notas</th>
                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">Monto</th>
                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">Saldo resultante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movimientos.map(m => (
                  <tr key={`${m.tipo}-${m.id}`} className="hover:bg-hover transition-colors">
                    <td className="px-4 py-3 text-xs text-text-tertiary whitespace-nowrap">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        m.tipo === 'abono'
                          ? 'bg-success-soft text-success'
                          : 'bg-danger-soft text-danger'
                      }`}>
                        {m.tipo === 'abono' ? 'Abono' : 'Venta a crédito'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary max-w-48 truncate">
                      {m.metodo_pago
                        ? <span className="capitalize">{m.metodo_pago}</span>
                        : m.notas ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium font-mono ${
                        m.tipo === 'abono' ? 'text-success' : 'text-danger'
                      }`}>
                        {m.tipo === 'abono' ? '-' : '+'}{formatCurrency(m.monto)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium font-mono text-text-primary">
                      {formatCurrency(m.saldo_nuevo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-2">
              <p className="text-xs text-text-tertiary">
                Mostrando {pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, total)} de {total}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="w-7 h-7 rounded-lg border border-border text-text-secondary
                             hover:bg-hover transition-colors disabled:opacity-40
                             disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-text-secondary px-2 font-mono">
                  {pagina + 1} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                  className="w-7 h-7 rounded-lg border border-border text-text-secondary
                             hover:bg-hover transition-colors disabled:opacity-40
                             disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}