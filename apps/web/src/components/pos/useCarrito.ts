'use client'

import { useState, useCallback } from 'react'
import type { Database } from '@repo/types'

type Producto = Database['public']['Tables']['productos']['Row']
type Cliente  = Database['public']['Tables']['clientes']['Row']

export type ItemCarrito = {
  producto:        Producto
  cantidad:        number
  precio_unitario: number
  descuento:       number
  esVario:         boolean
}

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto' | 'credito'

let contadorVarios = 0

export function useCarrito() {
  const [items,       setItems]       = useState<ItemCarrito[]>([])
  const [metodoPago,  setMetodoPago]  = useState<MetodoPago>('efectivo')
  const [descuento,   setDescuento]   = useState(0)
  const [cliente,     setCliente]     = useState<Cliente | null>(null)

  const agregarProducto = useCallback((producto: Producto) => {
    setItems(prev => {
      const existe = prev.find(i => i.producto.id === producto.id && !i.esVario)
      if (existe) {
        return prev.map(i =>
          i.producto.id === producto.id && !i.esVario
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [...prev, {
        producto,
        cantidad:        1,
        precio_unitario: producto.precio_base,
        descuento:       0,
        esVario:         false,
      }]
    })
  }, [])

  const agregarProductoVario = useCallback((
    descripcion: string,
    precio:      number,
    cantidad:    number
  ) => {
    contadorVarios += 1
    const productoFalso = {
      id:               `vario-${Date.now()}-${contadorVarios}`,
      nombre:           descripcion,
      precio_base:      precio,
      precio_mayoreo:   null,
      sku:              null,
      codigo_barras:    null,
      imagen_url:       null,
      categoria_id:     null,
      stock_minimo:     0,
      unidad:           'pza',
      activo:           true,
      created_at:       null,
    } as unknown as Producto

    setItems(prev => [...prev, {
      producto:        productoFalso,
      cantidad,
      precio_unitario: precio,
      descuento:       0,
      esVario:         true,
    }])
  }, [])

  const cambiarCantidad = useCallback((productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems(prev => prev.filter(i => i.producto.id !== productoId))
      return
    }
    setItems(prev =>
      prev.map(i =>
        i.producto.id === productoId ? { ...i, cantidad } : i
      )
    )
  }, [])

  const eliminarItem = useCallback((productoId: string) => {
    setItems(prev => prev.filter(i => i.producto.id !== productoId))
  }, [])

  const limpiarCarrito = useCallback(() => {
    setItems([])
    setDescuento(0)
    setCliente(null)
    setMetodoPago('efectivo')
  }, [])

  const asignarCliente = useCallback((clienteSeleccionado: Cliente | null) => {
    setCliente(clienteSeleccionado)
  }, [])

  const actualizarSaldoCliente = useCallback((nuevoSaldo: number) => {
    setCliente(prev => prev ? { ...prev, saldo_credito: nuevoSaldo } : prev)
  }, [])

  const subtotal = items.reduce(
    (acc, i) => acc + i.precio_unitario * i.cantidad - i.descuento,
    0
  )
  const total = Math.max(0, subtotal - descuento)

  return {
    items,
    metodoPago,
    descuento,
    cliente,
    clienteId: cliente?.id ?? null,
    clienteNombre: cliente?.nombre ?? null,
    subtotal,
    total,
    setMetodoPago,
    setDescuento,
    agregarProducto,
    agregarProductoVario,
    cambiarCantidad,
    eliminarItem,
    limpiarCarrito,
    asignarCliente,
    actualizarSaldoCliente,
  }
}