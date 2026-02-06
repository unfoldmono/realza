import Link from 'next/link'
import { notFound } from 'next/navigation'
import { mockListings } from '@/lib/data/mockListings'
import ListingGallery from './_components/ListingGallery'

export const runtime = 'nodejs'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatPropertyType(type: string) {
  switch (type) {
    case 'single_family':
      return 'Single-family'
    case 'multi_family':
      return 'Multi-family'
    case 'townhouse':
      return 'Townhouse'
    case 'condo':
      return 'Condo'
    case 'land':
      return 'Land'
    default:
      return type.replaceAll('_', ' ')
  }
}

function osmEmbedUrl(lat: number, lng: number) {
  const pad = 0.02
  const left = lng - pad
  const right = lng + pad
  const top = lat + pad
  const bottom = lat - pad

  const bbox = `${left},${bottom},${right},${top}`
  const marker = `${lat},${lng}`

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`
}

export default async function BrowseListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = await params
  const id = resolvedParams.id

  const listing = mockListings.find((l) => l.id === id)
  if (!listing) notFound()

  const chatNext = `/browse/${encodeURIComponent(id)}/chat`
  const requestShowingNext = `/browse/${encodeURIComponent(id)}/request-showing`

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/browse" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Browse
            </Link>
            <Link href="/login" className="btn-secondary text-sm">
              Log In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5">
          <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to browse
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <ListingGallery photos={listing.photos} address={listing.address} />

            <div className="card mt-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {listing.is_realza ? (
                      <span className="badge badge-coral">Listed by Realza</span>
                    ) : (
                      <span className="badge" style={{ background: '#e6fffb', color: '#0d9488' }}>
                        MLS listing
                      </span>
                    )}
                    {listing.days_on_market <= 7 ? (
                      <span className="badge" style={{ background: '#e6fffb', color: '#0d9488' }}>
                        New
                      </span>
                    ) : null}
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
                    {listing.address}
                  </h1>
                  <p className="text-gray-600">
                    {listing.city}, {listing.state} {listing.zip}
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="text-3xl font-bold text-[#ff6b4a]">{formatPrice(listing.price)}</div>
                  <div className="text-gray-500 text-sm">Asking price</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Beds</div>
                  <div className="text-lg font-semibold">{listing.beds}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Baths</div>
                  <div className="text-lg font-semibold">{listing.baths}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Sqft</div>
                  <div className="text-lg font-semibold">{listing.sqft.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Property description</h2>
              <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
            </div>

            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key details</h2>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Detail label="Property type" value={formatPropertyType(listing.property_type)} />
                <Detail label="Year built" value={listing.year_built ? String(listing.year_built) : '—'} />
                <Detail label="Status" value={listing.status} />
                <Detail label="Days on market" value={`${listing.days_on_market} days`} />
                <Detail label="Lot size" value={'—'} />
                <Detail label="Price / sqft" value={formatPrice(Math.round(listing.price / Math.max(1, listing.sqft)))} />
                <Detail label="MLS #" value={listing.mls_number ?? '—'} />
                <Detail label="Listing office" value={listing.listing_office ?? '—'} />
                <Detail label="Listing agent" value={listing.listing_agent ?? '—'} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Talk to the seller</h2>

              <Link
                href={`/login?next=${encodeURIComponent(chatNext)}`}
                className="btn-primary w-full text-center text-lg"
              >
                Chat with Seller
              </Link>
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium text-gray-900">Direct to owner.</span> Skip the middleman.
              </div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-900">Request a showing</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Uber-style showings: pick a time and we dispatch a local agent to unlock the home—fast, simple, and
                  on-demand.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(requestShowingNext)}`}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full px-6 py-3 font-semibold border-2 transition-colors"
                  style={{ borderColor: '#0d9488', color: '#0d9488', background: 'white' }}
                >
                  Request Showing
                </Link>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>

              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <iframe
                  title="Map"
                  src={osmEmbedUrl(listing.lat, listing.lng)}
                  className="w-full h-72"
                  loading="lazy"
                />
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <div>
                  Approximate location ·{' '}
                  <a
                    className="text-[#0d9488] hover:underline"
                    href={`https://www.openstreetmap.org/?mlat=${listing.lat}&mlon=${listing.lng}#map=15/${listing.lat}/${listing.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View larger map
                  </a>
                </div>
              </div>
            </div>

            {listing.is_realza ? (
              <div className="card" style={{ border: '1px solid rgba(255, 107, 74, 0.25)' }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold"
                    style={{ background: '#ff6b4a' }}
                    aria-hidden="true"
                  >
                    R
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Listed by Realza</div>
                    <div className="text-sm text-gray-600 mt-1">
                      This is a direct-to-owner Realza listing. Message the seller in-app—no lead forms, no spam.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-gray-900 font-medium mt-1 break-words">{value}</div>
    </div>
  )
}
