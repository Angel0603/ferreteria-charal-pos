import { requireRole } from '@/lib/auth/requireRole'
import { UsuariosClient } from './UsuariosClient'

export default async function UsuariosPage() {
  await requireRole(['admin'], '/pos')
  return <UsuariosClient />
}