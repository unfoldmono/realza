'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithEmail(email: string) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signUp(data: {
  email: string
  name: string
  userType: 'seller' | 'agent'
  licenseNumber?: string
}) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin')

  // Sign up with OTP
  const { error: authError } = await supabase.auth.signInWithOtp({
    email: data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?type=${data.userType}&name=${encodeURIComponent(data.name)}${data.licenseNumber ? `&license=${data.licenseNumber}` : ''}`,
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
