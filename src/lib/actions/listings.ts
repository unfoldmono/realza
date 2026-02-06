'use server'

import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/lib/types/database'

async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string }) {
  // Check if profile exists
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle() // Use maybeSingle instead of single to avoid error when not found

  if (profile) return { profile, error: null }

  // Profile doesn't exist - create one
  // Try upsert to handle race conditions
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || '',
      full_name: user.email?.split('@')[0] || 'User',
      user_type: 'user',
    }, { onConflict: 'id' })
    .select()
    .single()

  if (insertError) {
    console.error('Profile upsert error:', insertError)
    return { profile: null, error: `Failed to create profile: ${insertError.message} (code: ${insertError.code})` }
  }
  
  if (!newProfile) {
    return { profile: null, error: 'Profile creation returned no data' }
  }
  
  return { profile: newProfile, error: null }
}

export async function createListing(data: {
  address: string
  city: string
  state: string
  zip: string
  price: number
  beds: number
  baths: number
  sqft: number
  yearBuilt?: number
  description: string
  photos: string[]
  lockCode?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Ensure profile exists before creating listing
  const { error: profileError } = await ensureProfile(supabase, user)
  if (profileError) {
    return { error: profileError }
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      price: data.price,
      beds: data.beds,
      baths: data.baths,
      sqft: data.sqft,
      year_built: data.yearBuilt,
      description: data.description,
      photos: data.photos,
      lock_code: data.lockCode,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { listing }
}

export async function updateListing(id: string, data: Partial<Listing>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .update(data)
    .eq('id', id)
    .eq('seller_id', user.id) // Ensure ownership
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { listing }
}

export async function publishListing(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Update status to pending (will become active after MLS submission)
  const { data: listing, error } = await supabase
    .from('listings')
    .update({ status: 'pending' })
    .eq('id', id)
    .eq('seller_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // TODO: Trigger MLS submission workflow
  // TODO: Create Stripe payment intent

  return { listing }
}

export async function getMyListings() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { listings: [] }
  }

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, listings: [] }
  }

  return { listings }
}

export async function getListing(id: string) {
  const supabase = await createClient()

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { error: error.message }
  }

  // Increment views
  await supabase.rpc('increment_listing_views', { listing_id: id })

  return { listing }
}

export async function deleteListing(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
