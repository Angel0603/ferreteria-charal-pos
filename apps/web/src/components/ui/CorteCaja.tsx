'use client'

import { useState, useRef } from 'react'
import { X, Printer, TrendingUp, CreditCard, Banknote, Landmark, Shuffle, HandCoins, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

type CorteCajaData = {
  fecha:        string
  total:        number
  tickets:      number
  efectivo:     number
  tarjeta:      number
  transferencia: number
  mixto:        number
  credito:      number
}

type Props = {
  sucursalId:    string
  sucursalNombre: string
  onClose:       () => void
}

const METODOS = [
  { key: 'efectivo',      label: 'Efectivo',      icon: <Banknote size={15} /> },
  { key: 'tarjeta',       label: 'Tarjeta',        icon: <CreditCard size={15} /> },
  { key: 'transferencia', label: 'Transferencia',  icon: <Landmark size={15} /> },
  { key: 'mixto',         label: 'Mixto',          icon: <Shuffle size={15} /> },
  { key: 'credito',       label: 'Crédito',        icon: <HandCoins size={15} /> },
]

export function CorteCaja({ sucursalId, sucursalNombre, onClose }: Props) {
  const [data,    setData]    = useState<CorteCajaData | null>(null)
  const [loading, setLoading] = useState(false)
  const supabaseRef = useRef(createClient())

  async function handleCorte() {
    setLoading(true)
    try {
      const { data: result, error } = await supabaseRef.current
        .rpc('get_corte_caja', { p_sucursal_id: sucursalId })

      if (error) throw error
      setData(result as CorteCajaData)
    } catch {
      toast.error('Error al generar el corte de caja')
    } finally {
      setLoading(false)
    }
  }

  function handleImprimir() {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Receipt size={17} className="text-accent" />
            <h2 className="font-medium text-text-primary">Corte de caja</h2>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {!data ? (
            <>
              <div className="bg-surface-2 rounded-xl p-4 text-center space-y-1">
                <p className="text-sm font-medium text-text-primary">{sucursalNombre}</p>
                <p className="text-xs text-text-tertiary">
                  {new Date().toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric',
                    month: 'long', day: 'numeric'
                  })}
                </p>
              </div>

              <p className="text-sm text-text-secondary text-center">
                Genera el corte de caja del día actual con el resumen
                de ventas por método de pago.
              </p>

              <button
                onClick={handleCorte}
                disabled={loading}
                className="w-full py-3 bg-accent text-white rounded-xl text-sm
                           font-medium hover:bg-accent-hover transition-colors
                           disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <TrendingUp size={16} />
                {loading ? 'Generando...' : 'Generar corte del día'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-surface-2 rounded-xl p-4 text-center space-y-1">
                <p className="text-sm font-medium text-text-primary">{sucursalNombre}</p>
                <p className="text-xs text-text-tertiary">
                  {new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric',
                    month: 'long', day: 'numeric'
                  })}
                </p>
              </div>

              {/* Total y tickets */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent-soft rounded-xl p-4 text-center">
                  <p className="text-xs text-accent-soft-text mb-1">Total vendido</p>
                  <p className="text-xl font-semibold text-accent font-mono">
                    {formatCurrency(data.total)}
                  </p>
                </div>
                <div className="bg-surface-2 rounded-xl p-4 text-center">
                  <p className="text-xs text-text-secondary mb-1">Tickets emitidos</p>
                  <p className="text-xl font-semibold text-text-primary font-mono">
                    {data.tickets}
                  </p>
                </div>
              </div>

              {/* Desglose por método de pago */}
              <div className="bg-surface-2 rounded-xl overflow-hidden">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide px-4 py-2.5 border-b border-border">
                  Desglose por método de pago
                </p>
                <div className="divide-y divide-border">
                  {METODOS.map(m => {
                    const monto = data[m.key as keyof CorteCajaData] as number
                    if (monto === 0) return null
                    return (
                      <div key={m.key} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5 text-text-secondary">
                          {m.icon}
                          <span className="text-sm">{m.label}</span>
                        </div>
                        <span className="text-sm font-medium text-text-primary font-mono">
                          {formatCurrency(monto)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setData(null)}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm
                             font-medium text-text-secondary hover:bg-hover transition-colors"
                >
                  Nuevo corte
                </button>
                <button
                  onClick={handleImprimir}
                  className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm
                             font-medium hover:bg-accent-hover transition-colors
                             flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  Imprimir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}