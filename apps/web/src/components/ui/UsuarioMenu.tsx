'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, User, LogOut } from 'lucide-react'
import { usePerfil } from '@/lib/context/PerfilContext'
import { logout } from '@/app/(auth)/login/actions'
import Link from 'next/link'

const ROL_LABEL: Record<string, string> = {
  admin:   'Admin',
  cajero:  'Cajero',
  almacen: 'Almacén',
}

export function UsuarioMenu() {
  const { nombre, rol, sucursalNombre } = usePerfil()
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const iniciales = nombre
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setAbierto(v => !v)}
        className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-xl
                   hover:bg-hover transition-colors"
      >
        {/* Avatar con punto de estado */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center
                          justify-center text-sm font-medium text-accent">
            {iniciales || '?'}
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                          bg-success border-2 border-base" />
        </div>

        {/* Nombre + badge rol + sucursal */}
        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-text-primary leading-tight">
              {nombre}
            </p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full
                             bg-accent-soft text-accent-soft-text leading-none">
              {ROL_LABEL[rol] ?? rol}
            </span>
          </div>
          <p className="text-[10px] text-text-tertiary leading-tight mt-0.5">
            {sucursalNombre}
          </p>
        </div>

        <ChevronDown
          size={13}
          className={`text-text-tertiary transition-transform duration-200 ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-full mt-2 w-52 bg-surface border border-border
                    rounded-xl overflow-hidden z-50 origin-top transition-all duration-150 ${
          abierto
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Info del usuario en el dropdown */}
        <div className="px-3.5 py-3 border-b border-border">
          <p className="text-xs font-medium text-text-primary truncate">{nombre}</p>
          <p className="text-[11px] text-text-tertiary truncate">{sucursalNombre}</p>
        </div>

        <Link
          href="/perfil"
          onClick={() => setAbierto(false)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-primary
                     hover:bg-hover transition-colors"
        >
          <User size={15} className="text-text-secondary shrink-0" />
          Mi perfil
        </Link>

        <div className="h-px bg-border" />

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger
                       hover:bg-hover transition-colors text-left"
          >
            <LogOut size={15} className="shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}