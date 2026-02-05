import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AgentHeader } from '@/app/agent/_components/AgentHeader'

export const runtime = 'nodejs'

export default async function AgentListingsPage() {
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
            <p className="text-gray-600 mb-6">Please sign in to browse active listings.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, address, city, state, zip, price, beds, baths, sqft, photos')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/agent" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/agent" className="text-gray-500 hover:text-gray-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Listings</h1>
          <p className="text-gray-600">Browse listings and request showings for your buyers.</p>
        </div>

        {error && (
          <div className="card mb-6 border border-red-200">
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {!error && (!listings || listings.length === 0) && (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">🏡</div>
            <h3 className="text-xl font-semibold mb-2">No active listings</h3>
            <p className="text-gray-600">Check back soon.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(listings ?? []).map((listing) => {
            const photo = Array.isArray(listing.photos) ? listing.photos[0] : null
            return (
              <div key={listing.id} className="card overflow-hidden p-0">
                <div className="h-44 bg-gray-100">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={`${listing.address} photo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No photo
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {listing.address}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {listing.city}, {listing.state} {listing.zip}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#ff6b4a]">
                        ${Number(listing.price).toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-xs">price</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-3">
                    {listing.beds} bd · {listing.baths} ba · {Number(listing.sqft).toLocaleString()} sqft
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Link
                      href={`/agent/listings/${listing.id}`}
                      className="btn-primary flex-1 text-center"
                    >
                      Request Showing
                    </Link>
                    <Link
                      href={`/agent/listings/${listing.id}`}
                      className="btn-secondary px-5 py-3"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
