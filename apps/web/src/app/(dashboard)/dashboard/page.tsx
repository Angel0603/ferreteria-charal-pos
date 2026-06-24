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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";
import Link from "next/link";

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

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [ventasRecientes, setVentasRecientes] = useState<VentaReciente[]>([]);
  const [bajoStock, setBajoStock] = useState<ProductoBajoStock[]>([]);
  const [deudores, setDeudores] = useState<ClienteDeuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const supabaseRef = useRef(createClient());

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

      const sucursalId = perfil.sucursal_id;

      const { data: kpisData } = await supabase.rpc("get_dashboard_kpis", {
        p_sucursal_id: sucursalId,
      });
      if (activo && kpisData) setKpis(kpisData as KPIs);

      const { data: ventasData } = await supabase.rpc("get_ventas_recientes", {
        p_sucursal_id: sucursalId,
      });
      if (activo && ventasData)
        setVentasRecientes(ventasData as VentaReciente[]);

      const { data: stockData } = await supabase
        .from("inventario")
        .select("cantidad, productos(nombre, stock_minimo)")
        .eq("sucursal_id", sucursalId)
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
        .eq("sucursal_id", sucursalId)
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
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-md text-text-secondary mt-0.5">
          {sucursalNombre} —{" "}
          {new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
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
                <div
                  key={v.folio}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary font-mono">
                      {v.folio}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">
                      {v.cliente} · {v.cajero}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium text-text-primary">
                      {formatCurrency(v.total)}
                    </p>
                    <p className="text-xs text-text-tertiary capitalize">
                      {v.metodo_pago}
                    </p>
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
