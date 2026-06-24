"use client";

import { useState } from "react";
import { X, Banknote, CreditCard, Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@repo/types";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

type Props = {
  cliente: Cliente;
  onClose: () => void;
  onGuardado: (cliente: Cliente) => void;
};

const MAX_NOTAS = 120;

export function ModalAbono({ cliente, onClose, onGuardado }: Props) {
  const supabase = createClient();
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState<
    "efectivo" | "tarjeta" | "transferencia"
  >("efectivo");

  const montoNum = parseFloat(monto) || 0;
  const saldoNuevo = Math.max(0, cliente.saldo_credito - montoNum);

  function handleMontoChange(e: React.ChangeEvent<HTMLInputElement>) {
    let valor = e.target.value.replace(/[^0-9.]/g, "");
    const partes = valor.split(".");
    if (partes.length > 2) {
      valor = partes[0] + "." + partes.slice(1).join("");
    }
    if (partes[1]?.length > 2) {
      valor = partes[0] + "." + partes[1].slice(0, 2);
    }
    setMonto(valor);
  }

  function handleNotasChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNotas(e.target.value.slice(0, MAX_NOTAS));
  }

  async function handleAbonar() {
    if (!monto || montoNum <= 0) {
      toast.warning("El monto debe ser mayor a 0");
      return;
    }
    if (montoNum > cliente.saldo_credito) {
      toast.warning("El abono no puede ser mayor al saldo pendiente");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No se pudo identificar al usuario");

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("sucursal_id")
        .eq("id", user.id)
        .single();

      if (!perfil?.sucursal_id)
        throw new Error("No se pudo identificar la sucursal");

      const { data, error } = await supabase
        .from("clientes")
        .update({ saldo_credito: saldoNuevo })
        .eq("id", cliente.id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("abonos").insert({
        cliente_id: cliente.id,
        sucursal_id: perfil.sucursal_id,
        cajero_id: user.id,
        monto: montoNum,
        saldo_previo: cliente.saldo_credito,
        saldo_nuevo: saldoNuevo,
        metodo_pago: metodoPago,
        notas: notas.trim() || null,
      });

      toast.success("Abono registrado correctamente", {
        description: `Saldo restante: ${formatCurrency(saldoNuevo)}`,
      });
      onGuardado(data);
      onClose();
    } catch (err) {
      toast.error("Error al registrar el abono", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-medium text-text-primary">Registrar abono</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-surface-2 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-text-primary">
              {cliente.nombre}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Saldo pendiente</span>
              <span className="font-medium text-danger font-mono">
                {formatCurrency(cliente.saldo_credito)}
              </span>
            </div>
            {montoNum > 0 && (
              <div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
                <span className="text-text-secondary">
                  Saldo después del abono
                </span>
                <span className="font-medium text-success font-mono">
                  {formatCurrency(saldoNuevo)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Monto del abono
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={monto}
                onChange={handleMontoChange}
                autoFocus
                className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg
                           text-sm focus:outline-none focus:ring-2 focus:ring-accent
                           bg-surface text-text-primary font-mono"
                placeholder="0.00"
              />
            </div>
            {montoNum > cliente.saldo_credito && (
              <p className="text-xs text-danger mt-1">
                El abono no puede ser mayor al saldo pendiente
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Método de pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  value: "efectivo" as const,
                  label: "Efectivo",
                  icon: <Banknote size={14} />,
                },
                {
                  value: "tarjeta" as const,
                  label: "Tarjeta",
                  icon: <CreditCard size={14} />,
                },
                {
                  value: "transferencia" as const,
                  label: "Transferencia",
                  icon: <Landmark size={14} />,
                },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMetodoPago(m.value)}
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Notas (opcional)
              </label>
              <span className="text-xs text-text-tertiary">
                {notas.length}/{MAX_NOTAS}
              </span>
            </div>
            <input
              type="text"
              value={notas}
              onChange={handleNotasChange}
              maxLength={MAX_NOTAS}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="Ej. Pago en efectivo"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm
                         font-medium text-text-secondary hover:bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAbonar}
              disabled={
                loading || montoNum <= 0 || montoNum > cliente.saldo_credito
              }
              className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Registrar abono"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
