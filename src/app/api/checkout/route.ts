import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const { listingId } = (await request.json()) as { listingId?: string }
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id')
      .eq('id', listingId)
      .eq('seller_id', user.id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const origin = new URL(request.url).origin

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Realza Listing Fee',
              description: 'One-time flat fee to activate your MLS listing',
            },
            unit_amount: 20000, // $200
          },
          quantity: 1,
        },
      ],
      metadata: {
        listing_id: listingId,
        type: 'listing_fee',
      },
      success_url: `${origin}/seller/listing/${listingId}/success`,
      cancel_url: `${origin}/seller/new`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
