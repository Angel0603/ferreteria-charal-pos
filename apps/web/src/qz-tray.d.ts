/**
 * useQzTray.ts
 *
 * Hook para conectar con QZ Tray e imprimir en impresoras térmicas.
 * QZ Tray debe estar instalado y corriendo en la PC del cajero.
 * Descarga: https://qz.io/download/
 *
 * Instalación del SDK:
 *   pnpm --filter web add qz-tray
 */

import { useCallback, useEffect, useRef, useState } from "react";

// qz-tray no tiene tipos oficiales; lo importamos como módulo genérico
// Si usas TypeScript estricto, crea un archivo qz-tray.d.ts con: declare module "qz-tray";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import qz from "qz-tray";

type EstadoConexion = "desconectado" | "conectando" | "conectado" | "error";

export function useQzTray() {
  const [estado, setEstado] = useState<EstadoConexion>("desconectado");
  const [impresoras, setImpresoras] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const conectadoRef = useRef(false);

  // ─── Configuración de firma (modo sin firma para desarrollo local) ───────────
  // En producción deberías configurar un certificado real.
  // Ver: https://qz.io/wiki/2.1-signing-messages
  useEffect(() => {
    qz.security.setCertificatePromise((_resolve: (v: string) => void, reject: (v: Error) => void) => {
      // Sin certificado (solo funciona en localhost o con QZ Tray configurado para no requerir firma)
      reject(new Error("Sin certificado configurado — usa localhost o configura un cert"));
    });

    qz.security.setSignatureAlgorithm("SHA512");
   
  }, []);

  // ─── Conectar ─────────────────────────────────────────────────────────────────
  const conectar = useCallback(async () => {
    if (conectadoRef.current) return;

    setEstado("conectando");
    setErrorMsg(null);

    try {
      await qz.websocket.connect();
      conectadoRef.current = true;
      setEstado("conectado");

      // Cargar lista de impresoras disponibles
      const lista: string[] = await qz.printers.find();
      setImpresoras(lista);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEstado("error");
      setErrorMsg(
        msg.includes("Unable to establish connection")
          ? "QZ Tray no está corriendo. Ábrelo en la PC e intenta de nuevo."
          : msg,
      );
    }
  }, []);

  // ─── Desconectar ─────────────────────────────────────────────────────────────
  const desconectar = useCallback(async () => {
    if (!conectadoRef.current) return;
    try {
      await qz.websocket.disconnect();
    } finally {
      conectadoRef.current = false;
      setEstado("desconectado");
    }
  }, []);

  // Desconectar al desmontar
  useEffect(() => {
    return () => {
      if (conectadoRef.current) {
        qz.websocket.disconnect().catch(() => {});
      }
    };
  }, []);

  // ─── Imprimir HTML (térmica 58mm) ────────────────────────────────────────────
  /**
   * @param nombreImpresora  Nombre exacto de la impresora (usa `impresoras` para elegir)
   * @param htmlContent      HTML del ticket — solo estilos inline o <style> embebido
   * @param anchoPx          Ancho del papel en píxeles (58mm ≈ 220px, 80mm ≈ 302px)
   */
  const imprimirHTML = useCallback(
    async (nombreImpresora: string, htmlContent: string, anchoPx = 220) => {
      if (!conectadoRef.current) {
        throw new Error("QZ Tray no está conectado. Llama a conectar() primero.");
      }

      const config = qz.configs.create(nombreImpresora, {
        // Ajusta según tu impresora:
        colorType: "blackwhite",   // Impresión en blanco y negro
        copies: 1,
        density: 0,                // 0 = predeterminado de la impresora
        duplex: false,
        fallbackPrinter: false,
        interpolation: "bicubic",
        jobName: "Ticket POS",
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        orientation: "portrait",
        paperThickness: null,
        printerTray: null,
        rasterize: true,           // Convierte HTML → imagen para mejor compatibilidad
        rotation: 0,
        scaleContent: true,
        size: { width: `${anchoPx}px`, height: null }, // altura automática
        units: "px",
      });

      const data = [
        {
          type: "pixel",
          format: "html",
          flavor: "plain",
          data: htmlContent,
          options: {
            pageWidth: `${anchoPx}px`,   // ancho del viewport de renderizado
            pageHeight: null,             // sin límite de alto → imprime todo el contenido
          },
        },
      ];

      await qz.print(config, data);
    },
    [],
  );

  // ─── Imprimir ESC/POS (comandos raw) ─────────────────────────────────────────
  /**
   * Para impresoras que aceptan comandos ESC/POS directamente.
   * Más confiable que HTML para térmicas básicas.
   *
   * @param nombreImpresora  Nombre de la impresora
   * @param lineas           Array de strings; cada uno se imprime como línea
   */
  const imprimirEscPos = useCallback(
    async (nombreImpresora: string, lineas: string[]) => {
      if (!conectadoRef.current) {
        throw new Error("QZ Tray no está conectado.");
      }

      const ESC = "\x1B";
      const GS = "\x1D";

      // Comandos básicos ESC/POS
      const INIT         = `${ESC}@`;        // Inicializar
      const BOLD_ON      = `${ESC}E\x01`;
      const BOLD_OFF     = `${ESC}E\x00`;
      const CENTER       = `${ESC}a\x01`;
      const LEFT         = `${ESC}a\x00`;
      const CUT          = `${GS}V\x41\x03`; // Corte parcial
      const FEED_LINES   = (n: number) => `${ESC}d${String.fromCharCode(n)}`;

      const contenido = [
        INIT,
        ...lineas,
        FEED_LINES(4),
        CUT,
      ].join("\n");

      // Exponer helpers para que los llames desde fuera si construyes el ticket manualmente
      void BOLD_ON; void BOLD_OFF; void CENTER; void LEFT;

      const config = qz.configs.create(nombreImpresora);
      const data = [
        {
          type: "raw",
          format: "plain",
          flavor: "plain",
          data: contenido,
        },
      ];

      await qz.print(config, data);
    },
    [],
  );

  return {
    /** Estado actual: 'desconectado' | 'conectando' | 'conectado' | 'error' */
    estado,
    /** Lista de impresoras detectadas por QZ Tray */
    impresoras,
    /** Mensaje de error si estado === 'error' */
    errorMsg,
    /** Conectar con QZ Tray (llamar antes de imprimir) */
    conectar,
    /** Desconectar manualmente */
    desconectar,
    /** Imprimir HTML renderizado (recomendado para tickets con estilos) */
    imprimirHTML,
    /** Imprimir comandos ESC/POS raw (más rápido, sin estilos) */
    imprimirEscPos,
  };
}