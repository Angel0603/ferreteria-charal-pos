"use client";

import { useState, useEffect, useRef } from "react";
import { X, Percent, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  descuentoActual: number;
  onAplicar: (descuento: number) => void;
  onClose: () => void;
};

export function ModalDescuentoProducto({
  nombreProducto,
  precioUnitario,
  cantidad,
  descuentoActual,
  onAplicar,
  onClose,
}: Props) {
  const [tipo, setTipo] = useState<"porcentaje" | "monto">("porcentaje");
  // Inicializar el valor según el descuento actual
  const [valor, setValor] = useState(() => {
    if (descuentoActual > 0) {
      const subtotal = precioUnitario * cantidad;
      return String(Math.round((descuentoActual / subtotal) * 100));
    }
    return "";
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const subtotalOriginal = precioUnitario * cantidad;

  const descuentoCalculado = (() => {
    const v = parseFloat(valor) || 0;
    if (tipo === "porcentaje")
      return Math.min(subtotalOriginal, (subtotalOriginal * v) / 100);
    return Math.min(subtotalOriginal, v);
  })();

  const totalConDescuento = subtotalOriginal - descuentoCalculado;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleCambiarTipo(nuevoTipo: "porcentaje" | "monto") {
    const v = parseFloat(valor) || 0;
    if (nuevoTipo === "monto" && tipo === "porcentaje") {
      // Convertir porcentaje a monto
      const monto = (subtotalOriginal * v) / 100;
      setValor(monto > 0 ? String(monto.toFixed(2)) : "");
    } else if (nuevoTipo === "porcentaje" && tipo === "monto") {
      // Convertir monto a porcentaje
      const pct =
        subtotalOriginal > 0 ? Math.round((v / subtotalOriginal) * 100) : 0;
      setValor(pct > 0 ? String(pct) : "");
    }
    setTipo(nuevoTipo);
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^0-9.]/g, "");
    const partes = v.split(".");
    if (partes.length > 2) v = partes[0] + "." + partes.slice(1).join("");
    if (partes[1]?.length > 2) v = partes[0] + "." + partes[1].slice(0, 2);
    if (tipo === "porcentaje" && parseFloat(v) > 100) v = "100";
    setValor(v);
  }

  function handleAplicar() {
    if (!valor || descuentoCalculado < 0) {
      toast.warning("Ingresa un valor válido");
      return;
    }
    onAplicar(descuentoCalculado);
    toast.success("Descuento aplicado");
    onClose();
  }

  function handleEliminar() {
    onAplicar(0);
    toast.success("Descuento eliminado");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-medium text-text-primary">
              Descuento por producto
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5 truncate max-w-56">
              {nombreProducto}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Resumen */}
          <div className="bg-surface-2 rounded-xl p-3 flex justify-between text-sm">
            <span className="text-text-secondary">
              {cantidad} × {formatCurrency(precioUnitario)}
            </span>
            <span className="font-medium text-text-primary font-mono">
              {formatCurrency(subtotalOriginal)}
            </span>
          </div>

          {/* Toggle tipo */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "porcentaje" as const,
                label: "Porcentaje",
                ejemplo: "Ej. 10%",
                icon: <Percent size={20} />,
              },
              {
                value: "monto" as const,
                label: "Monto fijo",
                ejemplo: "Ej. $20.00",
                icon: <DollarSign size={20} />,
              },
            ].map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => handleCambiarTipo(op.value)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border
                  transition-all duration-150 ${
                    tipo === op.value
                      ? "bg-accent-soft border-accent"
                      : "bg-surface-2 border-border hover:bg-hover"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center
                       transition-colors ${
                         tipo === op.value
                           ? "bg-accent text-white"
                           : "bg-surface border border-border text-text-secondary"
                       }`}
                >
                  {op.icon}
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${
                      tipo === op.value ? "text-accent" : "text-text-secondary"
                    }`}
                  >
                    {op.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      tipo === op.value
                        ? "text-accent/70"
                        : "text-text-tertiary"
                    }`}
                  >
                    {op.ejemplo}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleCambiarTipo("monto")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md
              text-sm font-medium transition-colors ${
                tipo === "monto"
                  ? "bg-surface text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
          >
            <DollarSign size={14} />
            Monto fijo
          </button>

          {/* Input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
              {tipo === "porcentaje" ? "%" : "$"}
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={handleValorChange}
              placeholder={tipo === "porcentaje" ? "0 – 100" : "0.00"}
              className="w-full pl-8 pr-3 py-3 border border-border rounded-xl text-lg
                         font-medium font-mono text-center focus:outline-none
                         focus:ring-2 focus:ring-accent bg-surface text-text-primary"
            />
          </div>

          {/* Preview */}
          {descuentoCalculado > 0 && (
            <div className="bg-success-soft rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Descuento</span>
                <span className="text-success font-mono">
                  -{formatCurrency(descuentoCalculado)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t border-success/20 pt-1.5">
                <span className="text-text-primary">Total con descuento</span>
                <span className="text-text-primary font-mono">
                  {formatCurrency(totalConDescuento)}
                </span>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            {descuentoActual > 0 && (
              <button
                type="button"
                onClick={handleEliminar}
                className="px-4 py-2.5 border border-danger/30 bg-danger-soft text-danger
                           rounded-xl text-sm font-medium hover:bg-danger-soft/70 transition-colors"
              >
                Quitar descuento
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm
                         font-medium text-text-secondary hover:bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAplicar}
              disabled={!valor || descuentoCalculado <= 0}
              className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
