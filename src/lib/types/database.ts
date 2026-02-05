export type UserType = 'seller' | 'agent'

export interface Profile {
  id: string
  email: string
  full_name: string
  user_type: UserType
  phone?: string
  license_number?: string // For agents
  avatar_url?: string
  rating?: number // For agents
  total_showings?: number // For agents
  // Agent service area
  service_zip?: string
  service_city?: string
  service_state?: string
  service_radius_miles?: number
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  seller_id: string
  address: string
  city: string
  state: string
  zip: string
  price: number
  beds: number
  baths: number
  sqft: number
  year_built?: number
  description: string
  photos: string[]
  status: 'draft' | 'pending' | 'active' | 'sold' | 'cancelled'
  lock_code?: string
  mls_number?: string
  views: number
  saves: number
  created_at: string
  updated_at: string
}

export interface Showing {
  id: string
  listing_id: string
  buyer_name?: string
  buyer_email?: string
  buyer_phone?: string
  requested_date: string
  requested_time: string
  status: 'pending' | 'bidding' | 'assigned' | 'completed' | 'cancelled'
  claim_mode?: 'seller_approves' | 'first_claim'
  assigned_agent_id?: string
  payout_amount?: number
  lock_code_revealed: boolean
  feedback?: string
  rating?: number
  created_at: string
  updated_at: string
}

export interface ShowingBid {
  id: string
  showing_id: string
  agent_id: string
  bid_amount: number
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface ShowingRequest {
  id: string
  showing_id: string
  agent_id: string
  bid_amount: number
  message?: string
  status: 'pending' | 'claimed' | 'withdrawn' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  listing_id: string
  sender_id: string
  recipient_id: string
  content: string
  read: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      listings: {
        Row: Listing
        Insert: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'views' | 'saves'>
        Update: Partial<Omit<Listing, 'id' | 'created_at'>>
      }
      showings: {
        Row: Showing
        Insert: Omit<Showing, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Showing, 'id' | 'created_at'>>
      }
      showing_bids: {
        Row: ShowingBid
        Insert: Omit<ShowingBid, 'id' | 'created_at'>
        Update: Partial<Omit<ShowingBid, 'id' | 'created_at'>>
      }
      showing_requests: {
        Row: ShowingRequest
        Insert: Omit<ShowingRequest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ShowingRequest, 'id' | 'created_at' | 'updated_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
    }
  }
}
