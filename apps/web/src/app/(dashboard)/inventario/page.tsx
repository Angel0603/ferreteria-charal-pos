'use client'

import { useState } from 'react'
import { Package, ArrowDownToLine, ArrowLeftRight, ClipboardList, History } from 'lucide-react'
import { EntradaMercancia } from '@/components/inventario/EntradaMercancia'
import { AjusteInventario } from '@/components/inventario/AjusteInventario'
import { TraspasoSucursal } from '@/components/inventario/TraspasoSucursal'
import { StockActual } from '@/components/inventario/StockActual'
import { Historial } from '@/components/inventario/Historial'

type Tab = 'stock' | 'entrada' | 'traspaso' | 'ajuste' | 'historial'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'stock',     label: 'Stock actual',      icon: <Package size={15} /> },
  { key: 'entrada',   label: 'Entrada mercancía',  icon: <ArrowDownToLine size={15} /> },
  { key: 'traspaso',  label: 'Traspaso',           icon: <ArrowLeftRight size={15} /> },
  { key: 'ajuste',    label: 'Ajuste',             icon: <ClipboardList size={15} /> },
  { key: 'historial', label: 'Historial',          icon: <History size={15} /> },
]

export default function InventarioPage() {
  const [tab, setTab] = useState<Tab>('stock')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Inventario</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Control de stock, entradas, traspasos y ajustes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                        font-medium transition-colors ${
              tab === t.key
                ? 'bg-surface text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {tab === 'stock'     && <StockActual />}
        {tab === 'entrada'   && <EntradaMercancia onExito={() => setTab('stock')} />}
        {tab === 'traspaso'  && <TraspasoSucursal onExito={() => setTab('stock')} />}
        {tab === 'ajuste'    && <AjusteInventario onExito={() => setTab('stock')} />}
        {tab === 'historial' && <Historial />}
      </div>
    </div>
  )
}