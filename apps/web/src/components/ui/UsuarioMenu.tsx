'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, User, LogOut } from 'lucide-react'
import { usePerfil } from '@/lib/context/PerfilContext'
import { logout } from '@/app/(auth)/login/actions'
import Link from 'next/link'

export function UsuarioMenu() {
  const { nombre, rol } = usePerfil()
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
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-hover transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center
                        text-xs font-medium text-accent shrink-0">
          {iniciales || '?'}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-medium text-text-primary leading-tight">{nombre}</p>
          <p className="text-[10px] text-text-tertiary leading-tight capitalize">{rol}</p>
        </div>
        <ChevronDown size={13} className="text-text-tertiary" />
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border
                        rounded-xl overflow-hidden z-50">
          <Link
            href="/perfil"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-primary
                       hover:bg-hover transition-colors"
          >
            <User size={15} className="text-text-secondary" />
            Mi perfil
          </Link>
          <div className="h-px bg-border" />
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger
                         hover:bg-hover transition-colors text-left"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}