"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ItemCarrito, MetodoPago } from "./useCarrito";

type Props = {
  items: ItemCarrito[];
  total: number;
  descuento: number;
  metodoPago: MetodoPago;
  clienteNombre: string | null;
  clienteSaldoActual?: number;
  clienteLimiteCredito?: number;
  onConfirmar: (efectivoRecibido: number) => Promise<void>;
  onClose: () => void;
};

export function ModalCobro({
  items,
  total,
  descuento,
  metodoPago,
  clienteNombre,
  clienteSaldoActual,
  clienteLimiteCredito,
  onConfirmar,
  onClose,
}: Props) {
  const [efectivo, setEfectivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const efectivoNum = parseFloat(efectivo) || 0;
  const cambio = Math.max(0, efectivoNum - total);
  const faltante = Math.max(0, total - efectivoNum);

  const sugerencias = [
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
  ]
    .filter((v, i, arr) => v >= total && arr.indexOf(v) === i)
    .slice(0, 4);

  async function handleConfirmar() {
    if (metodoPago === "efectivo" && efectivoNum < total) {
      setError("El efectivo recibido es menor al total");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirmar(efectivoNum);
    } catch {
      setError("Error al procesar la venta");
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleConfirmar();
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-md"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-medium text-text-primary">Confirmar cobro</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Resumen de la venta */}
          <div className="bg-surface-2 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>
                {items.length} producto{items.length !== 1 ? "s" : ""}
              </span>
              <span>{clienteNombre ?? "Público general"}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Descuento</span>
                <span className="text-success">
                  − {formatCurrency(descuento)}
                </span>
              </div>
            )}
            <div
              className="flex justify-between text-xl font-medium text-text-primary pt-1
                            border-t border-border"
            >
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Método:</span>
            <span className="text-sm font-medium text-text-primary capitalize">
              {metodoPago}
            </span>
          </div>

          {metodoPago === "credito" && (
            <div className="space-y-3">
              <div className="bg-surface-2 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Saldo actual</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(clienteSaldoActual ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="text-text-secondary">
                    Saldo después de esta venta
                  </span>
                  <span className="font-mono font-medium text-text-primary">
                    {formatCurrency((clienteSaldoActual ?? 0) + total)}
                  </span>
                </div>
              </div>

              {clienteLimiteCredito !== undefined &&
                clienteLimiteCredito > 0 &&
                (clienteSaldoActual ?? 0) + total > clienteLimiteCredito && (
                  <div
                    className="bg-warning-soft border border-warning/20 text-warning text-sm
                      rounded-lg px-3 py-2 flex items-start gap-2"
                  >
                    <span>
                      Esta venta excede el límite de crédito del cliente (
                      {formatCurrency(clienteLimiteCredito)}). Puedes continuar
                      si decides autorizarlo.
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Input efectivo */}
          {metodoPago === "efectivo" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Efectivo recibido
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                    $
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={efectivo}
                    onChange={(e) => setEfectivo(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 border border-border rounded-xl
                               text-lg font-medium font-mono focus:outline-none focus:ring-2
                               focus:ring-accent text-center bg-surface text-text-primary"
                  />
                </div>
              </div>

              {/* Sugerencias de monto */}
              {sugerencias.length > 0 && (
                <div className="flex gap-2">
                  {sugerencias.map((s) => (
                    <button
                      key={s}
                      onClick={() => setEfectivo(String(s))}
                      className="flex-1 py-2 border border-border rounded-lg text-sm
                                 text-text-secondary hover:bg-hover transition-colors font-medium font-mono"
                    >
                      ${s}
                    </button>
                  ))}
                </div>
              )}

              {/* Cambio */}
              {efectivoNum > 0 && (
                <div
                  className={`rounded-xl p-3 text-center border ${
                    faltante > 0
                      ? "bg-danger-soft border-danger/20"
                      : "bg-success-soft border-success/20"
                  }`}
                >
                  {faltante > 0 ? (
                    <div>
                      <p className="text-xs text-danger">Falta</p>
                      <p className="text-2xl font-medium text-danger font-mono">
                        {formatCurrency(faltante)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-success">Cambio</p>
                      <p className="text-2xl font-medium text-success font-mono">
                        {formatCurrency(cambio)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              className="bg-danger-soft border border-danger/20 text-danger text-sm
                            rounded-lg px-3 py-2 text-center"
            >
              {error}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-border rounded-xl text-sm
                       font-medium text-text-secondary hover:bg-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={
              loading ||
              (metodoPago === "efectivo" && faltante > 0 && efectivoNum > 0) ||
              (metodoPago === "efectivo" && efectivoNum === 0)
            }
            className="flex-2 md:flex-1 py-3 bg-accent text-white rounded-xl text-sm
                       font-medium hover:bg-accent-hover transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              "Procesando..."
            ) : (
              <>
                <Check size={16} />
                Confirmar cobro
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
