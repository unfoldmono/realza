import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

export const runtime = 'nodejs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/settings')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings</p>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium text-gray-900">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium text-gray-900">{profile?.full_name || 'Not set'}</div>
              </div>
              <Link href="/profile" className="text-[#ff6b4a] text-sm font-medium">
                Edit
              </Link>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="text-sm text-gray-500">Account Type</div>
                <div className="font-medium text-gray-900 capitalize">{profile?.user_type || 'User'}</div>
              </div>
            </div>

            {profile?.user_type === 'agent' && profile?.license_number && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm text-gray-500">License Number</div>
                  <div className="font-medium text-gray-900">{profile.license_number}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm text-gray-500">Member Since</div>
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
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Sign Out</h2>
          <p className="text-gray-600 text-sm mb-4">
            Sign out of your account on this device.
          </p>
          <form action={signOut}>
            <button type="submit" className="btn-secondary text-red-600 hover:bg-red-50 border-red-200">
              🚪 Sign Out
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
