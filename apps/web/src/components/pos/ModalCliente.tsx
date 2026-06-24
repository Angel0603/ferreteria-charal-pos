"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search, Plus, User, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@repo/types";
import { ModalAbono } from "@/components/clientes/ModalAbono";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

type Props = {
  sucursalId: string;
  onSeleccionar: (cliente: Cliente | null) => void;
  onClose: () => void;
};

export function ModalCliente({ sucursalId, onSeleccionar, onClose }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTel, setNuevoTel] = useState("");
  const [creando, setCreando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const supabaseRef = useRef(createClient());
  const inputRef = useRef<HTMLInputElement>(null);
  const [clienteParaAbono, setClienteParaAbono] = useState<Cliente | null>(
    null,
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let activo = true;
    async function buscar() {
      setLoading(true);
      const supabase = supabaseRef.current;
      let query = supabase
        .from("clientes")
        .select("*")
        .eq("sucursal_id", sucursalId)
        .eq("activo", true)
        .order("nombre")
        .limit(8);

      if (busqueda.trim()) {
        query = query.or(
          `nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`,
        );
      }

      const { data } = await query;
      if (activo && data) setClientes(data);
      if (activo) setLoading(false);
    }
    buscar();
    return () => {
      activo = false;
    };
  }, [busqueda, sucursalId]);

  async function handleCrearRapido() {
    if (!nuevoNombre.trim()) {
      toast.warning("El nombre es obligatorio");
      return;
    }
    setCreando(true);
    try {
      const { data, error } = await supabaseRef.current
        .from("clientes")
        .insert({
          nombre: nuevoNombre.trim(),
          telefono: nuevoTel.trim() || null,
          sucursal_id: sucursalId,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Cliente creado");
      onSeleccionar(data);
    } catch {
      toast.error("Error al crear el cliente");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-medium text-text-primary">Seleccionar cliente</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Buscador */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              ref={inputRef}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary placeholder:text-text-tertiary"
            />
          </div>

          {/* Público general */}
          <button
            onClick={() => onSeleccionar(null)}
            className="w-full flex items-center gap-3 px-4 py-3 border border-border
                       rounded-xl hover:bg-hover transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
              <User size={14} className="text-text-tertiary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Público general
              </p>
              <p className="text-xs text-text-tertiary">Sin cliente asignado</p>
            </div>
          </button>

          {/* Lista */}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-text-tertiary text-center py-4">
                Buscando...
              </p>
            ) : clientes.length === 0 && busqueda ? (
              <p className="text-sm text-text-tertiary text-center py-4">
                No se encontró ningún cliente
              </p>
            ) : (
              clientes.map((c) => (
                <div
                  key={c.id}
                  className="w-full flex items-center justify-between px-4 py-2.5
               rounded-xl hover:bg-hover transition-colors"
                >
                  <button
                    onClick={() => onSeleccionar(c)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full bg-surface-2 flex items-center
                      justify-center shrink-0"
                    >
                      <span className="text-xs font-medium text-text-secondary">
                        {c.nombre.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {c.nombre}
                      </p>
                      {c.telefono && (
                        <p className="text-xs text-text-tertiary">
                          {c.telefono}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {c.saldo_credito > 0 && (
                      <>
                        <span className="text-xs text-danger font-medium font-mono">
                          Debe ${c.saldo_credito.toFixed(2)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClienteParaAbono(c);
                          }}
                          title="Registrar abono"
                          className="text-text-tertiary hover:text-success transition-colors p-1"
                        >
                          <CreditCard size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Crear cliente rápido */}
          <div className="border-t border-border pt-3">
            {!mostrarForm ? (
              <button
                onClick={() => setMostrarForm(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 border border-dashed
                           border-border-strong rounded-xl text-sm text-text-tertiary
                           hover:bg-hover transition-colors"
              >
                <Plus size={15} />
                Crear cliente nuevo
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre del cliente *"
                  autoFocus
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                             text-text-primary"
                />
                <input
                  value={nuevoTel}
                  onChange={(e) => setNuevoTel(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  type="tel"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                             text-text-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setMostrarForm(false)}
                    className="flex-1 py-2 border border-border rounded-lg text-sm
                               text-text-secondary hover:bg-hover transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearRapido}
                    disabled={creando}
                    className="flex-1 py-2 bg-accent text-white rounded-lg text-sm
                               font-medium hover:bg-accent-hover transition-colors
                               disabled:opacity-50"
                  >
                    {creando ? "Creando..." : "Crear y seleccionar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {clienteParaAbono && (
        <ModalAbono
          cliente={clienteParaAbono}
          onClose={() => setClienteParaAbono(null)}
          onGuardado={(clienteActualizado) => {
            setClientes((prev) =>
              prev.map((c) =>
                c.id === clienteActualizado.id ? clienteActualizado : c,
              ),
            );
            setClienteParaAbono(null);
          }}
        />
      )}
    </div>
  );
}
