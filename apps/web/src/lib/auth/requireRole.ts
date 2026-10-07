import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireRole(rolesPermitidos: string[], rutaFallback = '/pos') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
    redirect(rutaFallback)
  }

  return perfil.rol
}