import Dexie, { type Table } from 'dexie'

// Tipos locales simplificados para IndexedDB
export type ProductoLocal = {
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
  categoria_nombre: string | null
  activo:         boolean
  cantidad:       number  // stock en esta sucursal
}

export type ClienteLocal = {
  id:             string
  nombre:         string
  telefono:       string | null
  saldo_credito:  number
  limite_credito: number
}

export type VentaPendiente = {
  id:           string  // UUID local temporal
  sucursal_id:  string
  cajero_id:    string
  cliente_id:   string | null
  folio_local:  string
  subtotal:     number
  descuento:    number
  total:        number
  metodo_pago:  string
  items:        VentaItemLocal[]
  created_at:   string
  sincronizada: boolean
  error?:       string | null
}

export type VentaItemLocal = {
  producto_id:     string
  nombre:          string
  cantidad:        number
  precio_unitario: number
  descuento:       number
  subtotal:        number
}

export type ConfigLocal = {
  key:   string
  value: string
}

class FerreteriaPOSDB extends Dexie {
  productos!:       Table<ProductoLocal>
  clientes!:        Table<ClienteLocal>
  ventasPendientes!: Table<VentaPendiente>
  config!:          Table<ConfigLocal>

  constructor() {
    super('ferreteria-pos')

    this.version(1).stores({
      productos:        'id, nombre, codigo_barras, sku, categoria_id, activo',
      clientes:         'id, nombre',
      ventasPendientes: 'id, sincronizada, created_at',
      config:           'key',
    })
  }
}

export const db = new FerreteriaPOSDB()