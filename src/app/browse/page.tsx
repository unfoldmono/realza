import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SaveButton } from '@/app/_components/SaveButton'
import { getMySavedListingIds } from '@/lib/actions/saved-listings'

export const runtime = 'nodejs'

export default async function BrowsePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const searchParams = await props.searchParams
  const q = typeof searchParams?.q === 'string' ? searchParams.q.trim() : ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const baseQuery = supabase
    .from('listings')
    .select('id, address, city, state, zip, price, beds, baths, sqft, photos, seller_id, saves')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const listingsQuery = q
    ? baseQuery.or(`city.ilike.%${q}%,address.ilike.%${q}%,zip.ilike.%${q}%`)
    : baseQuery

  const [{ savedListingIds }, { data: listings, error }] = await Promise.all([
    getMySavedListingIds(),
    listingsQuery,
  ])

  const savedSet = new Set(savedListingIds ?? [])

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>

          <div className="flex-1 max-w-xl">
            <form action="/browse" className="relative">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by city, zip, or address…"
                className="w-full px-4 py-2.5 pl-10 rounded-full border-2 border-gray-200 focus:border-[#ff6b4a] focus:outline-none transition-colors text-sm bg-white"
              />
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </form>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/messages" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Messages
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login?next=/browse" className="btn-secondary text-sm">
                  Log In
                </Link>
                <Link href="/signup" className="btn-primary text-sm">
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse homes</h1>
            <p className="text-gray-600">Save listings and message sellers directly.</p>
          </div>
        </div>

        {error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error.message}
          </div>
        ) : null}

        {!error && (!listings || listings.length === 0) ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-3">🏡</div>
            <h2 className="text-xl font-semibold mb-2">No active listings found</h2>
            <p className="text-gray-600">Try a different search.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(listings ?? []).map((listing) => {
              const photo = Array.isArray(listing.photos) ? listing.photos[0] : null
              const isMine = !!user && user.id === listing.seller_id

              return (
                <div key={listing.id} className="card overflow-hidden p-0">
                  <div className="relative h-44 bg-gray-100">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="Listing" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No photo</div>
                    )}

                    <div className="absolute top-3 right-3">
                      <SaveButton listingId={listing.id} initialSaved={savedSet.has(listing.id)} />
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">{listing.address}</h3>
                        <p className="text-gray-500 text-sm">
                          {listing.city}, {listing.state} {listing.zip}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#ff6b4a]">${Number(listing.price).toLocaleString()}</div>
                        <div className="text-gray-500 text-xs">price</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mt-3">
                      {listing.beds} bd · {listing.baths} ba · {Number(listing.sqft).toLocaleString()} sqft
                    </div>

                    <div className="mt-5 flex gap-3">
                      <Link href={`/listing/${listing.id}`} className="btn-primary flex-1 text-center">
                        View
                      </Link>
                      {user ? (
                        isMine ? (
                          <Link href={`/dashboard/listings/${listing.id}/edit`} className="btn-secondary px-5 py-3">
                            Edit
                          </Link>
                        ) : (
                          <Link href={`/messages/${listing.id}/${listing.seller_id}`} className="btn-secondary px-5 py-3">
                            Message
                          </Link>
                        )
                      ) : null}
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
