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
    if (termica) {
      const sep = "─".repeat(28);

      return (
        <div
          ref={ref}
          style={{
            width: "219px",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "12px",
            lineHeight: "1.6",
            color: "#000000",
            background: "#ffffff",
            padding: "6px 8px",
            boxSizing: "border-box",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {/* Encabezado */}
          <div style={{ textAlign: "center", marginBottom: "5px" }}>
            <p
              style={{ fontWeight: "900", fontSize: "16px", margin: "0 0 2px" }}
            >
              {sucursalNombre.toUpperCase()}
            </p>
            <p
              style={{ margin: "0 0 1px", fontSize: "13px", fontWeight: "900" }}
            >
              Ferretería y Material Eléctrico El Charal
            </p>
            <p style={{ margin: "0 0 1px", fontSize: "13px", fontWeight: "900" }}>
              Tel: 7713444322
            </p>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "900" }}>{fechaHora}</p>
          </div>

          <p
            style={{ margin: "3px 0", textAlign: "center", fontWeight: "900" }}
          >
            {sep}
          </p>

          <p style={{ margin: "2px 0", fontSize: "13px", fontWeight: "900" }}>
            Folio: <b style={{ fontSize: "13px" }}>{folio}</b>
          </p>
          <p style={{ margin: "2px 0", fontSize: "13px", fontWeight: "900" }}>
            Cajero: {cajeroNombre}
          </p>
          <p style={{ margin: "2px 0", fontSize: "13px", fontWeight: "900" }}>
            Cliente: {clienteNombre ?? "Público general"}
          </p>

          <p
            style={{ margin: "3px 0", textAlign: "center", fontWeight: "900" }}
          >
            {sep}
          </p>

          {items.map((item) => (
            <div key={item.producto.id} style={{ marginBottom: "5px" }}>
              <p
                style={{
                  margin: "0 0 1px",
                  fontWeight: "900",
                  fontSize: "14px",
                }}
              >
                {item.producto.nombre}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  fontWeight: "900"
                }}
              >
                <span>
                  {item.cantidad} x {formatCurrency(item.precio_unitario)}
                </span>
                <span style={{ fontWeight: "900" }}>
                  {formatCurrency(item.precio_unitario * item.cantidad)}
                </span>
              </div>
              {item.descuento > 0 && (
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "900" }}>
                  Desc: -{formatCurrency(item.descuento)}
                </p>
              )}
            </div>
          ))}

          <p
            style={{ margin: "3px 0", textAlign: "center", fontWeight: "900" }}
          >
            {sep}
          </p>

          <div style={{ fontSize: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
                fontWeight: "900"
              }}
            >
              <span>Subtotal</span>
              <span style={{ fontWeight: "900", fontSize: "14px" }}>
                {formatCurrency(subtotal)}
              </span>
            </div>
            {descuento > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                  fontWeight: "900"
                }}
              >
                <span>Descuento</span>
                <span style={{ fontWeight: "900" }}>
                  -{formatCurrency(descuento)}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "900",
                fontSize: "14px",
                marginTop: "3px",
                borderTop: "2px solid #000000",
                paddingTop: "3px",
              }}
            >
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <p
            style={{ margin: "3px 0", textAlign: "center", fontWeight: "900" }}
          >
            {sep}
          </p>

          <div style={{ fontSize: "14px", fontWeight: "900" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
              }}
            >
              <span>Pago</span>
              <span style={{ textTransform: "capitalize", fontWeight: "900" }}>
                {metodoPago}
              </span>
            </div>
            {metodoPago === "efectivo" &&
              efectivoRecibido !== undefined &&
              efectivoRecibido > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "2px",
                    }}
                  >
                    <span>Efectivo recibido</span>
                    <span style={{ fontWeight: "900" }}>
                      {formatCurrency(efectivoRecibido)}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontWeight: "900" }}>Cambio</span>
                    <span style={{ fontWeight: "900" }}>
                      {formatCurrency(cambio ?? 0)}
                    </span>
                  </div>
                </>
              )}
          </div>

          <p
            style={{ margin: "3px 0", textAlign: "center", fontWeight: "900" }}
          >
            {sep}
          </p>

          <div style={{ textAlign: "center", marginTop: "3px" }}>
            <p
              style={{ margin: "0 0 2px", fontWeight: "900", fontSize: "14px" }}
            >
              ¡Gracias por su compra!
            </p>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "900" }}>
              Conserve su ticket
            </p>
          </div>
        </div>
      );
    }
    // ── Ticket hoja carta ──
    return (
      <div
        ref={ref}
        style={{
          width: "680px",
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          color: "#1a1a1a",
          background: "#fff",
          padding: "40px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "20px",
            borderBottom: "2px solid #B45309",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "10px",
                fontWeight: "500",
                letterSpacing: "1.2px",
                color: "#B45309",
                textTransform: "uppercase",
                margin: "0 0 6px",
              }}
            >
              Recibo de venta
            </p>
            <h1
              style={{
                fontSize: "21px",
                fontWeight: "700",
                margin: "0 0 4px",
                color: "#111",
              }}
            >
              {sucursalNombre}
            </h1>
            <p style={{ margin: "0 0 1px", fontSize: "12px", color: "#777" }}>
              Ferretería y Material Eléctrico El Charal
            </p>
            <p style={{ margin: "0", color: "#777", fontSize: "12px" }}>
              Tel: 7713444322
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                margin: "0",
                fontSize: "19px",
                fontWeight: "700",
                fontFamily: "monospace",
                color: "#111",
              }}
            >
              {folio}
            </p>
            <p style={{ margin: "4px 0 0", color: "#999", fontSize: "11px" }}>
              {fechaHora}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "14px 0",
            fontSize: "12.5px",
          }}
        >
          <span style={{ color: "#888" }}>
            Cliente:{" "}
            <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
              {clienteNombre ?? "Público general"}
            </span>
          </span>
          <span style={{ color: "#888" }}>
            Cajero:{" "}
            <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
              {cajeroNombre}
            </span>
          </span>
          <span style={{ color: "#888" }}>
            Pago:{" "}
            <span
              style={{
                color: "#1a1a1a",
                fontWeight: "500",
                textTransform: "capitalize",
              }}
            >
              {metodoPago}
            </span>
          </span>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "6px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1.5px solid #1a1a1a" }}>
              {["Producto", "Cant.", "Precio unit.", "Total"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "7px 0",
                    textAlign: i === 0 ? "left" : "right",
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#555",
                    width: i === 0 ? "auto" : "90px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.producto.id}
                style={{ borderBottom: "0.5px solid #eee" }}
              >
                <td style={{ padding: "10px 0", fontWeight: "500" }}>
                  {item.producto.nombre}
                  {item.descuento > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#999",
                        marginLeft: "8px",
                      }}
                    >
                      (desc: -{formatCurrency(item.descuento)})
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    textAlign: "right",
                    color: "#666",
                  }}
                >
                  {item.cantidad}
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    textAlign: "right",
                    color: "#666",
                  }}
                >
                  {formatCurrency(item.precio_unitario)}
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  {formatCurrency(item.precio_unitario * item.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "18px",
          }}
        >
          <div style={{ width: "230px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                color: "#666",
                fontSize: "13px",
              }}
            >
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {descuento > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  color: "#16a34a",
                  fontSize: "13px",
                }}
              >
                <span>Descuento</span>
                <span>-{formatCurrency(descuento)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "11px 14px",
                marginTop: "6px",
                background: "#B45309",
                color: "#fff",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "16px",
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {efectivoRecibido !== undefined && efectivoRecibido > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0 2px",
                    color: "#666",
                    fontSize: "12px",
                    marginTop: "8px",
                  }}
                >
                  <span>Efectivo recibido</span>
                  <span>{formatCurrency(efectivoRecibido)}</span>
                </div>
                {cambio !== undefined && cambio > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "3px 0",
                      fontWeight: "600",
                      color: "#111",
                      fontSize: "13px",
                    }}
                  >
                    <span>Cambio</span>
                    <span>{formatCurrency(cambio)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "28px",
            paddingTop: "16px",
            borderTop: "0.5px solid #e5e5e5",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontWeight: "700",
              fontSize: "13px",
              color: "#111",
            }}
          >
            ¡Gracias por su compra!
          </p>
          <p style={{ margin: "0", color: "#999", fontSize: "10.5px" }}>
            Este documento no es una factura fiscal. Para factura electrónica
            solicítela por separado.
          </p>
        </div>
      </div>
    );
  },
);

Ticket.displayName = "Ticket";
