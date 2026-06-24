'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@repo/types'

type Cliente = Database['public']['Tables']['clientes']['Row']

const POR_PAGINA = 10

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState('')
  const [soloConCreditoInterno, setSoloConCreditoInterno] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const supabaseRef = useRef(createClient())
  const [cargaInicial, setCargaInicial] = useState(true)

  // Debounce: espera 300ms después de que el usuario deje de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaActiva(busquedaInput)
      setPagina(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaInput])

  const setBusqueda = useCallback((valor: string) => {
    setBusquedaInput(valor)
  }, [])

  const setSoloConCredito = useCallback((valor: boolean) => {
    setSoloConCreditoInterno(valor)
    setPagina(0)
  }, [])

  useEffect(() => {
    let activo = true

    async function cargar() {
      setLoading(true)
      const supabase = supabaseRef.current

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('sucursal_id')
        .eq('id', user.id)
        .single()

      if (!perfil?.sucursal_id) return

      const desde = pagina * POR_PAGINA
      const hasta = desde + POR_PAGINA - 1

      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('sucursal_id', perfil.sucursal_id)
        .order('nombre')
        .range(desde, hasta)

      if (busquedaActiva) {
        query = query.or(
          `nombre.ilike.%${busquedaActiva}%,telefono.ilike.%${busquedaActiva}%`
        )
      }

      if (soloConCreditoInterno) query = query.gt('saldo_credito', 0)

      const { data, count } = await query
      if (activo) {
        if (data) setClientes(data)
        setTotalRegistros(count ?? 0)
        setLoading(false)
        setCargaInicial(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [busquedaActiva, soloConCreditoInterno, pagina])

  const agregarLocal = useCallback((cliente: Cliente) => {
    setClientes(prev =>
      [...prev, cliente].sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
    setTotalRegistros(prev => prev + 1)
  }, [])

  const actualizarLocal = useCallback((cliente: Cliente) => {
    setClientes(prev =>
      prev.map(c => c.id === cliente.id ? cliente : c)
    )
  }, [])

  const toggleActivo = useCallback(async (clienteId: string, nuevoEstado: boolean) => {
    const supabase = supabaseRef.current
    const { data, error } = await supabase
      .from('clientes')
      .update({ activo: nuevoEstado })
      .eq('id', clienteId)
      .select()
      .single()

    if (error) throw error

    setClientes(prev =>
      prev.map(c => c.id === clienteId ? data : c)
    )

    return data
  }, [])

  const recargar = useCallback(() => {
    setBusquedaActiva(b => b)
  }, [])

  return {
    clientes,
    loading,
    busqueda: busquedaInput,
    setBusqueda,
    soloConCredito: soloConCreditoInterno,
    setSoloConCredito,
    pagina,
    setPagina,
    totalRegistros,
    porPagina: POR_PAGINA,
    agregarLocal,
    actualizarLocal,
    toggleActivo,
    recargar,
    cargaInicial
  }
}