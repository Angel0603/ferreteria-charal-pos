"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CreditCard,
  Users,
  Package,
  ArrowRight,
  CircleCheck,
  Receipt,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";
import Link from "next/link";
import { ClimaWidget } from "@/components/ui/ClimaWidget";
import { CorteCaja } from "@/components/ui/CorteCaja";

type KPIs = {
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
  tickets_hoy: number;
  ticket_promedio: number;
  productos_bajo_stock: number;
  clientes_con_deuda: number;
  total_por_cobrar: number;
};

type VentaReciente = {
  id: string;
  folio: string;
  total: number;
  metodo_pago: string;
  cajero: string;
  cliente: string;
  created_at: string;
};

type ProductoBajoStock = {
  nombre: string;
  cantidad: number;
  stock_minimo: number;
};

type ClienteDeuda = {
  nombre: string;
  saldo_credito: number;
  telefono: string | null;
};

type DetalleVenta = {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  es_vario: boolean;
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [ventasRecientes, setVentasRecientes] = useState<VentaReciente[]>([]);
  const [bajoStock, setBajoStock] = useState<ProductoBajoStock[]>([]);
  const [deudores, setDeudores] = useState<ClienteDeuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [modalCorte, setModalCorte] = useState(false);
  const supabaseRef = useRef(createClient());
  const [ventaExpandida, setVentaExpandida] = useState<string | null>(null);
  const [detalleVentas, setDetalleVentas] = useState<
    Record<string, DetalleVenta[]>
  >({});
  const [loadingDetalle, setLoadingDetalle] = useState<string | null>(null);

async function handleExpandirVenta(folio: string, ventaId: string) {
  if (ventaExpandida === folio) {
    setVentaExpandida(null)
    return
  }

  setVentaExpandida(folio)

  if (detalleVentas[folio]) return

  setLoadingDetalle(folio)
  try {
    const { data } = await supabaseRef.current
      .rpc('get_detalle_venta', { p_venta_id: ventaId })
    console.log('Detalle venta:', JSON.stringify(data, null, 2))
    if (data) {
      setDetalleVentas(prev => ({ ...prev, [folio]: data as DetalleVenta[] }))
    }
  } finally {
    setLoadingDetalle(null)
  }
}

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("sucursal_id, sucursales(nombre)")
        .eq("id", user.id)
        .single();

      if (!perfil?.sucursal_id) return;

      const suc = perfil.sucursales as unknown as { nombre: string } | null;
      if (suc && activo) setSucursalNombre(suc.nombre);
      if (activo) setSucursalId(perfil.sucursal_id);

      const sucId = perfil.sucursal_id;

      const { data: kpisData } = await supabase.rpc("get_dashboard_kpis", {
        p_sucursal_id: sucId,
      });
      if (activo && kpisData) setKpis(kpisData as KPIs);

      const { data: ventasData } = await supabase.rpc("get_ventas_recientes", {
        p_sucursal_id: sucId,
      });
      if (activo && ventasData)
        setVentasRecientes(ventasData as VentaReciente[]);

      const { data: stockData } = await supabase
        .from("inventario")
        .select("cantidad, productos(nombre, stock_minimo)")
        .eq("sucursal_id", sucId)
        .order("cantidad")
        .limit(5);

      if (activo && stockData) {
        const bajos = (
          stockData as unknown as {
            cantidad: number;
            productos:
              | { nombre: string; stock_minimo: number }
              | { nombre: string; stock_minimo: number }[];
          }[]
        )
          .filter((i) => {
            const p = Array.isArray(i.productos) ? i.productos[0] : i.productos;
            return i.cantidad <= p.stock_minimo;
          })
          .map((i) => {
            const p = Array.isArray(i.productos) ? i.productos[0] : i.productos;
            return {
              nombre: p.nombre,
              cantidad: i.cantidad,
              stock_minimo: p.stock_minimo,
            };
          });
        setBajoStock(bajos);
      }

      const { data: deudoresData } = await supabase
        .from("clientes")
        .select("nombre, saldo_credito, telefono")
        .eq("sucursal_id", sucId)
        .gt("saldo_credito", 0)
        .eq("activo", true)
        .order("saldo_credito", { ascending: false })
        .limit(5);
      if (activo && deudoresData) setDeudores(deudoresData as ClienteDeuda[]);

      if (activo) setLoading(false);
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6 bg-surface border border-border rounded-xl px-6 py-4">
        {/* Fecha */}
        <div className="flex items-baseline gap-3 shrink-0">
          <span className="text-5xl font-semibold text-text-primary leading-none">
            {new Date().getDate()}
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary capitalize">
              {new Date().toLocaleDateString("es-MX", { month: "long" })}
            </p>
            <p className="text-xs text-text-tertiary capitalize">
              {new Date().getFullYear()} ·{" "}
              {new Date().toLocaleDateString("es-MX", { weekday: "long" })}
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="w-px h-10 bg-border shrink-0" />

        {/* Título + sucursal */}
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium
                     bg-accent-soft text-accent-soft-text px-2.5 py-1 rounded-full mt-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            {sucursalNombre}
          </span>
        </div>

        {/* Clima */}
        <div className="shrink-0 justify-self-end ml-auto">
          <ClimaWidget />
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ventas hoy"
          valor={formatCurrency(kpis?.ventas_hoy ?? 0)}
          sub={`${kpis?.tickets_hoy ?? 0} tickets`}
          icon={<ShoppingCart size={18} />}
          color="info"
        />
        <KPICard
          label="Ventas semana"
          valor={formatCurrency(kpis?.ventas_semana ?? 0)}
          icon={<TrendingUp size={18} />}
          color="success"
        />
        <KPICard
          label="Ventas mes"
          valor={formatCurrency(kpis?.ventas_mes ?? 0)}
          sub={`Promedio: ${formatCurrency(kpis?.ticket_promedio ?? 0)}`}
          icon={<Calendar size={18} />}
          color="accent"
        />
        <KPICard
          label="Por cobrar"
          valor={formatCurrency(kpis?.total_por_cobrar ?? 0)}
          sub={`${kpis?.clientes_con_deuda ?? 0} clientes`}
          icon={<CreditCard size={18} />}
          color="danger"
        />
      </div>

      {/* Alertas */}
      {(kpis?.productos_bajo_stock ?? 0) > 0 && (
        <Link href="/inventario">
          <div
            className="flex items-center gap-3 bg-surface border border-border
                    border-l-[3px] border-l-warning rounded-xl px-4 py-3 my-4
                    hover:bg-hover transition-colors cursor-pointer"
          >
            <AlertTriangle size={16} className="text-warning shrink-0" />
            <p className="text-sm text-text-primary">
              <span className="font-medium">
                {kpis?.productos_bajo_stock} producto
                {(kpis?.productos_bajo_stock ?? 0) !== 1 ? "s" : ""}
              </span>{" "}
              con stock por debajo del mínimo
            </p>
            <button
              className="ml-auto w-7 h-7 rounded-lg border border-border text-text-secondary
                 hover:bg-hover hover:text-warning transition-colors
                 flex items-center justify-center shrink-0"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </Link>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas recientes */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
            <ShoppingCart size={17} className="text-text-secondary" />
            <h2 className="text-sm font-medium text-text-primary">
              Ventas recientes
            </h2>
            <Link
              href="/pos"
              aria-label="Ir al POS"
              className="ml-auto w-7 h-7 rounded-lg border border-border text-text-secondary
                 hover:bg-hover hover:text-accent transition-colors
                 flex items-center justify-center"
            >
              <ArrowRight size={14} />
            </Link>
          </div>
          {ventasRecientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
              <ShoppingCart size={24} className="mb-2 opacity-40" />
              <p className="text-sm">Sin ventas hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ventasRecientes.map((v) => (
                <div key={v.folio}>
                  {/* Fila principal */}
                  <button
                    onClick={() => handleExpandirVenta(v.folio, v.id)}
                    className="w-full flex items-center justify-between px-4 py-3
                       hover:bg-hover transition-colors text-left group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary font-mono">
                        {v.folio}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">
                        {v.cliente} · {v.cajero}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {formatCurrency(v.total)}
                        </p>
                        <p className="text-xs text-text-tertiary capitalize">
                          {v.metodo_pago}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border border-border flex items-center
                              justify-center transition-all duration-300 group-hover:border-accent
                              group-hover:text-accent ${
                                ventaExpandida === v.folio
                                  ? "bg-accent border-accent text-white"
                                  : "text-text-tertiary"
                              }`}
                      >
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-300 ${
                            ventaExpandida === v.folio ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Detalle expandible con animación */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      ventaExpandida === v.folio
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="bg-surface-2 border-t border-border px-4 py-3 space-y-2">
                      {loadingDetalle === v.folio ? (
                        <div className="flex items-center justify-center gap-2 py-3">
                          <div className="w-3 h-3 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                          <div className="w-3 h-3 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                          <div className="w-3 h-3 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
                        </div>
                      ) : (detalleVentas[v.folio] ?? []).length === 0 ? (
                        <p className="text-xs text-text-tertiary text-center py-2">
                          Sin productos
                        </p>
                      ) : (
                        <>
                          {/* Encabezado tabla */}
                          <div
                            className="grid grid-cols-12 gap-2 text-xs font-medium
                                  text-text-tertiary pb-1.5 border-b border-border"
                          >
                            <span className="col-span-5">Producto</span>
                            <span className="col-span-2 text-center">
                              Cant.
                            </span>
                            <span className="col-span-2 text-right">
                              Precio
                            </span>
                            <span className="col-span-3 text-right">Total</span>
                          </div>

                          {/* Filas de productos */}
                          {(detalleVentas[v.folio] ?? []).map((item, i) => (
                            <div
                              key={i}
                              className="grid grid-cols-12 gap-2 text-xs items-start"
                            >
                              <div className="col-span-5 flex items-start gap-1.5 min-w-0">
                                {item.es_vario && (
                                  <span
                                    className="text-[10px] bg-warning-soft text-warning
                                           px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                                  >
                                    Vario
                                  </span>
                                )}
                                <span className="text-text-primary leading-tight">
                                  {item.nombre}
                                </span>
                              </div>
                              <span className="col-span-2 text-center text-text-secondary font-mono">
                                {item.cantidad}
                              </span>
                              <span className="col-span-2 text-right text-text-secondary font-mono">
                                {formatCurrency(item.precio_unitario)}
                              </span>
                              <div className="col-span-3 text-right">
                                <span className="text-text-primary font-medium font-mono">
                                  {formatCurrency(item.subtotal)}
                                </span>
                                {item.descuento > 0 && (
                                  <p className="text-success font-mono text-[10px]">
                                    Desc: -{formatCurrency(item.descuento)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Totales */}
                          <div className="pt-1.5 border-t border-border space-y-1">
                            {/* Descuento global de la venta si aplica */}
                            {(detalleVentas[v.folio] ?? []).some(
                              (i) => i.descuento > 0,
                            ) && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-tertiary">
                                  Descuento aplicado
                                </span>
                                <span className="text-success font-mono">
                                  -
                                  {formatCurrency(
                                    (detalleVentas[v.folio] ?? []).reduce(
                                      (acc, i) => acc + i.descuento,
                                      0,
                                    ),
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-xs font-medium text-text-secondary">
                                Total
                              </span>
                              <span className="text-sm font-semibold text-text-primary font-mono">
                                {formatCurrency(v.total)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Stock bajo */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <Package size={17} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                Stock bajo
              </h2>
              {bajoStock.length > 0 && (
                <span className="bg-warning-soft text-warning text-xs font-medium px-2 py-0.5 rounded-full">
                  {bajoStock.length}
                </span>
              )}
              <Link
                href="/inventario"
                aria-label="Ver inventario"
                className="ml-auto w-7 h-7 rounded-lg border border-border text-text-secondary
                 hover:bg-hover hover:text-accent transition-colors
                 flex items-center justify-center"
              >
                <ArrowRight size={14} />
              </Link>
            </div>
            {bajoStock.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-4 text-success">
                <CircleCheck size={16} />
                <p className="text-sm">Todo el stock está en nivel óptimo</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {bajoStock.map((p) => (
                  <div
                    key={p.nombre}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <p className="text-sm text-text-secondary truncate flex-1">
                      {p.nombre}
                    </p>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-text-tertiary">
                        mín: {p.stock_minimo}
                      </span>
                      <span
                        className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${
                          p.cantidad === 0
                            ? "bg-danger-soft text-danger"
                            : "bg-warning-soft text-warning"
                        }`}
                      >
                        {p.cantidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clientes con deuda */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <Users size={17} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                Clientes con saldo
              </h2>
              {deudores.length > 0 && (
                <span className="bg-danger-soft text-danger text-xs font-medium px-2 py-0.5 rounded-full">
                  {deudores.length}
                </span>
              )}
              <Link
                href="/clientes"
                aria-label="Ver clientes"
                className="ml-auto w-7 h-7 rounded-lg border border-border text-text-secondary
                 hover:bg-hover hover:text-accent transition-colors
                 flex items-center justify-center"
              >
                <ArrowRight size={14} />
              </Link>
            </div>
            {deudores.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-4 text-success">
                <CircleCheck size={16} />
                <p className="text-sm">Sin saldos pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {deudores.map((c) => (
                  <div
                    key={c.nombre}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {c.nombre}
                      </p>
                      {c.telefono && (
                        <p className="text-xs text-text-tertiary">
                          {c.telefono}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-danger shrink-0 ml-4">
                      {formatCurrency(c.saldo_credito)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Modal corte de caja */}
            {modalCorte && sucursalId && (
              <CorteCaja
                sucursalId={sucursalId}
                sucursalNombre={sucursalNombre}
                onClose={() => setModalCorte(false)}
              />
            )}
            {/* Botón flotante corte de caja */}
            <div className="fixed bottom-6 right-6 z-40">
              <div className="relative flex items-center justify-center">
                {/* Anillos de pulso */}
                <span className="absolute w-14 h-14 rounded-full bg-accent opacity-60 animate-ping" />
                <span className="absolute w-14 h-14 rounded-full bg-accent opacity-30 animate-ping [animation-delay:0.4s]" />

                {/* Botón */}
                <button
                  onClick={() => setModalCorte(true)}
                  title="Corte de caja"
                  className="relative w-14 h-14 rounded-full bg-accent text-white
                 flex items-center justify-center
                 hover:bg-accent-hover transition-all duration-200
                 shadow-lg shadow-accent/30 hover:scale-110 active:scale-95"
                >
                  <Receipt size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type KPICardProps = {
  label: string;
  valor: string;
  sub?: string;
  icon: React.ReactNode;
  color: "accent" | "success" | "info" | "danger";
};

const COLOR_CLASSES = {
  accent: { bg: "bg-accent-soft", text: "text-accent" },
  success: { bg: "bg-success-soft", text: "text-success" },
  info: { bg: "bg-info-soft", text: "text-info" },
  danger: { bg: "bg-danger-soft", text: "text-danger" },
};

function KPICard({ label, valor, sub, icon, color }: KPICardProps) {
  const c = COLOR_CLASSES[color];
  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <div className={`${c.bg} ${c.text} p-2 rounded-lg`}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-semibold text-text-primary">{valor}</p>
        {sub && <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
