import { redirect } from 'next/navigation'

export default async function StudentShortsPage({
  searchParams
}: {
  searchParams: Promise<{ tag?: string; id?: string }>
}) {
  const { tag, id } = await searchParams
  const query = new URLSearchParams()
  if (tag) query.set('tag', tag)
  if (id) query.set('id', id)
  const qStr = query.toString()

  redirect(`/shorts${qStr ? `?${qStr}` : ''}`)
}
