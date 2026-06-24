"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEstaMontado } from "@/lib/hooks/useEstaMontado";
import {
  Home,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  BarChart3,
  UserCog,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
  titulo: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    titulo: "Operación",
    items: [
      { href: "/dashboard", label: "Inicio", icon: <Home size={16} /> },
      { href: "/pos", label: "POS", icon: <ShoppingCart size={16} /> },
      { href: "/productos", label: "Productos", icon: <Package size={16} /> },
      { href: "/inventario", label: "Inventario", icon: <Boxes size={16} /> },
    ],
  },
  {
    titulo: "Negocio",
    items: [
      { href: "/clientes", label: "Clientes", icon: <Users size={16} /> },
      { href: "/proveedores", label: "Proveedores", icon: <Truck size={16} /> },
      { href: "/reportes", label: "Reportes", icon: <BarChart3 size={16} /> },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { href: "/usuarios", label: "Usuarios", icon: <UserCog size={16} /> },
    ],
  },
];

type Props = {
  sucursalNombre: string;
};

export function Sidebar({ sucursalNombre }: Props) {
  const pathname = usePathname();
  const montado = useEstaMontado();
  const [colapsado, setColapsado] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-colapsado") === "true";
  });

  function toggleColapsado() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    localStorage.setItem("sidebar-colapsado", String(nuevo));
  }

  return (
    <aside
      className={`bg-surface border-r border-border flex flex-col shrink-0
                  h-screen sticky top-0 transition-all duration-200 ${
                    colapsado ? "w-16" : "w-56"
                  }`}
    >
      <div
        className={`flex items-center gap-2.5 px-4 py-3.5 border-b border-border h-14.25 ${
          colapsado ? "justify-center" : ""
        }`}
      >
        <button
          onClick={colapsado ? toggleColapsado : undefined}
          aria-label={colapsado ? "Expandir menú" : undefined}
          className={`w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center shrink-0 ${
            colapsado ? "hover:bg-hover transition-colors cursor-pointer" : ""
          }`}
        >
          <Wrench size={14} className="text-accent" />
        </button>
        {!colapsado && (
          <>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary leading-tight truncate">
                Ferretería
              </p>
              <p className="text-xs text-text-tertiary leading-tight truncate">
                {sucursalNombre}
              </p>
            </div>
            {montado && (
              <button
                onClick={toggleColapsado}
                aria-label="Colapsar menú"
                className="ml-auto w-6 h-6 rounded-md text-text-tertiary hover:bg-hover
                     hover:text-text-primary transition-colors flex items-center
                     justify-center shrink-0"
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </>
        )}
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((grupo) => (
          <div key={grupo.titulo}>
            {!colapsado && (
              <p
                className="text-[10px] font-medium text-text-tertiary uppercase
                           tracking-wider px-2.5 pb-1"
              >
                {grupo.titulo}
              </p>
            )}
            <div className="space-y-0.5">
              {grupo.items.map((item) => {
                const activo = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={colapsado ? item.label : undefined}
                    className={`flex items-center gap-2.5 text-sm px-2.5 py-2 rounded-lg
                                transition-colors ${
                                  colapsado ? "justify-center" : ""
                                } ${
                                  activo
                                    ? "bg-accent-soft text-accent font-medium"
                                    : "text-text-secondary hover:bg-hover hover:text-text-primary"
                                }`}
                  >
                    {item.icon}
                    {!colapsado && item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {colapsado && montado && (
        <div className="p-2.5 border-t border-border">
          <button
            onClick={toggleColapsado}
            aria-label="Expandir menú"
            className="w-full h-9 rounded-lg text-text-tertiary hover:bg-hover
                       hover:text-text-primary transition-colors flex items-center
                       justify-center"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
