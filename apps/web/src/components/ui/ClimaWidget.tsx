"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Wind,
  Thermometer,
} from "lucide-react";

type ClimaData = {
  temperatura: number;
  sensacion: number;
  humedad: number;
  descripcion: string;
  codigo: number;
};

function getIconoClima(codigo: number) {
  if (codigo === 0) return <Sun size={28} className="text-warning" />;
  if (codigo <= 3) return <Cloud size={28} className="text-text-tertiary" />;
  if (codigo <= 67) return <CloudRain size={28} className="text-info" />;
  if (codigo <= 77) return <CloudSnow size={28} className="text-info" />;
  if (codigo <= 82) return <CloudRain size={28} className="text-info" />;
  return <Wind size={28} className="text-text-tertiary" />;
}

function getDescripcion(codigo: number): string {
  if (codigo === 0) return "Despejado";
  if (codigo === 1) return "Mayormente despejado";
  if (codigo === 2) return "Parcialmente nublado";
  if (codigo === 3) return "Nublado";
  if (codigo <= 49) return "Niebla";
  if (codigo <= 57) return "Llovizna";
  if (codigo <= 67) return "Lluvia";
  if (codigo <= 77) return "Nieve";
  if (codigo <= 82) return "Lluvia intensa";
  if (codigo <= 99) return "Tormenta";
  return "Sin datos";
}

export function ClimaWidget() {
  const [clima, setClima] = useState<ClimaData | null>(null);
  const [ciudad, setCiudad] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function obtenerClima(lat: number, lon: number) {
      try {
        const [climaRes, geoRes] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code` +
              `&timezone=auto`,
          ),
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
          ),
        ]);

        const climaJson = await climaRes.json();
        const geoJson = await geoRes.json();
        const c = climaJson.current;

        setClima({
          temperatura: Math.round(c.temperature_2m),
          sensacion: Math.round(c.apparent_temperature),
          humedad: c.relative_humidity_2m,
          descripcion: getDescripcion(c.weather_code),
          codigo: c.weather_code,
        });

        const addr = geoJson.address;
        setCiudad(
          addr.city ??
            addr.town ??
            addr.village ??
            addr.municipality ??
            addr.county ??
            "",
        );
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (!navigator.geolocation) {
      // Diferimos para no llamar setState síncronamente en el efecto
      const timer = setTimeout(() => {
        setError(true);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        obtenerClima(lat, lon);
      },
      () => {
        setError(true);
        setLoading(false);
      },
      { timeout: 8000 },
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-7 h-7 rounded-lg bg-surface-2" />
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-surface-2" />
          <div className="h-2.5 w-24 rounded bg-surface-2" />
        </div>
      </div>
    );
  }

  if (error || !clima) {
    return (
      <div className="flex items-center gap-2 text-text-tertiary">
        <Thermometer size={16} />
        <span className="text-xs">Clima no disponible</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {getIconoClima(clima.codigo)}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-text-primary leading-none">
            {clima.temperatura}°C
          </span>
          <span className="text-xs text-text-tertiary">
            Sensación {clima.sensacion}°C
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          {clima.descripcion}
          {ciudad && <span className="text-text-tertiary"> · {ciudad}</span>}
        </p>
      </div>
    </div>
  );
}
