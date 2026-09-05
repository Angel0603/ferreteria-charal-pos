"use client";

import { forwardRef } from "react";
import type { ItemCarrito, MetodoPago } from "./useCarrito";
import { formatCurrency } from "@/lib/utils";

type Props = {
  folio: string;
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  clienteNombre: string | null;
  cajeroNombre: string;
  sucursalNombre: string;
  efectivoRecibido?: number;
  cambio?: number;
  fechaHora: string;
  termica?: boolean;
};

export const Ticket = forwardRef<HTMLDivElement, Props>(
  (
    {
      folio,
      items,
      subtotal,
      descuento,
      total,
      metodoPago,
      clienteNombre,
      cajeroNombre,
      sucursalNombre,
      efectivoRecibido,
      cambio,
      fechaHora,
      termica = false,
    },
    ref,
  ) => {
    // ── Ticket térmico 58mm ──
    if (termica) {
  const ANCHO = 32 // caracteres para 58mm

  function linea(izq: string, der: string): string {
    const espacios = ANCHO - izq.length - der.length
    return izq + ' '.repeat(Math.max(1, espacios)) + der
  }

  function centrar(texto: string): string {
    const espacios = Math.max(0, Math.floor((ANCHO - texto.length) / 2))
    return ' '.repeat(espacios) + texto
  }

  const sep = '─'.repeat(ANCHO)

  return (
    <div
      ref={ref}
      style={{
        width:      '219px',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize:   '11px',
        lineHeight: '1.5',
        color:      '#000',
        background: '#fff',
        padding:    '6px 8px',
        boxSizing:  'border-box',
        whiteSpace: 'pre',
      }}
    >
      {/* Encabezado */}
      {centrar(sucursalNombre.toUpperCase())}
      {'\n'}
      {centrar('Ferretería y Material Eléctrico')}
      {'\n'}
      {centrar('"El Charal"')}
      {'\n'}
      {centrar('Tel: 7713444322')}
      {'\n'}
      {centrar(fechaHora)}
      {'\n'}
      {sep}
      {'\n'}

      {/* Info de la venta */}
      {`Folio: ${folio}`}
      {'\n'}
      {`Cajero: ${cajeroNombre}`}
      {'\n'}
      {`Cliente: ${clienteNombre ?? 'Público general'}`}
      {'\n'}
      {sep}
      {'\n'}

      {/* Productos */}
      {items.map(item => {
        const nombre = item.producto.nombre.length > ANCHO
          ? item.producto.nombre.slice(0, ANCHO)
          : item.producto.nombre
        const detalle = `${item.cantidad} x ${formatCurrency(item.precio_unitario)}`
        const totalItem = formatCurrency(item.precio_unitario * item.cantidad)
        return (
          <span key={item.producto.id}>
            {nombre}
            {'\n'}
            {linea(detalle, totalItem)}
            {'\n'}
            {item.descuento > 0
              ? `Desc: -${formatCurrency(item.descuento)}\n`
              : ''}
          </span>
        )
      })}

      {sep}
      {'\n'}

      {/* Totales */}
      {linea('Subtotal', formatCurrency(subtotal))}
      {'\n'}
      {descuento > 0
        ? linea('Descuento', `-${formatCurrency(descuento)}`) + '\n'
        : ''}
      {linea('TOTAL', formatCurrency(total))}
      {'\n'}

      {sep}
      {'\n'}

      {/* Método de pago */}
      {linea('Pago', metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1))}
      {'\n'}
      {metodoPago === 'efectivo' && efectivoRecibido !== undefined && efectivoRecibido > 0
        ? linea('Efectivo recibido', formatCurrency(efectivoRecibido)) + '\n' +
          linea('Cambio', formatCurrency(cambio ?? 0)) + '\n'
        : ''}

      {sep}
      {'\n'}

      {/* Pie */}
      {centrar('¡Gracias por su compra!')}
      {'\n'}
      {centrar('Conserve su ticket')}
      {'\n'}
    </div>
  )
}
  },
);

Ticket.displayName = "Ticket";
