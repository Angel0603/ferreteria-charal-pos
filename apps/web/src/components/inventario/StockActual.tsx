"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  AlertTriangle,
  Package,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { InventarioSkeleton } from "../ui/skeletons/InventarioSkeleton";

type StockItem = {
  producto_id: string;
  nombre: string;
  sku: string | null;
  codigo_barras: string | null;
  imagen_url: string | null;
  precio_base: number;
  stock_minimo: number;
  cantidad: number;
  categoria: string | null;
};

const POR_PAGINA = 10;

export function StockActual() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargaInicial, setCargaInicial] = useState(true);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState("");
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [sucursalId, setSucursalId] = useState("");
  const supabaseRef = useRef(createClient());

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaActiva(busquedaInput);
      setPagina(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  // Obtener sucursal del usuario
  useEffect(() => {
    let activo = true;
    async function cargarSucursal() {
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
    cargarSucursal();
    return () => {
      activo = false;
    };
  }, []);

  // Cargar total de alertas (independiente de la búsqueda/paginación)
  useEffect(() => {
    if (!sucursalId) return;
    let activo = true;
    async function cargarAlertas() {
      const { data } = await supabaseRef.current.rpc("contar_alertas_stock", {
        p_sucursal_id: sucursalId,
      });
      if (activo && typeof data === "number") setTotalAlertas(data);
    }
    cargarAlertas();
    return () => {
      activo = false;
    };
  }, [sucursalId]);

  // Cargar productos paginados
  useEffect(() => {
    if (!sucursalId) return;
    let activo = true;

    async function cargar() {
      setLoading(true);
      const supabase = supabaseRef.current;
      const desde = pagina * POR_PAGINA;
      const hasta = desde + POR_PAGINA - 1;

      const { data, count } = await supabase
        .rpc(
          "buscar_stock_actual",
          {
            p_sucursal_id: sucursalId,
            p_query: busquedaActiva.trim(),
            p_solo_alertas: soloAlertas,
          },
          { count: "exact" },
        )
        .range(desde, hasta);

      if (activo) {
        if (data) setItems(data as StockItem[]);
        setTotalRegistros(count ?? 0);
        setLoading(false);
        setCargaInicial(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [sucursalId, busquedaActiva, soloAlertas, pagina]);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / POR_PAGINA));

  const handleBusquedaChange = useCallback((valor: string) => {
    setBusquedaInput(valor);
  }, []);

  function handleToggleAlertas() {
    setSoloAlertas((v) => !v);
    setPagina(0);
  }

  if (cargaInicial) return <InventarioSkeleton />;

  return (
    <div className="space-y-4">
      {totalAlertas > 0 && (
        <div
          className="flex items-center gap-3 bg-surface border border-border
                        border-l-[3px] border-l-warning rounded-xl px-4 py-3"
        >
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <p className="text-sm text-text-primary">
            <span className="font-medium">
              {totalAlertas} producto{totalAlertas !== 1 ? "s" : ""}
            </span>{" "}
            con stock por debajo del mínimo
          </p>
          <button
            onClick={handleToggleAlertas}
            className="ml-auto w-7 h-7 rounded-lg border border-border text-text-secondary
                       hover:bg-hover hover:text-warning transition-colors
                       flex items-center justify-center shrink-0"
            title={soloAlertas ? "Ver todos" : "Ver solo alertas"}
          >
            <ArrowRight size={14} className={soloAlertas ? "rotate-180" : ""} />
          </button>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={busquedaInput}
            onChange={(e) => handleBusquedaChange(e.target.value)}
            placeholder="Buscar producto por nombre, SKU o código de barras..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {items.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <Package size={28} className="mb-2 opacity-40" />
            <p className="text-sm">Sin resultados</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {[
                    "Producto",
                    "Categoría",
                    "SKU",
                    "Precio",
                    "Mínimo",
                    "Stock",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`text-xs font-medium text-text-secondary px-4 py-3 ${
                        i >= 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-border transition-opacity duration-150 ${
                  loading ? "opacity-40 pointer-events-none" : "opacity-100"
                }`}
              >
                {items.map((item) => {
                  const enAlerta =
                    item.cantidad < item.stock_minimo || item.cantidad === 0;
                  return (
                    <tr
                      key={item.producto_id}
                      className="hover:bg-hover transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                            {item.imagen_url ? (
                              <Image
                                src={item.imagen_url}
                                alt={item.nombre}
                                fill
                                sizes="32px"
                                className="object-contain p-0.5"
                              />
                            ) : (
                              <Package
                                size={12}
                                className="text-text-tertiary m-auto mt-2"
                              />
                            )}
                          </div>
                          <p className="text-sm font-medium text-text-primary">
                            {item.nombre}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {item.categoria ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-tertiary font-mono">
                        {item.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-text-primary font-mono">
                        {formatCurrency(item.precio_base)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-text-secondary">
                        {item.stock_minimo}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center justify-center min-w-10
                                          text-sm font-semibold px-2.5 py-1 rounded-lg font-mono ${
                                            enAlerta
                                              ? "bg-danger-soft text-danger"
                                              : "bg-success-soft text-success"
                                          }`}
                        >
                          {item.cantidad}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-2">
              <p className="text-xs text-text-tertiary">
                Mostrando {pagina * POR_PAGINA + 1}–
                {Math.min((pagina + 1) * POR_PAGINA, totalRegistros)} de{" "}
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
    </div>
  );
}
