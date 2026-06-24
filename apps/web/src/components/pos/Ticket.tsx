'use client'

import { forwardRef } from 'react'
import type { ItemCarrito, MetodoPago } from './useCarrito'
import { formatCurrency } from '@/lib/utils'

type Props = {
  folio:            string
  items:            ItemCarrito[]
  subtotal:         number
  descuento:        number
  total:            number
  metodoPago:       MetodoPago
  clienteNombre:    string | null
  cajeroNombre:     string
  sucursalNombre:   string
  efectivoRecibido?: number
  cambio?:          number
  fechaHora:        string
  termica?:         boolean
}

export const Ticket = forwardRef<HTMLDivElement, Props>(({
  folio, items, subtotal, descuento, total, metodoPago,
  clienteNombre, cajeroNombre, sucursalNombre,
  efectivoRecibido, cambio, fechaHora, termica = false,
}, ref) => {

  if (termica) return (
    <div
      ref={ref}
      style={{
        width: '80mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#000',
        background: '#fff',
        padding: '8px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0', textTransform: 'uppercase' }}>Ferretería y Novedades El Charal</p>
        <p style={{ margin: '2px 0', color: '#555' }}>
          {sucursalNombre}
        </p>
          
        <p style={{ borderTop: '1px dashed #999', margin: '6px 0 4px' }} />
        <p style={{ margin: '2px 0' }}>Folio: <strong>{folio}</strong></p>
        <p style={{ margin: '2px 0', color: '#555' }}>{fechaHora}</p>
        <p style={{ margin: '2px 0', color: '#555' }}>Cajero: {cajeroNombre}</p>
        {clienteNombre && (
          <p style={{ margin: '2px 0', color: '#555' }}>Cliente: {clienteNombre}</p>
        )}
      </div>

      <p style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      <div style={{ marginBottom: '8px' }}>
        {items.map(item => (
          <div key={item.producto.id} style={{ marginBottom: '6px' }}>
            <p style={{ margin: '0', fontWeight: '500' }}>{item.producto.nombre}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#555' }}>
                {item.cantidad} x {formatCurrency(item.precio_unitario)}
              </span>
              <strong>{formatCurrency(item.precio_unitario * item.cantidad)}</strong>
            </div>
          </div>
        ))}
      </div>

      <p style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {descuento > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Descuento</span>
            <span>-{formatCurrency(descuento)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontWeight: 'bold', fontSize: '14px',
          borderTop: '1px dashed #999', paddingTop: '4px', marginTop: '4px'
        }}>
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', marginTop: '3px' }}>
          <span style={{ textTransform: 'capitalize' }}>{metodoPago}</span>
          {efectivoRecibido && efectivoRecibido > 0 && (
            <span>{formatCurrency(efectivoRecibido)}</span>
          )}
        </div>
        {cambio !== undefined && cambio > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '500', marginTop: '3px' }}>
            <span>Cambio</span>
            <span>{formatCurrency(cambio)}</span>
          </div>
        )}
      </div>

      <p style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />
      <div style={{ textAlign: 'center', color: '#555', fontSize: '11px' }}>
        <p style={{ margin: '2px 0' }}>¡Gracias por su compra!</p>
        <p style={{ margin: '2px 0' }}>Conserve su ticket</p>
      </div>
    </div>
  )

  // ── Ticket hoja carta (diseño factura profesional) ──
  return (
    <div
      ref={ref}
      style={{
        width: '680px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#1a1a1a',
        background: '#fff',
        padding: '40px',
        boxSizing: 'border-box',
      }}
    >
      {/* Encabezado */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingBottom: '20px', borderBottom: '2px solid #B45309', marginBottom: '0',
      }}>
        <div>
          <p style={{
            fontSize: '10px', fontWeight: '500', letterSpacing: '1.2px',
            color: '#B45309', textTransform: 'uppercase', margin: '0 0 6px',
          }}>
            Recibo de venta
          </p>
          <h1 style={{
            fontSize: '21px', fontWeight: '700', margin: '0 0 4px',
            color: '#111',
          }}>
            {sucursalNombre}
          </h1>
            <p style={{ margin: '0', color: '#777', fontSize: '12px' }}>
              Tel: 771-344-4322
            </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            margin: '0', fontSize: '19px', fontWeight: '700',
            fontFamily: 'monospace', color: '#111',
          }}>
            {folio}
          </p>
          <p style={{ margin: '4px 0 0', color: '#999', fontSize: '11px' }}>
            {fechaHora}
          </p>
        </div>
      </div>

      {/* Info de la venta */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '20px', padding: '18px 0',
      }}>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Cliente
          </p>
          <p style={{ margin: '0', fontWeight: '500', fontSize: '13px' }}>
            {clienteNombre ?? 'Público general'}
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Cajero
          </p>
          <p style={{ margin: '0', fontWeight: '500', fontSize: '13px' }}>{cajeroNombre}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Método de pago
          </p>
          <p style={{ margin: '0', fontWeight: '500', fontSize: '13px', textTransform: 'capitalize' }}>
            {metodoPago}
          </p>
        </div>
      </div>

      {/* Tabla de productos */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #1a1a1a' }}>
            {['Producto', 'Cant.', 'Precio unit.', 'Total'].map((h, i) => (
              <th key={h} style={{
                padding: '7px 0',
                textAlign: i === 0 ? 'left' : 'right',
                fontSize: '10px', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                color: '#555',
                width: i === 0 ? 'auto' : '90px',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.producto.id} style={{ borderBottom: '0.5px solid #eee' }}>
              <td style={{ padding: '10px 0', fontWeight: '500' }}>
                {item.producto.nombre}
                {item.descuento > 0 && (
                  <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                    (desc: -{formatCurrency(item.descuento)})
                  </span>
                )}
              </td>
              <td style={{ padding: '10px 0', textAlign: 'right', color: '#666' }}>
                {item.cantidad}
              </td>
              <td style={{ padding: '10px 0', textAlign: 'right', color: '#666' }}>
                {formatCurrency(item.precio_unitario)}
              </td>
              <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>
                {formatCurrency(item.precio_unitario * item.cantidad)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
        <div style={{ width: '230px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#666', fontSize: '13px' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {descuento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#16a34a', fontSize: '13px' }}>
              <span>Descuento</span>
              <span>-{formatCurrency(descuento)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '11px 14px', marginTop: '6px',
            background: '#B45309', color: '#fff',
            borderRadius: '6px', fontWeight: '700', fontSize: '16px'
          }}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {efectivoRecibido !== undefined && efectivoRecibido > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 2px', color: '#666', fontSize: '12px', marginTop: '8px' }}>
                <span>Efectivo recibido</span>
                <span>{formatCurrency(efectivoRecibido)}</span>
              </div>
              {cambio !== undefined && cambio > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: '600', color: '#111', fontSize: '13px' }}>
                  <span>Cambio</span>
                  <span>{formatCurrency(cambio)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pie */}
      <div style={{
        marginTop: '28px', paddingTop: '16px', borderTop: '0.5px solid #e5e5e5',
        textAlign: 'center',
      }}>
        <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '13px', color: '#111' }}>
          ¡Gracias por su compra!
        </p>
        <p style={{ margin: '0', color: '#999', fontSize: '10.5px' }}>
          Este documento no es una factura fiscal. Para factura electrónica solicítela por separado.
        </p>
      </div>
    </div>
  )
})

Ticket.displayName = 'Ticket'