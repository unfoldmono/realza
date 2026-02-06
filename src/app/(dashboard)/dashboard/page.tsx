import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserDropdown } from '@/app/_components/UserDropdown'
import { getMyConversations } from '@/lib/actions/messages'
import { getMySavedListings } from '@/lib/actions/saved-listings'

export const runtime = 'nodejs'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  const [{ data: profile }, { data: myListings }, conversationsRes, savedRes] = await Promise.all([
    supabase.from('profiles').select('full_name, user_type').eq('id', user.id).single(),
    supabase.from('listings').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
    getMyConversations(),
    getMySavedListings(),
  ])

  if (profile?.user_type === 'agent') {
    redirect('/agent')
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const unreadCount = (conversationsRes.conversations ?? []).reduce(
    (sum, c) => sum + (c.unread_count ?? 0),
    0
  )

  // Get showings for my listings
  const listingIds = (myListings ?? []).map((l: any) => l.id)
  const { data: showings } = listingIds.length
    ? await supabase
        .from('showings')
        .select(`*, assigned_agent:profiles!assigned_agent_id(id, full_name, rating)`)
        .in('listing_id', listingIds)
        .order('requested_date', { ascending: true })
    : { data: [] }

  const upcomingShowings = (showings ?? []).filter(
    (s: any) => s.status === 'assigned' || s.status === 'pending' || s.status === 'bidding'
  )

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold text-[#ff6b4a]">
              realza
            </Link>
            <Link href="/browse" className="text-gray-600 hover:text-gray-900 font-medium">
              Browse
            </Link>
            <Link href="/messages" className="text-gray-600 hover:text-gray-900 font-medium">
              Messages
              {unreadCount > 0 ? (
                <span className="ml-1 px-2 py-0.5 bg-[#ff6b4a] text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/new" className="btn-primary text-sm">
              + Create Listing
            </Link>
            <UserDropdown userName={profile?.full_name || firstName} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {firstName}!</h1>
          <p className="text-gray-600">Manage your listings, saved homes, and messages.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">My Listings</h2>
                <Link href="/dashboard/new" className="text-[#ff6b4a] text-sm font-medium">
                  Add →
                </Link>
              </div>

              {!myListings || myListings.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">🏠</div>
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                  <p className="text-gray-600 mb-5">Create a listing to start getting messages.</p>
                  <Link href="/dashboard/new" className="btn-primary inline-block">
                    Create Listing →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myListings.slice(0, 5).map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{l.address}</div>
                        <div className="text-sm text-gray-500">
                          {l.city}, {l.state} {l.zip}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-semibold text-[#ff6b4a]">${Number(l.price).toLocaleString()}</span>
                          <span className="text-gray-400"> · </span>
                          {l.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Link href={`/listing/${l.id}`} className="btn-secondary text-sm">
                          View
                        </Link>
                        <Link href={`/dashboard/listings/${l.id}/edit`} className="btn-primary text-sm">
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Saved</h2>
                <Link href="/profile" className="text-[#ff6b4a] text-sm font-medium">
                  View all →
                </Link>
              </div>

              {savedRes?.error ? (
                <div className="text-sm text-red-700">{savedRes.error}</div>
              ) : savedRes.saved.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">❤️</div>
                  <h3 className="text-lg font-semibold mb-2">No saved listings</h3>
                  <p className="text-gray-600 mb-5">Tap the heart on any listing to save it here.</p>
                  <Link href="/browse" className="btn-secondary inline-block">
                    Browse homes
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedRes.saved.slice(0, 5).map((row) => (
                    <Link
                      key={row.listing.id}
                      href={`/listing/${row.listing.id}`}
                      className="block p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{row.listing.address}</div>
                          <div className="text-sm text-gray-500">
                            {row.listing.city}, {row.listing.state} {row.listing.zip}
                          </div>
                        </div>
                        <div className="font-semibold text-[#ff6b4a] flex-shrink-0">
                          ${Number(row.listing.price).toLocaleString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Messages</h2>
                <Link href="/messages" className="text-[#ff6b4a] text-sm font-medium">
                  View all
                </Link>
              </div>

              {conversationsRes?.error ? (
                <p className="text-red-700 text-sm">{conversationsRes.error}</p>
              ) : (conversationsRes.conversations ?? []).length === 0 ? (
                <p className="text-gray-500 text-sm">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {(conversationsRes.conversations ?? []).slice(0, 5).map((c) => {
                    const otherName = c.other_profile?.full_name ?? 'User'
                    return (
                      <Link
                        key={`${c.listing_id}:${c.other_user_id}`}
                        href={`/messages/${c.listing_id}/${c.other_user_id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
                          {otherName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${c.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {otherName}
                          </div>
                          <p className={`text-sm truncate ${c.unread_count > 0 ? 'text-gray-700' : 'text-gray-500'}`}>
                            {c.last_message.content}
                          </p>
                        </div>
                        {c.unread_count > 0 ? <div className="w-2.5 h-2.5 bg-[#ff6b4a] rounded-full" /> : null}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Upcoming Showings</h2>
                  <p className="text-gray-500 text-sm">For your listings</p>
                </div>
                <Link href="/dashboard/showings" className="text-[#ff6b4a] text-sm font-medium">
                  Manage
                </Link>
              </div>

              {upcomingShowings.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming showings</p>
              ) : (
                <div className="space-y-3">
                  {upcomingShowings.slice(0, 4).map((showing: any) => (
                    <div key={showing.id} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {showing.requested_date} · {showing.requested_time}
                          </div>
                          <div className="text-sm text-gray-500">
                            {showing.assigned_agent?.full_name ? `Agent: ${showing.assigned_agent.full_name}` : 'Awaiting agent'}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700 capitalize">{showing.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
