"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Save, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type ItemStock = {
  producto_id:   string;
  nombre:        string;
  sku:           string | null;
  codigo_barras: string | null;
  cantidad:      number;
  stock_minimo:  number;
};

const POR_PAGINA = 10;

export function AjusteInventario({ onExito }: { onExito: () => void }) {
  const [items, setItems] = useState<ItemStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargaInicial, setCargaInicial] = useState(true);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [sucursalId, setSucursalId] = useState("");
  const [cajeroId, setCajeroId] = useState("");
  const [notas, setNotas] = useState("");
  // Cambios persisten entre páginas, keyed por producto_id
  const [cambios, setCambios] = useState<Record<string, number>>({});
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaActiva(busquedaInput);
      setPagina(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  useEffect(() => {
    let activo = true;
    async function cargarUsuario() {
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCajeroId(user.id);

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("sucursal_id")
        .eq("id", user.id)
        .single();

      if (activo && perfil?.sucursal_id) setSucursalId(perfil.sucursal_id);
    }
    cargarUsuario();
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!sucursalId) return;
    let activo = true;

    async function cargar() {
      setLoading(true);
      const supabase = supabaseRef.current;
      const desde = pagina * POR_PAGINA;
      const hasta = desde + POR_PAGINA - 1;

      const { data, count } = await supabase
        .rpc("buscar_stock_actual", {
          p_sucursal_id: sucursalId,
          p_query: busquedaActiva.trim(),
          p_solo_alertas: false,
        }, { count: "exact" })
        .range(desde, hasta);

      if (activo) {
        if (data) setItems(data as unknown as ItemStock[]);
        setTotalRegistros(count ?? 0);
        setLoading(false);
        setCargaInicial(false);
      }
    }

    cargar();
    return () => { activo = false; };
  }, [sucursalId, busquedaActiva, pagina]);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / POR_PAGINA));

  const cambiosArray = Object.entries(cambios).filter(([, v]) => v !== undefined);

  function actualizarCantidad(id: string, actual: number, valor: string) {
    if (valor === "") {
      setCambios((prev) => {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      });
      return;
    }
    const nueva = parseInt(valor) || 0;
    setCambios((prev) => {
      if (nueva === actual) {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      }
      return { ...prev, [id]: nueva };
    });
  }

  async function handleGuardar() {
    if (cambiosArray.length === 0) {
      toast.warning("No hay cambios que guardar");
      return;
    }

    setGuardando(true);
    const supabase = supabaseRef.current;

    try {
      for (const [productoId, nueva] of cambiosArray) {
        const itemActual = items.find((i) => i.producto_id === productoId);
        const actual = itemActual?.cantidad ?? 0;
        const diferencia = nueva - actual;

        await supabase
          .from("inventario")
          .update({ cantidad: nueva })
          .eq("producto_id", productoId)
          .eq("sucursal_id", sucursalId);

        await supabase.from("movimientos_inventario").insert({
          producto_id: productoId,
          sucursal_id: sucursalId,
          usuario_id: cajeroId,
          tipo: "ajuste",
          cantidad: diferencia,
          notas: notas || `Ajuste manual: ${actual} → ${nueva}`,
        });
      }

      toast.success("Ajuste guardado correctamente", {
        description: `${cambiosArray.length} producto${cambiosArray.length !== 1 ? "s" : ""} ajustados`,
      });
      setCambios({});
      setNotas("");
      onExito();
    } catch (err) {
      toast.error("Error al guardar el ajuste", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setGuardando(false);
    }
  }

  if (cargaInicial) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
        Cargando inventario...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-surface border border-border
                      border-l-[3px] border-l-warning rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="text-warning shrink-0" />
        <p className="text-sm text-text-primary">
          <span className="font-medium">Ajuste manual:</span> modifica la cantidad real
          contada en físico. Se registrará la diferencia como movimiento.
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar producto por nombre, SKU o código de barras..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        {cambiosArray.length > 0 && (
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white
                       rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors
                       disabled:opacity-50 shrink-0"
          >
            <Save size={14} />
            {guardando ? "Guardando..." : `Guardar ${cambiosArray.length} cambio${cambiosArray.length !== 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {items.length === 0 && !loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
            Sin resultados
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">Producto</th>
                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">Stock actual</th>
                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">Cantidad real</th>
                  <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">Diferencia</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-border transition-opacity duration-150 ${
                loading ? "opacity-40" : "opacity-100"
              }`}>
                {items.map((item) => {
                  const nueva = cambios[item.producto_id];
                  const diferencia = nueva !== undefined ? nueva - item.cantidad : null;
                  return (
                    <tr
                      key={item.producto_id}
                      className={`hover:bg-hover transition-colors ${
                        diferencia !== null && diferencia !== 0 ? "bg-info-soft/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-text-primary">{item.nombre}</p>
                        {item.sku && <p className="text-xs text-text-tertiary font-mono">{item.sku}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-text-secondary font-mono">{item.cantidad}</span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={nueva ?? ""}
                          onChange={(e) => actualizarCantidad(item.producto_id, item.cantidad, e.target.value)}
                          placeholder={String(item.cantidad)}
                          className="w-full text-right px-3 py-1.5 border border-border
                                     rounded-lg text-sm focus:outline-none focus:ring-2
                                     focus:ring-accent max-w-24 ml-auto block
                                     bg-surface text-text-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {diferencia !== null && diferencia !== 0 && (
                          <span className={`text-sm font-medium font-mono ${
                            diferencia > 0 ? "text-success" : "text-danger"
                          }`}>
                            {diferencia > 0 ? "+" : ""}{diferencia}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-2">
              <p className="text-xs text-text-tertiary">
                Mostrando {pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, totalRegistros)} de {totalRegistros}
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
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
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

      {cambiosArray.length > 0 && (
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