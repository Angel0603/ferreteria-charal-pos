'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@repo/types'

type Proveedor = Database['public']['Tables']['proveedores']['Row']

type Props = {
  proveedor:  Proveedor | null
  onClose:    () => void
  onGuardado: (proveedor: Proveedor) => void
}

const MAX_NOMBRE   = 60
const MAX_CONTACTO = 60

export function ProveedorModal({ proveedor, onClose, onGuardado }: Props) {
  const supabase  = createClient()
  const esEdicion = !!proveedor

  const [form, setForm] = useState({
    nombre:   proveedor?.nombre   ?? '',
    contacto: proveedor?.contacto ?? '',
    telefono: proveedor?.telefono ?? '',
    email:    proveedor?.email    ?? '',
  })
  const [loading, setLoading] = useState(false)

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, nombre: e.target.value.slice(0, MAX_NOMBRE) }))
  }

  function handleContactoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, contacto: e.target.value.slice(0, MAX_CONTACTO) }))
  }

  function handleTelefonoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setForm(prev => ({ ...prev, telefono: valor }))
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, email: e.target.value }))
  }

  function emailValido(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nombreLimpio = form.nombre.trim()

    if (!nombreLimpio) {
      toast.warning('El nombre es obligatorio')
      return
    }
    if (nombreLimpio.length < 2) {
      toast.warning('El nombre es demasiado corto')
      return
    }
    if (form.telefono && form.telefono.length !== 10) {
      toast.warning('El teléfono debe tener exactamente 10 dígitos')
      return
    }
    if (form.email && !emailValido(form.email.trim())) {
      toast.warning('El correo electrónico no es válido')
      return
    }

    setLoading(true)
    try {
      const payload = {
        nombre:   nombreLimpio,
        contacto: form.contacto.trim() || null,
        telefono: form.telefono || null,
        email:    form.email.trim() || null,
      }

      if (esEdicion && proveedor) {
        const { data, error } = await supabase
          .from('proveedores')
          .update(payload)
          .eq('id', proveedor.id)
          .select()
          .single()
        if (error) throw error
        toast.success('Proveedor actualizado correctamente')
        onGuardado(data)
      } else {
        const { data, error } = await supabase
          .from('proveedores')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        toast.success('Proveedor creado correctamente')
        onGuardado(data)
      }
      onClose()
    } catch (err) {
      toast.error('Error al guardar el proveedor', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-medium text-text-primary">
            {esEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Nombre <span className="text-danger">*</span>
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
              placeholder="Ej. Truper, Pretul, Urrea"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Persona de contacto
              </label>
              <span className="text-xs text-text-tertiary">
                {form.contacto.length}/{MAX_CONTACTO}
              </span>
            </div>
            <input
              name="contacto"
              value={form.contacto ?? ''}
              onChange={handleContactoChange}
              maxLength={MAX_CONTACTO}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="Nombre del vendedor o representante"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Teléfono
            </label>
            <input
              name="telefono"
              value={form.telefono ?? ''}
              onChange={handleTelefonoChange}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary font-mono"
              placeholder="5550001234"
            />
            {form.telefono && form.telefono.length < 10 && (
              <p className="text-xs text-warning mt-1">
                El teléfono debe tener 10 dígitos
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              name="email"
              value={form.email ?? ''}
              onChange={handleEmailChange}
              type="email"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="ventas@proveedor.com"
            />
            {form.email && !emailValido(form.email.trim()) && (
              <p className="text-xs text-warning mt-1">
                Ingresa un correo electrónico válido
              </p>
            )}
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
              {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}