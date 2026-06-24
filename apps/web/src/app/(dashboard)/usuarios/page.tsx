"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Users,
  ShieldCheck,
  ShoppingCart,
  Package,
  Check,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UsuarioModal } from "@/components/usuarios/UsuarioModal";
import { UsuariosSkeleton } from "@/components/ui/skeletons/UsuariosSkeleton";
import { toast } from "sonner";
import type { Database } from "@repo/types";
import { usePerfil } from "@/lib/context/PerfilContext";

type Perfil = Database["public"]["Tables"]["perfiles"]["Row"] & {
  sucursales: { nombre: string } | null;
};

const ROL_CONFIG = {
  admin: {
    label: "Admin",
    color: "bg-accent-soft text-accent-soft-text",
    icon: <ShieldCheck size={12} />,
  },
  cajero: {
    label: "Cajero",
    color: "bg-info-soft text-info",
    icon: <ShoppingCart size={12} />,
  },
  almacen: {
    label: "Almacén",
    color: "bg-warning-soft text-warning",
    icon: <Package size={12} />,
  },
};

export default function UsuariosPage() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [perfilEditar, setPerfilEditar] = useState<Perfil | null>(null);
  const [miId, setMiId] = useState("");
  const supabaseRef = useRef(createClient());
  const { actualizarNombre } = usePerfil();

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setLoading(true);
      const supabase = supabaseRef.current;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && activo) setMiId(user.id);

      const { data } = await supabase
        .from("perfiles")
        .select("*, sucursales(nombre)")
        .order("nombre");

      if (activo && data) setPerfiles(data as unknown as Perfil[]);
      if (activo) setLoading(false);
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const agregarLocal = useCallback((perfil: Perfil) => {
    setPerfiles((prev) =>
      [...prev, perfil].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
  }, []);

  const actualizarLocal = useCallback((perfil: Perfil) => {
    setPerfiles((prev) => prev.map((p) => (p.id === perfil.id ? perfil : p)));
  }, []);

  async function handleToggleActivo(perfil: Perfil) {
    if (perfil.id === miId) {
      toast.warning("No puedes desactivar tu propio usuario");
      return;
    }
    try {
      const nuevoEstado = !perfil.activo;
      const { data, error } = await supabaseRef.current
        .from("perfiles")
        .update({ activo: nuevoEstado })
        .eq("id", perfil.id)
        .select("*, sucursales(nombre)")
        .single();
      if (error) throw error;
      setPerfiles((prev) =>
        prev.map((p) => (p.id === perfil.id ? (data as unknown as Perfil) : p)),
      );
      toast.success(
        perfil.activo
          ? "Usuario desactivado correctamente"
          : "Usuario activado correctamente",
      );
    } catch {
      toast.error("Error al cambiar el estado del usuario");
    }
  }

  if (loading) return <UsuariosSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Usuarios</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {perfiles.length} usuarios registrados
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-accent text-white text-sm
                     font-medium px-4 py-2.5 rounded-lg hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {perfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <Users size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No hay usuarios registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Usuario
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Sucursal
                </th>
                <th className="text-left text-xs font-medium text-text-secondary px-4 py-3">
                  Rol
                </th>
                <th className="text-center text-xs font-medium text-text-secondary px-4 py-3">
                  Estado
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perfiles.map((perfil) => {
                const rol = ROL_CONFIG[perfil.rol as keyof typeof ROL_CONFIG];
                const esMiUsuario = perfil.id === miId;
                const sucNombre = perfil.sucursales
                  ? Array.isArray(perfil.sucursales)
                    ? (perfil.sucursales[0] as { nombre: string })?.nombre
                    : (perfil.sucursales as { nombre: string }).nombre
                  : "—";

                return (
                  <tr
                    key={perfil.id}
                    className="hover:bg-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-surface-2 flex items-center
                                        justify-center shrink-0"
                        >
                          <span className="text-xs font-medium text-text-secondary">
                            {perfil.nombre.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {perfil.nombre}
                            {esMiUsuario && (
                              <span className="ml-2 text-xs text-text-tertiary">
                                (tú)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {sucNombre}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium
                                        px-2.5 py-1 rounded-full ${rol?.color}`}
                      >
                        {rol?.icon}
                        {rol?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="grid place-content-center">
                        <button
                          onClick={() => handleToggleActivo(perfil)}
                          disabled={esMiUsuario}
                          role="switch"
                          aria-checked={perfil.activo}
                          title={
                            esMiUsuario
                              ? "No puedes desactivar tu propio usuario"
                              : perfil.activo
                                ? "Clic para desactivar"
                                : "Clic para activar"
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full
                                      transition-colors shrink-0 disabled:opacity-40
                                      disabled:cursor-not-allowed ${
                                        perfil.activo
                                          ? "bg-success"
                                          : "bg-danger"
                                      }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center h-4.5 w-4.5
                                        transform rounded-full bg-white shadow-sm
                                        transition-transform ${
                                          perfil.activo
                                            ? "translate-x-5.5"
                                            : "translate-x-0.75"
                                        }`}
                          >
                            {perfil.activo ? (
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
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setPerfilEditar(perfil)}
                          className="text-text-tertiary hover:text-text-primary transition-colors p-1"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales */}
      {(modalNuevo || perfilEditar) && (
        <UsuarioModal
          perfil={perfilEditar}
          onClose={() => {
            setModalNuevo(false);
            setPerfilEditar(null);
          }}
          onGuardado={(perfil) => {
            if (perfilEditar) {
              actualizarLocal(perfil as unknown as Perfil);
              if (perfil.id === miId) {
                actualizarNombre(perfil.nombre);
              }
            } else {
              agregarLocal(perfil as unknown as Perfil);
            }
            setModalNuevo(false);
            setPerfilEditar(null);
          }}
        />
      )}
    </div>
  );
}
