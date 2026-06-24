"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Truck,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProveedorModal } from "@/components/proveedores/ProveedorModal";
import { ProveedoresSkeleton } from "@/components/ui/skeletons/ProveedoresSkeleton";
import { toast } from "sonner";
import type { Database } from "@repo/types";

type Proveedor = Database["public"]["Tables"]["proveedores"]["Row"];

const POR_PAGINA = 10;

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState<Proveedor | null>(
    null,
  );
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setLoading(true);
      const { data } = await supabaseRef.current
        .from("proveedores")
        .select("*")
        .order("nombre");
      if (activo && data) setProveedores(data);
      if (activo) setLoading(false);
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const agregarLocal = useCallback((proveedor: Proveedor) => {
    setProveedores((prev) =>
      [...prev, proveedor].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
  }, []);

  const actualizarLocal = useCallback((proveedor: Proveedor) => {
    setProveedores((prev) =>
      prev.map((p) => (p.id === proveedor.id ? proveedor : p)),
    );
  }, []);

  async function handleToggleActivo(proveedor: Proveedor) {
    try {
      const nuevoEstado = !proveedor.activo;
      const { data, error } = await supabaseRef.current
        .from("proveedores")
        .update({ activo: nuevoEstado })
        .eq("id", proveedor.id)
        .select()
        .single();
      if (error) throw error;
      setProveedores((prev) =>
        prev.map((p) => (p.id === proveedor.id ? data : p)),
      );
      toast.success(
        proveedor.activo
          ? "Proveedor desactivado correctamente"
          : "Proveedor activado correctamente",
      );
    } catch {
      toast.error("Error al cambiar el estado del proveedor");
    }
  }

  const filtrados = useMemo(
    () =>
      proveedores.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.contacto?.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.telefono?.includes(busqueda) ||
          p.email?.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [proveedores, busqueda],
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);

  const paginados = useMemo(() => {
    const desde = paginaActual * POR_PAGINA;
    return filtrados.slice(desde, desde + POR_PAGINA);
  }, [filtrados, paginaActual]);

  function handleBusquedaChange(valor: string) {
    setBusqueda(valor);
    setPagina(0);
  }

  if (loading) return <ProveedoresSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Proveedores
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {proveedores.length} proveedores registrados
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-accent text-white text-sm
                     font-medium px-4 py-2.5 rounded-lg hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={busqueda}
            onChange={(e) => handleBusquedaChange(e.target.value)}
            placeholder="Buscar por nombre, contacto, teléfono o email..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <Truck size={32} className="mb-3 opacity-40" />
            <p className="text-sm">
              {busqueda ? "Sin resultados" : "No hay proveedores registrados"}
            </p>
            {!busqueda && (
              <button
                onClick={() => setModalNuevo(true)}
                className="mt-3 text-sm text-accent font-medium hover:underline"
              >
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                    Proveedor
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                    Contacto
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                    Teléfono
                  </th>
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                    Email
                  </th>
                  <th className="text-center text-xs font-medium text-text-secondary px-4 py-3">
                    Estado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginados.map((proveedor) => (
                  <tr
                    key={proveedor.id}
                    className="hover:bg-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-surface-2 flex items-center
                                        justify-center shrink-0"
                        >
                          <span className="text-xs font-medium text-text-secondary">
                            {proveedor.nombre.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-text-primary">
                          {proveedor.nombre}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {proveedor.contacto ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {proveedor.telefono ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {proveedor.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="grid place-content-center">
                        <button
                          onClick={() => handleToggleActivo(proveedor)}
                          role="switch"
                          aria-checked={proveedor.activo}
                          title={
                            proveedor.activo
                              ? "Clic para desactivar"
                              : "Clic para activar"
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full
                                      transition-colors shrink-0 ${
                                        proveedor.activo
                                          ? "bg-success"
                                          : "bg-danger"
                                      }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center h-4.5 w-4.5
                                        transform rounded-full bg-white shadow-sm
                                        transition-transform ${
                                          proveedor.activo
                                            ? "translate-x-5.5"
                                            : "translate-x-0.75"
                                        }`}
                          >
                            {proveedor.activo ? (
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
                        <button
                          onClick={() => setProveedorEditar(proveedor)}
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
                Mostrando {paginaActual * POR_PAGINA + 1}–
                {Math.min((paginaActual + 1) * POR_PAGINA, filtrados.length)} de{" "}
                {filtrados.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={paginaActual === 0}
                  className="w-7 h-7 rounded-lg border border-border text-text-secondary
                             hover:bg-hover transition-colors disabled:opacity-40
                             disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-text-secondary px-2 font-mono">
                  {paginaActual + 1} / {totalPaginas}
                </span>
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(totalPaginas - 1, p + 1))
                  }
                  disabled={paginaActual >= totalPaginas - 1}
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
      {(modalNuevo || proveedorEditar) && (
        <ProveedorModal
          proveedor={proveedorEditar}
          onClose={() => {
            setModalNuevo(false);
            setProveedorEditar(null);
          }}
          onGuardado={(proveedor) => {
            if (proveedorEditar) {
              actualizarLocal(proveedor);
            } else {
              agregarLocal(proveedor);
            }
            setModalNuevo(false);
            setProveedorEditar(null);
          }}
        />
      )}
    </div>
  );
}
