"use client";

import { useState } from "react";
import { login } from "./actions";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#110F0E" }}
    >
      <div
        className="w-full flex rounded-2xl overflow-hidden"
        style={{
          maxWidth: "800px",
          border: "0.5px solid #322F2A",
          boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
          minHeight: "480px",
        }}
      >
        {/* Panel izquierdo */}
        <div
          className="flex flex-col justify-between"
          style={{
            width: "42%",
            background: "#1A1815",
            borderRight: "0.5px solid #322F2A",
            padding: "3rem 2.5rem",
          }}
        >
          <div>
            <div
              className="flex items-center justify-center rounded-2xl mb-7"
              style={{ width: "60px", height: "60px", background: "#332217" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D97D3D"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div className="flex gap-1">
              <p
                className="font-medium mb-3"
                style={{ fontSize: "22px", color: "#EDEAE3" }}
              >
                Ferretería
              </p>
              <p
                className="font-medium mb-3"
                style={{ fontSize: "22px", color: "#D97D3D" }}
              >
                POS
              </p>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#605C56",
                lineHeight: "1.7",
                margin: 0,
              }}
            >
              Sistema de gestión multi-sucursal para ferreterías
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: "Acceso seguro por rol" },
              { label: "Gestión multi-sucursal" },
              { label: "Solo personal autorizado" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#D97D3D" }}
                />
                <span style={{ fontSize: "13px", color: "#605C56" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div
          className="flex flex-col justify-center flex-1 gap-5"
          style={{ background: "#211F1B", padding: "3rem 3rem" }}
        >
          <div className="mb-1">
            <p
              className="font-medium mb-1.5"
              style={{ fontSize: "20px", color: "#EDEAE3" }}
            >
              Iniciar sesión
            </p>
            <p style={{ fontSize: "14px", color: "#605C56" }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="block mb-2"
                style={{ fontSize: "13px", fontWeight: 500, color: "#938F87" }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#605C56" }}
                />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="cajero@ferreteria.com"
                  className="w-full rounded-xl text-sm"
                  style={{
                    paddingTop: "12px",
                    paddingBottom: "12px",
                    paddingLeft: "44px",
                    paddingRight: "16px",
                    background: "#1A1815",
                    border: "0.5px solid #322F2A",
                    color: "#EDEAE3",
                    outline: "none",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D97D3D")}
                  onBlur={(e) => (e.target.style.borderColor = "#322F2A")}
                />
              </div>
            </div>

            <div>
              <label
                className="block mb-2"
                style={{ fontSize: "13px", fontWeight: 500, color: "#938F87" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#605C56" }}
                />
                <input
                  name="password"
                  type={mostrarPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl text-sm"
                  style={{
                    paddingTop: "12px",
                    paddingBottom: "12px",
                    paddingLeft: "44px",
                    paddingRight: "44px",
                    background: "#1A1815",
                    border: "0.5px solid #322F2A",
                    color: "#EDEAE3",
                    outline: "none",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D97D3D")}
                  onBlur={(e) => (e.target.style.borderColor = "#322F2A")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#605C56" }}
                >
                  {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "#321A1A",
                  border: "0.5px solid #F87171",
                  color: "#F87171",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl font-medium transition-opacity mt-1"
              style={{
                padding: "13px",
                background: "#D97D3D",
                color: "#fff",
                border: "none",
                fontSize: "15px",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <Link
            href="/forgot-password"
            className="text-center transition-colors hover:opacity-80"
            style={{ fontSize: "13px", color: "#605C56" }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
