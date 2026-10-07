import { requireRole } from '@/lib/auth/requireRole'
import { ReportesClient } from './ReportesClient'

export default async function ReportesPage() {
  await requireRole(['admin'], '/pos')
  return <ReportesClient />
}