import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyConversations } from '@/lib/actions/messages'

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function MessagesInboxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ conversations, error }, { data: myProfile }] = await Promise.all([
    getMyConversations(),
    supabase.from('profiles').select('user_type').eq('id', user.id).single(),
  ])

  const dashboardHref = myProfile?.user_type === 'agent' ? '/agent' : '/dashboard'

  const grouped = new Map<string, typeof conversations>()
  for (const c of conversations ?? []) {
    const arr = grouped.get(c.listing_id) ?? []
    arr.push(c)
    grouped.set(c.listing_id, arr)
  }

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <div className="flex items-center gap-3">
            <Link href={dashboardHref} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Your conversations by listing</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
            <p className="text-gray-600">When you contact a seller (or a buyer contacts you), it’ll show up here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([listingId, convs]) => {
              const listing = convs[0]?.listing
              const heading = listing
                ? `${listing.address}, ${listing.city}, ${listing.state}`
                : `Listing ${listingId}`

              return (
                <div key={listingId} className="card">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{heading}</div>
                      {listing?.price ? (
                        <div className="text-sm text-gray-500">${Number(listing.price).toLocaleString()}</div>
                      ) : null}
                    </div>
                    {listing?.photos?.[0] ? (
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={listing.photos[0]} alt="Listing" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {convs.map((c) => {
                      const otherName = c.other_profile?.full_name ?? 'User'
                      const lastPreview = c.last_message.content
                      const lastTime = formatTime(c.last_message.created_at)

                      return (
                        <Link
                          key={`${c.listing_id}:${c.other_user_id}`}
                          href={`/messages/${c.listing_id}/${c.other_user_id}`}
                          className="flex items-center gap-4 py-4 hover:bg-gray-50 rounded-2xl px-3 -mx-3 transition-colors"
                        >
                          <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700 flex-shrink-0">
                            {otherName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className={`font-medium truncate ${c.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                {otherName}
                              </div>
                              <div className="text-xs text-gray-400 flex-shrink-0">{lastTime}</div>
                            </div>
                            <div className={`text-sm truncate ${c.unread_count > 0 ? 'text-gray-700' : 'text-gray-500'}`}>
                              {lastPreview}
                            </div>
                          </div>
                          {c.unread_count > 0 ? (
                            <div className="min-w-[28px] h-7 px-2 rounded-full bg-[#ff6b4a] text-white text-xs font-semibold flex items-center justify-center">
                              {c.unread_count}
                            </div>
                          ) : null}
                        </Link>
                      )
                    })}
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
