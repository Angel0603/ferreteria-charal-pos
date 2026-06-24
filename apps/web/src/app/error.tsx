'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('Error global:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-base flex items-center justify-center p-6">
          <div className="text-center max-w-md">

            <div className="w-16 h-16 rounded-2xl bg-danger-soft flex items-center
                            justify-center mx-auto mb-6">
              <AlertTriangle size={28} className="text-danger" />
            </div>

            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Error del servidor
            </h1>
            <p className="text-sm text-text-secondary mb-2">
              Ocurrió un error inesperado. Puedes intentar recargar la página.
            </p>
            {error.digest && (
              <p className="text-xs text-text-tertiary font-mono mb-8">
                Código: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white
                         rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              <RotateCcw size={14} />
              Intentar de nuevo
            </button>

          </div>
        </div>
      </body>
    </html>
  )
}