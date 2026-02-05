import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentHeader } from '@/app/agent/_components/AgentHeader'
import { claimShowing, getLockCode } from '@/lib/actions/showings'

export const runtime = 'nodejs'

function fmtDateTime(date?: string, time?: string) {
  if (!date) return ''
  return time ? `${date} ${String(time).slice(0, 5)}` : date
}

export default async function AgentShowingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string }
  searchParams?: Promise<{ error?: string }> | { error?: string }
}) {
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const showingId = resolvedParams.id

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
            <p className="text-gray-600 mb-6">Please sign in to view this showing.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: showing, error } = await supabase
    .from('showings')
    .select(
      `
      id,
      listing_id,
      requested_date,
      requested_time,
      status,
      claim_mode,
      assigned_agent_id,
      payout_amount,
      lock_code_revealed,
      buyer_name,
      buyer_email,
      buyer_phone,
      listing:listings(
        id,
        address,
        city,
        state,
        zip,
        price,
        beds,
        baths,
        sqft,
        description,
        photos,
        lock_code
      )
    `
    )
    .eq('id', showingId)
    .single()

  if (error || !showing) return notFound()

  const listing: any = (showing as any).listing
  const photos: string[] = Array.isArray(listing?.photos) ? listing.photos : []
  const hero = photos[0]

  const isMine = showing.assigned_agent_id === user.id
  const isOpen = !showing.assigned_agent_id && ['pending', 'bidding'].includes(showing.status as any)
  const isClaimable =
    isOpen &&
    ((showing.status as any) === 'bidding' || (showing as any).claim_mode === 'first_claim')

  async function submitClaim(formData: FormData) {
    'use server'

    const bidAmount = Number(formData.get('bidAmount') ?? 0)
    const message = String(formData.get('message') ?? '').trim() || undefined

    const result = await claimShowing(showingId, bidAmount, message)
    if (result?.error) {
      redirect(`/agent/showings/${showingId}?error=${encodeURIComponent(result.error)}`)
    }

    redirect('/agent/my-showings')
  }

  async function revealLock() {
    'use server'

    const result = await getLockCode(showingId)
    if (result?.error) {
      redirect(`/agent/showings/${showingId}?error=${encodeURIComponent(result.error)}`)
    }

    redirect(`/agent/showings/${showingId}`)
  }

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <AgentHeader active="/agent/showings" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Showing Details</h1>
            <p className="text-gray-600">{fmtDateTime(showing.requested_date, showing.requested_time)}</p>
          </div>
          <Link href="/agent/showings" className="btn-secondary px-5 py-2">
            Back
          </Link>
        </div>

        {resolvedSearchParams?.error && (
          <div className="card mb-6 border border-red-200">
            <p className="text-red-700">{resolvedSearchParams.error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="card overflow-hidden p-0">
              <div className="h-72 bg-gray-100">
                {hero ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero} alt="Listing" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No photo</div>
                )}
              </div>
              {photos.length > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <div className="grid grid-cols-4 gap-3">
                    {photos.slice(1, 5).map((p) => (
                      <div key={p} className="h-20 bg-gray-100 rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt="Listing" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card mt-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">{listing?.address}</h2>
                  <p className="text-gray-600">
                    {listing?.city}, {listing?.state} {listing?.zip}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#ff6b4a]">
                    ${Number(listing?.price ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">price</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="badge bg-gray-100 text-gray-700">{listing?.beds} bd</span>
                <span className="badge bg-gray-100 text-gray-700">{listing?.baths} ba</span>
                <span className="badge bg-gray-100 text-gray-700">
                  {Number(listing?.sqft ?? 0).toLocaleString()} sqft
                </span>
                <span className={isMine ? 'badge badge-green' : 'badge bg-gray-100 text-gray-700'}>
                  {isMine ? 'Claimed by you' : showing.assigned_agent_id ? 'Claimed' : 'Available'}
                </span>
              </div>

              {listing?.description ? (
                <div className="mt-5">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/listing/${listing?.id}`} className="btn-secondary">
                  View property page
                </Link>
                <Link href="/messages" className="btn-secondary">
                  Messages
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">Appointment</h3>
              <div className="text-sm text-gray-700">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">{fmtDateTime(showing.requested_date, showing.requested_time)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium">{String(showing.status).toUpperCase()}</span>
                </div>
              </div>

              {(showing.buyer_name || showing.buyer_email || showing.buyer_phone) && (
                <div className="mt-5">
                  <h4 className="font-semibold text-gray-900 mb-2">Buyer info</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    {showing.buyer_name ? <div>Name: {showing.buyer_name}</div> : null}
                    {showing.buyer_email ? <div>Email: {showing.buyer_email}</div> : null}
                    {showing.buyer_phone ? <div>Phone: {showing.buyer_phone}</div> : null}
                  </div>
                </div>
              )}
            </div>

            {isMine ? (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold mb-2">Lockbox</h3>
                {showing.lock_code_revealed && listing?.lock_code ? (
                  <div className="bg-[#e8f5e9] rounded-2xl px-5 py-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Lock Code</div>
                    <div className="text-3xl font-bold text-[#2e7d32] tracking-wider">{listing.lock_code}</div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Lockbox code is hidden. You may be able to reveal it closer to showtime.
                    </p>
                    <form action={revealLock}>
                      <button type="submit" className="btn-primary w-full">
                        Reveal lockbox code
                      </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-2">For safety, codes may unlock 1 hour before.</p>
                  </div>
                )}
              </div>
            ) : isClaimable ? (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold mb-2">Claim this showing</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Enter your bid to claim this slot. Minimum $75.
                </p>

                <form action={submitClaim} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bid amount (USD)</label>
                    <input name="bidAmount" type="number" min={75} step={1} defaultValue={75} className="input" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                    <textarea name="message" className="input" rows={3} placeholder="Anything the buyer/seller should know?" />
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    Claim showing
                  </button>

                  <p className="text-xs text-gray-500">
                    After claiming, this slot is removed from the public pool.
                  </p>
                </form>
              </div>
            ) : (
              <div className="card mt-6">
                <h3 className="text-xl font-semibold mb-2">Not available</h3>
                <p className="text-sm text-gray-600">
                  This showing has already been claimed or requires seller approval.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link href="/agent/showings" className="btn-primary flex-1 text-center">
                    Browse available showings
                  </Link>
                  <Link href="/agent" className="btn-secondary px-5 py-3">
                    Dashboard
                  </Link>
                </div>
              </div>
            )}

            {showing.payout_amount ? (
              <div className="card mt-6">
                <h3 className="text-lg font-semibold mb-2">Payout</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Your payout</span>
                  <span className="font-bold text-[#2e7d32]">${Number(showing.payout_amount).toFixed(0)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
