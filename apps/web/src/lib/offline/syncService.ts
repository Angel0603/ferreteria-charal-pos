import { db } from '@/lib/db/local'
import { createClient } from '@/lib/supabase/client'

type InventarioSyncRow = {
  cantidad:    number
  producto_id: string
  productos:
    | {
        id:             string
        nombre:         string
        codigo_barras:  string | null
        sku:            string | null
        precio_base:    number
        precio_mayoreo: number | null
        stock_minimo:   number
        unidad:         string
        imagen_url:     string | null
        categoria_id:   string | null
        activo:         boolean
        categorias:     { nombre: string } | { nombre: string }[] | null
      }
    | {
        id:             string
        nombre:         string
        codigo_barras:  string | null
        sku:            string | null
        precio_base:    number
        precio_mayoreo: number | null
        stock_minimo:   number
        unidad:         string
        imagen_url:     string | null
        categoria_id:   string | null
        activo:         boolean
        categorias:     { nombre: string } | { nombre: string }[] | null
      }[]
}

type ClienteSyncRow = {
  id:             string
  nombre:         string
  telefono:       string | null
  saldo_credito:  number
  limite_credito: number
}

const supabase = createClient()

export async function sincronizarDatosLocales(sucursalId: string) {
  try {
    // 1. Sincronizar productos con inventario
    const { data: inventario } = await supabase
      .from('inventario')
      .select(`
        cantidad,
        producto_id,
        productos(
          id, nombre, codigo_barras, sku,
          precio_base, precio_mayoreo, stock_minimo,
          unidad, imagen_url, categoria_id, activo,
          categorias(nombre)
        )
      `)
      .eq('sucursal_id', sucursalId)

    if (inventario) {
      const productosLocales = (inventario as unknown as InventarioSyncRow[]).map(i => {
        const p   = Array.isArray(i.productos) ? i.productos[0] : i.productos
        const cat = p.categorias
          ? Array.isArray(p.categorias) ? p.categorias[0] : p.categorias
          : null
        return {
          id:               p.id,
          nombre:           p.nombre,
          codigo_barras:    p.codigo_barras,
          sku:              p.sku,
          precio_base:      p.precio_base,
          precio_mayoreo:   p.precio_mayoreo,
          stock_minimo:     p.stock_minimo,
          unidad:           p.unidad,
          imagen_url:       p.imagen_url,
          categoria_id:     p.categoria_id,
          categoria_nombre: cat?.nombre ?? null,
          activo:           p.activo,
          cantidad:         i.cantidad,
        }
      })
      await db.productos.bulkPut(productosLocales)
    }

    // 2. Sincronizar clientes
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nombre, telefono, saldo_credito, limite_credito')
      .eq('sucursal_id', sucursalId)
      .eq('activo', true)

    if (clientes) {
      await db.clientes.bulkPut(clientes as unknown as ClienteSyncRow[])
    }

    // 3. Guardar timestamp de última sync
    await db.config.put({
      key:   'ultima_sync',
      value: new Date().toISOString(),
    })

    await db.config.put({
      key:   'sucursal_id',
      value: sucursalId,
    })

    return { ok: true }
  } catch (err) {
    console.error('Error en sincronización:', err)
    return { ok: false, error: err }
  }
}

export async function enviarVentasPendientes(): Promise<{
  enviadas: number
  errores:  number
}> {
  const pendientes = await db.ventasPendientes
    .where('sincronizada')
    .equals(0)
    .toArray()

  let enviadas = 0
  let errores  = 0

  for (const venta of pendientes) {
    try {
      const { data: folio } = await supabase
        .rpc('generar_folio', { p_sucursal_id: venta.sucursal_id })

      const { data: ventaCreada, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          sucursal_id: venta.sucursal_id,
          cajero_id:   venta.cajero_id,
          cliente_id:  venta.cliente_id,
          folio:       folio as string,
          subtotal:    venta.subtotal,
          descuento:   venta.descuento,
          total:       venta.total,
          metodo_pago: venta.metodo_pago,
          estado:      'completada',
          created_at:  venta.created_at,
        })
        .select('id')
        .single()

      if (ventaError) throw ventaError

      await supabase.from('venta_items').insert(
        venta.items.map(item => ({
          venta_id:        ventaCreada.id,
          producto_id:     item.producto_id,
          cantidad:        item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento:       item.descuento,
          subtotal:        item.subtotal,
        }))
      )

      for (const item of venta.items) {
        await supabase.rpc('descontar_inventario', {
          p_producto_id: item.producto_id,
          p_sucursal_id: venta.sucursal_id,
          p_cantidad:    item.cantidad,
        })

        await supabase.from('movimientos_inventario').insert({
          producto_id: item.producto_id,
          sucursal_id: venta.sucursal_id,
          usuario_id:  venta.cajero_id,
          tipo:        'venta',
          cantidad:    -item.cantidad,
          referencia:  folio as string,
        })
      }

      await db.ventasPendientes.update(venta.id, { sincronizada: true })
      enviadas++
    } catch (err) {
      await db.ventasPendientes.update(venta.id, {
        error: err instanceof Error ? err.message : 'Error desconocido',
      })
      errores++
    }
  }

  return { enviadas, errores }
}

export async function getUltimaSync(): Promise<string | null> {
  const config = await db.config.get('ultima_sync')
  return config?.value ?? null
}

export async function getPendientesCount(): Promise<number> {
  return await db.ventasPendientes
    .where('sincronizada')
    .equals(0)
    .count()
}