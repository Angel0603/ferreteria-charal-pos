'use client'

import { useEffect, useRef, useState } from 'react'

export function useEscalaAutomatica<T extends HTMLElement>(
  anchoOriginal:    number,
  anchoDisponible:  number,
  altoDisponible:   number,
) {
  const contenidoRef = useRef<T>(null)
  const [escala, setEscala] = useState(1)

  useEffect(() => {
    function recalcular() {
      const el = contenidoRef.current
      if (!el) return
      const altoReal = el.scrollHeight

      const escalaPorAncho = anchoDisponible / anchoOriginal
      const escalaPorAlto  = altoDisponible  / altoReal

      setEscala(Math.min(escalaPorAncho, escalaPorAlto, 1))
    }

    recalcular()

    const observer = new ResizeObserver(recalcular)
    if (contenidoRef.current) observer.observe(contenidoRef.current)
    window.addEventListener('resize', recalcular)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recalcular)
    }
  }, [anchoOriginal, anchoDisponible, altoDisponible])

  return { contenidoRef, escala }
}