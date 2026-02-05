import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const { listing_id, type } = session.metadata || {}

      if (type === 'listing_fee' && listing_id) {
        // Activate listing now that payment completed
        await supabaseAdmin
          .from('listings')
          .update({ status: 'active' })
          .eq('id', listing_id)

        // Record payment
        await supabaseAdmin.from('payments').insert({
          listing_id,
          amount: session.amount_total,
          type: 'listing_fee',
          status: 'completed',
          stripe_payment_id: session.payment_intent as string,
          user_id: (await supabaseAdmin
            .from('listings')
            .select('seller_id')
            .eq('id', listing_id)
            .single()).data?.seller_id,
        })

        // TODO: Trigger MLS submission workflow
        console.log(`Listing ${listing_id} payment completed, ready for MLS submission`)
      }
      break
    }

    case 'account.updated': {
      // Agent connected account was updated
      const account = event.data.object
      const userId = account.metadata?.user_id

      if (userId && account.charges_enabled) {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_account_id: account.id, stripe_onboarded: true })
          .eq('id', userId)
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
