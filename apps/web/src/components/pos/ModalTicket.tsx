"use client";

import { useState } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  FileText,
  Image as ImageIcon,
  Zap,
  ChevronDown,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Ticket } from "./Ticket";
import { useTicket } from "@/lib/useTicket";
import type { ItemCarrito, MetodoPago } from "./useCarrito";
import { toast } from "sonner";

type Props = {
  folio: string;
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  clienteNombre: string | null;
  cajeroNombre: string;
  sucursalNombre: string;
  sucursalTel: string;
  efectivoRecibido: number;
  cambio: number;
  fechaHora: string;
  onClose: () => void;
};

export function ModalTicket({
  folio,
  items,
  subtotal,
  descuento,
  total,
  metodoPago,
  clienteNombre,
  cajeroNombre,
  sucursalNombre,
  sucursalTel,
  efectivoRecibido,
  cambio,
  fechaHora,
  onClose,
}: Props) {
  const [termica, setTermica] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [impresoraSeleccionada, setImpresoraSeleccionada] = useState<string>("");

  const {
    ticketRef,
    imprimir,
    imprimirConQZ,
    descargarPDF,
    descargarImagen,
    compartirWhatsApp,
    qz,
  } = useTicket();

  async function handleAccion(accion: () => Promise<void>, id: string) {
    setLoading(id);
    try {
      await accion();
      const mensajes: Record<string, string> = {
        imprimir:   "Imprimiendo ticket...",
        qz:         "Ticket enviado a la impresora",
        pdf:        "PDF descargado",
        imagen:     "Imagen descargada",
        "wa-img":   "Abriendo WhatsApp...",
        "wa-pdf":   "Abriendo WhatsApp...",
      };
      toast.success(mensajes[id] ?? "Listo");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  const ticketProps = {
    folio, items, subtotal, descuento, total, metodoPago,
    clienteNombre, cajeroNombre, sucursalNombre, sucursalTel,
    efectivoRecibido, cambio, fechaHora,
  };

  // ─── Indicador de estado QZ Tray ──────────────────────────────────────────
  const estadoQZ = {
    desconectado: { color: "text-text-tertiary",  icon: WifiOff,   label: "QZ Tray desconectado" },
    conectando:   { color: "text-yellow-500",     icon: Loader2,   label: "Conectando..." },
    conectado:    { color: "text-success",        icon: Wifi,      label: "QZ Tray listo" },
    error:        { color: "text-red-500",        icon: WifiOff,   label: "Error de conexión" },
  }[qz.estado];

  const IconoEstado = estadoQZ.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-medium text-text-primary">Venta completada</h2>
            <p className="text-xs text-text-tertiary mt-0.5 font-mono">Folio: {folio}</p>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Toggle térmica/carta */}
          <div className="flex bg-surface-2 rounded-lg p-0.5 w-fit">
            <button
              onClick={() => setTermica(true)}
              className={`px-6 py-1.5 rounded-md text-xs font-medium transition-colors ${
                termica ? "bg-surface text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Térmica 58mm
            </button>
            <button
              onClick={() => setTermica(false)}
              className={`px-6 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !termica ? "bg-surface text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Hoja carta
            </button>
          </div>

          <div className="flex gap-6 items-start">
            {/* Preview del ticket */}
            <div className="flex-1 bg-surface-2 rounded-xl border border-border overflow-hidden">
              {termica ? (
                <div className="p-4 flex justify-center">
                  <Ticket ref={ticketRef} {...ticketProps} termica={true} />
                </div>
              ) : (
                <div className="p-6 flex justify-center overflow-x-auto">
                  <div
                    style={{
                      transform: "scale(0.6)",
                      transformOrigin: "top center",
                      width: "680px",
                      marginBottom: "calc((680px * 0.6 - 680px) * 0.6)",
                    }}
                  >
                    <Ticket ref={ticketRef} {...ticketProps} termica={false} />
                  </div>
                </div>
              )}
            </div>

            {/* Panel de acciones */}
            <div className="w-48 flex flex-col gap-2 shrink-0">

              {/* ── Sección QZ Tray ── */}
              <div className="rounded-lg border border-border p-3 space-y-2 bg-surface-2">
                {/* Estado */}
                <div className={`flex items-center gap-1.5 text-xs ${estadoQZ.color}`}>
                  <IconoEstado
                    size={12}
                    className={qz.estado === "conectando" ? "animate-spin" : ""}
                  />
                  <span>{estadoQZ.label}</span>
                </div>

                {/* Botón conectar / error */}
                {qz.estado !== "conectado" && (
                  <button
                    onClick={() => qz.conectar()}
                    disabled={qz.estado === "conectando"}
                    className="w-full text-xs py-1.5 rounded-md border border-border
                               text-text-secondary hover:bg-hover transition-colors disabled:opacity-50"
                  >
                    {qz.estado === "conectando" ? "Conectando..." : "Conectar QZ Tray"}
                  </button>
                )}

                {/* Mensaje de error */}
                {qz.estado === "error" && qz.errorMsg && (
                  <p className="text-xs text-red-500 leading-tight">{qz.errorMsg}</p>
                )}

                {/* Selector de impresora */}
                {qz.estado === "conectado" && (
                  <div className="relative">
                    <select
                      value={impresoraSeleccionada}
                      onChange={(e) => setImpresoraSeleccionada(e.target.value)}
                      className="w-full text-xs py-1.5 pl-2 pr-7 rounded-md border border-border
                                 bg-surface text-text-primary appearance-none truncate"
                    >
                      <option value="">— Impresora —</option>
                      {qz.impresoras.map((imp) => (
                        <option key={imp} value={imp}>{imp}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                    />
                  </div>
                )}

                {/* Botón imprimir QZ */}
                {qz.estado === "conectado" && (
                  <button
                    onClick={() =>
                      handleAccion(
                        () => imprimirConQZ(impresoraSeleccionada, 220),
                        "qz",
                      )
                    }
                    disabled={!!loading || !impresoraSeleccionada}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-md
                               bg-accent text-white text-xs font-medium
                               hover:bg-accent-hover transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap size={13} />
                    {loading === "qz" ? "Enviando..." : "Imprimir térmica"}
                  </button>
                )}
              </div>

              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mt-1">
                Otras opciones
              </p>

              {/* Imprimir por ventana (fallback) */}
              <button
                onClick={() => handleAccion(() => imprimir(termica), "imprimir")}
                disabled={!!loading}
                className="flex items-center gap-2.5 px-3 py-2.5 border border-border
                   rounded-lg text-sm text-text-secondary hover:bg-hover transition-colors
                   disabled:opacity-50 w-full text-left"
              >
                <Printer size={15} className="text-text-tertiary shrink-0" />
                {loading === "imprimir" ? "Imprimiendo..." : "Imprimir (ventana)"}
              </button>

              <button
                onClick={() => handleAccion(() => descargarPDF(folio), "pdf")}
                disabled={!!loading}
                className="flex items-center gap-2.5 px-3 py-2.5 border border-border
                   rounded-lg text-sm text-text-secondary hover:bg-hover transition-colors
                   disabled:opacity-50 w-full text-left"
              >
                <FileText size={15} className="text-text-tertiary shrink-0" />
                {loading === "pdf" ? "Generando..." : "Descargar PDF"}
              </button>

              <button
                onClick={() => handleAccion(() => descargarImagen(folio), "imagen")}
                disabled={!!loading}
                className="flex items-center gap-2.5 px-3 py-2.5 border border-border
                   rounded-lg text-sm text-text-secondary hover:bg-hover transition-colors
                   disabled:opacity-50 w-full text-left"
              >
                <ImageIcon size={15} className="text-text-tertiary shrink-0" />
                {loading === "imagen" ? "Descargando..." : "Descargar imagen"}
              </button>

              <div className="border-t border-border my-1" />

              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                WhatsApp
              </p>

              <button
                onClick={() => handleAccion(() => compartirWhatsApp(folio, total, "imagen"), "wa-img")}
                disabled={!!loading}
                className="flex items-center gap-2.5 px-3 py-2.5 border border-success/30
                   bg-success-soft rounded-lg text-sm text-success
                   hover:bg-success-soft/70 transition-colors
                   disabled:opacity-50 w-full text-left"
              >
                <Share2 size={15} className="shrink-0" />
                {loading === "wa-img" ? "Abriendo..." : "Enviar imagen"}
              </button>

              <button
                onClick={() => handleAccion(() => compartirWhatsApp(folio, total, "pdf"), "wa-pdf")}
                disabled={!!loading}
                className="flex items-center gap-2.5 px-3 py-2.5 border border-success/30
                   bg-success-soft rounded-lg text-sm text-success
                   hover:bg-success-soft/70 transition-colors
                   disabled:opacity-50 w-full text-left"
              >
                <Download size={15} className="shrink-0" />
                {loading === "wa-pdf" ? "Abriendo..." : "Enviar PDF"}
              </button>

              <div className="border-t border-border my-1" />

              <button
                onClick={onClose}
                className="flex items-center justify-center px-3 py-2.5 bg-accent
                   text-white rounded-lg text-sm font-medium
                   hover:bg-accent-hover transition-colors w-full"
              >
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
