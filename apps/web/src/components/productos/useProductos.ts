'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@repo/types'

export type Producto = Database['public']['Tables']['productos']['Row'] & {
  categorias: { nombre: string } | null
}

export type Categoria = Database['public']['Tables']['categorias']['Row']

type Filtros = {
  busqueda: string
  categoriaId: string
  soloActivos: boolean
}

const POR_PAGINA = 10

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [filtrosInternos, setFiltrosInternos] = useState<Filtros>({
    busqueda: '',
    categoriaId: '',
    soloActivos: true,
  })
  const [cargaInicial, setCargaInicial] = useState(true)

  const supabaseRef = useRef(createClient())

  const setFiltros = useCallback((actualizador: Filtros | ((prev: Filtros) => Filtros)) => {
    setFiltrosInternos(actualizador)
    setPagina(0)
  }, [])

  useEffect(() => {
    let activo = true
    const supabase = supabaseRef.current

    async function cargarCategorias() {
      const { data } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')
      if (activo && data) setCategorias(data)
    }

    cargarCategorias()
    return () => { activo = false }
  }, [])

  useEffect(() => {
    let activo = true
    const supabase = supabaseRef.current

    async function cargarProductos() {
      setLoading(true)

      const desde = pagina * POR_PAGINA
      const hasta = desde + POR_PAGINA - 1

      let query = supabase
        .from('productos')
        .select('*, categorias(nombre)', { count: 'exact' })
        .order('nombre')
        .range(desde, hasta)

      if (filtrosInternos.soloActivos) query = query.eq('activo', true)
      if (filtrosInternos.categoriaId) query = query.eq('categoria_id', filtrosInternos.categoriaId)
      if (filtrosInternos.busqueda) query = query.ilike('nombre', `%${filtrosInternos.busqueda}%`)

      const { data, count } = await query
      if (activo) {
        if (data) setProductos(data as Producto[])
        setTotalRegistros(count ?? 0)
        setLoading(false)
        setCargaInicial(false)
      }
    }

    cargarProductos()
    return () => { activo = false }
  }, [filtrosInternos, pagina])

  const agregarLocal = useCallback((producto: Producto) => {
    setProductos(prev =>
      [...prev, producto].sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
    setTotalRegistros(prev => prev + 1)
  }, [])

  const actualizarLocal = useCallback((producto: Producto) => {
    setProductos(prev =>
      prev.map(p => p.id === producto.id ? producto : p)
    )
  }, [])

  const agregarCategoriaLocal = useCallback((categoria: Categoria) => {
    setCategorias(prev =>
      [...prev, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
  }, [])

  const toggleActivo = useCallback(async (productoId: string, nuevoEstado: boolean) => {
    const supabase = supabaseRef.current
    const { data, error } = await supabase
      .from('productos')
      .update({ activo: nuevoEstado })
      .eq('id', productoId)
      .select('*, categorias(nombre)')
      .single()

    if (error) throw error

    setProductos(prev =>
      prev.map(p => p.id === productoId ? (data as unknown as Producto) : p)
    )

    return data
  }, [])

  return {
    productos,
    categorias,
    loading,
    cargaInicial,
    filtros: filtrosInternos,
    setFiltros,
    pagina,
    setPagina,
    totalRegistros,
    porPagina: POR_PAGINA,
    agregarLocal,
    actualizarLocal,
    agregarCategoriaLocal,
    toggleActivo,
  }
}