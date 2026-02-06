'use client'

import { useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toggleSavedListing } from '@/lib/actions/saved-listings'

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6c-1.7-1.7-4.5-1.7-6.2 0L12 7.2l-2.6-2.6c-1.7-1.7-4.5-1.7-6.2 0s-1.7 4.5 0 6.2L12 19.6l8.8-8.8c1.7-1.7 1.7-4.5 0-6.2z" />
    </svg>
  )
}

export function SaveButton(props: {
  listingId: string
  initialSaved?: boolean
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  const nextUrl = useMemo(() => {
    const qs = search?.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }, [pathname, search])

  const [saved, setSaved] = useState(!!props.initialSaved)
  const [isPending, startTransition] = useTransition()

  const onToggle = () => {
    startTransition(async () => {
      // optimistic
      setSaved((s) => !s)

      const res = await toggleSavedListing(props.listingId)

      if (res?.error) {
        // revert optimistic
        setSaved((s) => !s)

        if (res.error === 'Not authenticated') {
          router.push(`/login?next=${encodeURIComponent(nextUrl)}`)
          return
        }

        // non-fatal; stay put
        return
      }

      if (typeof res.saved === 'boolean') {
        setSaved(res.saved)
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      disabled={isPending}
      className={
        props.className ??
        `inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/90 hover:bg-white transition-colors w-10 h-10 ${
          saved ? 'text-[#ff6b4a]' : 'text-gray-600'
        }`
      }
      title={saved ? 'Saved' : 'Save'}
    >
      <HeartIcon filled={saved} />
    </button>
  )
}
