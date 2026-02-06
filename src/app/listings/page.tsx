import { redirect } from 'next/navigation'

export default async function ListingsRedirect(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const sp = await props.searchParams
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(sp ?? {})) {
    if (typeof value === 'string') params.set(key, value)
    else if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
  }

  const qs = params.toString()
  redirect(`/browse${qs ? `?${qs}` : ''}`)
}
