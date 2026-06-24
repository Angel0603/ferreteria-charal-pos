'use client'

import { useState, useRef, useEffect } from 'react'
import { X, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  onAgregar: (descripcion: string, precio: number, cantidad: number) => void
  onClose:   () => void
}

const MAX_DESCRIPCION = 80
const MAX_PRECIO      = 999999
const MAX_CANTIDAD    = 999

export function ModalProductoVario({ onAgregar, onClose }: Props) {
  const [descripcion, setDescripcion] = useState('')
  const [precio,      setPrecio]      = useState('')
  const [cantidad,    setCantidad]    = useState('1')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleDescripcionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.slice(0, MAX_DESCRIPCION)
    setDescripcion(valor)
  }

  function handlePrecioChange(e: React.ChangeEvent<HTMLInputElement>) {
    let valor = e.target.value.replace(/[^0-9.]/g, '')
    // Solo permitir un punto decimal
    const partes = valor.split('.')
    if (partes.length > 2) {
      valor = partes[0] + '.' + partes.slice(1).join('')
    }
    // Máximo 2 decimales
    if (partes[1]?.length > 2) {
      valor = partes[0] + '.' + partes[1].slice(0, 2)
    }
    setPrecio(valor)
  }

  function handleCantidadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.replace(/[^0-9]/g, '')
    setCantidad(valor)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const descripcionLimpia = descripcion.trim()
    const precioNum   = parseFloat(precio)
    const cantidadNum = parseInt(cantidad, 10)

    if (!descripcionLimpia) {
      toast.warning('Escribe una descripción del producto')
      inputRef.current?.focus()
      return
    }
    if (descripcionLimpia.length < 3) {
      toast.warning('La descripción es demasiado corta')
      inputRef.current?.focus()
      return
    }
    if (!precio || isNaN(precioNum) || precioNum <= 0) {
      toast.warning('Ingresa un precio válido mayor a $0')
      return
    }
    if (precioNum > MAX_PRECIO) {
      toast.warning(`El precio no puede ser mayor a ${MAX_PRECIO.toLocaleString('es-MX')}`)
      return
    }
    if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.warning('La cantidad debe ser al menos 1')
      return
    }
    if (cantidadNum > MAX_CANTIDAD) {
      toast.warning(`La cantidad no puede ser mayor a ${MAX_CANTIDAD}`)
      return
    }

    onAgregar(descripcionLimpia, precioNum, cantidadNum)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm border border-border">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <PackagePlus size={17} className="text-accent" />
            <h2 className="font-medium text-text-primary">Producto vario</h2>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <p className="text-xs text-text-tertiary -mt-1">
            Úsalo para productos que no estén registrados en el catálogo. Quedará marcado para revisión.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Descripción <span className="text-danger">*</span>
              </label>
              <span className="text-xs text-text-tertiary">
                {descripcion.length}/{MAX_DESCRIPCION}
              </span>
            </div>
            <input
              ref={inputRef}
              value={descripcion}
              onChange={handleDescripcionChange}
              maxLength={MAX_DESCRIPCION}
              placeholder="Ej. Tornillo especial 1/4"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary placeholder:text-text-tertiary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Precio <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precio}
                  onChange={handlePrecioChange}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                             text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Cantidad
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cantidad}
                onChange={handleCantidadChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary"
              />
            </div>
          </div>

          {precio && !isNaN(parseFloat(precio)) && cantidad && !isNaN(parseInt(cantidad, 10)) && (
            <p className="text-sm text-text-secondary text-center">
              Total: <span className="font-medium text-text-primary">
                {(parseFloat(precio) * parseInt(cantidad, 10)).toLocaleString('es-MX', {
                  style: 'currency', currency: 'MXN',
                })}
              </span>
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm
                         text-text-secondary hover:bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm
                         font-medium hover:bg-accent-hover transition-colors"
            >
              Agregar a la venta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}