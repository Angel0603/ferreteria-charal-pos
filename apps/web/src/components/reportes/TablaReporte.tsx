import { formatCurrency } from '@/lib/utils'

type Columna = {
  key:     string
  label:   string
  align?:  'left' | 'right' | 'center'
  format?: 'currency' | 'number' | 'text'
}

type Props = {
  titulo:   string
  columnas: Columna[]
  datos:    Record<string, unknown>[]
  vacio?:   string
}

export function TablaReporte({ titulo, columnas, datos, vacio }: Props) {
  function formatearValor(valor: unknown, format?: string) {
    if (valor === null || valor === undefined) return '—'
    if (format === 'currency') return formatCurrency(Number(valor))
    if (format === 'number')   return Number(valor).toLocaleString('es-MX')
    return String(valor)
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">{titulo}</h3>
      </div>
      {datos.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-text-tertiary">
          {vacio ?? 'Sin datos en este período'}
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {columnas.map(col => (
                <th
                  key={col.key}
                  className={`text-xs font-medium text-text-secondary px-4 py-2.5 ${
                    col.align === 'right'  ? 'text-right'  :
                    col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {datos.map((fila, i) => (
              <tr key={i} className="hover:bg-hover transition-colors">
                {columnas.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 text-sm ${
                      col.align === 'right'  ? 'text-right font-medium text-text-primary font-mono'  :
                      col.align === 'center' ? 'text-center text-text-secondary' : 'text-text-secondary'
                    }`}
                  >
                    {formatearValor(fila[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}