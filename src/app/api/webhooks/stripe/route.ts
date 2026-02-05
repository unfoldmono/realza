import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Use service role for webhooks (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Missing STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const listingId = session.metadata?.listing_id
      const type = session.metadata?.type

      if (type === 'listing_fee' && listingId) {
        // Activate the listing now that payment completed
        await supabaseAdmin.from('listings').update({ status: 'active' }).eq('id', listingId)

        const { data: listing } = await supabaseAdmin
          .from('listings')
          .select('seller_id')
          .eq('id', listingId)
          .single()

        const userId = listing?.seller_id

        if (userId) {
          await supabaseAdmin.from('payments').insert({
            user_id: userId,
            listing_id: listingId,
            amount: session.amount_total ?? 20000,
            type: 'listing_fee',
            status: 'completed',
            stripe_payment_id:
              (session.payment_intent as string | null) ?? session.id,
          })
        }

        console.log(`Listing ${listingId} payment completed; status set to active.`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
