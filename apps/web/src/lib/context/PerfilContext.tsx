"use client";

import { createContext, useContext, useState, useCallback } from "react";

type PerfilContextType = {
  nombre: string;
  rol: string;
  sucursalNombre: string;
  actualizarNombre: (nombre: string) => void;
};

const PerfilContext = createContext<PerfilContextType>({
  nombre: "",
  rol: "",
  sucursalNombre: "",
  actualizarNombre: () => {},
});

export function PerfilProvider({
  children,
  nombreInicial,
  rolInicial,
  sucursalNombreInicial,
}: {
  children: React.ReactNode;
  nombreInicial: string;
  rolInicial: string;
  sucursalNombreInicial: string;
}) {
  const [nombre, setNombre] = useState(nombreInicial);

  const actualizarNombre = useCallback((nuevoNombre: string) => {
    setNombre(nuevoNombre);
  }, []);

  return (
    <PerfilContext.Provider
      value={{
        nombre,
        rol: rolInicial,
        sucursalNombre: sucursalNombreInicial,
        actualizarNombre,
      }}
    >
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil() {
  return useContext(PerfilContext);
}
