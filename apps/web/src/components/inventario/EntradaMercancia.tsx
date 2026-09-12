"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@repo/types";

type Producto = Database["public"]["Tables"]["productos"]["Row"];
type LineaEntrada = { producto: Producto; cantidad: number; costo: number };
type StockBajo = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  stock_minimo: number;
};

const POR_PAGINA_STOCK = 10;

export function EntradaMercancia({ onExito }: { onExito: () => void }) {
  const [lineas, setLineas] = useState<LineaEntrada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucursalId, setSucursalId] = useState("");
  const [cajeroId, setCajeroId] = useState("");

  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [paginaStockBajo, setPaginaStockBajo] = useState(0);
  const [loadingStockBajo, setLoadingStockBajo] = useState(true);

  const supabaseRef = useRef(createClient());

  // Datos del usuario y sucursal
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
        .select("sucursal_id")
        .eq("id", user.id)
        .single();

      if (!perfil?.sucursal_id) return;
      if (activo) setSucursalId(perfil.sucursal_id);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  // Búsqueda de productos con debounce (servidor)
  useEffect(() => {
    if (!busqueda.trim()) {
      const timer = setTimeout(() => setResultados([]), 0);
      return () => clearTimeout(timer);
    }
    let activo = true;

    const timer = setTimeout(async () => {
      setBuscando(true);
      const { data } = await supabaseRef.current.rpc(
        "buscar_productos_nombre",
        {
          p_query: busqueda.trim(),
          p_categoria_id: null,
          p_solo_activos: true,
        },
      );
      if (activo) {
        setResultados(((data ?? []) as unknown as Producto[]).slice(0, 6));
        setBuscando(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      activo = false;
    };
  }, [busqueda]);

  // Stock bajo paginado (servidor)
  useEffect(() => {
    if (!sucursalId) return;
    let activo = true;

    async function cargarStockBajo() {
      setLoadingStockBajo(true);
      const supabase = supabaseRef.current;
      const desde = paginaStockBajo * POR_PAGINA_STOCK;
      const hasta = desde + POR_PAGINA_STOCK - 1;

      const { data } = await supabase
        .rpc("buscar_stock_actual", {
          p_sucursal_id: sucursalId,
          p_query: "",
          p_solo_alertas: true,
        })
        .range(desde, hasta);

      const { data: totalData } = await supabase.rpc("contar_alertas_stock", {
        p_sucursal_id: sucursalId,
      });

      if (activo) {
        setStockBajo(
          (data ?? []) as unknown as {
            producto_id: string;
            nombre: string;
            cantidad: number;
            stock_minimo: number;
          }[],
        );
        if (typeof totalData === "number") setTotalAlertas(totalData);
        setLoadingStockBajo(false);
      }
    }

    cargarStockBajo();
    return () => {
      activo = false;
    };
  }, [sucursalId, paginaStockBajo]);

  const totalPaginasStock = Math.max(
    1,
    Math.ceil(totalAlertas / POR_PAGINA_STOCK),
  );

  function agregarLinea(producto: Producto) {
    if (lineas.find((l) => l.producto.id === producto.id)) {
      toast.warning("Este producto ya está en la lista");
      return;
    }
    setLineas((prev) => [...prev, { producto, cantidad: 1, costo: 0 }]);
    setBusqueda("");
    setResultados([]);
  }

  function actualizarLinea(
    id: string,
    campo: "cantidad" | "costo",
    valor: number,
  ) {
    setLineas((prev) =>
      prev.map((l) => (l.producto.id === id ? { ...l, [campo]: valor } : l)),
    );
  }

  function eliminarLinea(id: string) {
    setLineas((prev) => prev.filter((l) => l.producto.id !== id));
  }

  async function agregarLineaPorId(productoId: string) {
    const { data } = await supabaseRef.current
      .from("productos")
      .select("*")
      .eq("id", productoId)
      .single();
    if (data) agregarLinea(data as Producto);
  }

  async function handleGuardar() {
    if (lineas.length === 0) {
      toast.warning("Agrega al menos un producto");
      return;
    }
    if (lineas.some((l) => l.cantidad <= 0)) {
      toast.warning("Todas las cantidades deben ser mayores a 0");
      return;
    }

    setLoading(true);
    const supabase = supabaseRef.current;

    try {
      for (const linea of lineas) {
        await supabase.rpc("descontar_inventario", {
          p_producto_id: linea.producto.id,
          p_sucursal_id: sucursalId,
          p_cantidad: -linea.cantidad,
        });

        await supabase.from("movimientos_inventario").insert({
          producto_id: linea.producto.id,
          sucursal_id: sucursalId,
          usuario_id: cajeroId,
          tipo: "entrada",
          cantidad: linea.cantidad,
          notas: notas || null,
        });
      }

      toast.success("Entrada registrada correctamente", {
        description: `${lineas.length} producto${lineas.length !== 1 ? "s" : ""} actualizados`,
      });
      setLineas([]);
      setNotas("");
      setPaginaStockBajo(0);
      onExito();
    } catch (err) {
      toast.error("Error al registrar la entrada", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-medium text-text-primary">
          Agregar productos
        </h2>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre, SKU o código..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
          {busqueda.trim() && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-surface border
                            border-border rounded-xl shadow-lg z-10 overflow-hidden"
            >
              {buscando ? (
                <div className="px-4 py-3 text-sm text-text-tertiary">
                  Buscando...
                </div>
              ) : resultados.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-tertiary">
                  Sin resultados
                </div>
              ) : (
                resultados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => agregarLinea(p)}
                    className="w-full flex items-center justify-between px-4 py-2.5
                               hover:bg-hover transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {p.nombre}
                      </p>
                      {p.sku && (
                        <p className="text-xs text-text-tertiary font-mono">
                          {p.sku}
                        </p>
                      )}
                    </div>
                    <Plus size={15} className="text-text-tertiary shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de líneas */}
      {lineas.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Producto
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3 w-32">
                  Cantidad
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineas.map((linea) => (
                <tr key={linea.producto.id}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {linea.producto.nombre}
                    </p>
                    {linea.producto.sku && (
                      <p className="text-xs text-text-tertiary font-mono">
                        {linea.producto.sku}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={linea.cantidad || ""}
                      onChange={(e) =>
                        actualizarLinea(
                          linea.producto.id,
                          "cantidad",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full text-right px-3 py-1.5 border border-border
                                 rounded-lg text-sm focus:outline-none focus:ring-2
                                 focus:ring-accent bg-surface text-text-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => eliminarLinea(linea.producto.id)}
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

      {/* Notas y guardar */}
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
              placeholder="Ej. Compra proveedor Truper, factura #1234"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGuardar}
              disabled={loading}
              className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registrando..." : "Registrar entrada"}
            </button>
          </div>
        </div>
      )}

      {/* Productos con stock bajo */}
      {totalAlertas > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border border-l-[3px] border-l-warning">
            <AlertTriangle size={16} className="text-warning shrink-0" />
            <p className="text-sm text-text-primary">
              <span className="font-medium">
                {totalAlertas} producto{totalAlertas !== 1 ? "s" : ""}
              </span>{" "}
              por surtir
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-2">
                  Producto
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-2">
                  Stock actual
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-2">
                  Mínimo
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-2">
                  Faltante
                </th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-border transition-opacity duration-150 ${
                loadingStockBajo ? "opacity-40" : "opacity-100"
              }`}
            >
              {stockBajo.map((item) => {
                const yaAgregado = lineas.some(
                  (l) => l.producto.id === item.producto_id,
                );
                const enAlerta =
                  item.cantidad < item.stock_minimo || item.cantidad === 0;
                const faltante = enAlerta
                  ? item.stock_minimo - item.cantidad
                  : 0;
                return (
                  <tr
                    key={item.producto_id}
                    className={
                      yaAgregado ? "bg-success-soft/50" : "hover:bg-hover"
                    }
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-text-primary">
                        {item.nombre}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`text-sm font-medium font-mono ${
                          item.cantidad === 0 ? "text-danger" : "text-warning"
                        }`}
                      >
                        {item.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-text-secondary font-mono">
                      {item.stock_minimo}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-sm font-semibold text-danger font-mono">
                        +{faltante}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {yaAgregado ? (
                        <span className="text-xs text-success font-medium">
                          ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => agregarLineaPorId(item.producto_id)}
                          className="text-xs text-text-secondary hover:text-text-primary
                                     border border-border rounded-lg px-2 py-1
                                     hover:bg-hover transition-colors whitespace-nowrap"
                        >
                          + Agregar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalAlertas > POR_PAGINA_STOCK && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-2">
              <p className="text-xs text-text-tertiary">
                Mostrando {paginaStockBajo * POR_PAGINA_STOCK + 1}–
                {Math.min(
                  (paginaStockBajo + 1) * POR_PAGINA_STOCK,
                  totalAlertas,
                )}{" "}
                de {totalAlertas}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPaginaStockBajo((p) => Math.max(0, p - 1))}
                  disabled={paginaStockBajo === 0}
                  className="w-7 h-7 rounded-lg border border-border text-text-secondary
                             hover:bg-hover transition-colors disabled:opacity-40
                             disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-text-secondary px-2 font-mono">
                  {paginaStockBajo + 1} / {totalPaginasStock}
                </span>
                <button
                  onClick={() =>
                    setPaginaStockBajo((p) =>
                      Math.min(totalPaginasStock - 1, p + 1),
                    )
                  }
                  disabled={paginaStockBajo >= totalPaginasStock - 1}
                  className="w-7 h-7 rounded-lg border border-border text-text-secondary
                             hover:bg-hover transition-colors disabled:opacity-40
                             disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
