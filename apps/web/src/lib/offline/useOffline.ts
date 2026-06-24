'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useConexion } from './useConexion'
import {
  sincronizarDatosLocales,
  enviarVentasPendientes,
  getPendientesCount,
} from './syncService'
import { toast } from 'sonner'

export function useOffline(sucursalId: string) {
  const { online, verificando }           = useConexion()
  const [sincronizando, setSincronizando] = useState(false)
  const [pendientes,    setPendientes]    = useState(0)
  const [ultimaSync,    setUltimaSync]    = useState<Date | null>(null)
  const eraOffline     = useRef(false)
  const sincronizandoRef = useRef(false)
  const sucursalIdRef  = useRef(sucursalId)

  useEffect(() => { sucursalIdRef.current = sucursalId }, [sucursalId])

  const sincronizar = useCallback(async () => {
    if (!navigator.onLine || !sucursalIdRef.current || sincronizandoRef.current) return

    sincronizandoRef.current = true
    setSincronizando(true)

    try {
      const { enviadas, errores } = await enviarVentasPendientes()

      if (enviadas > 0) {
        toast.success(`${enviadas} venta${enviadas !== 1 ? 's' : ''} sincronizada${enviadas !== 1 ? 's' : ''}`)
      }
      if (errores > 0) {
        toast.error(`${errores} venta${errores !== 1 ? 's' : ''} con error al sincronizar`)
      }

      await sincronizarDatosLocales(sucursalIdRef.current)
      setUltimaSync(new Date())

      const count = await getPendientesCount()
      setPendientes(count)
    } finally {
      sincronizandoRef.current = false
      setSincronizando(false)
    }
  }, [])

  // Detectar cuando vuelve internet
  useEffect(() => {
    if (online && eraOffline.current) {
      toast.success('Conexión restaurada', {
        description: 'Sincronizando datos...',
        duration: 3000,
      })
      void sincronizar()
    }
    eraOffline.current = !online
  }, [online, sincronizar])

  // Sincronizar al cargar la sucursal por primera vez
  const sincronizadoInicial = useRef(false)
  useEffect(() => {
    if (!sucursalId || sincronizadoInicial.current) return
    sincronizadoInicial.current = true

    async function init() {
      const count = await getPendientesCount()
      setPendientes(count)
      if (navigator.onLine) void sincronizar()
    }

    void init()
  }, [sucursalId, sincronizar])

  return {
    online,
    verificando,
    sincronizando,
    pendientes,
    ultimaSync,
    sincronizar,
  }
}