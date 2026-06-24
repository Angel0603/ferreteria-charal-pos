"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@repo/types";
import { X, Upload, Camera, ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import { EscanerCamara } from "../pos/EscanerCamara";
import { toast } from "sonner";
import { type Producto } from "@/components/productos/useProductos";
type Categoria = Database["public"]["Tables"]["categorias"]["Row"];

type Props = {
  producto: Producto | null;
  categorias: Categoria[];
  onClose: () => void;
  onGuardado: (producto: Producto) => void;
  onCategoriaCreada?: (categoria: Categoria) => void;
};

export function ProductoModal({
  producto,
  categorias,
  onClose,
  onGuardado,
  onCategoriaCreada,
}: Props) {
  const supabase = createClient();
  const esEdicion = !!producto;

  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    codigo_barras: producto?.codigo_barras ?? "",
    sku: producto?.sku ?? "",
    unidad: producto?.unidad ?? "pieza",
    precio_base: producto?.precio_base ?? 0,
    precio_mayoreo: producto?.precio_mayoreo ?? 0,
    stock_minimo: producto?.stock_minimo ?? 0,
    categoria_id: producto?.categoria_id ?? "",
    activo: producto?.activo ?? true,
  });

  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    producto?.imagen_url ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [dropdownCategoriaAbierto, setDropdownCategoriaAbierto] =
    useState(false);
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null);
  function generarSKU(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .map((palabra) =>
        palabra
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 4)
          .toUpperCase(),
      )
      .filter(Boolean)
      .join("-");
  }

  const skuEditadoManualmente = useRef(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;

    if (name === "sku") {
      skuEditadoManualmente.current = true;
    }

    if (name === "nombre" && !skuEditadoManualmente.current) {
      setForm((prev) => ({
        ...prev,
        nombre: value,
        sku: generarSKU(value),
      }));
      return;
    }

    const camposNumericos = ["precio_base", "precio_mayoreo", "stock_minimo"];
    if (camposNumericos.includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value) || 0,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (
        dropdownCategoriaRef.current &&
        !dropdownCategoriaRef.current.contains(e.target as Node)
      ) {
        setDropdownCategoriaAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function handleSeleccionarCategoria(valor: string) {
    if (valor === "__nueva__") {
      setCreandoCategoria(true);
      setDropdownCategoriaAbierto(false);
      return;
    }
    setForm((prev) => ({ ...prev, categoria_id: valor }));
    setDropdownCategoriaAbierto(false);
  }

  function handleCodigoBarrasChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Solo permitir números, máximo 14 dígitos (cubre UPC, EAN-13, EAN-8, etc.)
    const valor = e.target.value.replace(/[^0-9]/g, "").slice(0, 14);
    setForm((prev) => ({ ...prev, codigo_barras: valor }));
  }

  function handleImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleCrearCategoria() {
    if (!nuevaCategoria.trim()) return;

    try {
      const { data, error } = await supabase
        .from("categorias")
        .insert({ nombre: nuevaCategoria.trim() })
        .select()
        .single();

      if (error) throw error;

      onCategoriaCreada?.(data);
      setForm((prev) => ({ ...prev, categoria_id: data.id }));
      setCreandoCategoria(false);
      setNuevaCategoria("");
      toast.success("Categoría creada correctamente");
    } catch {
      toast.error("Error al crear la categoría", {
        description: "Es posible que ya exista una con ese nombre",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (
      form.codigo_barras &&
      (form.codigo_barras.length < 6 || form.codigo_barras.length > 14)
    ) {
      toast.warning("El código de barras debe tener entre 6 y 14 dígitos");
      setLoading(false);
      return;
    }
    setError(null);

    try {
      let imagen_url = producto?.imagen_url ?? null;

      if (imagen) {
        const ext = imagen.name.split(".").pop();
        const filename = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("productos")
          .upload(filename, imagen, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("productos")
          .getPublicUrl(filename);

        imagen_url = urlData.publicUrl;
      }

      const payload = {
        ...form,
        imagen_url,
        categoria_id: form.categoria_id || null,
        precio_mayoreo: form.precio_mayoreo || null,
        codigo_barras: form.codigo_barras || null,
        sku: form.sku || null,
      };

      if (esEdicion && producto) {
        const { data, error } = await supabase
          .from("productos")
          .update(payload)
          .eq("id", producto.id)
          .select("*, categorias(nombre)")
          .single();
        if (error) throw error;
        toast.success("Producto actualizado correctamente");
        onGuardado(data as unknown as Producto);
      } else {
        const { data, error } = await supabase
          .from("productos")
          .insert(payload)
          .select("*, categorias(nombre)")
          .single();
        if (error) throw error;
        toast.success("Producto creado correctamente");
        onGuardado(data as unknown as Producto);
      }
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";

      if (mensaje.includes("inventario")) {
        toast.warning(
          "Producto guardado pero hubo un problema al asignar inventario",
          {
            description: "Ve a inventario y agrégalo manualmente",
            duration: 6000,
          },
        );
        onClose();
        return;
      }

      if (mensaje.includes("codigo_barras")) {
        toast.error("Ya existe un producto con ese código de barras");
        setError("Ya existe un producto con ese código de barras");
        return;
      }

      if (mensaje.includes("sku")) {
        toast.error("El SKU ya está en uso", {
          description: "Modifícalo manualmente antes de guardar",
        });
        setError("El SKU ya está en uso, modifícalo manualmente");
        return;
      }

      if (mensaje.includes("imagen") || mensaje.includes("storage")) {
        toast.error("Error al subir la imagen", {
          description: "Verifica que el archivo sea PNG o JPG menor a 2MB",
        });
        setError("Error al subir la imagen");
        return;
      }

      toast.error("Error al guardar el producto", {
        description: mensaje,
        duration: 6000,
      });
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {esEdicion ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Imagen */}
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 rounded-xl border border-border
                overflow-hidden bg-surface-2 shrink-0 flex items-center justify-center"
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="preview"
                  fill
                  sizes="160px"
                  className="object-contain p-1"
                />
              ) : (
                <Upload size={20} className="text-text-tertiary" />
              )}
            </div>
            <div>
              <label
                className="cursor-pointer text-sm font-medium text-text-secondary
                                hover:text-text-primary transition-colors"
              >
                {preview ? "Cambiar imagen" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagen}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-text-tertiary mt-1">
                PNG, JPG hasta 2MB
              </p>
            </div>
          </div>

          {/* Nombre y categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Nombre <span className="text-danger">*</span>
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary"
                placeholder="Ej. Martillo de uña 16oz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Categoría
              </label>

              <div className="relative" ref={dropdownCategoriaRef}>
                <button
                  type="button"
                  onClick={() => setDropdownCategoriaAbierto((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border
                 border-border rounded-lg text-sm bg-surface text-text-primary
                 hover:bg-hover transition-colors"
                >
                  <span
                    className={form.categoria_id ? "" : "text-text-tertiary"}
                  >
                    {categorias.find((c) => c.id === form.categoria_id)
                      ?.nombre ?? "Sin categoría"}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-text-tertiary transition-transform duration-200 shrink-0 ${
                      dropdownCategoriaAbierto ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute top-full left-0 right-0 mt-1.5 bg-surface border
                  border-border rounded-xl shadow-lg z-20 overflow-hidden
                  origin-top transition-all duration-150 ${
                    dropdownCategoriaAbierto
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => handleSeleccionarCategoria("")}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                     text-sm text-text-primary hover:bg-hover transition-colors text-left"
                    >
                      Sin categoría
                      {!form.categoria_id && (
                        <Check size={14} className="text-accent shrink-0" />
                      )}
                    </button>

                    {categorias.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSeleccionarCategoria(c.id)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2
                       text-sm text-text-primary hover:bg-hover transition-colors text-left"
                      >
                        {c.nombre}
                        {form.categoria_id === c.id && (
                          <Check size={14} className="text-accent shrink-0" />
                        )}
                      </button>
                    ))}

                    <div className="border-t border-border my-1" />

                    <button
                      type="button"
                      onClick={() => handleSeleccionarCategoria("__nueva__")}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm
                     text-accent hover:bg-hover transition-colors text-left font-medium"
                    >
                      + Agregar nueva categoría...
                    </button>
                  </div>
                </div>
              </div>

              {creandoCategoria && (
                <div className="grid gap-2 mt-2">
                  <input
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    autoFocus
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm
       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
       text-text-primary"
                  />
                  <div className="flex gap-4 justify-end">
                    <button
                      type="button"
                      onClick={handleCrearCategoria}
                      disabled={!nuevaCategoria.trim()}
                      className="px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium
       hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                      Crear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreandoCategoria(false);
                        setNuevaCategoria("");
                      }}
                      className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary
       hover:bg-hover transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Unidad
              </label>
              <select
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary"
              >
                {[
                  "pieza",
                  "metro",
                  "litro",
                  "kilo",
                  "caja",
                  "rollo",
                  "par",
                  "juego",
                ].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Códigos */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Código de barras
            </label>
            <div className="flex gap-2">
              <input
                name="codigo_barras"
                value={form.codigo_barras}
                onChange={handleCodigoBarrasChange}
                inputMode="numeric"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-accent bg-surface
              text-text-primary font-mono"
                placeholder="7501234567890"
              />
              <button
                type="button"
                onClick={() => setEscanerAbierto(true)}
                className="px-3 py-2 border border-border rounded-lg text-text-secondary
                 hover:text-text-primary hover:bg-hover transition-colors"
                title="Escanear con cámara"
              >
                <Camera size={16} />
              </button>
            </div>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              SKU
              <span className="ml-2 text-xs text-text-tertiary font-normal">
                generado automáticamente
              </span>
            </label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
               focus:outline-none focus:ring-2 focus:ring-accent
               bg-surface-2 text-text-secondary font-mono"
              placeholder="Se genera con el nombre"
            />
          </div>

          {/* Precios */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Precio base <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                $
              </span>
              <input
                name="precio_base"
                type="text"
                inputMode="decimal"
                value={form.precio_base === 0 ? "" : form.precio_base}
                onChange={handleChange}
                required
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                 text-text-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Precio mayoreo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                $
              </span>
              <input
                name="precio_mayoreo"
                type="text"
                inputMode="decimal"
                value={form.precio_mayoreo === 0 ? "" : form.precio_mayoreo}
                onChange={handleChange}
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                 text-text-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Stock mínimo
            </label>
            <input
              name="stock_minimo"
              type="text"
              inputMode="numeric"
              value={form.stock_minimo === 0 ? "" : form.stock_minimo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
               focus:outline-none focus:ring-2 focus:ring-accent bg-surface
               text-text-primary"
              placeholder="0"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion ?? ""}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                         text-text-primary resize-none"
              placeholder="Descripción opcional del producto"
            />
          </div>

          {error && (
            <div className="bg-danger-soft border border-danger/20 text-danger text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm
                         font-medium text-text-secondary hover:bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
      {escanerAbierto && (
        <EscanerCamara
          onDetectado={(codigo) => {
            setForm((prev) => ({ ...prev, codigo_barras: codigo }));
            setEscanerAbierto(false);
          }}
          onClose={() => setEscanerAbierto(false)}
        />
      )}
    </div>
  );
}
