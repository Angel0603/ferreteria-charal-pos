"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning("Ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (error) throw error;
      setEnviado(true);
    } catch (err) {
      toast.error("Error al enviar el correo", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-8 text-center">
          <div
            className="w-12 h-12 rounded-full bg-success-soft flex items-center
                          justify-center mx-auto mb-4"
          >
            <span className="text-success text-xl">✓</span>
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Correo enviado
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Revisa tu bandeja de entrada en{" "}
            <span className="font-medium text-text-primary">{email}</span> y haz
            clic en el enlace para restablecer tu contraseña.
          </p>
          <p className="text-xs text-text-tertiary mb-4">
            Si no lo ves, revisa tu carpeta de spam.
          </p>
          <Link href="/login" className="text-sm text-accent hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text-primary mb-1">
              Olvidé mi contraseña
            </h1>
            <p className="text-sm text-text-secondary">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                placeholder="juanperez@ferreteria.com"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent bg-surface
                           text-text-primary placeholder:text-text-tertiary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent text-white rounded-xl text-sm
                         font-medium hover:bg-accent-hover transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
            <div className="flex items-center justify-center mt-2">
              <Link
                href="/login"
                className="w-full items-center text-center gap-2 px-4 py-2.5 rounded-xl text-sm
             font-medium transition-colors"
                style={{
                  background: "#1A1815",
                  border: "0.5px solid #322F2A",
                  color: "#938F87",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#2A2722";
                  (e.currentTarget as HTMLElement).style.color = "#EDEAE3";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#1A1815";
                  (e.currentTarget as HTMLElement).style.color = "#938F87";
                }}
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
