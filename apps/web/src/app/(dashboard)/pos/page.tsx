"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Search, Camera } from "lucide-react";
import { MetodoPago, useCarrito } from "@/components/pos/useCarrito";
import { useBuscador } from "@/components/pos/useBuscador";
import { useTeclado } from "@/components/pos/useTeclado";
import { Carrito } from "@/components/pos/Carrito";
import { ModalCobro } from "@/components/pos/ModalCobro";
import { ModalTicket } from "@/components/pos/ModalTicket";
import { ModalCliente } from "@/components/pos/ModalCliente";
import { useProcesarVenta } from "@/components/pos/useProcesarVenta";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@repo/types";
import Image from "next/image";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { ModalProductoVario } from "@/components/pos/ModalProductoVario";
import { EscanerCamara } from "@/components/pos/EscanerCamara";

type Producto = Database["public"]["Tables"]["productos"]["Row"];
type Categoria = Database["public"]["Tables"]["categorias"]["Row"];

export default function PosPage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modalCobrar, setModalCobrar] = useState(false);
  const [modalDescuento, setModalDescuento] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalTicket, setModalTicket] = useState(false);
  const [sucursalId, setSucursalId] = useState("");
  const [cajeroId, setCajeroId] = useState("");
  const [cajeroNombre, setCajeroNombre] = useState("");
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [sucursalTel, setSucursalTel] = useState("");
  const [modalProductoVario, setModalProductoVario] = useState(false);
  const [modalEscaner, setModalEscaner] = useState(false);
  const [datosTicket, setDatosTicket] = useState<{
    folio: string;
    efectivoRecibido: number;
    cambio: number;
    fechaHora: string;
  } | null>(null);

  const supabaseRef = useRef(createClient());
  const { procesarVenta } = useProcesarVenta();

  useEffect(() => {
    let activo = true;
    async function cargarSucursal() {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCajeroId(user.id);

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre, sucursal_id, sucursales(nombre, telefono)")
        .eq("id", user.id)
        .single();

      if (!activo || !perfil) return;

      setCajeroNombre(perfil.nombre);
      if (perfil.sucursal_id) setSucursalId(perfil.sucursal_id);

      const suc = perfil.sucursales as unknown as {
        nombre: string;
        telefono: string;
      } | null;
      if (suc) {
        setSucursalNombre(suc.nombre);
        setSucursalTel(suc.telefono ?? "");
      }
    }
    cargarSucursal();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      const { data } = await supabaseRef.current
        .from("categorias")
        .select("*")
        .order("nombre");
      if (activo && data) setCategorias(data);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const carrito = useCarrito();
  const buscador = useBuscador(sucursalId);

  const enfocarBuscar = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  useTeclado({
    onBuscar: enfocarBuscar,
    onCliente: () => setModalCliente(true),
    onDescuento: () => setModalDescuento(true),
    onProductoVario: () => setModalProductoVario(true),
    onCobrar: () => {
      if (carrito.items.length > 0) setModalCobrar(true);
    },
    onCancelar: () => carrito.limpiarCarrito(),
  });

  function handleProductoClick(producto: Producto) {
    carrito.agregarProducto(producto);
  }

  function handleCodigoDetectado(codigo: string) {
    buscador.setQuery(codigo);
  }

  async function handleAgregarProductoVario(
    descripcion: string,
    precio: number,
    cantidad: number,
  ) {
    carrito.agregarProductoVario(descripcion, precio, cantidad);
    setModalProductoVario(false);

    try {
      await supabaseRef.current.from("productos_varios").insert({
        descripcion,
        precio,
        cantidad,
        sucursal_id: sucursalId,
        cajero_id: cajeroId,
      });
    } catch {
      // No bloqueamos la venta si falla el registro de auditoría
    }

    toast.success("Producto agregado a la venta", {
      description: "Quedó marcado para revisión del administrador",
    });
  }

  async function handleConfirmarVenta(efectivoRecibido: number) {
    try {
      const folio = await procesarVenta({
        sucursalId,
        cajeroId,
        clienteId: carrito.clienteId,
        clienteSaldoActual: carrito.cliente?.saldo_credito,
        items: carrito.items,
        subtotal: carrito.subtotal,
        descuento: carrito.descuento,
        total: carrito.total,
        metodoPago: carrito.metodoPago,
      });

      const fechaHora = new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());

      const cambio = Math.max(0, efectivoRecibido - carrito.total);

      setDatosTicket({ folio, efectivoRecibido, cambio, fechaHora });
      setModalCobrar(false);
      setModalTicket(true);

      toast.success(`Venta registrada — ${folio}`, {
        description: `Total cobrado: ${formatCurrency(carrito.total)}`,
        duration: 4000,
      });
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "Error al procesar la venta";
      toast.error("Error al registrar la venta", {
        description: mensaje,
        duration: 6000,
      });
    }
  }

  function handleMetodoPago(metodo: MetodoPago) {
    if (metodo === "credito" && !carrito.clienteId) {
      toast.warning("Selecciona un cliente para vender a crédito", {
        description: "No se puede vender a crédito a Público general",
      });
      return;
    }
    carrito.setMetodoPago(metodo);
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden -m-6">
      {/* Panel izquierdo */}
      <div className="flex flex-col flex-1 min-w-0 bg-base">
        {/* Barra de búsqueda */}
        <div className="bg-surface border-b border-border px-4 py-3 space-y-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              ref={searchRef}
              value={buscador.query}
              onChange={(e) => buscador.setQuery(e.target.value)}
              placeholder="Buscar producto o escanear código de barras..."
              className="w-full pl-9 pr-24 py-2.5 border border-border rounded-xl text-sm
               focus:outline-none focus:ring-2 focus:ring-accent bg-surface-2
               text-text-primary placeholder:text-text-tertiary"
              autoFocus
            />
            <button
              onClick={() => setModalEscaner(true)}
              title="Escanear código de barras"
              className="absolute right-12 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg
               text-text-tertiary hover:bg-hover hover:text-accent transition-colors
               flex items-center justify-center"
            >
              <Camera size={15} />
            </button>
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary
                   font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-border"
            >
              F2
            </span>
          </div>

          {/* Atajos visibles */}
          <div className="flex gap-4 flex-wrap">
            {[
              { key: "F2", label: "Buscar" },
              { key: "F4", label: "Cliente" },
              { key: "F6", label: "Producto vario" },
              { key: "F8", label: "Descuento" },
              { key: "F10", label: "Cobrar" },
              { key: "ESC", label: "Cancelar venta" },
            ].map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="text-xs font-mono bg-surface-2 text-text-secondary
                                 px-1.5 py-0.5 rounded border border-border"
                >
                  {s.key}
                </span>
                <span className="text-xs text-text-tertiary">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filtro por categorías */}
        <div className="bg-surface border-b border-border px-4 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => buscador.setCategoriaId("")}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !buscador.categoriaId
                ? "bg-accent text-white border-accent"
                : "bg-surface text-text-secondary border-border hover:bg-hover"
            }`}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => buscador.setCategoriaId(cat.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                buscador.categoriaId === cat.id
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-text-secondary border-border hover:bg-hover"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          {!buscador.query && !buscador.categoriaId && (
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Más vendidos esta semana
            </p>
          )}
          {buscador.loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-text-tertiary">
              Cargando productos...
            </div>
          ) : buscador.resultados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-tertiary gap-2">
              <Package size={28} className="opacity-40" />
              <p className="text-sm">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {buscador.resultados.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => handleProductoClick(producto)}
                  className="bg-surface border border-border rounded-xl p-3 text-left
                             hover:border-accent/40 active:scale-[0.97]
                             transition-all flex flex-col gap-2"
                >
                  <div
                    className="w-full aspect-square rounded-lg bg-surface-2 overflow-hidden
                                  flex items-center justify-center relative border border-border"
                  >
                    {producto.imagen_url ? (
                      <Image
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        fill
                        sizes="240px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <Package size={24} className="text-text-tertiary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary line-clamp-2 leading-tight">
                      {producto.nombre}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatCurrency(producto.precio_base)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho: carrito */}
      <div className="w-80 shrink-0">
        <Carrito
          items={carrito.items}
          subtotal={carrito.subtotal}
          descuento={carrito.descuento}
          total={carrito.total}
          metodoPago={carrito.metodoPago}
          clienteId={carrito.clienteId}
          clienteNombre={carrito.clienteNombre}
          onCantidad={carrito.cambiarCantidad}
          onEliminar={carrito.eliminarItem}
          onMetodoPago={handleMetodoPago}
          onCobrar={() => setModalCobrar(true)}
          onCliente={() => setModalCliente(true)}
          onDescuento={() => setModalDescuento(true)}
        />
      </div>

      {/* Modal descuento */}
      {modalDescuento && (
        <ModalDescuento
          subtotal={carrito.subtotal}
          descuentoActual={carrito.descuento}
          onAplicar={(d) => {
            carrito.setDescuento(d);
            setModalDescuento(false);
          }}
          onClose={() => setModalDescuento(false)}
        />
      )}

      {/* Modal cliente */}
      {modalCliente && (
        <ModalCliente
          sucursalId={sucursalId}
          onSeleccionar={(cliente) => {
            carrito.asignarCliente(cliente);
            setModalCliente(false);
          }}
          onClose={() => setModalCliente(false)}
        />
      )}

      {/* Modal cobro */}
      {modalCobrar && (
        <ModalCobro
          items={carrito.items}
          total={carrito.total}
          descuento={carrito.descuento}
          metodoPago={carrito.metodoPago}
          clienteNombre={carrito.clienteNombre}
          clienteSaldoActual={carrito.cliente?.saldo_credito}
          clienteLimiteCredito={carrito.cliente?.limite_credito}
          onConfirmar={handleConfirmarVenta}
          onClose={() => setModalCobrar(false)}
        />
      )}

      {/* Modal ticket */}
      {modalTicket && datosTicket && (
        <ModalTicket
          folio={datosTicket.folio}
          items={carrito.items}
          subtotal={carrito.subtotal}
          descuento={carrito.descuento}
          total={carrito.total}
          metodoPago={carrito.metodoPago}
          clienteNombre={carrito.clienteNombre}
          cajeroNombre={cajeroNombre}
          sucursalNombre={sucursalNombre}
          sucursalTel={sucursalTel}
          efectivoRecibido={datosTicket.efectivoRecibido}
          cambio={datosTicket.cambio}
          fechaHora={datosTicket.fechaHora}
          onClose={() => {
            setModalTicket(false);
            carrito.limpiarCarrito();
          }}
        />
      )}
      {modalProductoVario && (
        <ModalProductoVario
          onAgregar={handleAgregarProductoVario}
          onClose={() => setModalProductoVario(false)}
        />
      )}
      {modalEscaner && (
        <EscanerCamara
          onDetectado={handleCodigoDetectado}
          onClose={() => setModalEscaner(false)}
        />
      )}
    </div>
  );
}

function ModalDescuento({
  subtotal,
  descuentoActual,
  onAplicar,
  onClose,
}: {
  subtotal: number;
  descuentoActual: number;
  onAplicar: (d: number) => void;
  onClose: () => void;
}) {
  const [tipo, setTipo] = useState<"monto" | "porcentaje">("porcentaje");
  const [valor, setValor] = useState(
    descuentoActual > 0 ? String(descuentoActual) : "",
  );

  const montoCalculado =
    tipo === "porcentaje"
      ? (subtotal * (parseFloat(valor) || 0)) / 100
      : parseFloat(valor) || 0;

  function handleAplicar() {
    onAplicar(Math.min(montoCalculado, subtotal));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-xs p-6 space-y-4 border border-border">
        <h3 className="font-medium text-text-primary">Aplicar descuento</h3>

        <div className="grid grid-cols-2 gap-2">
          {(["porcentaje", "monto"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTipo(t);
                setValor("");
              }}
              className={`py-2 rounded-lg border text-sm transition-colors ${
                tipo === t
                  ? "bg-accent text-white border-accent"
                  : "bg-surface-2 text-text-secondary border-border"
              }`}
            >
              {t === "porcentaje" ? "Porcentaje %" : "Monto $"}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
            {tipo === "porcentaje" ? "%" : "$"}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full pl-8 pr-3 py-2.5 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                       text-text-primary"
          />
        </div>

        {valor && (
          <p className="text-sm text-text-secondary text-center">
            Descuento:{" "}
            <span className="font-medium text-text-primary">
              {formatCurrency(montoCalculado)}
            </span>{" "}
            → Total:{" "}
            <span className="font-medium text-text-primary">
              {formatCurrency(subtotal - montoCalculado)}
            </span>
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-lg text-sm
                       text-text-secondary hover:bg-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAplicar}
            className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm
                       hover:bg-accent-hover transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
