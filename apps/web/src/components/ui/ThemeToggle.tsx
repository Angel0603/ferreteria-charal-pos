'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEstaMontado } from '@/lib/hooks/useEstaMontado'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const montado = useEstaMontado()

  if (!montado) {
    return <div className="w-8 h-8" />
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-8 h-8 rounded-lg border border-border text-text-secondary
                 hover:bg-hover hover:text-text-primary transition-colors
                 flex items-center justify-center"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}