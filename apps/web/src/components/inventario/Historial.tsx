"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Movimiento = {
  id: string;
  tipo: string;
  cantidad: number;
  notas: string | null;
  created_at: string;
  producto: string;
  usuario: string | null;
};

type MovimientoRow = {
  id: string;
  tipo: string;
  cantidad: number;
  notas: string | null;
  created_at: string;
  productos: { nombre: string } | { nombre: string }[];
  perfiles: { nombre: string } | { nombre: string }[] | null;
};

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  entrada:           { label: "Entrada",          color: "bg-success-soft text-success" },
  venta:             { label: "Venta",            color: "bg-info-soft text-info" },
  devolucion:        { label: "Devolución",       color: "bg-accent-soft text-accent-soft-text" },
  traspaso_entrada:  { label: "Traspaso entrada",  color: "bg-success-soft text-success" },
  traspaso_salida:   { label: "Traspaso salida",   color: "bg-warning-soft text-warning" },
  ajuste:            { label: "Ajuste",            color: "bg-surface-2 text-text-secondary" },
  salida:            { label: "Salida",            color: "bg-danger-soft text-danger" },
};

const POR_PAGINA = 10;

export function Historial() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const supabaseRef = useRef(createClient());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / POR_PAGINA));

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setLoading(true);
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

      if (!perfil?.sucursal_id) return;

      const desde = pagina * POR_PAGINA;
      const hasta = desde + POR_PAGINA - 1;

      let query = supabase
        .from("movimientos_inventario")
        .select(
          `
          id, tipo, cantidad, notas, created_at,
          productos(nombre),
          perfiles(nombre)
        `,
          { count: "exact" },
        )
        .eq("sucursal_id", perfil.sucursal_id)
        .order("created_at", { ascending: false })
        .range(desde, hasta);

      if (filtroTipo) query = query.eq("tipo", filtroTipo);

      const { data, count } = await query;

      if (activo) {
        if (data) {
          setMovimientos(
            (data as unknown as MovimientoRow[]).map((m) => {
              const prod = Array.isArray(m.productos)
                ? m.productos[0]
                : m.productos;
              const perf = Array.isArray(m.perfiles) ? m.perfiles[0] : m.perfiles;
              return {
                id: m.id,
                tipo: m.tipo,
                cantidad: m.cantidad,
                notas: m.notas,
                created_at: m.created_at,
                producto: prod.nombre,
                usuario: perf?.nombre ?? null,
              };
            }),
          );
        }
        setTotalRegistros(count ?? 0);
        setLoading(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [filtroTipo, pagina]);

  function handleFiltroChange(valor: string) {
    setFiltroTipo(valor);
    setPagina(0);
    setDropdownAbierto(false);
  }

  const opciones = [
    { value: "", label: "Todos los movimientos" },
    ...Object.entries(TIPO_LABELS).map(([key, val]) => ({ value: key, label: val.label })),
  ];

  const opcionActual = opciones.find((o) => o.value === filtroTipo) ?? opciones[0];

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            onClick={() => setDropdownAbierto((v) => !v)}
            className="flex items-center justify-between gap-3 px-3.5 py-2 border
                       border-border rounded-lg text-sm bg-surface text-text-primary
                       hover:bg-hover transition-colors min-w-56"
          >
            {opcionActual.label}
            <ChevronDown
              size={15}
              className={`text-text-tertiary transition-transform duration-200 ${
                dropdownAbierto ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`absolute top-full left-0 mt-1.5 w-full bg-surface border
                        border-border rounded-xl shadow-lg z-20 overflow-hidden
                        origin-top transition-all duration-150 ${
              dropdownAbierto
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <div className="py-1 max-h-72 overflow-y-auto">
              {opciones.map((o) => (
                <button
                  key={o.value}
                  onClick={() => handleFiltroChange(o.value)}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                             text-sm text-text-primary hover:bg-hover transition-colors text-left"
                >
                  {o.label}
                  {filtroTipo === o.value && (
                    <Check size={14} className="text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
            Cargando historial...
          </div>
        ) : movimientos.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
            Sin movimientos registrados
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Fecha
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Producto
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Tipo
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  Cantidad
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Usuario
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movimientos.map((m) => {
                const tipo = TIPO_LABELS[m.tipo] ?? {
                  label: m.tipo,
                  color: "bg-surface-2 text-text-secondary",
                };
                return (
                  <tr key={m.id} className="hover:bg-hover transition-colors">
                    <td className="px-4 py-3 text-xs text-text-tertiary whitespace-nowrap">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">
                      {m.producto}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${tipo.color}`}
                      >
                        {tipo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium font-mono ${
                          m.cantidad > 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {m.cantidad > 0 ? "+" : ""}
                        {m.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {m.usuario ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary max-w-48 truncate">
                      {m.notas ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && movimientos.length > 0 && (
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
        )}
      </div>
    </div>
  );
}