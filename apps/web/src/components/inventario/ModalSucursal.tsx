'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@repo/types'

type Sucursal = Database['public']['Tables']['sucursales']['Row']

type Props = {
  onClose:    () => void
  onCreada:   (sucursal: Sucursal) => void
}

const MAX_NOMBRE     = 60
const MAX_DIRECCION  = 120

export function ModalSucursal({ onClose, onCreada }: Props) {
  const supabase = createClient()
  const [nombre,    setNombre]    = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [loading,   setLoading]   = useState(false)

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNombre(e.target.value.slice(0, MAX_NOMBRE))
  }

  function handleDireccionChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDireccion(e.target.value.slice(0, MAX_DIRECCION))
  }

  function handleTelefonoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setTelefono(valor)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nombreLimpio = nombre.trim()

    if (!nombreLimpio) {
      toast.warning('El nombre de la sucursal es obligatorio')
      return
    }
    if (nombreLimpio.length < 3) {
      toast.warning('El nombre es demasiado corto')
      return
    }
    if (telefono && telefono.length !== 10) {
      toast.warning('El teléfono debe tener exactamente 10 dígitos')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sucursales')
        .insert({
          nombre:    nombreLimpio,
          direccion: direccion.trim() || null,
          telefono:  telefono || null,
          activa:    true,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Sucursal creada correctamente')
      onCreada(data)
      onClose()
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido'
      if (mensaje.includes('duplicate') || mensaje.includes('unique')) {
        toast.error('Ya existe una sucursal con ese nombre')
      } else {
        toast.error('Error al crear la sucursal', { description: mensaje })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-medium text-text-primary">Nueva sucursal</h2>
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
                {nombre.length}/{MAX_NOMBRE}
              </span>
            </div>
            <input
              value={nombre}
              onChange={handleNombreChange}
              maxLength={MAX_NOMBRE}
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="Ej. Sucursal Norte"
            />
            {nombre && nombre.trim().length < 3 && (
              <p className="text-xs text-warning mt-1">
                El nombre debe tener al menos 3 caracteres
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Dirección
              </label>
              <span className="text-xs text-text-tertiary">
                {direccion.length}/{MAX_DIRECCION}
              </span>
            </div>
            <input
              value={direccion}
              onChange={handleDireccionChange}
              maxLength={MAX_DIRECCION}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="Calle, número, colonia"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Teléfono
            </label>
            <input
              value={telefono}
              onChange={handleTelefonoChange}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary font-mono"
              placeholder="5550001234"
            />
            {telefono && telefono.length < 10 && (
              <p className="text-xs text-warning mt-1">
                El teléfono debe tener 10 dígitos
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
              {loading ? 'Creando...' : 'Crear sucursal'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}