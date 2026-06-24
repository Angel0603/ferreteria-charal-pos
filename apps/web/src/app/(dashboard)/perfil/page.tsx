'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react'
import { usePerfil } from '@/lib/context/PerfilContext'
import { PerfilSkeleton } from '@/components/ui/skeletons/PerfilSkeleton'

export default function PerfilPage() {
  const supabaseRef = useRef(createClient())
  const { actualizarNombre } = usePerfil()

  const [nombre,           setNombre]           = useState('')
  const [email,            setEmail]            = useState('')
  const [loadingNombre,    setLoadingNombre]    = useState(false)
  const [loadingPassword,  setLoadingPassword]  = useState(false)
  const [loadingDatos,     setLoadingDatos]     = useState(true)

  const [passwordActual,   setPasswordActual]   = useState('')
  const [passwordNuevo,    setPasswordNuevo]    = useState('')
  const [passwordConfirm,  setPasswordConfirm]  = useState('')
  const [mostrarActual,    setMostrarActual]    = useState(false)
  const [mostrarNuevo,     setMostrarNuevo]     = useState(false)

  useEffect(() => {
    let activo = true
    async function cargar() {
      const supabase = supabaseRef.current
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !activo) return

      setEmail(user.email ?? '')

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      if (activo && perfil) setNombre(perfil.nombre)
      if (activo) setLoadingDatos(false)
    }
    cargar()
    return () => { activo = false }
  }, [])

  async function handleGuardarNombre(e: React.FormEvent) {
    e.preventDefault()
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) {
      toast.warning('El nombre no puede estar vacío')
      return
    }
    if (nombreLimpio.length < 3) {
      toast.warning('El nombre debe tener al menos 3 caracteres')
      return
    }

    setLoadingNombre(true)
    try {
      const supabase = supabaseRef.current
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('perfiles')
        .update({ nombre: nombreLimpio })
        .eq('id', user.id)

      if (error) throw error

      actualizarNombre(nombreLimpio)
      toast.success('Nombre actualizado correctamente')
    } catch (err) {
      toast.error('Error al actualizar el nombre', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    } finally {
      setLoadingNombre(false)
    }
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()

    if (passwordNuevo.length < 8) {
      toast.warning('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (passwordNuevo !== passwordConfirm) {
      toast.warning('Las contraseñas no coinciden')
      return
    }

    setLoadingPassword(true)
    try {
      const supabase = supabaseRef.current

      // Verificar contraseña actual reautenticando
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('No autenticado')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordActual,
      })
      if (signInError) {
        toast.error('La contraseña actual es incorrecta')
        return
      }

      const { error } = await supabase.auth.updateUser({ password: passwordNuevo })
      if (error) throw error

      toast.success('Contraseña actualizada correctamente')
      setPasswordActual('')
      setPasswordNuevo('')
      setPasswordConfirm('')
    } catch (err) {
      toast.error('Error al actualizar la contraseña', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    } finally {
      setLoadingPassword(false)
    }
  }

  function nivelPassword(pwd: string) {
    if (pwd.length === 0)  return null
    if (pwd.length < 8)    return { label: 'Débil',     color: 'bg-danger',  ancho: 'w-1/3' }
    if (pwd.length < 12)   return { label: 'Aceptable', color: 'bg-warning', ancho: 'w-2/3' }
    return                        { label: 'Fuerte',    color: 'bg-success', ancho: 'w-full' }
  }

  const nivel = nivelPassword(passwordNuevo)

  if (loadingDatos) return <PerfilSkeleton />

  return (
  <div className="space-y-6">

    {/* Header */}
    <div>
      <h1 className="text-2xl font-semibold text-text-primary">Mi perfil</h1>
      <p className="text-sm text-text-secondary mt-0.5">
        Administra tu información personal y seguridad
      </p>
    </div>

    {/* Avatar + info básica */}
    <div className="bg-surface rounded-xl border border-border p-6 flex items-center gap-5">
      <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center
                      justify-center shrink-0">
        <span className="text-xl font-semibold text-accent">
          {nombre.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div>
        <p className="text-lg font-medium text-text-primary">{nombre}</p>
        <p className="text-sm text-text-secondary">{email}</p>
      </div>
    </div>

    {/* Dos columnas */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* Información personal */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
          <User size={16} className="text-text-secondary" />
          <h2 className="text-sm font-medium text-text-primary">Información personal</h2>
        </div>
        <form onSubmit={handleGuardarNombre} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Correo electrónico
            </label>
            <input
              value={email}
              disabled
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         bg-surface-2 text-text-tertiary cursor-not-allowed"
            />
            <p className="text-xs text-text-tertiary mt-1">
              El correo no se puede cambiar desde aquí.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Nombre completo
              </label>
              <span className="text-xs text-text-tertiary">{nombre.length}/60</span>
            </div>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value.slice(0, 60))}
              maxLength={60}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="Tu nombre completo"
            />
            {nombre && nombre.trim().length < 3 && (
              <p className="text-xs text-warning mt-1">
                El nombre debe tener al menos 3 caracteres
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingNombre}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white
                         rounded-lg text-sm font-medium hover:bg-accent-hover
                         transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {loadingNombre ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Seguridad */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
          <Lock size={16} className="text-text-secondary" />
          <h2 className="text-sm font-medium text-text-primary">Seguridad</h2>
        </div>
        <form onSubmit={handleCambiarPassword} className="p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={mostrarActual ? 'text' : 'password'}
                value={passwordActual}
                onChange={e => setPasswordActual(e.target.value)}
                required
                placeholder="Tu contraseña actual"
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary"
              />
              <button
                type="button"
                onClick={() => setMostrarActual(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary
                           hover:text-text-primary transition-colors"
              >
                {mostrarActual ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={mostrarNuevo ? 'text' : 'password'}
                value={passwordNuevo}
                onChange={e => setPasswordNuevo(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary"
              />
              <button
                type="button"
                onClick={() => setMostrarNuevo(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary
                           hover:text-text-primary transition-colors"
              >
                {mostrarNuevo ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {nivel && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
                  <div className={`h-full transition-all ${nivel.color} ${nivel.ancho}`} />
                </div>
                <span className="text-xs text-text-tertiary shrink-0">{nivel.label}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type={mostrarNuevo ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              required
              placeholder="Repite la nueva contraseña"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
            />
            {passwordConfirm && passwordNuevo !== passwordConfirm && (
              <p className="text-xs text-danger mt-1">
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                loadingPassword ||
                passwordNuevo !== passwordConfirm ||
                passwordNuevo.length < 8 ||
                !passwordActual
              }
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white
                         rounded-lg text-sm font-medium hover:bg-accent-hover
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock size={14} />
              {loadingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
)
}