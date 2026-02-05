import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { acceptBid as acceptBidAction, rejectBid as rejectBidAction } from '@/lib/actions/showings'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

async function handleAcceptBid(bidId: string) {
  'use server'
  await acceptBidAction(bidId)
  revalidatePath('/seller/showings')
}

async function handleRejectBid(bidId: string) {
  'use server'
  await rejectBidAction(bidId)
  revalidatePath('/seller/showings')
}

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatDateTime(date: string, time: string) {
  // naive formatting; date = YYYY-MM-DD, time = HH:MM
  return `${date} ${time}`
}

export default async function SellerShowingsPage() {
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
            <p className="text-gray-600 mb-6">Please sign in to manage showing requests.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Use service role for cross-user reads (bids + agent profiles)
  const { data: sellerListings, error: listingsError } = await supabaseAdmin
    .from('listings')
    .select('id')
    .eq('seller_id', user.id)

  const listingIds = (sellerListings ?? []).map((l) => l.id)

  if (listingsError) {
    return (
      <div className="min-h-screen bg-[#fffbf7]">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/seller" className="text-2xl font-bold text-[#ff6b4a]">
              realza
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="card border border-red-200">
            <p className="text-red-700">{listingsError.message}</p>
          </div>
        </main>
      </div>
    )
  }

  if (listingIds.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffbf7]">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/seller" className="text-2xl font-bold text-[#ff6b4a]">
              realza
            </Link>
            <Link href="/seller" className="text-gray-500 hover:text-gray-700">
              Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">📅</div>
            <h1 className="text-2xl font-bold mb-2">No listings found</h1>
            <p className="text-gray-600">Create and activate a listing to receive showing requests.</p>
          </div>
        </main>
      </div>
    )
  }

  const { data: showings, error: showingsError } = await supabaseAdmin
    .from('showings')
    .select(
      `
      id,
      requested_date,
      requested_time,
      status,
      created_at,
      listing:listings!listing_id(id, address, city, state, photos, price, lock_code),
      bids:showing_bids(
        id,
        bid_amount,
        status,
        created_at,
        agent:profiles!agent_id(id, full_name, email, rating, total_showings)
      )
    `
    )
    .in('listing_id', listingIds)
    .in('status', ['pending', 'assigned'])
    .order('requested_date', { ascending: true })

  const pendingShowings = (showings ?? []).filter((s: any) => s.status === 'pending')
  const assignedShowings = (showings ?? []).filter((s: any) => s.status === 'assigned')

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/seller" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <Link href="/seller" className="text-gray-500 hover:text-gray-700">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Showing Requests</h1>
          <p className="text-gray-600">Approve or reject incoming agent requests for your listings.</p>
        </div>

        {showingsError && (
          <div className="card mb-6 border border-red-200">
            <p className="text-red-700">{showingsError.message}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Incoming</h2>
                <p className="text-gray-500 text-sm">Pending requests awaiting your decision</p>
              </div>
              <span className="badge badge-coral">{pendingShowings.length}</span>
            </div>

            {pendingShowings.length === 0 ? (
              <div className="text-gray-600">No pending requests.</div>
            ) : (
              <div className="space-y-4">
                {pendingShowings.map((showing: any) => {
                  const listing = showing.listing
                  const photo = Array.isArray(listing?.photos) ? listing.photos[0] : null
                  const bids = Array.isArray(showing.bids) ? showing.bids : []

                  return (
                    <div key={showing.id} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-16 bg-gray-200 rounded-xl overflow-hidden">
                            {photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={photo} alt="Listing" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No photo
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="font-semibold text-gray-900">
                              {listing?.address}
                            </div>
                            <div className="text-sm text-gray-600">
                              {listing?.city}, {listing?.state}
                              <span className="text-gray-400"> · </span>
                              {formatDateTime(showing.requested_date, showing.requested_time)}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="text-[#ff6b4a] font-semibold">
                                ${Number(listing?.price ?? 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {bids
                            .filter((b: any) => b.status === 'pending')
                            .map((bid: any) => (
                              <div key={bid.id} className="bg-white rounded-xl p-3 border border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {bid.agent?.full_name ?? 'Agent'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {bid.agent?.email}
                                      {bid.agent?.rating ? (
                                        <>
                                          <span className="text-gray-300"> · </span>
                                          <span className="text-yellow-500">★</span> {bid.agent.rating}
                                        </>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-[#2e7d32]">
                                        ${Number(bid.bid_amount).toFixed(0)}
                                      </div>
                                      <div className="text-xs text-gray-500">bid</div>
                                    </div>

                                    <form action={handleAcceptBid.bind(null, bid.id)}>
                                      <button type="submit" className="btn-primary px-5 py-2">
                                        Approve
                                      </button>
                                    </form>
                                    <form action={handleRejectBid.bind(null, bid.id)}>
                                      <button type="submit" className="btn-secondary px-5 py-2">
                                        Reject
                                      </button>
                                    </form>
                                  </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-2">
                                  Approving assigns this agent and reveals the lock code to them.
                                </p>
                              </div>
                            ))}
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
                <h2 className="text-xl font-semibold">Approved</h2>
                <p className="text-gray-500 text-sm">Showings you’ve approved</p>
              </div>
              <span className="badge badge-green">{assignedShowings.length}</span>
            </div>

            {assignedShowings.length === 0 ? (
              <div className="text-gray-600">No approved showings yet.</div>
            ) : (
              <div className="space-y-3">
                {assignedShowings.map((showing: any) => {
                  const listing = showing.listing
                  const acceptedBid = (Array.isArray(showing.bids) ? showing.bids : []).find(
                    (b: any) => b.status === 'accepted'
                  )
                  return (
                    <div key={showing.id} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">{listing?.address}</div>
                          <div className="text-sm text-gray-600">
                            {listing?.city}, {listing?.state} · {formatDateTime(showing.requested_date, showing.requested_time)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Agent: <span className="font-medium">{acceptedBid?.agent?.full_name ?? '—'}</span>
                            <span className="text-gray-400"> · </span>
                            Bid: <span className="font-medium">${Number(acceptedBid?.bid_amount ?? 0).toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Status: <span className="badge badge-green">Assigned</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
