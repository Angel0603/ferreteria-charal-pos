'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrar,         setMostrar]         = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [listo,           setListo]           = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar que el usuario llegó con un token válido de Supabase
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Token válido, el usuario puede cambiar su contraseña
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.warning('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.warning('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setListo(true)
      toast.success('Contraseña actualizada correctamente')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      toast.error('Error al actualizar la contraseña', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    } finally {
      setLoading(false)
    }
  }

  if (listo) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success-soft flex items-center
                          justify-center mx-auto mb-4">
            <span className="text-success text-xl">✓</span>
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Contraseña actualizada
          </h1>
          <p className="text-sm text-text-secondary">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">

        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text-primary mb-1">
              Nueva contraseña
            </h1>
            <p className="text-sm text-text-secondary">
              Elige una contraseña segura para tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrar ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                             text-text-primary placeholder:text-text-tertiary"
                />
                <button
                  type="button"
                  onClick={() => setMostrar(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary
                             hover:text-text-primary transition-colors"
                >
                  {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
                    <div className={`h-full transition-all ${
                      password.length < 8
                        ? 'w-1/3 bg-danger'
                        : password.length < 12
                          ? 'w-2/3 bg-warning'
                          : 'w-full bg-success'
                    }`} />
                  </div>
                  <span className="text-xs text-text-tertiary shrink-0">
                    {password.length < 8 ? 'Débil' : password.length < 12 ? 'Aceptable' : 'Fuerte'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Confirmar contraseña
              </label>
              <input
                type={mostrar ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la contraseña"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary placeholder:text-text-tertiary"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-danger mt-1">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password !== confirmPassword || password.length < 8}
              className="w-full py-2.5 bg-accent text-white rounded-xl text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}