import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const userType = searchParams.get('type') || 'seller'
  const name = searchParams.get('name')
  const license = searchParams.get('license')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // Create profile if it doesn't exist
      if (!existingProfile && name) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          full_name: decodeURIComponent(name),
          user_type: userType as 'seller' | 'agent',
          license_number: license ? decodeURIComponent(license) : null,
        })
      }

      // Redirect based on user type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      const redirectPath = profile?.user_type === 'agent' ? '/agent' : '/seller'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Auth error, redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
