'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Showings that are open for agent bids (legacy flow)
 */
export async function getAvailableShowings() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { showings: [] as any[] }
  }

  const { data: showings, error } = await supabase
    .from('showings')
    .select(
      `
      *,
      listing:listings(address, city, state, photos)
    `
    )
    .in('status', ['pending', 'bidding'])
    .order('requested_date', { ascending: true })

  if (error) {
    return { error: error.message, showings: [] as any[] }
  }

  return { showings: showings ?? [] }
}

/**
 * Legacy: showings assigned to the current agent.
 */
export async function getMyShowings() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { showings: [] as any[] }
  }

  const { data: showings, error } = await supabase
    .from('showings')
    .select(
      `
      *,
      listing:listings(address, city, state, photos, lock_code)
    `
    )
    .eq('assigned_agent_id', user.id)
    .order('requested_date', { ascending: true })

  if (error) {
    return { error: error.message, showings: [] as any[] }
  }

  return { showings: showings ?? [] }
}

export async function getShowingsForListing(listingId: string) {
  const supabase = await createClient()

  const { data: showings, error } = await supabase
    .from('showings')
    .select(
      `
      *,
      agent:profiles!assigned_agent_id(full_name, rating, total_showings)
    `
    )
    .eq('listing_id', listingId)
    .order('requested_date', { ascending: true })

  if (error) {
    return { error: error.message, showings: [] as any[] }
  }

  return { showings: showings ?? [] }
}

/**
 * NEW (Agent flow): agent requests a showing on an active listing.
 * Creates a showing + an initial bid from the requesting agent.
 */
export async function requestShowing(
  listingId: string,
  requestedAt: string,
  bidAmount: number
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is an agent
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { error: profileError.message }
  }

  if (profile?.user_type !== 'agent') {
    return { error: 'Only agents can request showings' }
  }

  if (!Number.isFinite(bidAmount) || bidAmount < 75) {
    return { error: 'Bid amount must be at least $75' }
  }

  // Ensure listing exists and is active
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, status')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return { error: listingError?.message ?? 'Listing not found' }
  }

  if (listing.status !== 'active') {
    return { error: 'Listing is not active' }
  }

  // requestedAt expected as "YYYY-MM-DDTHH:MM" (datetime-local)
  const [requestedDate, timePart] = String(requestedAt).split('T')
  const requestedTime = (timePart ?? '').slice(0, 5)

  if (!requestedDate || requestedTime.length < 4) {
    return { error: 'Please choose a valid date and time' }
  }

  // Create showing
  const { data: showing, error: showingError } = await supabase
    .from('showings')
    .insert({
      listing_id: listingId,
      requested_date: requestedDate,
      requested_time: requestedTime,
      status: 'pending',
      claim_mode: 'seller_approves',
      lock_code_revealed: false,
    })
    .select()
    .single()

  if (showingError || !showing) {
    return { error: showingError?.message ?? 'Failed to create showing' }
  }

  // Create initial bid (the requesting agent)
  const { data: bid, error: bidError } = await supabase
    .from('showing_bids')
    .insert({
      showing_id: showing.id,
      agent_id: user.id,
      bid_amount: bidAmount,
      status: 'pending',
    })
    .select()
    .single()

  if (bidError || !bid) {
    return { error: bidError?.message ?? 'Failed to create bid' }
  }

  revalidatePath('/agent')
  revalidatePath('/seller/showings')

  return { showing, bid }
}

/**
 * Legacy (buyer flow): buyer requests a showing; then agents bid.
 * Kept for compatibility.
 */
export async function requestBuyerShowing(data: {
  listingId: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  requestedDate: string
  requestedTime: string
}) {
  const supabase = await createClient()

  const { data: showing, error } = await supabase
    .from('showings')
    .insert({
      listing_id: data.listingId,
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail,
      buyer_phone: data.buyerPhone,
      requested_date: data.requestedDate,
      requested_time: data.requestedTime,
      status: 'bidding',
      claim_mode: 'first_claim',
      lock_code_revealed: false,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { showing }
}

export async function bidOnShowing(
  showingId: string,
  bidAmount: number,
  message?: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is an agent
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'agent') {
    return { error: 'Only agents can bid on showings' }
  }

  const { data: bid, error } = await supabase
    .from('showing_bids')
    .insert({
      showing_id: showingId,
      agent_id: user.id,
      bid_amount: bidAmount,
      message,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/showings')

  return { bid }
}

/**
 * NEW: Get showings relevant to the current agent (pending requests + approved showings).
 */
export async function getAgentShowings() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { pendingBids: [] as any[], approvedShowings: [] as any[] }
  }

  const { data: pendingBids, error: bidsError } = await supabase
    .from('showing_bids')
    .select(
      `
      id,
      bid_amount,
      status,
      created_at,
      showing:showings(
        id,
        requested_date,
        requested_time,
        status,
        listing:listings!listing_id(id, address, city, state, photos, price)
      )
    `
    )
    .eq('agent_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (bidsError) {
    return {
      error: bidsError.message,
      pendingBids: [] as any[],
      approvedShowings: [] as any[],
    }
  }

  const { data: approvedShowings, error: showingsError } = await supabase
    .from('showings')
    .select(
      `
      id,
      requested_date,
      requested_time,
      status,
      payout_amount,
      lock_code_revealed,
      listing:listings!listing_id(id, address, city, state, photos, price, lock_code)
    `
    )
    .eq('assigned_agent_id', user.id)
    .in('status', ['assigned', 'completed'])
    .order('requested_date', { ascending: true })

  if (showingsError) {
    return {
      error: showingsError.message,
      pendingBids: pendingBids ?? [],
      approvedShowings: [] as any[],
    }
  }

  return { pendingBids: pendingBids ?? [], approvedShowings: approvedShowings ?? [] }
}

export async function acceptBid(bidId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get the bid
  const { data: bid, error: bidError } = await supabase
    .from('showing_bids')
    .select('*, showing:showings(listing_id)')
    .eq('id', bidId)
    .single()

  if (bidError || !bid) {
    return { error: 'Bid not found' }
  }

  // Verify ownership of listing
  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', (bid.showing as any).listing_id)
    .single()

  if (listing?.seller_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  // Accept the bid
  const { error: updateBidError } = await supabase
    .from('showing_bids')
    .update({ status: 'accepted' })
    .eq('id', bidId)

  if (updateBidError) {
    return { error: updateBidError.message }
  }

  // Update showing with assigned agent
  const { error: updateShowingError } = await supabase
    .from('showings')
    .update({
      status: 'assigned',
      assigned_agent_id: bid.agent_id,
      payout_amount: bid.bid_amount,
      lock_code_revealed: true, // seller approval reveals code to agent
    })
    .eq('id', bid.showing_id)

  if (updateShowingError) {
    return { error: updateShowingError.message }
  }

  // Reject other bids
  await supabase
    .from('showing_bids')
    .update({ status: 'rejected' })
    .eq('showing_id', bid.showing_id)
    .neq('id', bidId)

  revalidatePath('/seller/showings')
  revalidatePath('/agent')

  return { success: true }
}

export async function rejectBid(bidId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: bid, error: bidError } = await supabase
    .from('showing_bids')
    .select('id, showing_id, agent_id, status, showing:showings(listing_id)')
    .eq('id', bidId)
    .single()

  if (bidError || !bid) {
    return { error: 'Bid not found' }
  }

  // Verify ownership of listing
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', (bid.showing as any).listing_id)
    .single()

  if (listingError) {
    return { error: listingError.message }
  }

  if (listing?.seller_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { error: updateBidError } = await supabase
    .from('showing_bids')
    .update({ status: 'rejected' })
    .eq('id', bidId)

  if (updateBidError) {
    return { error: updateBidError.message }
  }

  // If no pending bids remain, cancel the showing
  const { data: remaining } = await supabase
    .from('showing_bids')
    .select('id')
    .eq('showing_id', bid.showing_id)
    .eq('status', 'pending')

  if (!remaining || remaining.length === 0) {
    await supabase
      .from('showings')
      .update({ status: 'cancelled' })
      .eq('id', bid.showing_id)
  }

  revalidatePath('/seller/showings')

  return { success: true }
}

export async function completeShowing(
  showingId: string,
  feedback?: string,
  rating?: number
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: showing, error } = await supabase
    .from('showings')
    .update({
      status: 'completed',
      feedback,
      rating,
    })
    .eq('id', showingId)
    .eq('assigned_agent_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // TODO: Update agent stats / payout workflow

  revalidatePath('/agent')

  return { showing }
}

export async function getLockCode(showingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify agent is assigned and showing is within time window
  const { data: showing } = await supabase
    .from('showings')
    .select(
      `
      *,
      listing:listings(lock_code)
    `
    )
    .eq('id', showingId)
    .eq('assigned_agent_id', user.id)
    .eq('status', 'assigned')
    .single()

  if (!showing) {
    return { error: 'Showing not found or not authorized' }
  }

  // Check if within 1 hour of showing time
  const showingTime = new Date(`${showing.requested_date}T${showing.requested_time}`)
  const now = new Date()
  const diffMs = showingTime.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours > 1) {
    return { error: 'Lock code available 1 hour before showing' }
  }

  // Mark lock code as revealed
  await supabase.from('showings').update({ lock_code_revealed: true }).eq('id', showingId)

  return { lockCode: (showing.listing as any).lock_code }
}

export async function updateAgentServiceArea(input: {
  serviceZip?: string
  serviceCity?: string
  serviceState?: string
  serviceRadiusMiles?: number
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const serviceZip = input.serviceZip?.trim() || null
  const serviceCity = input.serviceCity?.trim() || null
  const serviceState = input.serviceState?.trim() || null
  const serviceRadiusMiles = Number.isFinite(input.serviceRadiusMiles)
    ? Math.max(1, Number(input.serviceRadiusMiles))
    : null

  const { error } = await supabase
    .from('profiles')
    .update({
      service_zip: serviceZip,
      service_city: serviceCity,
      service_state: serviceState,
      ...(serviceRadiusMiles ? { service_radius_miles: serviceRadiusMiles } : {}),
    } as any)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/agent')
  revalidatePath('/agent/showings')

  return { success: true }
}

export async function getAvailableShowingsInMyArea() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { groups: [] as any[], serviceArea: null as any }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('service_zip, service_city, service_state, service_radius_miles')
    .eq('id', user.id)
    .single()

  // Pre-filter listings by service area (lightweight; no geo yet)
  let listingIds: string[] | null = null
  if (profile?.service_zip || profile?.service_city || profile?.service_state) {
    let q = supabase.from('listings').select('id').eq('status', 'active')

    if (profile?.service_zip) q = q.eq('zip', profile.service_zip)
    if (profile?.service_city) q = q.eq('city', profile.service_city)
    if (profile?.service_state) q = q.eq('state', profile.service_state)

    const { data: listings, error: listingsError } = await q
    if (listingsError) {
      return { error: listingsError.message, groups: [] as any[], serviceArea: profile ?? null }
    }

    listingIds = (listings ?? []).map((l: any) => l.id)

    // If area is set but no matching listings, return empty state.
    if (listingIds.length === 0) {
      return { groups: [] as any[], serviceArea: profile ?? null }
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  let showingsQuery = supabase
    .from('showings')
    .select(
      `
      id,
      requested_date,
      requested_time,
      status,
      claim_mode,
      buyer_name,
      created_at,
      listing:listings!listing_id(id, address, city, state, zip, price, photos)
    `
    )
    .is('assigned_agent_id', null)
    .in('status', ['pending', 'bidding'])
    .gte('requested_date', today)
    // Claimable showings: legacy buyer requests are 'bidding'; new flow uses claim_mode='first_claim'
    .or('status.eq.bidding,claim_mode.eq.first_claim')
    .order('requested_date', { ascending: true })
    .order('requested_time', { ascending: true })

  if (listingIds) {
    showingsQuery = showingsQuery.in('listing_id', listingIds)
  }

  const { data: showings, error } = await showingsQuery

  if (error) {
    return { error: error.message, groups: [] as any[], serviceArea: profile ?? null }
  }

  const map = new Map<string, { listing: any; slots: any[] }>()

  for (const s of showings ?? []) {
    const listing = (s as any).listing
    const listingId = listing?.id
    if (!listingId) continue

    const existing = map.get(listingId)
    if (existing) {
      existing.slots.push(s)
    } else {
      map.set(listingId, { listing, slots: [s] })
    }
  }

  const groups = Array.from(map.values()).sort((a, b) => {
    const a0 = a.slots[0]
    const b0 = b.slots[0]
    const aKey = `${a0.requested_date}T${a0.requested_time}`
    const bKey = `${b0.requested_date}T${b0.requested_time}`
    return aKey.localeCompare(bKey)
  })

  return { groups, serviceArea: profile ?? null }
}

export async function claimShowing(showingId: string, bidAmount: number, message?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is an agent
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'agent') {
    return { error: 'Only agents can claim showings' }
  }

  if (!Number.isFinite(bidAmount) || bidAmount < 75) {
    return { error: 'Bid amount must be at least $75' }
  }

  const { data: showing, error: showingError } = await supabase
    .from('showings')
    .select('id, status, assigned_agent_id, claim_mode')
    .eq('id', showingId)
    .single()

  if (showingError || !showing) {
    return { error: showingError?.message ?? 'Showing not found' }
  }

  if (showing.assigned_agent_id) {
    return { error: 'This showing has already been claimed' }
  }

  if (!['pending', 'bidding'].includes((showing as any).status)) {
    return { error: 'This showing is not available to claim' }
  }

  const isClaimable = (showing as any).status === 'bidding' || (showing as any).claim_mode === 'first_claim'
  if (!isClaimable) {
    return { error: 'This showing requires seller approval and cannot be claimed instantly' }
  }

  // Record the claim/request
  const { error: requestError } = await supabase.from('showing_requests').insert({
    showing_id: showingId,
    agent_id: user.id,
    bid_amount: bidAmount,
    message,
    status: 'claimed',
  })

  if (requestError) {
    // Unique constraint commonly hits here if agent already claimed
    return { error: requestError.message }
  }

  // Atomically assign if still unclaimed
  const { data: updated, error: updateError } = await supabase
    .from('showings')
    .update({
      status: 'assigned',
      assigned_agent_id: user.id,
      payout_amount: bidAmount,
      lock_code_revealed: true,
    })
    .eq('id', showingId)
    .is('assigned_agent_id', null)
    .select('id')

  if (updateError) {
    return { error: updateError.message }
  }

  if (!updated || updated.length === 0) {
    await supabase
      .from('showing_requests')
      .update({ status: 'rejected' })
      .eq('showing_id', showingId)
      .eq('agent_id', user.id)

    return { error: 'This showing was claimed by someone else' }
  }

  revalidatePath('/agent')
  revalidatePath('/agent/showings')
  revalidatePath('/agent/showings/' + showingId)
  revalidatePath('/agent/my-showings')

  return { success: true }
}
