"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  History,
} from "lucide-react";
import { useClientes } from "@/components/clientes/useClientes";
import { ClienteModal } from "@/components/clientes/ClienteModal";
import { ModalAbono } from "@/components/clientes/ModalAbono";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@repo/types";
import { ClientesSkeleton } from "@/components/ui/skeletons/ClientesSkeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export default function ClientesPage() {
  const {
    clientes,
    loading,
    busqueda,
    setBusqueda,
    soloConCredito,
    setSoloConCredito,
    pagina,
    setPagina,
    totalRegistros,
    porPagina,
    agregarLocal,
    actualizarLocal,
    toggleActivo,
    cargaInicial,
  } = useClientes();

  const [sucursalId, setSucursalId] = useState("");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  const [clienteAbono, setClienteAbono] = useState<Cliente | null>(null);
  const supabaseRef = useRef(createClient());
  const router = useRouter();

  useEffect(() => {
    let activo = true;
    async function cargar() {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("sucursal_id")
        .eq("id", user.id)
        .single();
      if (activo && perfil?.sucursal_id) setSucursalId(perfil.sucursal_id);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  async function handleToggleActivo(cliente: Cliente) {
    try {
      await toggleActivo(cliente.id, !cliente.activo);
      toast.success(
        cliente.activo
          ? "Cliente desactivado correctamente"
          : "Cliente activado correctamente",
      );
    } catch {
      toast.error("Error al cambiar el estado del cliente");
    }
  }

  const totalSaldoPendiente = clientes.reduce(
    (acc, c) => acc + c.saldo_credito,
    0,
  );
  const clientesConDeuda = clientes.filter((c) => c.saldo_credito > 0).length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / porPagina));

  if (cargaInicial) return <ClientesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Clientes</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalRegistros} cliente{totalRegistros !== 1 ? "s" : ""} registrado
            {totalRegistros !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-accent text-white text-sm
                     font-medium px-4 py-2.5 rounded-lg hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary mb-1">Total clientes</p>
          <p className="text-2xl font-semibold text-text-primary font-mono">
            {totalRegistros}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary mb-1">
            Con saldo pendiente
          </p>
          <p className="text-2xl font-semibold text-danger font-mono">
            {clientesConDeuda}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary mb-1">Total por cobrar</p>
          <p className="text-2xl font-semibold text-danger font-mono">
            {formatCurrency(totalSaldoPendiente)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-xl border border-border p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={soloConCredito}
            onChange={(e) => setSoloConCredito(e.target.checked)}
            className="rounded"
          />
          Solo con saldo pendiente
        </label>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {clientes.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <Users size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No hay clientes registrados</p>
            <button
              onClick={() => setModalNuevo(true)}
              className="mt-3 text-sm text-accent font-medium hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                    Cliente
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                    Teléfono
                  </th>
                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                    Límite crédito
                  </th>
                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                    Saldo pendiente
                  </th>
                  <th className="text-center text-xs font-medium text-text-secondary px-4 py-3">
                    Estado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-surface-2 flex items-center
                                        justify-center shrink-0"
                        >
                          <span className="text-xs font-medium text-text-secondary">
                            {cliente.nombre.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {cliente.nombre}
                          </p>
                          {cliente.notas && (
                            <p className="text-xs text-text-tertiary truncate max-w-40">
                              {cliente.notas}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {cliente.telefono ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary font-mono">
                      {cliente.limite_credito > 0
                        ? formatCurrency(cliente.limite_credito)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium font-mono ${
                          cliente.saldo_credito > 0
                            ? "text-danger"
                            : "text-text-tertiary"
                        }`}
                      >
                        {cliente.saldo_credito > 0
                          ? formatCurrency(cliente.saldo_credito)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="grid place-content-center">
                        <button
                          onClick={() => handleToggleActivo(cliente)}
                          role="switch"
                          aria-checked={cliente.activo}
                          title={
                            cliente.activo
                              ? "Clic para desactivar"
                              : "Clic para activar"
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors shrink-0 ${
                    cliente.activo ? "bg-success" : "bg-danger"
                  }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center h-4.5 w-4.5
                    transform rounded-full bg-white shadow-sm
                    transition-transform ${
                      cliente.activo ? "translate-x-5.5" : "translate-x-0.75"
                    }`}
                          >
                            {cliente.activo ? (
                              <Check
                                size={11}
                                className="text-success"
                                strokeWidth={3}
                              />
                            ) : (
                              <X
                                size={11}
                                className="text-danger"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {cliente.saldo_credito > 0 && (
                          <button
                            onClick={() => setClienteAbono(cliente)}
                            className="text-text-tertiary hover:text-success transition-colors p-1"
                            title="Registrar abono"
                          >
                            <CreditCard size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/clientes/${cliente.id}`)}
                          className="text-text-tertiary hover:text-text-primary transition-colors p-1"
                          title="Ver historial de crédito"
                        >
                          <History size={15} />
                        </button>
                        <button
                          onClick={() => setClienteEditar(cliente)}
                          className="text-text-tertiary hover:text-text-primary transition-colors p-1"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-2">
              <p className="text-xs text-text-tertiary">
                Mostrando {pagina * porPagina + 1}–
                {Math.min((pagina + 1) * porPagina, totalRegistros)} de{" "}
                {totalRegistros}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="w-7 h-7 rounded-lg border border-border text-text-secondary
                             hover:bg-hover transition-colors disabled:opacity-40
                             disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-text-secondary px-2 font-mono">
                  {pagina + 1} / {totalPaginas}
                </span>
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(totalPaginas - 1, p + 1))
                  }
                  disabled={pagina >= totalPaginas - 1}
                  className="w-7 h-7 rounded-lg border border-border text-text-secondary
                             hover:bg-hover transition-colors disabled:opacity-40
                             disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      {(modalNuevo || clienteEditar) && (
        <ClienteModal
          cliente={clienteEditar}
          sucursalId={sucursalId}
          onClose={() => {
            setModalNuevo(false);
            setClienteEditar(null);
          }}
          onGuardado={(cliente) => {
            if (clienteEditar) {
              actualizarLocal(cliente);
            } else {
              agregarLocal(cliente);
            }
            setModalNuevo(false);
            setClienteEditar(null);
          }}
        />
      )}

      {clienteAbono && (
        <ModalAbono
          cliente={clienteAbono}
          onClose={() => setClienteAbono(null)}
          onGuardado={(cliente) => {
            actualizarLocal(cliente);
            setClienteAbono(null);
          }}
        />
      )}
    </div>
  );
}
