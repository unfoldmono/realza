import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export default async function FeaturedListings() {
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, address, city, state, zip, price, beds, baths, sqft, photos, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Listings</h2>
            <p className="text-gray-600 mt-1">Latest homes listed on Realza</p>
          </div>
          <Link
            href="/browse"
            className="text-[#ff6b4a] font-semibold hover:underline flex items-center gap-1"
          >
            View all <span>→</span>
          </Link>
        </div>

        {!listings || listings.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🏡</div>
            <h3 className="text-xl font-semibold mb-2">No active listings yet</h3>
            <p className="text-gray-600">Be the first to list your home.</p>
            <div className="mt-5">
              <Link href="/signup" className="btn-primary inline-block">
                Get Started →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => {
              const photo = Array.isArray(listing.photos) ? listing.photos[0] : null

              return (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={listing.address}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">🏠</div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="text-xl font-bold text-gray-900 mb-1">{formatPrice(listing.price)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>{listing.beds} bd</span>
                      <span className="text-gray-300">•</span>
                      <span>{listing.baths} ba</span>
                      <span className="text-gray-300">•</span>
                      <span>{Number(listing.sqft).toLocaleString()} sqft</span>
                    </div>
                    <p className="text-gray-800 font-medium truncate">{listing.address}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {listing.city}, {listing.state} {listing.zip}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
