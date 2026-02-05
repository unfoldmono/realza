import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requestShowing } from '@/lib/actions/showings'

export const runtime = 'nodejs'

export default async function AgentListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string }
  searchParams?: Promise<{ error?: string }> | { error?: string }
}) {
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const listingId = resolvedParams.id

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
            <p className="text-gray-600 mb-6">Please sign in to request a showing.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single()

  if (error || !listing) return notFound()

  async function submit(formData: FormData) {
    'use server'

    const requestedAt = String(formData.get('requestedAt') ?? '')
    const bidAmount = Number(formData.get('bidAmount') ?? 0)

    const result = await requestShowing(listingId, requestedAt, bidAmount)
    if (result?.error) {
      redirect(`/agent/listings/${listingId}?error=${encodeURIComponent(result.error)}`)
    }

    redirect('/agent')
  }

  const photos: string[] = Array.isArray(listing.photos) ? listing.photos : []
  const hero = photos[0]

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/agent" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/agent/listings" className="text-gray-500 hover:text-gray-700">
              Back to Listings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
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
                  <img src={hero} alt="Listing photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No photo
                  </div>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{listing.address}</h1>
              <p className="text-gray-600">
                {listing.city}, {listing.state} {listing.zip}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="badge badge-coral">${Number(listing.price).toLocaleString()}</span>
                <span className="badge bg-gray-100 text-gray-700">{listing.beds} bd</span>
                <span className="badge bg-gray-100 text-gray-700">{listing.baths} ba</span>
                <span className="badge bg-gray-100 text-gray-700">{Number(listing.sqft).toLocaleString()} sqft</span>
              </div>

              {listing.description && (
                <div className="mt-5">
                  <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold mb-2">Request a showing</h2>
              <p className="text-gray-600 text-sm mb-5">
                Choose a date/time and enter your bid (minimum $75). The seller will approve or reject.
              </p>

              <form action={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date &amp; time
                  </label>
                  <input
                    name="requestedAt"
                    type="datetime-local"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bid amount (USD)
                  </label>
                  <input
                    name="bidAmount"
                    type="number"
                    min={75}
                    step={1}
                    defaultValue={75}
                    className="input"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum $75</p>
                </div>

                <button type="submit" className="btn-primary w-full">
                  Submit Request
                </button>

                <p className="text-xs text-gray-500">
                  After approval, you’ll see the lock code in your dashboard.
                </p>
              </form>
            </div>

            <div className="card mt-6">
              <h3 className="font-semibold mb-2">Next steps</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Seller reviews your request</li>
                <li>On approval, you’re assigned the showing</li>
                <li>Lock code becomes available immediately after approval</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
