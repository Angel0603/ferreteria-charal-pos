'use client'

import { useEffect } from 'react'

type Atajos = {
  onBuscar:         () => void
  onCliente:        () => void
  onDescuento:      () => void
  onProductoVario:  () => void
  onCobrar:         () => void
  onCancelar:       () => void
}

export function useTeclado(atajos: Atajos) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      const enInput = tag === 'input' || tag === 'textarea'

      switch (e.key) {
        case 'F2':
          e.preventDefault()
          atajos.onBuscar()
          break
        case 'F4':
          e.preventDefault()
          atajos.onCliente()
          break
        case 'F6':
          e.preventDefault()
          atajos.onProductoVario()
          break
        case 'F8':
          e.preventDefault()
          atajos.onDescuento()
          break
        case 'F10':
          e.preventDefault()
          atajos.onCobrar()
          break
        case 'Escape':
          if (!enInput) {
            e.preventDefault()
            atajos.onCancelar()
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [atajos])
}