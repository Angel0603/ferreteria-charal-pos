'use client'

import { useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { db } from '@/lib/db/local'
import type { ItemCarrito, MetodoPago } from './useCarrito'
import { v4 as uuidv4 } from 'uuid'

type Params = {
  sucursalId: string
  cajeroId: string
  clienteId: string | null
  clienteSaldoActual?: number
  items: ItemCarrito[]
  subtotal: number
  descuento: number
  total: number
  metodoPago: MetodoPago
}

export function useProcesarVenta() {
  const supabaseRef = useRef(createClient())
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true

  async function procesarVenta(params: Params): Promise<string> {
    if (online) {
      return procesarOnline(params)
    } else {
      return procesarOffline(params)
    }
  }

  async function procesarOnline(params: Params): Promise<string> {
    const supabase = supabaseRef.current

    const { data: folio, error: folioError } = await supabase
      .rpc('generar_folio', { p_sucursal_id: params.sucursalId })
    if (folioError) throw folioError

    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert({
        sucursal_id: params.sucursalId,
        cajero_id: params.cajeroId,
        cliente_id: params.clienteId,
        folio: folio as string,
        subtotal: params.subtotal,
        descuento: params.descuento,
        total: params.total,
        metodo_pago: params.metodoPago,
        estado: 'completada',
      })
      .select('id')
      .single()
    if (ventaError) throw ventaError

    const itemsReales = params.items.filter(i => !i.esVario)
    const itemsVarios = params.items.filter(i => i.esVario)

    if (itemsReales.length > 0) {
      await supabase.from('venta_items').insert(
        itemsReales.map(item => ({
          venta_id: venta.id,
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento,
          subtotal: item.precio_unitario * item.cantidad - item.descuento,
        }))
      )

      for (const item of itemsReales) {
        await supabase.rpc('descontar_inventario', {
          p_producto_id: item.producto.id,
          p_sucursal_id: params.sucursalId,
          p_cantidad: item.cantidad,
        })

        await supabase.from('movimientos_inventario').insert({
          producto_id: item.producto.id,
          sucursal_id: params.sucursalId,
          usuario_id: params.cajeroId,
          tipo: 'venta',
          cantidad: -item.cantidad,
          referencia: folio as string,
        })

        await db.productos
          .where('id')
          .equals(item.producto.id)
          .modify(p => { p.cantidad = Math.max(0, p.cantidad - item.cantidad) })
      }
    }

    // Vincular los productos varios ya guardados con esta venta
    if (itemsVarios.length > 0) {
      await supabase
        .from('productos_varios')
        .update({ venta_id: venta.id })
        .eq('sucursal_id', params.sucursalId)
        .eq('cajero_id', params.cajeroId)
        .is('venta_id', null)
    }

    // Si la venta es a crédito, incrementar el saldo del cliente y registrar el cargo
    if (params.metodoPago === 'credito' && params.clienteId) {
      const saldoPrevio = params.clienteSaldoActual ?? 0
      const saldoNuevo = saldoPrevio + params.total

      const { error: errorRpc } = await supabase.rpc('aplicar_venta_credito', {
        p_cliente_id: params.clienteId,
        p_monto: params.total,
      })
      if (errorRpc) {
        console.error('Error en aplicar_venta_credito:', errorRpc)
        throw errorRpc
      }

      const { error: errorInsert } = await supabase.from('ventas_credito').insert({
        venta_id: venta.id,
        cliente_id: params.clienteId,
        sucursal_id: params.sucursalId,
        monto: params.total,
        saldo_previo: saldoPrevio,
        saldo_nuevo: saldoNuevo,
      })
      if (errorInsert) {
        console.error('Error al insertar en ventas_credito:', errorInsert)
        throw errorInsert
      }
    }

    return folio as string
  }

  async function procesarOffline(params: Params): Promise<string> {
    const folioLocal = `OFF-${Date.now()}`
    const id = uuidv4()

    const itemsReales = params.items.filter(i => !i.esVario)

    await db.ventasPendientes.add({
      id,
      sucursal_id: params.sucursalId,
      cajero_id: params.cajeroId,
      cliente_id: params.clienteId,
      folio_local: folioLocal,
      subtotal: params.subtotal,
      descuento: params.descuento,
      total: params.total,
      metodo_pago: params.metodoPago,
      items: itemsReales.map(item => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: item.descuento,
        subtotal: item.precio_unitario * item.cantidad - item.descuento,
      })),
      created_at: new Date().toISOString(),
      sincronizada: false,
    })

    for (const item of itemsReales) {
      await db.productos
        .where('id')
        .equals(item.producto.id)
        .modify(p => { p.cantidad = Math.max(0, p.cantidad - item.cantidad) })
    }

    return folioLocal
  }

  return { procesarVenta }
}