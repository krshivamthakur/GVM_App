export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getAllShortsAdmin } from '@/actions/short-actions'
import { AdminShortsManager } from '@/components/admin/AdminShortsManager'

export default async function AdminShortsPage() {
  const shorts = await getAllShortsAdmin()

  return <AdminShortsManager initialShorts={shorts} />
}
