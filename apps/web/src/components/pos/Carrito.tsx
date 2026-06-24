"use client";

import {
  Plus,
  Minus,
  Trash2,
  User,
  FileText,
  Receipt,
  Banknote,
  CreditCard,
  Landmark,
  Shuffle,
  HandCoins,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { Package } from "lucide-react";
import type { ItemCarrito, MetodoPago } from "./useCarrito";

type Props = {
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  clienteId: string | null;
  clienteNombre: string | null;
  onCantidad: (productoId: string, cantidad: number) => void;
  onEliminar: (productoId: string) => void;
  onMetodoPago: (metodo: MetodoPago) => void;
  onCobrar: () => void;
  onCliente: () => void;
  onDescuento: () => void;
};

const METODOS: { value: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { value: "efectivo", label: "Efectivo", icon: <Banknote size={15} /> },
  { value: "tarjeta", label: "Tarjeta", icon: <CreditCard size={15} /> },
  {
    value: "transferencia",
    label: "Transferencia",
    icon: <Landmark size={15} />,
  },
  { value: "mixto", label: "Mixto", icon: <Shuffle size={15} /> },
  { value: "credito", label: "Crédito", icon: <HandCoins size={15} /> },
];

export function Carrito({
  items,
  subtotal,
  descuento,
  total,
  metodoPago,
  clienteId,
  clienteNombre,
  onCantidad,
  onEliminar,
  onMetodoPago,
  onCobrar,
  onCliente,
  onDescuento,
}: Props) {
  return (
    <div className="h-full flex flex-col bg-surface border-l border-border">
      {/* Header tipo ticket */}
      <div className="px-4 pt-4 pb-3 border-b border-dashed border-border-strong shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-accent" />
            <h2 className="text-sm font-medium text-text-primary">
              Venta actual
            </h2>
          </div>
          <span className="text-xs text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-full">
            {items.length} producto{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          onClick={onCliente}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg
                     bg-surface-2 hover:bg-hover transition-colors"
        >
          <User size={14} className="text-text-tertiary" />
          <span className="flex-1 text-left text-sm text-text-secondary truncate">
            {clienteNombre || "Público general"}
          </span>
          <span
            className="text-xs font-mono bg-surface text-text-tertiary
                           px-1.5 py-0.5 rounded border border-border"
          >
            F4
          </span>
        </button>
      </div>

      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2 px-4">
            <FileText size={32} className="opacity-30" />
            <p className="text-sm">Sin productos</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.producto.id} className="px-4 py-3 flex gap-3">
                <div
                  className="w-10 h-10 rounded-lg bg-surface-2 border border-border
                                flex items-center justify-center shrink-0 relative overflow-hidden"
                >
                  {item.producto.imagen_url ? (
                    <Image
                      src={item.producto.imagen_url}
                      alt={item.producto.nombre}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <Package size={16} className="text-text-tertiary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {item.producto.nombre}
                  </p>
                  <p className="text-xs text-text-tertiary font-mono">
                    {item.cantidad} × {formatCurrency(item.precio_unitario)}
                  </p>

                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onCantidad(item.producto.id, item.cantidad - 1)
                        }
                        className="w-6 h-6 rounded-md border border-border text-text-secondary
                                   hover:bg-hover transition-colors flex items-center justify-center"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-mono w-6 text-center text-text-primary">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          onCantidad(item.producto.id, item.cantidad + 1)
                        }
                        className="w-6 h-6 rounded-md border border-border text-text-secondary
                                   hover:bg-hover transition-colors flex items-center justify-center"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <span className="text-sm font-medium text-text-primary font-mono">
                      {formatCurrency(item.precio_unitario * item.cantidad)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onEliminar(item.producto.id)}
                  className="text-text-tertiary hover:text-danger transition-colors shrink-0 self-start"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: totales y cobro */}
      <div
        className="border-t border-dashed border-border-strong p-4 space-y-3 shrink-0
                      bg-surface-2"
      >
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="text-text-primary font-mono">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <button
            onClick={onDescuento}
            className="flex justify-between text-sm w-full hover:opacity-70 transition-opacity"
          >
            <span className="text-text-secondary flex items-center gap-1.5">
              Descuento
              <span
                className="text-xs font-mono bg-surface text-text-tertiary
                               px-1.5 py-0.5 rounded border border-border"
              >
                F8
              </span>
            </span>
            <span
              className={
                descuento > 0 ? "text-success font-mono" : "text-text-tertiary"
              }
            >
              {descuento > 0 ? `-${formatCurrency(descuento)}` : "—"}
            </span>
          </button>
          <div className="flex justify-between pt-2 border-t border-border-strong">
            <span className="font-medium text-text-primary">Total</span>
            <span className="text-lg font-semibold text-accent font-mono">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {METODOS.filter((m) => m.value !== "credito").map((m) => (
            <button
              key={m.value}
              onClick={() => onMetodoPago(m.value)}
              className={`py-2 rounded-lg border text-xs font-medium flex items-center
                  justify-center gap-1.5 transition-colors ${
                    metodoPago === m.value
                      ? "bg-accent-soft border-accent text-accent"
                      : "bg-surface text-text-secondary border-border hover:bg-hover"
                  }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onMetodoPago("credito")}
          disabled={!clienteId}
          title={
            !clienteId
              ? "Selecciona un cliente para vender a crédito"
              : undefined
          }
          className={`w-full py-2 rounded-lg border text-xs font-medium flex items-center
              justify-center gap-1.5 transition-colors disabled:opacity-40
              disabled:cursor-not-allowed ${
                metodoPago === "credito"
                  ? "bg-accent-soft border-accent text-accent"
                  : "bg-surface text-text-secondary border-border hover:bg-hover"
              }`}
        >
          <HandCoins size={15} />
          Vender a crédito
        </button>

        <button
          onClick={onCobrar}
          disabled={items.length === 0}
          className="w-full py-3 bg-accent text-white rounded-xl font-medium
                     hover:bg-accent-hover transition-colors disabled:opacity-40
                     disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Cobrar {formatCurrency(total)}
          <span className="text-xs font-mono bg-white/20 px-1.5 py-0.5 rounded">
            F10
          </span>
        </button>
      </div>
    </div>
  );
}
