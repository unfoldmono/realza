import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AgentHeader } from '@/app/agent/_components/AgentHeader'
import { getAgentShowings, getAvailableShowingsInMyArea } from '@/lib/actions/showings'

export const runtime = 'nodejs'

function fmtDateTime(date?: string, time?: string) {
  if (!date) return ''
  return time ? `${date} ${time}` : date
}

export default async function AgentDashboard() {
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
            <p className="text-gray-600 mb-6">Please sign in to view your dashboard.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { pendingBids, approvedShowings, error } = await getAgentShowings()
  const { groups: availableGroups } = await getAvailableShowingsInMyArea()

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <AgentHeader active="/agent" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Dashboard</h1>
          <p className="text-gray-600">Pending requests and approved showings.</p>
        </div>

        {error && (
          <div className="card mb-6 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Available showings near you</h2>
              <p className="text-gray-500 text-sm">Claim an open slot in your service area.</p>
            </div>
            <Link href="/agent/showings" className="btn-primary text-sm px-5 py-2">
              View all
            </Link>
          </div>

          {(availableGroups ?? []).length === 0 ? (
            <div className="text-gray-600 mt-4">
              No open showings right now. Check back soon.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 mt-5">
              {(availableGroups ?? []).slice(0, 3).map((group: any) => {
                const listing = group.listing
                const slots = Array.isArray(group.slots) ? group.slots : []
                const next = slots[0]
                const photo = Array.isArray(listing?.photos) ? listing.photos[0] : null

                return (
                  <Link
                    key={listing.id}
                    href={next ? `/agent/showings/${next.id}` : '/agent/showings'}
                    className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-200 overflow-hidden flex-shrink-0">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo} alt="Listing" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{listing?.address}</div>
                        <div className="text-xs text-gray-600">
                          {listing?.city}, {listing?.state} · {fmtDateTime(next?.requested_date, next?.requested_time)}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Pending requests</h2>
                <p className="text-gray-500 text-sm">Waiting for seller approval</p>
              </div>
              <span className="badge badge-coral">{(pendingBids ?? []).length}</span>
            </div>

            {(pendingBids ?? []).length === 0 ? (
              <div className="text-gray-600">
                No pending requests.{' '}
                <Link href="/agent/listings" className="text-[#ff6b4a] font-medium">
                  Request a showing
                </Link>
                .
              </div>
            ) : (
              <div className="space-y-3">
                {(pendingBids ?? []).map((bid: any) => {
                  const showing = bid.showing
                  const listing = showing?.listing
                  return (
                    <div key={bid.id} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {listing?.address ?? 'Listing'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {listing?.city}, {listing?.state}
                            <span className="text-gray-400"> · </span>
                            {fmtDateTime(showing?.requested_date, showing?.requested_time)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#2e7d32]">
                            ${Number(bid.bid_amount).toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">your bid</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Approved showings</h2>
                <p className="text-gray-500 text-sm">Lock code is shown after approval</p>
              </div>
              <span className="badge badge-green">{(approvedShowings ?? []).length}</span>
            </div>

            {(approvedShowings ?? []).length === 0 ? (
              <div className="text-gray-600">No approved showings yet.</div>
            ) : (
              <div className="space-y-3">
                {(approvedShowings ?? []).map((showing: any) => {
                  const listing = showing.listing
                  const lockCode = showing.lock_code_revealed ? listing?.lock_code : null
                  return (
                    <div key={showing.id} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {listing?.address ?? 'Listing'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {listing?.city}, {listing?.state}
                            <span className="text-gray-400"> · </span>
                            {fmtDateTime(showing.requested_date, showing.requested_time)}
                          </div>
                          {showing.payout_amount ? (
                            <div className="text-sm text-gray-600 mt-1">
                              Payout:{' '}
                              <span className="font-medium text-[#2e7d32]">
                                ${Number(showing.payout_amount).toFixed(0)}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {lockCode ? (
                          <div className="bg-[#e8f5e9] rounded-xl px-4 py-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">Lock Code</div>
                            <div className="text-2xl font-bold text-[#2e7d32] tracking-wider">
                              {lockCode}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No lock code on listing</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-2">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/agent/showings" className="btn-primary">
              Claim a Showing
            </Link>
            <Link href="/agent/my-showings" className="btn-secondary">
              View My Showings
            </Link>
            <Link href="/agent/listings" className="btn-secondary">
              Request via Listing
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
