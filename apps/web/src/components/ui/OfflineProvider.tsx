'use client'

import { useOffline }          from '@/lib/offline/useOffline'
import { BannerConexion }      from './BannerConexion'
import { ThemeToggle }         from './ThemeToggle'
import { Sidebar }             from './Sidebar'
import { NotificacionesMenu }  from './NotificacionesMenu'
import { UsuarioMenu }         from './UsuarioMenu'
import { usePerfil }           from '@/lib/context/PerfilContext'

type Props = {
  sucursalId: string
  children:   React.ReactNode
}

function Topbar({ sucursalId }: { sucursalId: string }) {
  const { online, sincronizando, pendientes, sincronizar } = useOffline(sucursalId)

  return (
    <header className="bg-surface border-b border-border px-5 h-14.25
                       flex items-center justify-end gap-3 sticky top-0 z-30">
      <BannerConexion
        online={online}
        sincronizando={sincronizando}
        pendientes={pendientes}
        onSincronizar={sincronizar}
      />
      <NotificacionesMenu sucursalId={sucursalId} />
      <ThemeToggle />
      <div className="w-px h-5.5 bg-border" />
      <UsuarioMenu />
    </header>
  )
}

export function OfflineProvider({ sucursalId, children }: Props) {
  const { sucursalNombre } = usePerfil()

  return (
    <div className="flex">
      <Sidebar sucursalNombre={sucursalNombre} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar sucursalId={sucursalId} />
        <main className="p-6 bg-base flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}