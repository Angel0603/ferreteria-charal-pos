import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OfflineProvider } from "@/components/ui/OfflineProvider";
import { PerfilProvider } from "@/lib/context/PerfilContext";

type Sucursal = { nombre: string };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol, sucursal_id, sucursales(nombre)")
    .eq("id", user.id)
    .single();

  const sucursalNombre = perfil?.sucursales
    ? Array.isArray(perfil.sucursales)
      ? (perfil.sucursales[0] as Sucursal)?.nombre
      : (perfil.sucursales as unknown as Sucursal).nombre
    : null;

  return (
    <PerfilProvider
      nombreInicial={perfil?.nombre ?? ""}
      rolInicial={perfil?.rol ?? ""}
      sucursalNombreInicial={sucursalNombre ?? ""}
    >
      <OfflineProvider sucursalId={perfil?.sucursal_id ?? ""}>
        {children}
      </OfflineProvider>
    </PerfilProvider>
  );
}
