"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Save, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type ItemAjuste = {
  producto_id: string;
  nombre: string;
  sku: string | null;
  cantidad_actual: number;
  cantidad_nueva: number | "";
  editando: boolean;
};
type InventarioRow = {
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

export function AjusteInventario({ onExito }: { onExito: () => void }) {
  const [items, setItems] = useState<ItemAjuste[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [sucursalId, setSucursalId] = useState("");
  const [cajeroId, setCajeroId] = useState("");
  const [notas, setNotas] = useState("");
  const supabaseRef = useRef(createClient());

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
      setSucursalId(perfil.sucursal_id);

      const { data } = await supabase
        .from("inventario")
        .select("cantidad, producto_id, productos(nombre, sku)")
        .eq("sucursal_id", perfil.sucursal_id)
        .order("productos(nombre)");

      if (activo && data) {
        setItems(
          (data as unknown as InventarioRow[]).map((i) => {
            const prod = Array.isArray(i.productos)
              ? i.productos[0]
              : i.productos;
            return {
              producto_id: i.producto_id,
              nombre: prod.nombre,
              sku: prod.sku,
              cantidad_actual: i.cantidad,
              cantidad_nueva: "",
              editando: false,
            };
          }),
        );
      }
      if (activo) setLoading(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const filtrados = items.filter(
    (i) =>
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.sku?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const conCambios = items.filter(
    (i) => i.cantidad_nueva !== "" && i.cantidad_nueva !== i.cantidad_actual,
  );

  function actualizarCantidad(id: string, valor: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.producto_id === id
          ? { ...i, cantidad_nueva: valor === "" ? "" : parseInt(valor) || 0 }
          : i,
      ),
    );
  }

  async function handleGuardar() {
    if (conCambios.length === 0) {
      toast.warning("No hay cambios que guardar");
      return;
    }

    setGuardando(true);
    const supabase = supabaseRef.current;

    try {
      for (const item of conCambios) {
        const nueva = item.cantidad_nueva as number;
        const diferencia = nueva - item.cantidad_actual;

        await supabase
          .from("inventario")
          .update({ cantidad: nueva })
          .eq("producto_id", item.producto_id)
          .eq("sucursal_id", sucursalId);

        await supabase.from("movimientos_inventario").insert({
          producto_id: item.producto_id,
          sucursal_id: sucursalId,
          usuario_id: cajeroId,
          tipo: "ajuste",
          cantidad: diferencia,
          notas: notas || `Ajuste manual: ${item.cantidad_actual} → ${nueva}`,
        });
      }

      toast.success("Ajuste guardado correctamente", {
        description: `${conCambios.length} producto${conCambios.length !== 1 ? "s" : ""} ajustados`,
      });
      onExito();
    } catch (err) {
      toast.error("Error al guardar el ajuste", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-surface border border-border
                      border-l-[3px] border-l-warning rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="text-warning shrink-0" />
        <p className="text-sm text-text-primary">
          <span className="font-medium">Ajuste manual:</span> modifica la
          cantidad real contada en físico. Se registrará la diferencia como
          movimiento.
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 flex gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        {conCambios.length > 0 && (
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white
                       rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors
                       disabled:opacity-50"
          >
            <Save size={14} />
            {guardando
              ? "Guardando..."
              : `Guardar ${conCambios.length} cambio${conCambios.length !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
            Cargando inventario...
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Producto
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  Stock actual
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  Cantidad real
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  Diferencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((item) => {
                const nueva =
                  item.cantidad_nueva === ""
                    ? null
                    : (item.cantidad_nueva as number);
                const diferencia =
                  nueva !== null ? nueva - item.cantidad_actual : null;
                return (
                  <tr
                    key={item.producto_id}
                    className={`hover:bg-hover transition-colors ${
                      nueva !== null && nueva !== item.cantidad_actual
                        ? "bg-info-soft/50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">
                        {item.nombre}
                      </p>
                      {item.sku && (
                        <p className="text-xs text-text-tertiary font-mono">{item.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-text-secondary font-mono">
                        {item.cantidad_actual}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.cantidad_nueva}
                        onChange={(e) =>
                          actualizarCantidad(item.producto_id, e.target.value)
                        }
                        placeholder={String(item.cantidad_actual)}
                        className="w-full text-right px-3 py-1.5 border border-border
                                   rounded-lg text-sm focus:outline-none focus:ring-2
                                   focus:ring-accent max-w-24 ml-auto block
                                   bg-surface text-text-primary"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {diferencia !== null && diferencia !== 0 && (
                        <span
                          className={`text-sm font-medium font-mono ${
                            diferencia > 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          {diferencia > 0 ? "+" : ""}
                          {diferencia}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {conCambios.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Motivo del ajuste (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Ej. Conteo físico mensual, merma, rotura..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary resize-none"
          />
        </div>
      )}
    </div>
  );
}