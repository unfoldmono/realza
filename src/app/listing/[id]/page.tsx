import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      *,
      seller:profiles!seller_id(id, full_name, email, avatar_url)
    `.trim()
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  // Supabase relationship selects are not typed in this repo; cast for UI usage
  const listing = data as any

  type SellerProfile = Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>
  const seller = (listing as unknown as { seller: SellerProfile | null }).seller
  const sellerName = seller?.full_name ?? 'Seller'
  const sellerInitials = sellerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isSeller = !!user && user.id === (listing as any).seller_id

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/messages" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Messages
              </Link>
            ) : (
              <Link href="/login" className="btn-secondary text-sm">
                Log In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Photos */}
          <div className="lg:col-span-2">
            <div className="card p-4">
              {Array.isArray(listing.photos) && listing.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden">
                    <img
                      src={listing.photos[0]}
                      alt="Listing photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {listing.photos.slice(1, 5).map((url: string, idx: number) => (
                    <div key={idx} className="aspect-[16/12] bg-gray-100 rounded-2xl overflow-hidden">
                      <img src={url} alt={`Listing photo ${idx + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                  No photos yet
                </div>
              )}
            </div>

            <div className="card mt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {listing.address}
                  </h1>
                  <p className="text-gray-600">
                    {listing.city}, {listing.state} {listing.zip}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#ff6b4a]">{formatPrice(listing.price)}</div>
                  <div className="text-gray-500 text-sm">Asking price</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
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
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Year</div>
                  <div className="text-lg font-semibold">{listing.year_built ?? '—'}</div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Contact</h2>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
                  {sellerInitials || 'S'}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {sellerName}
                  </div>
                  <div className="text-xs text-gray-500">Responds via Realza chat</div>
                </div>
              </div>

              {!user ? (
                <Link href={`/login?next=/listing/${listing.id}`} className="btn-primary w-full text-center">
                  Log in to contact seller →
                </Link>
              ) : isSeller ? (
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 text-sm">
                  You are the seller on this listing.
                </div>
              ) : (
                <Link href={`/messages/${listing.id}/${listing.seller_id}`} className="btn-primary w-full text-center">
                  Contact Seller →
                </Link>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Tip: keep personal info private until you’re ready to schedule a showing.
              </div>
            </div>

            <div className="card mt-6">
              <h3 className="font-semibold mb-2">Listing Details</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  <span className="text-gray-500">Status:</span> {listing.status}
                </div>
                <div>
                  <span className="text-gray-500">Views:</span> {listing.views}
                </div>
                <div>
                  <span className="text-gray-500">Saves:</span> {listing.saves}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
