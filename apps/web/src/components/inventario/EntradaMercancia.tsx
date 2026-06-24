"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Plus, Trash2, Search, AlertTriangle } from "lucide-react";
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
  faltante: number;
};
export function EntradaMercancia({ onExito }: { onExito: () => void }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lineas, setLineas] = useState<LineaEntrada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucursalId, setSucursalId] = useState("");
  const [cajeroId, setCajeroId] = useState("");
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
  const supabaseRef = useRef(createClient());

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return productos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo_barras?.includes(q) ||
          p.sku?.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [busqueda, productos]);

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

      const { data } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      if (activo && data) setProductos(data);

      const { data: invData } = await supabase
        .from("inventario")
        .select(
          `
        cantidad,
        producto_id,
        productos(nombre, stock_minimo)
      `,
        )
        .eq("sucursal_id", perfil.sucursal_id);

      if (activo && invData) {
        const bajos = (
          invData as unknown as {
            cantidad: number;
            producto_id: string;
            productos:
              | { nombre: string; stock_minimo: number }
              | { nombre: string; stock_minimo: number }[];
          }[]
        )
          .filter((i) => {
            const prod = Array.isArray(i.productos)
              ? i.productos[0]
              : i.productos;
            return i.cantidad <= prod.stock_minimo;
          })
          .map((i) => {
            const prod = Array.isArray(i.productos)
              ? i.productos[0]
              : i.productos;
            return {
              producto_id: i.producto_id,
              nombre: prod.nombre,
              cantidad: i.cantidad,
              stock_minimo: prod.stock_minimo,
              faltante: prod.stock_minimo - i.cantidad,
            };
          })
          .sort((a, b) => a.cantidad - b.cantidad);
        setStockBajo(bajos);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  function agregarLinea(producto: Producto) {
    if (lineas.find((l) => l.producto.id === producto.id)) {
      toast.warning("Este producto ya está en la lista");
      return;
    }
    setLineas((prev) => [...prev, { producto, cantidad: 1, costo: 0 }]);
    setBusqueda("");
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
      {/* Productos con stock bajo */}
      {stockBajo.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div
            className="flex items-center gap-3 px-4 py-3 my-2 border-b border-border
                    border-l-[3px] border-l-warning"
          >
            <AlertTriangle size={16} className="text-warning shrink-0" />
            <p className="text-sm text-text-primary">
              <span className="font-medium">
                {stockBajo.length} producto{stockBajo.length !== 1 ? "s" : ""}
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
            <tbody className="divide-y divide-border">
              {stockBajo.map((item) => {
                const yaAgregado = lineas.some(
                  (l) => l.producto.id === item.producto_id,
                );
                return (
                  <tr
                    key={item.producto_id}
                    className={`transition-colors ${
                      yaAgregado ? "bg-success-soft/50" : "hover:bg-hover"
                    }`}
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
                        +{item.faltante}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {yaAgregado ? (
                        <span className="text-xs text-success font-medium">
                          ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const prod = productos.find(
                              (p) => p.id === item.producto_id,
                            );
                            if (prod) agregarLinea(prod);
                          }}
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
        </div>
      )}
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
          {resultados.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-surface border
                            border-border rounded-xl shadow-lg z-10 overflow-hidden"
            >
              {resultados.map((p) => (
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
              ))}
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
    </div>
  );
}
