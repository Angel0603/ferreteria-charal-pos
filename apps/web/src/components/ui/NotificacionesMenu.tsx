'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, AlertTriangle, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Notificacion = {
  id:     string
  tipo:   'stock' | 'credito'
  titulo: string
  detalle: string
  href:   string
}

export function NotificacionesMenu({ sucursalId }: { sucursalId: string }) {
  const [abierto,        setAbierto]        = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const supabaseRef = useRef(createClient())
  const menuRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sucursalId) return
    let activo = true

    async function cargar() {
      const supabase = supabaseRef.current

      const { data: stockData } = await supabase
        .from('inventario')
        .select('cantidad, productos(nombre, stock_minimo)')
        .eq('sucursal_id', sucursalId)

      const { data: clientesData } = await supabase
        .from('clientes')
        .select('nombre, saldo_credito, limite_credito')
        .eq('sucursal_id', sucursalId)
        .gt('saldo_credito', 0)

      if (!activo) return

      const notifs: Notificacion[] = []

      if (stockData) {
        const bajos = (stockData as unknown as {
          cantidad: number
          productos: { nombre: string; stock_minimo: number } |
                     { nombre: string; stock_minimo: number }[]
        }[]).filter(i => {
          const p = Array.isArray(i.productos) ? i.productos[0] : i.productos
          return i.cantidad <= p.stock_minimo
        })

        if (bajos.length > 0) {
          notifs.push({
            id:      'stock-bajo',
            tipo:    'stock',
            titulo:  `${bajos.length} producto${bajos.length !== 1 ? 's' : ''} con stock bajo`,
            detalle: 'Revisa el inventario para reabastecer',
            href:    '/inventario',
          })
        }
      }

      if (clientesData) {
        const sobreLimite = clientesData.filter(
          c => c.limite_credito > 0 && c.saldo_credito >= c.limite_credito
        )
        if (sobreLimite.length > 0) {
          notifs.push({
            id:      'credito-limite',
            tipo:    'credito',
            titulo:  `${sobreLimite.length} cliente${sobreLimite.length !== 1 ? 's' : ''} al límite de crédito`,
            detalle: 'Considera solicitar un abono',
            href:    '/clientes',
          })
        }
      }

      setNotificaciones(notifs)
    }

    cargar()
    const interval = setInterval(cargar, 60_000)
    return () => { activo = false; clearInterval(interval) }
  }, [sucursalId])

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setAbierto(v => !v)}
        aria-label="Notificaciones"
        className="relative w-8 h-8 rounded-lg border border-border text-text-secondary
                   hover:bg-hover hover:text-text-primary transition-colors
                   flex items-center justify-center"
      >
        <Bell size={15} />
        {notificaciones.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-3.75 h-3.75 px-1
                           rounded-full bg-danger text-white text-[9px] font-medium
                           flex items-center justify-center">
            {notificaciones.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border
                        rounded-xl overflow-hidden z-50">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-sm font-medium text-text-primary">Notificaciones</p>
          </div>
          {notificaciones.length === 0 ? (
            <div className="px-4 py-6 text-center text-text-tertiary text-sm">
              No hay notificaciones nuevas
            </div>
          ) : (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {notificaciones.map(n => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setAbierto(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-hover transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    n.tipo === 'stock' ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger'
                  }`}>
                    {n.tipo === 'stock'
                      ? <AlertTriangle size={14} />
                      : <CreditCard size={14} />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{n.titulo}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{n.detalle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}