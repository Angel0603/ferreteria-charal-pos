'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Eye, EyeOff, ChevronDown, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@repo/types'

type Perfil    = Database['public']['Tables']['perfiles']['Row']
type Sucursal  = Database['public']['Tables']['sucursales']['Row']

type Props = {
  perfil:     Perfil | null
  onClose:    () => void
  onGuardado: (perfil: Perfil) => void
}

const ROLES = [
  { value: 'admin',   label: 'Administrador', desc: 'Acceso completo al sistema' },
  { value: 'cajero',  label: 'Cajero',         desc: 'Solo puede usar el POS'     },
  { value: 'almacen', label: 'Almacén',        desc: 'Gestión de inventario'      },
]

const MAX_NOMBRE     = 60
const MIN_PASSWORD   = 8

export function UsuarioModal({ perfil, onClose, onGuardado }: Props) {
  const supabase  = createClient()
  const esEdicion = !!perfil

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [form, setForm] = useState({
    nombre:      perfil?.nombre      ?? '',
    rol:         perfil?.rol         ?? 'cajero',
    sucursal_id: perfil?.sucursal_id ?? '',
    email:       '',
    password:    '',
  })
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [dropdownSucursalAbierto, setDropdownSucursalAbierto] = useState(false)
  const supabaseRef = useRef(createClient())
  const dropdownSucursalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      const { data } = await supabaseRef.current
        .from('sucursales')
        .select('*')
        .eq('activa', true)
        .order('nombre')
      if (activo && data) setSucursales(data)
    }
    cargar()
    return () => { activo = false }
  }, [])

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (dropdownSucursalRef.current && !dropdownSucursalRef.current.contains(e.target as Node)) {
        setDropdownSucursalAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  function emailValido(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, nombre: e.target.value.slice(0, MAX_NOMBRE) }))
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, email: e.target.value.trim() }))
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, password: e.target.value }))
  }

  function handleRolChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, rol: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nombreLimpio = form.nombre.trim()

    if (!nombreLimpio) {
      toast.warning('El nombre es obligatorio')
      return
    }
    if (nombreLimpio.length < 3) {
      toast.warning('El nombre debe tener al menos 3 caracteres')
      return
    }
    if (!form.sucursal_id) {
      toast.warning('Selecciona una sucursal')
      return
    }
    if (!esEdicion) {
      if (!form.email.trim()) {
        toast.warning('El correo es obligatorio')
        return
      }
      if (!emailValido(form.email)) {
        toast.warning('Ingresa un correo electrónico válido')
        return
      }
      if (form.password.length < MIN_PASSWORD) {
        toast.warning(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`)
        return
      }
    }

    setLoading(true)
    try {
      if (esEdicion && perfil) {
        const { data, error } = await supabase
          .from('perfiles')
          .update({
            nombre:      nombreLimpio,
            rol:         form.rol,
            sucursal_id: form.sucursal_id,
          })
          .eq('id', perfil.id)
          .select()
          .single()
        if (error) throw error
        toast.success('Usuario actualizado correctamente')
        onGuardado(data)
        onClose()
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email:    form.email,
          password: form.password,
          options: {
            data: {
              nombre: nombreLimpio,
            },
          },
        })
        if (authError) throw authError
        if (!authData.user) throw new Error('No se pudo crear el usuario')

        const { data: perfilData, error: perfilError } = await supabase
          .from('perfiles')
          .insert({
            id:          authData.user.id,
            nombre:      nombreLimpio,
            rol:         form.rol,
            sucursal_id: form.sucursal_id,
          })
          .select()
          .single()
        if (perfilError) throw perfilError

        toast.success('Usuario creado correctamente', {
          description: `Se envió un correo de confirmación a ${form.email}`,
          duration: 6000,
        })
        onGuardado(perfilData)
        onClose()
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      if (mensaje.includes('already registered')) {
        toast.error('Este correo ya está registrado')
      } else {
        toast.error('Error al guardar el usuario', { description: mensaje })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-medium text-text-primary">
            {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Nombre completo <span className="text-danger">*</span>
              </label>
              <span className="text-xs text-text-tertiary">
                {form.nombre.length}/{MAX_NOMBRE}
              </span>
            </div>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleNombreChange}
              maxLength={MAX_NOMBRE}
              required
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="Nombre del empleado"
            />
            {form.nombre && form.nombre.trim().length < 3 && (
              <p className="text-xs text-warning mt-1">
                El nombre debe tener al menos 3 caracteres
              </p>
            )}
          </div>

          {!esEdicion && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Correo electrónico <span className="text-danger">*</span>
                </label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleEmailChange}
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                             text-text-primary"
                  placeholder="empleado@ferreteria.com"
                />
                {form.email && !emailValido(form.email) && (
                  <p className="text-xs text-warning mt-1">
                    Ingresa un correo electrónico válido
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Contraseña <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    value={form.password}
                    onChange={handlePasswordChange}
                    type={mostrarPassword ? 'text' : 'password'}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                               text-text-primary"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary
                               hover:text-text-primary transition-colors"
                  >
                    {mostrarPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          form.password.length < MIN_PASSWORD
                            ? 'w-1/3 bg-danger'
                            : form.password.length < 12
                              ? 'w-2/3 bg-warning'
                              : 'w-full bg-success'
                        }`}
                      />
                    </div>
                    <span className="text-xs text-text-tertiary shrink-0">
                      {form.password.length < MIN_PASSWORD
                        ? 'Débil'
                        : form.password.length < 12
                          ? 'Aceptable'
                          : 'Fuerte'}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Sucursal <span className="text-danger">*</span>
            </label>

            <div className="relative" ref={dropdownSucursalRef}>
              <button
                type="button"
                onClick={() => setDropdownSucursalAbierto(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 border
                           border-border rounded-lg text-sm bg-surface text-text-primary
                           hover:bg-hover transition-colors"
              >
                <span className={form.sucursal_id ? '' : 'text-text-tertiary'}>
                  {sucursales.find(s => s.id === form.sucursal_id)?.nombre ?? 'Seleccionar sucursal...'}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-text-tertiary transition-transform duration-200 shrink-0 ${
                    dropdownSucursalAbierto ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`absolute top-full left-0 right-0 mt-1.5 bg-surface border
                            border-border rounded-xl shadow-lg z-20 overflow-hidden
                            origin-top transition-all duration-150 ${
                  dropdownSucursalAbierto
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="py-1 max-h-60 overflow-y-auto">
                  {sucursales.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, sucursal_id: s.id }))
                        setDropdownSucursalAbierto(false)
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                                 text-sm text-text-primary hover:bg-hover transition-colors text-left"
                    >
                      {s.nombre}
                      {form.sucursal_id === s.id && (
                        <Check size={14} className="text-accent shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Rol <span className="text-danger">*</span>
            </label>
            <div className="space-y-2">
              {ROLES.map(rol => (
                <label
                  key={rol.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer
                              transition-colors ${
                    form.rol === rol.value
                      ? 'border-accent bg-accent-soft'
                      : 'border-border hover:bg-hover'
                  }`}
                >
                  <input
                    type="radio"
                    name="rol"
                    value={rol.value}
                    checked={form.rol === rol.value}
                    onChange={handleRolChange}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{rol.label}</p>
                    <p className="text-xs text-text-secondary">{rol.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm
                         font-medium text-text-secondary hover:bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50"
            >
              {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}