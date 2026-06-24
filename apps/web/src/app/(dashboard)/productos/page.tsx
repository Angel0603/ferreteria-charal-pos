"use client";

import { useRef, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Pencil,
  Package,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useProductos,
  type Producto,
} from "@/components/productos/useProductos";
import { ProductoModal } from "@/components/productos/ProductoModal";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@repo/types";
import Image from "next/image";
import { ProductosSkeleton } from "@/components/ui/skeletons/ProductosSkeleton";
import { toast } from "sonner";

type ProductoPage = Database["public"]["Tables"]["productos"]["Row"] & {
  categorias: { nombre: string } | null;
};

export default function ProductosPage() {
  const {
    productos,
    categorias,
    loading,
    cargaInicial,
    filtros,
    setFiltros,
    pagina,
    setPagina,
    totalRegistros,
    porPagina,
    agregarLocal,
    actualizarLocal,
    agregarCategoriaLocal,
    toggleActivo,
  } = useProductos();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<ProductoPage | null>(
    null,
  );
  const [dropdownFiltroAbierto, setDropdownFiltroAbierto] = useState(false);
  const dropdownFiltroRef = useRef<HTMLDivElement>(null);
  function abrirNuevo() {
    setProductoEditar(null);
    setModalAbierto(true);
  }

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (
        dropdownFiltroRef.current &&
        !dropdownFiltroRef.current.contains(e.target as Node)
      ) {
        setDropdownFiltroAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function abrirEditar(producto: Producto) {
    setProductoEditar(producto);
    setModalAbierto(true);
  }

  async function handleToggleActivo(producto: Producto) {
    try {
      await toggleActivo(producto.id, !producto.activo);
      toast.success(
        producto.activo
          ? "Producto desactivado, ya no aparecerá en el POS"
          : "Producto activado correctamente",
      );
    } catch {
      toast.error("Error al cambiar el estado del producto");
    }
  }

  if (cargaInicial) return <ProductosSkeleton />;

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / porPagina));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Productos
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalRegistros} producto{totalRegistros !== 1 ? "s" : ""}{" "}
            encontrado
            {totalRegistros !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-accent text-white text-sm
                     font-medium px-4 py-2.5 rounded-lg hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          Nuevo producto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-xl border border-border p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={filtros.busqueda}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, busqueda: e.target.value }))
            }
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary placeholder:text-text-tertiary"
          />
        </div>

        <div className="relative" ref={dropdownFiltroRef}>
          <button
            type="button"
            onClick={() => setDropdownFiltroAbierto((v) => !v)}
            className="flex items-center justify-between gap-2 px-3 py-2 border
               border-border rounded-lg text-sm bg-surface text-text-primary
               hover:bg-hover transition-colors min-w-48"
          >
            <span className={filtros.categoriaId ? "" : "text-text-secondary"}>
              {categorias.find((c) => c.id === filtros.categoriaId)?.nombre ??
                "Todas las categorías"}
            </span>
            <ChevronDown
              size={15}
              className={`text-text-tertiary transition-transform duration-200 shrink-0 ${
                dropdownFiltroAbierto ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`absolute top-full left-0 right-0 mt-1.5 bg-surface border
                border-border rounded-xl shadow-lg z-20 overflow-hidden
                origin-top transition-all duration-150 ${
                  dropdownFiltroAbierto
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
          >
            <div className="py-1 max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setFiltros((f) => ({ ...f, categoriaId: "" }));
                  setDropdownFiltroAbierto(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                   text-sm text-text-primary hover:bg-hover transition-colors text-left"
              >
                Todas las categorías
                {!filtros.categoriaId && (
                  <Check size={14} className="text-accent shrink-0" />
                )}
              </button>

              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setFiltros((f) => ({ ...f, categoriaId: c.id }));
                    setDropdownFiltroAbierto(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                     text-sm text-text-primary hover:bg-hover transition-colors text-left"
                >
                  {c.nombre}
                  {filtros.categoriaId === c.id && (
                    <Check size={14} className="text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.soloActivos}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, soloActivos: e.target.checked }))
            }
            className="rounded"
          />
          Solo activos
        </label>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-tertiary text-sm">
            Cargando productos...
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <Package size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No hay productos</p>
            <button
              onClick={abrirNuevo}
              className="mt-3 text-sm text-accent font-medium hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Producto
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Categoría
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Código
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  Precio base
                </th>
                <th className="text-right text-xs font-medium text-text-secondary px-4 py-3">
                  P. mayoreo
                </th>
                <th className="text-center text-xs font-medium text-text-secondary px-4 py-3">
                  Stock mín.
                </th>
                <th className="text-center text-xs font-medium text-text-secondary px-4 py-3">
                  Estado
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-border transition-opacity duration-150 ${
                loading ? "opacity-40 pointer-events-none" : "opacity-100"
              }`}
            >
              {productos.map((producto) => (
                <tr
                  key={producto.id}
                  className="hover:bg-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {producto.imagen_url ? (
                        <div
                          className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0
                  bg-surface-2 border border-border"
                        >
                          <Image
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            fill
                            sizes="72px"
                            className="object-contain p-0.5"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg bg-surface-2 flex items-center
                  justify-center shrink-0"
                        >
                          <Package size={14} className="text-text-tertiary" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {producto.nombre}
                        </p>
                        {producto.sku && (
                          <p className="text-xs text-text-tertiary font-mono">
                            {producto.sku}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary">
                      {producto.categorias?.nombre ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-tertiary font-mono">
                      {producto.codigo_barras ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-text-primary font-mono">
                      {formatCurrency(producto.precio_base)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-text-tertiary font-mono">
                      {producto.precio_mayoreo
                        ? formatCurrency(producto.precio_mayoreo)
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-text-secondary">
                      {producto.stock_minimo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="grid place-content-center">
                      <button
                        onClick={() => handleToggleActivo(producto)}
                        role="switch"
                        aria-checked={producto.activo}
                        title={
                          producto.activo
                            ? "Clic para desactivar"
                            : "Clic para activar"
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors shrink-0 ${
                    producto.activo ? "bg-success" : "bg-danger"
                  }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center h-4.5 w-4.5
                    transform rounded-full bg-white shadow-sm
                    transition-transform ${
                      producto.activo ? "translate-x-5.5" : "translate-x-0.75"
                    }`}
                        >
                          {producto.activo ? (
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
                    <button
                      onClick={() => abrirEditar(producto)}
                      className="text-text-tertiary hover:text-text-primary transition-colors p-1"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && productos.length > 0 && (
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
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <ProductoModal
          producto={productoEditar}
          categorias={categorias}
          onClose={() => setModalAbierto(false)}
          onGuardado={(producto) => {
            if (productoEditar) {
              actualizarLocal(producto as unknown as ProductoPage);
            } else {
              agregarLocal(producto as unknown as ProductoPage);
            }
            setModalAbierto(false);
          }}
          onCategoriaCreada={agregarCategoriaLocal}
        />
      )}
    </div>
  );
}
