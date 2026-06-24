"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@repo/types";
import { ModalSucursal } from "./ModalSucursal";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

type ProductoStock = {
  cantidad: number;
  producto_id: string;
  productos:
    | {
        nombre: string;
        sku: string | null;
      }
    | {
        nombre: string;
        sku: string | null;
      }[];
};

type LineaTraspaso = {
  producto_id: string;
  nombre: string;
  disponible: number;
  cantidad: number;
};

export function TraspasoSucursal({ onExito }: { onExito: () => void }) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalOrigen, setSucursalOrigen] = useState("");
  const [sucursalDestino, setSucursalDestino] = useState("");
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [lineas, setLineas] = useState<LineaTraspaso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [cajeroId, setCajeroId] = useState("");
  const [modalSucursal, setModalSucursal] = useState(false);
  const supabaseRef = useRef(createClient());
  const [dropdownOrigenAbierto, setDropdownOrigenAbierto] = useState(false);
  const [dropdownDestinoAbierto, setDropdownDestinoAbierto] = useState(false);
  const dropdownOrigenRef = useRef<HTMLDivElement>(null);
  const dropdownDestinoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (
        dropdownOrigenRef.current &&
        !dropdownOrigenRef.current.contains(e.target as Node)
      ) {
        setDropdownOrigenAbierto(false);
      }
      if (
        dropdownDestinoRef.current &&
        !dropdownDestinoRef.current.contains(e.target as Node)
      ) {
        setDropdownDestinoAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCajeroId(user.id);

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("sucursal_id, rol")
        .eq("id", user.id)
        .single();

      if (!perfil?.sucursal_id) return;
      setSucursalOrigen(perfil.sucursal_id);

      const { data: sucs } = await supabase
        .from("sucursales")
        .select("*")
        .eq("activa", true);
      if (activo && sucs) setSucursales(sucs);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!sucursalOrigen) return;
    let activo = true;
    async function cargarStock() {
      const { data } = await supabaseRef.current
        .from("inventario")
        .select("cantidad, producto_id, productos(nombre, sku)")
        .eq("sucursal_id", sucursalOrigen)
        .gt("cantidad", 0);
      if (activo && data) setProductos(data as unknown as ProductoStock[]);
    }
    cargarStock();
    return () => {
      activo = false;
    };
  }, [sucursalOrigen]);

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return productos
      .filter((p) => {
        const prod = Array.isArray(p.productos) ? p.productos[0] : p.productos;
        return (
          prod.nombre.toLowerCase().includes(q) ||
          prod.sku?.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [busqueda, productos]);

  function agregarLinea(item: ProductoStock) {
    if (lineas.find((l) => l.producto_id === item.producto_id)) {
      toast.warning("Este producto ya está en la lista");
      return;
    }
    const prod = Array.isArray(item.productos)
      ? item.productos[0]
      : item.productos;
    setLineas((prev) => [
      ...prev,
      {
        producto_id: item.producto_id,
        nombre: prod.nombre,
        disponible: item.cantidad,
        cantidad: 1,
      },
    ]);
    setBusqueda("");
  }

  function handleSucursalCreada(sucursal: Sucursal) {
    setSucursales((prev) =>
      [...prev, sucursal].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    setSucursalDestino(sucursal.id);
  }

  function actualizarCantidad(id: string, valor: number) {
    setLineas((prev) =>
      prev.map((l) => (l.producto_id === id ? { ...l, cantidad: valor } : l)),
    );
  }

  async function handleTraspaso() {
    if (!sucursalDestino) {
      toast.warning("Selecciona la sucursal destino");
      return;
    }
    if (sucursalOrigen === sucursalDestino) {
      toast.warning("El origen y destino no pueden ser la misma sucursal");
      return;
    }
    if (lineas.length === 0) {
      toast.warning("Agrega al menos un producto");
      return;
    }
    if (lineas.some((l) => l.cantidad <= 0)) {
      toast.warning("Todas las cantidades deben ser mayores a 0");
      return;
    }
    if (lineas.some((l) => l.cantidad > l.disponible)) {
      toast.warning("Hay productos con cantidad mayor al stock disponible");
      return;
    }

    setLoading(true);
    const supabase = supabaseRef.current;

    try {
      for (const linea of lineas) {
        await supabase.rpc("descontar_inventario", {
          p_producto_id: linea.producto_id,
          p_sucursal_id: sucursalOrigen,
          p_cantidad: linea.cantidad,
        });

        await supabase.rpc("descontar_inventario", {
          p_producto_id: linea.producto_id,
          p_sucursal_id: sucursalDestino,
          p_cantidad: -linea.cantidad,
        });

        await supabase.from("movimientos_inventario").insert([
          {
            producto_id: linea.producto_id,
            sucursal_id: sucursalOrigen,
            usuario_id: cajeroId,
            tipo: "traspaso_salida",
            cantidad: -linea.cantidad,
            notas: notas || null,
          },
          {
            producto_id: linea.producto_id,
            sucursal_id: sucursalDestino,
            usuario_id: cajeroId,
            tipo: "traspaso_entrada",
            cantidad: linea.cantidad,
            notas: notas || null,
          },
        ]);
      }

      toast.success("Traspaso registrado correctamente", {
        description: `${lineas.length} producto${lineas.length !== 1 ? "s" : ""} transferidos`,
      });
      setLineas([]);
      setNotas("");
      onExito();
    } catch (err) {
      toast.error("Error al registrar el traspaso", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Sucursales */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-primary">
            Mover inventario entre sucursales
          </h2>
          <button
            type="button"
            onClick={() => setModalSucursal(true)}
            className="flex items-center gap-2 bg-accent text-white text-sm
                 font-medium px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors"
          >
            <Plus size={15} />
            Nueva sucursal
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
                Sucursal origen
              </label>

              <div className="relative" ref={dropdownOrigenRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOrigenAbierto((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border
                 border-border rounded-lg text-sm bg-surface text-text-primary
                 hover:bg-hover transition-colors"
                >
                  {sucursales.find((s) => s.id === sucursalOrigen)?.nombre ??
                    "Seleccionar..."}
                  <ChevronDown
                    size={15}
                    className={`text-text-tertiary transition-transform duration-200 shrink-0 ${
                      dropdownOrigenAbierto ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute top-full left-0 right-0 mt-1.5 bg-surface border
                  border-border rounded-xl shadow-lg z-20 overflow-hidden
                  origin-top transition-all duration-150 ${
                    dropdownOrigenAbierto
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {sucursales.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSucursalOrigen(s.id);
                          setLineas([]);
                          setDropdownOrigenAbierto(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                       text-sm text-text-primary hover:bg-hover transition-colors text-left"
                      >
                        {s.nombre}
                        {sucursalOrigen === s.id && (
                          <Check size={14} className="text-accent shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <ArrowRight
              size={20}
              className="text-text-tertiary shrink-0 mt-5"
            />

            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
                Sucursal destino
              </label>

              <div className="relative" ref={dropdownDestinoRef}>
                <button
                  type="button"
                  onClick={() => setDropdownDestinoAbierto((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border
                 border-border rounded-lg text-sm bg-surface text-text-primary
                 hover:bg-hover transition-colors"
                >
                  <span
                    className={sucursalDestino ? "" : "text-text-secondary"}
                  >
                    {sucursales.find((s) => s.id === sucursalDestino)?.nombre ??
                      "Seleccionar..."}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-text-tertiary transition-transform duration-200 shrink-0 ${
                      dropdownDestinoAbierto ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute top-full left-0 right-0 mt-1.5 bg-surface border
                  border-border rounded-xl shadow-lg z-20 overflow-hidden
                  origin-top transition-all duration-150 ${
                    dropdownDestinoAbierto
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {sucursales
                      .filter((s) => s.id !== sucursalOrigen)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSucursalDestino(s.id);
                            setDropdownDestinoAbierto(false);
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                         text-sm text-text-primary hover:bg-hover transition-colors text-left"
                        >
                          {s.nombre}
                          {sucursalDestino === s.id && (
                            <Check size={14} className="text-accent shrink-0" />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Buscador */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-primary mb-3">
          Productos a traspasar
        </h2>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto con stock disponible..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
          {resultados.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-surface border
                            border-border rounded-xl shadow-lg z-10 overflow-hidden"
            >
              {resultados.map((p) => {
                const prod = Array.isArray(p.productos)
                  ? p.productos[0]
                  : p.productos;
                return (
                  <button
                    key={p.producto_id}
                    onClick={() => agregarLinea(p)}
                    className="w-full flex items-center justify-between px-4 py-2.5
                               hover:bg-hover transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {prod.nombre}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Disponible: {p.cantidad}
                      </p>
                    </div>
                    <Plus size={15} className="text-text-tertiary shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Líneas */}
      {lineas.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Producto
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  Disponible
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  Cantidad
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineas.map((linea) => (
                <tr key={linea.producto_id}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {linea.nombre}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary font-mono">
                    {linea.disponible}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={linea.cantidad || ""}
                      onChange={(e) =>
                        actualizarCantidad(
                          linea.producto_id,
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className={`w-full text-right px-3 py-1.5 border rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-accent max-w-24 ml-auto block
                                 bg-surface text-text-primary
                                 ${
                                   linea.cantidad > linea.disponible
                                     ? "border-danger bg-danger-soft"
                                     : "border-border"
                                 }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setLineas((prev) =>
                          prev.filter(
                            (l) => l.producto_id !== linea.producto_id,
                          ),
                        )
                      }
                      className="text-text-tertiary hover:text-danger transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lineas.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Motivo del traspaso..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleTraspaso}
              disabled={loading}
              className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Confirmar traspaso"}
            </button>
          </div>
        </div>
      )}
      {modalSucursal && (
        <ModalSucursal
          onClose={() => setModalSucursal(false)}
          onCreada={handleSucursalCreada}
        />
      )}
    </div>
  );
}
