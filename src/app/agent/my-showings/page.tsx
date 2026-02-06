import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AgentHeader } from '@/app/agent/_components/AgentHeader'
import { getMyShowings } from '@/lib/actions/showings'
import { getProfile } from '@/lib/actions/auth'

export const runtime = 'nodejs'

function fmtDateTime(date?: string, time?: string) {
  if (!date) return ''
  return time ? `${date} ${String(time).slice(0, 5)}` : date
}

function isPast(date: string, time?: string) {
  const t = time ? String(time).slice(0, 5) : '00:00'
  const d = new Date(`${date}T${t}`)
  return d.getTime() < Date.now()
}

export default async function AgentMyShowingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }> | { tab?: string }
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const tab = resolvedSearchParams?.tab === 'past' ? 'past' : 'upcoming'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fffbf7] flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your showings.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { showings, error } = await getMyShowings()
  const profile = await getProfile()
  const list = Array.isArray(showings) ? showings : []

  const upcoming = list.filter((s: any) => s.status !== 'cancelled' && !isPast(s.requested_date, s.requested_time))
  const past = list.filter((s: any) => s.status === 'completed' || s.status === 'cancelled' || isPast(s.requested_date, s.requested_time))

  const items = tab === 'past' ? past : upcoming

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <AgentHeader active="/agent/my-showings" userName={profile?.full_name} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Showings</h1>
          <p className="text-gray-600">Your upcoming and past claimed showings.</p>
        </div>

        {error && (
          <div className="card mb-6 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2">
              <Link
                href="/agent/my-showings?tab=upcoming"
                className={
                  tab === 'upcoming'
                    ? 'px-4 py-2 rounded-full bg-[#fff0eb] text-[#ff6b4a] font-semibold'
                    : 'px-4 py-2 rounded-full text-gray-600 hover:bg-gray-50'
                }
              >
                Upcoming <span className="text-xs opacity-70">({upcoming.length})</span>
              </Link>
              <Link
                href="/agent/my-showings?tab=past"
                className={
                  tab === 'past'
                    ? 'px-4 py-2 rounded-full bg-[#fff0eb] text-[#ff6b4a] font-semibold'
                    : 'px-4 py-2 rounded-full text-gray-600 hover:bg-gray-50'
                }
              >
                Past <span className="text-xs opacity-70">({past.length})</span>
              </Link>
            </div>

            <Link href="/agent/showings" className="btn-primary text-sm px-5 py-2">
              Claim more showings
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">
              {tab === 'past' ? 'No past showings' : 'No upcoming showings'}
            </h3>
            <p className="text-gray-600">
              {tab === 'past'
                ? 'Your completed showings will appear here.'
                : 'Claim an available slot to get started.'}
            </p>
            {tab !== 'past' && (
              <div className="mt-6">
                <Link href="/agent/showings" className="btn-primary inline-block">
                  Browse available showings
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((showing: any) => {
              const listing = showing.listing
              const photo = Array.isArray(listing?.photos) ? listing.photos[0] : null
              const showLock = Boolean(showing.lock_code_revealed && listing?.lock_code)
              const statusBadge =
                showing.status === 'completed'
                  ? 'badge badge-green'
                  : showing.status === 'assigned'
                    ? 'badge badge-coral'
                    : 'badge bg-gray-100 text-gray-700'

              return (
                <div key={showing.id} className="card overflow-hidden p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-44 h-36 sm:h-auto bg-gray-100">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="Listing" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No photo
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-lg truncate">
                            {listing?.address ?? 'Listing'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {listing?.city}, {listing?.state}
                            <span className="text-gray-300"> · </span>
                            {fmtDateTime(showing.requested_date, showing.requested_time)}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={statusBadge}>{String(showing.status).toUpperCase()}</span>
                            {showing.payout_amount ? (
                              <span className="badge bg-[#e8f5e9] text-[#2e7d32]">
                                Payout ${Number(showing.payout_amount).toFixed(0)}
                              </span>
                            ) : null}
                            {showLock ? (
                              <span className="badge bg-[#e8f5e9] text-[#2e7d32]">Lock code ready</span>
                            ) : (
                              <span className="badge bg-gray-100 text-gray-700">Lock code hidden</span>
                            )}
                          </div>

                          {showLock ? (
                            <div className="mt-3 text-sm text-gray-700">
                              Lock Code: <span className="font-bold tracking-wider">{listing.lock_code}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex gap-3">
                          <Link
                            href={`/agent/showings/${showing.id}`}
                            className="btn-primary text-sm px-5 py-2"
                          >
                            Details
                          </Link>
                          <Link
                            href={`/listing/${listing?.id}`}
                            className="btn-secondary text-sm px-5 py-2"
                          >
                            Property
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
