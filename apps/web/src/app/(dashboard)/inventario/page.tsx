import { requireRole } from '@/lib/auth/requireRole'
import { InventarioClient } from './InventarioClient'

export default async function InventarioPage() {
  await requireRole(['admin', 'almacen'], '/pos')
  return <InventarioClient />
}