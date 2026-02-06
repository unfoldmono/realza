import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewListingClient from './NewListingClient'

export const runtime = 'nodejs'

export default async function NewSellerListingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard/new')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type === 'agent') {
    redirect('/agent')
  }

  return <NewListingClient />
}
