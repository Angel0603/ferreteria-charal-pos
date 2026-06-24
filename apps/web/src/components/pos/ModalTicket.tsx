"use client";

import { useState } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Ticket } from "./Ticket";
import { useTicket } from "./useTicket";
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

  const {
    ticketRef,
    imprimir,
    descargarPDF,
    descargarImagen,
    compartirWhatsApp,
  } = useTicket();

  async function handleAccion(accion: () => Promise<void>, id: string) {
    setLoading(id);
    try {
      await accion();
      toast.success(
        id === "imprimir"
          ? "Imprimiendo ticket..."
          : id === "pdf"
            ? "PDF descargado"
            : id === "imagen"
              ? "Imagen descargada"
              : "Abriendo WhatsApp...",
      );
    } catch {
      toast.error("Error al procesar el ticket");
    } finally {
      setLoading(null);
    }
  }

  const ticketProps = {
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
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-medium text-text-primary">Venta completada</h2>
            <p className="text-xs text-text-tertiary mt-0.5 font-mono">
              Folio: {folio}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Toggle térmica/carta */}
          <div className="flex bg-surface-2 rounded-lg p-0.5 w-fit">
            <button
              onClick={() => setTermica(true)}
              className={`px-6 py-1.5 rounded-md text-xs font-medium transition-colors ${
                termica
                  ? "bg-surface text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Térmica 80mm
            </button>
            <button
              onClick={() => setTermica(false)}
              className={`px-6 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !termica
                  ? "bg-surface text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Hoja carta
            </button>
          </div>

          {/* Preview + Acciones */}
          <div className="flex gap-6 items-start">
            {/* Preview */}
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

            {/* Acciones */}
            <div className="w-44 flex flex-col gap-2 shrink-0">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                Acciones
              </p>

              <button
                onClick={() =>
                  handleAccion(() => imprimir(termica), "imprimir")
                }
                disabled={!!loading}
                className="flex items-center gap-2.5 px-3 py-2.5 border border-border
                   rounded-lg text-sm text-text-secondary hover:bg-hover transition-colors
                   disabled:opacity-50 w-full text-left"
              >
                <Printer size={15} className="text-text-tertiary shrink-0" />
                {loading === "imprimir" ? "Imprimiendo..." : "Imprimir"}
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
                onClick={() =>
                  handleAccion(() => descargarImagen(folio), "imagen")
                }
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
                onClick={() =>
                  handleAccion(
                    () => compartirWhatsApp(folio, total, "imagen"),
                    "wa-img",
                  )
                }
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
                onClick={() =>
                  handleAccion(
                    () => compartirWhatsApp(folio, total, "pdf"),
                    "wa-pdf",
                  )
                }
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
