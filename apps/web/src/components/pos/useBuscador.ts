'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@repo/types'

type Producto = Database['public']['Tables']['productos']['Row']

export function useBuscador(sucursalId: string) {
  const [query,       setQuery]       = useState('')
  const [resultados,  setResultados]  = useState<Producto[]>([])
  const [loading,     setLoading]     = useState(false)
  const [categoriaId, setCategoriaId] = useState('')
  const supabaseRef   = useRef(createClient())

  useEffect(() => {
    if (!sucursalId) return
    let activo = true

    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = supabaseRef.current

      try {
        // Sin búsqueda NI categoría: mostrar los 10 más vendidos de la semana
        if (!query && !categoriaId) {
          const { data } = await supabase
            .rpc('get_productos_top_semana', { p_sucursal_id: sucursalId })
          if (activo && data) setResultados(data as unknown as Producto[])
          return
        }

        // Con búsqueda O categoría: buscar en catálogo completo
        let q = supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .order('nombre')
          .limit(40)

        if (query)       q = q.or(`nombre.ilike.%${query}%,codigo_barras.eq.${query}`)
        if (categoriaId) q = q.eq('categoria_id', categoriaId)

        const { data } = await q
        if (activo && data) setResultados(data as Producto[])
      } finally {
        if (activo) setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      activo = false
    }
  }, [query, categoriaId, sucursalId])

  return { query, setQuery, resultados, loading, categoriaId, setCategoriaId }
}