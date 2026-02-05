'use server'

import { createClient } from '@/lib/supabase/server'
import type { Listing, Message, Profile } from '@/lib/types/database'

export type ConversationSummary = {
  listing_id: string
  other_user_id: string
  last_message: Message
  unread_count: number
  listing?: Pick<Listing, 'id' | 'address' | 'city' | 'state' | 'price' | 'photos'>
  other_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'user_type'>
}

export async function sendMessage(listingId: string, toUserId: string, content: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' as const }
  }

  const trimmed = content.trim()
  if (!trimmed) {
    return { error: 'Message cannot be empty' as const }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      listing_id: listingId,
      sender_id: user.id,
      recipient_id: toUserId,
      content: trimmed,
      read: false,
    })
    .select('*')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { message }
}

export async function getConversation(listingId: string, otherUserId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' as const, messages: [] as Message[] }
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('listing_id', listingId)
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message, messages: [] as Message[] }
  }

  // Mark incoming messages as read for this conversation
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('listing_id', listingId)
    .eq('sender_id', otherUserId)
    .eq('recipient_id', user.id)
    .eq('read', false)

  return { messages: (messages ?? []) as Message[] }
}

export async function getMyConversations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' as const, conversations: [] as ConversationSummary[] }
  }

  const { data: rows, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return { error: error.message, conversations: [] as ConversationSummary[] }
  }

  const map = new Map<string, ConversationSummary>()

  for (const row of rows ?? []) {
    const otherUserId = row.sender_id === user.id ? row.recipient_id : row.sender_id
    const key = `${row.listing_id}:${otherUserId}`

    if (!map.has(key)) {
      map.set(key, {
        listing_id: row.listing_id,
        other_user_id: otherUserId,
        last_message: row,
        unread_count: 0,
      })
    }

    const summary = map.get(key)!

    // unread messages are only those where I'm the recipient
    if (row.recipient_id === user.id && !row.read) {
      summary.unread_count += 1
    }
  }

  const conversations = Array.from(map.values())

  const listingIds = Array.from(new Set(conversations.map((c) => c.listing_id)))
  const otherUserIds = Array.from(new Set(conversations.map((c) => c.other_user_id)))

  const [listingsRes, profilesRes] = await Promise.all([
    listingIds.length
      ? supabase
          .from('listings')
          .select('id, address, city, state, price, photos')
          .in('id', listingIds)
      : Promise.resolve({ data: [] as ConversationSummary['listing'][] }),
    otherUserIds.length
      ? supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, user_type')
          .in('id', otherUserIds)
      : Promise.resolve({ data: [] as ConversationSummary['other_profile'][] }),
  ])

  type ListingSummary = NonNullable<ConversationSummary['listing']>
  type ProfileSummary = NonNullable<ConversationSummary['other_profile']>

  const listingById = new Map<string, ListingSummary>()
  for (const l of (listingsRes.data ?? []) as unknown as ListingSummary[]) {
    listingById.set(l.id, l)
  }

  const profileById = new Map<string, ProfileSummary>()
  for (const p of (profilesRes.data ?? []) as unknown as ProfileSummary[]) {
    profileById.set(p.id, p)
  }

  for (const c of conversations) {
    c.listing = listingById.get(c.listing_id)
    c.other_profile = profileById.get(c.other_user_id)
  }

  return { conversations }
}
