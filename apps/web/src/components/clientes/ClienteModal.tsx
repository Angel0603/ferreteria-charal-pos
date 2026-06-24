"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@repo/types";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

type Props = {
  cliente: Cliente | null;
  sucursalId: string;
  onClose: () => void;
  onGuardado: (cliente: Cliente) => void;
};

const MAX_NOMBRE        = 60;
const MAX_NOTAS         = 200;
const MAX_LIMITE_CREDITO = 999999;

export function ClienteModal({
  cliente,
  sucursalId,
  onClose,
  onGuardado,
}: Props) {
  const supabase = createClient();
  const esEdicion = !!cliente;

  const [form, setForm] = useState({
    nombre: cliente?.nombre ?? "",
    telefono: cliente?.telefono ?? "",
    limite_credito: cliente?.limite_credito ?? 0,
    notas: cliente?.notas ?? "",
  });
  const [limiteCreditoTexto, setLimiteCreditoTexto] = useState(
    cliente?.limite_credito ? String(cliente.limite_credito) : "",
  );
  const [loading, setLoading] = useState(false);

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, nombre: e.target.value.slice(0, MAX_NOMBRE) }));
  }

  function handleTelefonoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, telefono: valor }));
  }

  function handleLimiteCreditoChange(e: React.ChangeEvent<HTMLInputElement>) {
    let valor = e.target.value.replace(/[^0-9.]/g, "");
    const partes = valor.split(".");
    if (partes.length > 2) {
      valor = partes[0] + "." + partes.slice(1).join("");
    }
    if (partes[1]?.length > 2) {
      valor = partes[0] + "." + partes[1].slice(0, 2);
    }
    setLimiteCreditoTexto(valor);
    setForm((prev) => ({ ...prev, limite_credito: parseFloat(valor) || 0 }));
  }

  function handleNotasChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, notas: e.target.value.slice(0, MAX_NOTAS) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nombreLimpio = form.nombre.trim();

    if (!nombreLimpio) {
      toast.warning("El nombre es obligatorio");
      return;
    }
    if (nombreLimpio.length < 3) {
      toast.warning("El nombre debe tener al menos 3 caracteres");
      return;
    }
    if (form.telefono && form.telefono.length !== 10) {
      toast.warning("El teléfono debe tener exactamente 10 dígitos");
      return;
    }
    if (form.limite_credito > MAX_LIMITE_CREDITO) {
      toast.warning(`El límite de crédito no puede ser mayor a ${MAX_LIMITE_CREDITO.toLocaleString("es-MX")}`);
      return;
    }
    if (form.limite_credito < 0) {
      toast.warning("El límite de crédito no puede ser negativo");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        nombre: nombreLimpio,
        telefono: form.telefono || null,
        notas: form.notas.trim() || null,
      };

      if (esEdicion && cliente) {
        const { data, error } = await supabase
          .from("clientes")
          .update(payload)
          .eq("id", cliente.id)
          .select()
          .single();
        if (error) throw error;
        toast.success("Cliente actualizado correctamente");
        onGuardado(data);
      } else {
        const { data, error } = await supabase
          .from("clientes")
          .insert({ ...payload, sucursal_id: sucursalId })
          .select()
          .single();
        if (error) throw error;
        toast.success("Cliente creado correctamente");
        onGuardado(data);
      }
    } catch (err) {
      toast.error("Error al guardar el cliente", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-medium text-text-primary">
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Nombre <span className="text-danger">*</span>
              </label>
              <span className="text-xs text-text-tertiary">
                {form.nombre.length}/{MAX_NOMBRE}
              </span>
            </div>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleNombreChange}
              maxLength={MAX_NOMBRE}
              required
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary"
              placeholder="Nombre completo"
            />
            {form.nombre && form.nombre.trim().length < 3 && (
              <p className="text-xs text-warning mt-1">
                El nombre debe tener al menos 3 caracteres
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Teléfono
            </label>
            <input
              name="telefono"
              value={form.telefono ?? ""}
              onChange={handleTelefonoChange}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary font-mono"
              placeholder="5550001234"
            />
            {form.telefono && form.telefono.length < 10 && (
              <p className="text-xs text-warning mt-1">
                El teléfono debe tener 10 dígitos
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Límite de crédito
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                $
              </span>
              <input
                name="limite_credito"
                value={limiteCreditoTexto}
                onChange={handleLimiteCreditoChange}
                type="text"
                inputMode="decimal"
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary font-mono"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Monto máximo que puede deber. 0 = sin crédito.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Notas
              </label>
              <span className="text-xs text-text-tertiary">
                {form.notas.length}/{MAX_NOTAS}
              </span>
            </div>
            <textarea
              name="notas"
              value={form.notas ?? ""}
              onChange={handleNotasChange}
              maxLength={MAX_NOTAS}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary resize-none"
              placeholder="Observaciones del cliente..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm
                         font-medium text-text-secondary hover:bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50"
            >
              {loading
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}