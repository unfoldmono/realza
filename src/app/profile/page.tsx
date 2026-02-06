import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const initial = profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <Link
            href={profile?.user_type === 'agent' ? '/agent' : '/seller'}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Your account information</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-[#ff6b4a] rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {initial}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="mt-2">
                <span className="badge badge-coral capitalize">
                  {profile?.user_type || 'user'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold mb-4">Account Details</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Full Name</div>
                <div className="font-medium text-gray-900">{profile?.full_name || 'Not set'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Email Address</div>
                <div className="font-medium text-gray-900">{user.email}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Account Type</div>
                <div className="font-medium text-gray-900 capitalize">{profile?.user_type || 'User'}</div>
              </div>

              {profile?.user_type === 'agent' && (
                <>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">License Number</div>
                    <div className="font-medium text-gray-900">{profile?.license_number || 'Not provided'}</div>
                  </div>

                  {profile?.rating && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Rating</div>
                      <div className="font-medium text-gray-900">
                        <span className="text-yellow-500">★</span> {profile.rating}
                      </div>
                    </div>
                  )}

                  {profile?.service_city && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Service Area</div>
                      <div className="font-medium text-gray-900">
                        {profile.service_city}, {profile.service_state} {profile.service_zip}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <div className="text-sm text-gray-500 mb-1">Member Since</div>
                <div className="font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="flex gap-3">
              <Link href="/settings" className="btn-secondary">
                ⚙️ Settings
              </Link>
              <Link
                href={profile?.user_type === 'agent' ? '/agent' : '/seller'}
                className="btn-primary"
              >
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
