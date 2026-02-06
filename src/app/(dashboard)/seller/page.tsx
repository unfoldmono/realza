import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserDropdown } from '@/app/_components/UserDropdown'

export const runtime = 'nodejs'

export default async function SellerDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller')
  }

  // Get seller's listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Get showings for seller's listings
  const listingIds = listings?.map((l) => l.id) ?? []
  const { data: showings } = listingIds.length
    ? await supabase
        .from('showings')
        .select(`
          *,
          assigned_agent:profiles!assigned_agent_id(id, full_name, rating)
        `)
        .in('listing_id', listingIds)
        .order('requested_date', { ascending: true })
    : { data: [] }

  // Get recent messages
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(id, full_name)
    `)
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const listing = listings?.[0] // Primary listing
  const upcomingShowings = (showings ?? []).filter(
    (s: any) => s.status === 'assigned' || s.status === 'pending' || s.status === 'bidding'
  )
  const unreadMessages = (messages ?? []).filter((m: any) => !m.read)

  // Calculate stats
  const totalViews = listings?.reduce((sum, l) => sum + (l.views ?? 0), 0) ?? 0
  const totalSaves = listings?.reduce((sum, l) => sum + (l.saves ?? 0), 0) ?? 0
  const totalShowings = showings?.length ?? 0
  const daysListed = listing
    ? Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold text-[#ff6b4a]">realza</Link>
            <Link href="/messages" className="text-gray-600 hover:text-gray-900 font-medium">
              Messages
              {unreadMessages.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-[#ff6b4a] text-white text-xs rounded-full">
                  {unreadMessages.length}
                </span>
              )}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <UserDropdown userName={profile?.full_name || firstName} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {firstName}! 👋</h1>
          <p className="text-gray-600">
            {listing ? "Here's what's happening with your listing." : "Ready to list your property?"}
          </p>
        </div>

        {/* No listings state */}
        {!listing && (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">List your property</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Sell your home for just $200 flat fee. Get on Zillow, Redfin & 100+ sites.
            </p>
            <Link href="/seller/new" className="btn-primary inline-block">
              Create Listing →
            </Link>
          </div>
        )}

        {/* Has listings */}
        {listing && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card">
                <div className="text-3xl font-bold text-gray-900">{totalViews}</div>
                <div className="text-gray-500 text-sm">Views</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-gray-900">{totalSaves}</div>
                <div className="text-gray-500 text-sm">Saves</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-gray-900">{totalShowings}</div>
                <div className="text-gray-500 text-sm">Showings</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-[#ff6b4a]">{daysListed}</div>
                <div className="text-gray-500 text-sm">Days Listed</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Listing Card */}
              <div className="lg:col-span-2 card">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Your Listing</h2>
                  <span className={`badge ${
                    listing.status === 'active' ? 'badge-green' : 
                    listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    ● {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex gap-4 mb-6">
                  <div className="w-32 h-24 bg-gray-200 rounded-xl overflow-hidden">
                    {listing.photos?.[0] ? (
                      <img 
                        src={listing.photos[0]} 
                        alt="Home" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📷
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{listing.address}</h3>
                    <p className="text-gray-500 text-sm">{listing.city}, {listing.state} {listing.zip}</p>
                    <p className="text-2xl font-bold text-[#ff6b4a]">${listing.price?.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">{listing.beds} bd · {listing.baths} ba · {listing.sqft?.toLocaleString()} sqft</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={`/listing/${listing.id}`} className="btn-secondary text-sm">
                    View Listing
                  </Link>
                  <Link href="/seller/new" className="btn-secondary text-sm">
                    + Add Another
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Messages</h2>
                  <Link href="/messages" className="text-[#ff6b4a] text-sm font-medium">View All</Link>
                </div>
                
                {messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.slice(0, 3).map((msg: any) => (
                      <Link 
                        key={msg.id} 
                        href={`/messages/${msg.listing_id}/${msg.sender_id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
                          {msg.sender?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${!msg.read ? "text-gray-900" : "text-gray-600"}`}>
                              {msg.sender?.full_name || "Unknown"}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${!msg.read ? "text-gray-700" : "text-gray-500"}`}>
                            {msg.content}
                          </p>
                        </div>
                        {!msg.read && (
                          <div className="w-2 h-2 bg-[#ff6b4a] rounded-full"></div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No messages yet</p>
                )}
              </div>
            </div>

            {/* Showings */}
            <div className="card mt-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Upcoming Showings</h2>
                  <p className="text-gray-500 text-sm">Manage your scheduled showings</p>
                </div>
                <Link href="/seller/showings" className="btn-primary text-sm">
                  Manage Schedule
                </Link>
              </div>

              {upcomingShowings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingShowings.slice(0, 5).map((showing: any) => (
                    <div 
                      key={showing.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-semibold">{showing.requested_date}</div>
                          <div className="text-gray-500 text-sm">{showing.requested_time}</div>
                        </div>
                        <div className="h-12 w-px bg-gray-200"></div>
                        {showing.assigned_agent ? (
                          <div>
                            <div className="font-medium">{showing.assigned_agent.full_name}</div>
                            {showing.assigned_agent.rating && (
                              <div className="text-sm text-gray-500">
                                <span className="text-yellow-500">★</span> {showing.assigned_agent.rating}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[#ff6b4a] font-medium">Awaiting agent...</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {showing.status === 'assigned' && (
                          <span className="badge badge-green">Confirmed</span>
                        )}
                        {showing.status === 'pending' && (
                          <span className="badge bg-yellow-100 text-yellow-700">Pending</span>
                        )}
                        {showing.status === 'bidding' && (
                          <span className="badge badge-coral">Needs Agent</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No upcoming showings scheduled</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
