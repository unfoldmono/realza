import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentHeader } from '@/app/agent/_components/AgentHeader'
import { getAvailableShowingsInMyArea, updateAgentServiceArea } from '@/lib/actions/showings'
import { getProfile } from '@/lib/actions/auth'

export const runtime = 'nodejs'

function fmtDateTime(date?: string, time?: string) {
  if (!date) return ''
  return time ? `${date} ${String(time).slice(0, 5)}` : date
}

export default async function AgentAvailableShowingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }> | { error?: string }
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fffbf7] flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h1>
            <p className="text-gray-600 mb-6">Please sign in to view available showings.</p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  async function saveArea(formData: FormData) {
    'use server'

    const serviceZip = String(formData.get('serviceZip') ?? '').trim()
    const serviceCity = String(formData.get('serviceCity') ?? '').trim()
    const serviceState = String(formData.get('serviceState') ?? '').trim()
    const serviceRadiusMiles = Number(formData.get('serviceRadiusMiles') ?? 25)

    const result = await updateAgentServiceArea({
      serviceZip: serviceZip || undefined,
      serviceCity: serviceCity || undefined,
      serviceState: serviceState || undefined,
      serviceRadiusMiles,
    })

    if (result?.error) {
      redirect(`/agent/showings?error=${encodeURIComponent(result.error)}`)
    }

    redirect('/agent/showings')
  }

  const { groups, serviceArea, error } = await getAvailableShowingsInMyArea()
  const profile = await getProfile()

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <AgentHeader active="/agent/showings" userName={profile?.full_name} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Showings</h1>
          <p className="text-gray-600">
            Claim open showing slots near your service area. Lockbox codes are revealed after claiming.
          </p>
        </div>

        {(resolvedSearchParams?.error || error) && (
          <div className="card mb-6 border border-red-200">
            <p className="text-red-700">{resolvedSearchParams?.error ?? error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2">Your service area</h2>
              <p className="text-sm text-gray-600 mb-5">
                Set a simple area filter (zip/city/state). This helps showings stay relevant.
              </p>

              <form action={saveArea} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
                  <input
                    name="serviceZip"
                    className="input"
                    placeholder="e.g. 33139"
                    defaultValue={serviceArea?.service_zip ?? ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    name="serviceCity"
                    className="input"
                    placeholder="e.g. Miami"
                    defaultValue={serviceArea?.service_city ?? ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    name="serviceState"
                    className="input"
                    placeholder="e.g. FL"
                    defaultValue={serviceArea?.service_state ?? ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Radius (miles)
                  </label>
                  <input
                    name="serviceRadiusMiles"
                    type="number"
                    min={1}
                    step={1}
                    className="input"
                    defaultValue={serviceArea?.service_radius_miles ?? 25}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note: radius is stored now; geo filtering can be added later.
                  </p>
                </div>

                <button type="submit" className="btn-primary w-full">
                  Save area
                </button>
              </form>
            </div>

            <div className="card mt-6">
              <h3 className="font-semibold mb-2">How claiming works</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Open a showing slot</li>
                <li>Enter your bid and claim it</li>
                <li>Lockbox code appears immediately (if provided)</li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-2">
            {groups.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-semibold mb-2">No available showings</h3>
                <p className="text-gray-600">
                  Try adjusting your service area, or check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {groups.map((group: any) => {
                  const listing = group.listing
                  const slots = Array.isArray(group.slots) ? group.slots : []
                  const photo = Array.isArray(listing?.photos) ? listing.photos[0] : null

                  return (
                    <div key={listing.id} className="card overflow-hidden p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-48 h-40 sm:h-auto bg-gray-100">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="Listing" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                              No photo
                            </div>
                          )}
                        </div>

                        <div className="flex-1 p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-lg truncate">
                                {listing.address}
                              </div>
                              <div className="text-sm text-gray-600">
                                {listing.city}, {listing.state} {listing.zip}
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="badge badge-coral">
                                  ${Number(listing.price ?? 0).toLocaleString()}
                                </span>
                                <span className="badge bg-gray-100 text-gray-700">
                                  {slots.length} slot{slots.length === 1 ? '' : 's'}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Link
                                href={`/listing/${listing.id}`}
                                className="btn-secondary px-5 py-2 text-sm"
                              >
                                Property
                              </Link>
                            </div>
                          </div>

                          <div className="mt-5">
                            <div className="text-sm font-semibold text-gray-900 mb-2">
                              Available time slots
                            </div>
                            <div className="space-y-2">
                              {slots.slice(0, 4).map((slot: any) => (
                                <Link
                                  key={slot.id}
                                  href={`/agent/showings/${slot.id}`}
                                  className="flex items-center justify-between gap-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl px-4 py-3"
                                >
                                  <div className="text-sm text-gray-800">
                                    {fmtDateTime(slot.requested_date, slot.requested_time)}
                                  </div>
                                  <div className="text-sm font-semibold text-[#ff6b4a]">View &amp; claim</div>
                                </Link>
                              ))}
                            </div>

                            {slots.length > 4 ? (
                              <div className="mt-3 text-xs text-gray-500">
                                Showing {4} of {slots.length} slots for this property.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
