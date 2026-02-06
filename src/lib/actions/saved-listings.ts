'use server'

import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/lib/types/database'

export async function getMySavedListingIds() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { savedListingIds: [] as string[] }

  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id)

  if (error) return { error: error.message, savedListingIds: [] as string[] }

  return { savedListingIds: (data ?? []).map((r) => r.listing_id) }
}

export async function isListingSaved(listingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { saved: false }

  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (error) return { error: error.message, saved: false }
  return { saved: !!data }
}

export async function toggleSavedListing(listingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' as const }

  const { data: existing, error: existsError } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (existsError) return { error: existsError.message }

  if (existing) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)

    if (error) return { error: error.message }

    return { saved: false as const }
  }

  const { error } = await supabase.from('saved_listings').insert({
    user_id: user.id,
    listing_id: listingId,
  })

  if (error) return { error: error.message }

  return { saved: true as const }
}

export type SavedListingWithListing = {
  created_at: string
  listing: Pick<
    Listing,
    'id' | 'address' | 'city' | 'state' | 'zip' | 'price' | 'beds' | 'baths' | 'sqft' | 'photos' | 'status' | 'saves' | 'views' | 'seller_id'
  >
}

export async function getMySavedListings() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' as const, saved: [] as SavedListingWithListing[] }

  const { data, error } = await supabase
    .from('saved_listings')
    .select(
      `
      created_at,
      listing:listings(
        id, address, city, state, zip, price, beds, baths, sqft, photos, status, saves, views, seller_id
      )
    `.trim()
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, saved: [] as SavedListingWithListing[] }

  const rows = (data ?? []) as unknown as Array<{ created_at: string; listing: SavedListingWithListing['listing'] | null }>

  return {
    saved: rows
      .filter((r) => r.listing)
      .map((r) => ({ created_at: r.created_at, listing: r.listing! })),
  }
}
