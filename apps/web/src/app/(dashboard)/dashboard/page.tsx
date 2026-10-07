import { requireRole } from '@/lib/auth/requireRole'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  await requireRole(['admin'], '/pos')
  return <DashboardClient />
}