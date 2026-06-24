'use client'

import { RefreshCw } from 'lucide-react'

type Props = {
  online:        boolean
  sincronizando: boolean
  pendientes:    number
  onSincronizar: () => void
}

export function BannerConexion({
  online, sincronizando, pendientes, onSincronizar
}: Props) {
  if (online && pendientes === 0 && !sincronizando) return null

  if (!online) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border
                      border-amber-200 rounded-lg text-xs text-amber-700">
        <span className="shrink-0">📡</span>
        <span className="font-medium">Sin conexión</span>
        {pendientes > 0 && (
          <span className="text-amber-600">
            · {pendientes} venta{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    )
  }

  if (sincronizando) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border
                      border-blue-200 rounded-lg text-xs text-blue-700">
        <RefreshCw size={13} className="animate-spin shrink-0" />
        <span>Sincronizando...</span>
      </div>
    )
  }

  if (pendientes > 0) {
    return (
      <button
        onClick={onSincronizar}
        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border
                   border-amber-200 rounded-lg text-xs text-amber-700
                   hover:bg-amber-100 transition-colors"
      >
        <RefreshCw size={13} className="shrink-0" />
        <span className="font-medium">
          {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
        </span>
        <span className="text-amber-500">· Sincronizar</span>
      </button>
    )
  }

  return null
}