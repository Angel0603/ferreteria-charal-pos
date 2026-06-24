"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, RefreshCw } from "lucide-react";

type Props = {
  onDetectado: (codigo: string) => void;
  onClose: () => void;
};

export function EscanerCamara({ onDetectado, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const onDetectadoRef = useRef(onDetectado);
  const onCloseRef = useRef(onClose);
  const [camaras, setCamaras] = useState<MediaDeviceInfo[]>([]);
  const [camaraIdx, setCamaraIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const yaDetectado = useRef(false);

  useEffect(() => {
    onDetectadoRef.current = onDetectado;
  }, [onDetectado]);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      try {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const dispositivos =
          await BrowserMultiFormatReader.listVideoInputDevices();
        if (!activo) return;

        if (dispositivos.length === 0) {
          setError("No se encontró ninguna cámara");
          return;
        }

        const idx = dispositivos.findIndex(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("trasera") ||
            d.label.toLowerCase().includes("rear"),
        );

        setCamaras(dispositivos);
        setCamaraIdx(idx >= 0 ? idx : 0);
      } catch {
        if (activo) setError("No se pudo acceder a la cámara");
      }
    }

    iniciar();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!camaras.length || !videoRef.current) return;

    const reader = readerRef.current;
    if (!reader) return;

    const deviceId = camaras[camaraIdx]?.deviceId;
    yaDetectado.current = false;

    const timer = setTimeout(() => {
      if (!videoRef.current) return;

      reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result && !yaDetectado.current) {
            yaDetectado.current = true;
            onDetectadoRef.current(result.getText());
            onCloseRef.current();
          }
          if (err && !err.message?.includes("No MultiFormat")) {
            console.error(err);
          }
        },
      );
    }, 300);

    return () => {
      clearTimeout(timer);
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [camaras, camaraIdx]);

  const cambiarCamara = useCallback(() => {
    BrowserMultiFormatReader.releaseAllStreams();
    yaDetectado.current = false;
    setCamaraIdx((i) => (i + 1) % camaras.length);
  }, [camaras.length]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-text-secondary" />
            <h3 className="text-sm font-medium text-text-primary">
              Escanear código
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative bg-black aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" />

          {/* Guía de escaneo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white/60 rounded-xl relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-white text-sm text-center px-4">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 flex items-center justify-between">
          <p className="text-xs text-text-tertiary">Apunta al código de barras</p>
          {camaras.length > 1 && (
            <button
              onClick={cambiarCamara}
              className="flex items-center gap-1.5 text-xs text-text-secondary
                         hover:text-text-primary transition-colors"
            >
              <RefreshCw size={13} />
              Cambiar cámara
            </button>
          )}
        </div>
      </div>
    </div>
  );
}