'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type CrearUsuarioParams = {
  email:       string
  password:    string
  nombre:      string
  rol:         string
  sucursal_id: string
}

export async function crearUsuario(params: CrearUsuarioParams) {
  // Verificar que quien llama es admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') return { error: 'Sin permisos' }

  // Crear usuario con Admin API
  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email:             params.email,
    password:          params.password,
    email_confirm:     true, // no requiere confirmación de email
    user_metadata:     { nombre: params.nombre },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'No se pudo crear el usuario' }

  // Crear perfil
  const { error: perfilError } = await adminClient
    .from('perfiles')
    .insert({
      id:          authData.user.id,
      nombre:      params.nombre,
      rol:         params.rol,
      sucursal_id: params.sucursal_id,
    })

  if (perfilError) {
    // Si falla el perfil, eliminar el usuario de auth para no dejar inconsistencias
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: perfilError.message }
  }

  return { id: authData.user.id }
}