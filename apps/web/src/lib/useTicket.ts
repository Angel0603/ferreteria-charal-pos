/**
 * useTicket.ts  (versión con QZ Tray)
 *
 * Reemplaza tu useTicket actual. Agrega `imprimirConQZ` junto a los
 * métodos existentes (imprimir por ventana, PDF, imagen, WhatsApp).
 *
 * Dependencias:
 *   npm install qz-tray html2canvas jspdf
 */

import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useQzTray } from "./useQzTray";

export function useTicket() {
  const ticketRef = useRef<HTMLDivElement>(null);
  const qz = useQzTray();

  // ─── Imprimir via ventana del navegador (método original) ──────────────────
  const imprimir = useCallback(async (termica: boolean) => {
    const el = ticketRef.current;
    if (!el) return;

    const ventana = window.open("", "_blank", "width=400,height=600");
    if (!ventana) throw new Error("Popup bloqueado por el navegador");

    const estilos = Array.from(document.styleSheets)
      .flatMap((s) => {
        try {
          return Array.from(s.cssRules).map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .join("\n");

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            ${estilos}
            body { margin: 0; background: white; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 0; ${termica ? "size: 58mm auto;" : "size: letter;"} }
            }
          </style>
        </head>
        <body>${el.outerHTML}</body>
      </html>
    `);
    ventana.document.close();
    await new Promise((r) => setTimeout(r, 600));
    ventana.print();
    ventana.close();
  }, []);

  // ─── Imprimir con QZ Tray (impresora térmica real) ─────────────────────────
  /**
   * @param nombreImpresora  El nombre exacto de la impresora (ej: "EPSON TM-T20III")
   *                         Usa `qz.impresoras` para mostrarle al usuario las disponibles.
   * @param anchoPx          220 para 58mm, 302 para 80mm
   */
  const imprimirConQZ = useCallback(
    async (nombreImpresora: string, anchoPx: 220 | 302 = 220) => {
      const el = ticketRef.current;
      if (!el) throw new Error("Ticket no renderizado");

      // Asegurar conexión
      if (qz.estado !== "conectado") {
        await qz.conectar();
      }

      // Capturar los estilos de la página para inyectarlos en el HTML
      const estilos = Array.from(document.styleSheets)
        .flatMap((s) => {
          try {
            return Array.from(s.cssRules).map((r) => r.cssText);
          } catch {
            return [];
          }
        })
        .join("\n");

      const htmlCompleto = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              ${estilos}
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body { margin: 0; padding: 0; background: white; font-family: monospace; }
            </style>
          </head>
          <body>${el.outerHTML}</body>
        </html>
      `;

      await qz.imprimirHTML(nombreImpresora, htmlCompleto, anchoPx);
    },
    [qz],
  );

  // ─── Descargar PDF ──────────────────────────────────────────────────────────
  const descargarPDF = useCallback(async (folio: string) => {
    const el = ticketRef.current;
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");

    const anchoPt = (el.offsetWidth * 72) / 96;
    const altoPt  = (el.offsetHeight * 72) / 96;
    const pdf = new jsPDF({ unit: "pt", format: [anchoPt, altoPt], orientation: "portrait" });

    pdf.addImage(imgData, "PNG", 0, 0, anchoPt, altoPt);
    pdf.save(`ticket-${folio}.pdf`);
  }, []);

  // ─── Descargar imagen ───────────────────────────────────────────────────────
  const descargarImagen = useCallback(async (folio: string) => {
    const el = ticketRef.current;
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `ticket-${folio}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  // ─── Compartir por WhatsApp ─────────────────────────────────────────────────
  const compartirWhatsApp = useCallback(
    async (folio: string, total: number, tipo: "imagen" | "pdf") => {
      const el = ticketRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      let blob: Blob;

      if (tipo === "pdf") {
        const anchoPt = (el.offsetWidth * 72) / 96;
        const altoPt  = (el.offsetHeight * 72) / 96;
        const pdf = new jsPDF({ unit: "pt", format: [anchoPt, altoPt], orientation: "portrait" });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, anchoPt, altoPt);
        blob = pdf.output("blob");
      } else {
        blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob falló"))), "image/png"),
        );
      }

      // Intenta Web Share API (móvil/Chrome); si no, abre WhatsApp Web
      if (navigator.canShare?.({ files: [new File([blob], "ticket.png", { type: blob.type })] })) {
        await navigator.share({
          files: [new File([blob], `ticket-${folio}.${tipo === "pdf" ? "pdf" : "png"}`, { type: blob.type })],
          title: `Ticket ${folio}`,
          text: `Total: $${total.toFixed(2)}`,
        });
      } else {
        const texto = encodeURIComponent(`Ticket ${folio} — Total: $${total.toFixed(2)}`);
        window.open(`https://wa.me/?text=${texto}`, "_blank");
      }
    },
    [],
  );

  return {
    ticketRef,
    imprimir,
    imprimirConQZ,
    descargarPDF,
    descargarImagen,
    compartirWhatsApp,
    /** Expone el estado de QZ Tray para mostrarlo en la UI */
    qz,
  };
}