import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversation } from '@/lib/actions/messages'
import ConversationClient from './ConversationClient'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ listingId: string; otherUserId: string }> | { listingId: string; otherUserId: string }
}) {
  const resolvedParams = await params
  const { listingId, otherUserId } = resolvedParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ messages, error: convoError }, { data: listing, error: listingError }, { data: otherProfile }] =
    await Promise.all([
      getConversation(listingId, otherUserId),
      supabase
        .from('listings')
        .select('id, address, city, state, zip, price, photos, seller_id')
        .eq('id', listingId)
        .single(),
      supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', otherUserId).single(),
    ])

  if (listingError || !listing) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/messages" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            ← Inbox
          </Link>
          <div className="min-w-0 text-center">
            <div className="font-semibold text-gray-900 truncate">
              {otherProfile?.full_name ?? 'Conversation'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {listing.address}, {listing.city}
            </div>
          </div>
          <Link href={`/listing/${listing.id}`} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            View Listing
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {convoError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {convoError}
          </div>
        )}
        <ConversationClient
          listingId={listingId}
          otherUserId={otherUserId}
          currentUserId={user.id}
          otherUserName={otherProfile?.full_name ?? 'User'}
          initialMessages={messages}
        />
      </main>
    </div>
  )
}
