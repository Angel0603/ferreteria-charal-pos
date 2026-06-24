'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error('Error en dashboard:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">

      <div className="w-14 h-14 rounded-2xl bg-danger-soft flex items-center
                      justify-center mb-5">
        <AlertTriangle size={24} className="text-danger" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Algo salió mal
      </h2>
      <p className="text-sm text-text-secondary max-w-sm mb-2">
        Ocurrió un error al cargar este módulo. Puedes intentar de nuevo
        o regresar al dashboard.
      </p>
      {error.digest && (
        <p className="text-xs text-text-tertiary font-mono mb-6">
          Código: {error.digest}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white
                     rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <RotateCcw size={14} />
          Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-border
                     text-text-secondary rounded-xl text-sm font-medium
                     hover:bg-hover transition-colors"
        >
          <ArrowLeft size={14} />
          Ir al dashboard
        </Link>
      </div>

    </div>
  )
}