import Stripe from 'stripe'

// Only initialize if we have the key (prevents build errors)
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null as unknown as Stripe

// Create checkout session for $200 listing fee
export async function createListingCheckout(listingId: string, userEmail: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Realza MLS Listing',
            description: 'One-time flat fee to list your home on MLS',
          },
          unit_amount: 20000, // $200.00 in cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      listing_id: listingId,
      type: 'listing_fee',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/listing/${listingId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/new-listing?step=review&payment=cancelled`,
  })

  return session
}

// Create connected account for agents (to receive payouts)
export async function createAgentConnectedAccount(email: string, userId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    metadata: {
      user_id: userId,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  return account
}

// Create onboarding link for agent
export async function createAgentOnboardingLink(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/agent/settings?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/agent/settings?onboard=complete`,
    type: 'account_onboarding',
  })

  return accountLink
}

// Transfer payout to agent after showing
export async function transferToAgent(
  agentStripeAccountId: string,
  amount: number, // in cents
  showingId: string
) {
  const transfer = await stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: agentStripeAccountId,
    metadata: {
      showing_id: showingId,
      type: 'showing_payout',
    },
  })

  return transfer
}
