'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSyncExternalStore } from 'react'

function getOnlineSnapshot()       { return typeof navigator !== 'undefined' ? navigator.onLine : true }
function getServerSnapshot()       { return true }
function subscribeToOnline(cb: () => void) {
  window.addEventListener('online',  cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online',  cb)
    window.removeEventListener('offline', cb)
  }
}

export function useConexion() {
  const online = useSyncExternalStore(
    subscribeToOnline,
    getOnlineSnapshot,
    getServerSnapshot,
  )

  const [verificando, setVerificando] = useState(false)

  const verificarConexion = useCallback(async () => {
    setVerificando(true)
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode:   'no-cors',
        signal: AbortSignal.timeout(5000),
      })
    } catch {
      // Si falla el fetch ya sabemos que no hay conexión por navigator.onLine
    } finally {
      setVerificando(false)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => { void verificarConexion() }, 30_000)
    return () => clearInterval(interval)
  }, [verificarConexion])

  return { online, verificando }
}