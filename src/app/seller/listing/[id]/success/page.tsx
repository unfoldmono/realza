import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ListingPaymentSuccessPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = await params
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
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment complete</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your listing status.</p>
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

  const isActive = listing.status === 'active'

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/seller" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <Link href="/seller" className="text-gray-500 hover:text-gray-700">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="card text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You’re all set!</h1>
          <p className="text-gray-600 mb-6">
            Your payment was successful. {isActive ? 'Your listing is now active.' : 'We’re activating your listing now.'}
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6">
            <p className="text-gray-500 text-sm">Listing</p>
            <p className="font-semibold text-gray-900">{listing.address}, {listing.city}, {listing.state} {listing.zip}</p>
            <p className="text-gray-700 mt-1">
              <span className="font-semibold text-[#ff6b4a]">${Number(listing.price).toLocaleString()}</span>
              <span className="text-gray-500"> · {listing.beds} bed · {listing.baths} bath · {Number(listing.sqft).toLocaleString()} sqft</span>
            </p>
            <div className="mt-3">
              <span className={`badge ${isActive ? 'badge-green' : 'badge-coral'}`}>
                ● {listing.status}
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/seller" className="btn-primary">
              Go to Dashboard
            </Link>
            <Link href="/seller/new" className="btn-secondary">
              Create Another Listing
            </Link>
          </div>

          {!isActive && (
            <p className="text-gray-500 text-sm mt-6">
              If this page still shows “draft” after a minute, refresh — Stripe webhooks can take a moment.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
