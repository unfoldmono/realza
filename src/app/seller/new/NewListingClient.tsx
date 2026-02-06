'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, useCallback } from 'react'
import type { DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { uploadPhoto, deletePhoto } from '@/lib/actions/storage'
import { createListing } from '@/lib/actions/listings'
import AddressAutocomplete from '@/app/_components/AddressAutocomplete'

type Step = 'address' | 'details' | 'description' | 'price' | 'photos' | 'review'

type FormState = {
  address: string
  city: string
  state: string
  zip: string
  beds: string
  baths: string
  sqft: string
  yearBuilt: string
  description: string
  price: string
  photos: string[]
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function toNumber(value: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

function isValidUSState(value: string) {
  return /^[A-Z]{2}$/.test(value)
}

export default function NewListingClient() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<Step>('address')
  const [error, setError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<FormState>({
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    beds: '',
    baths: '',
    sqft: '',
    yearBuilt: '',
    description: '',
    price: '',
    photos: [],
  })

  const steps = useMemo(
    () =>
      [
        { key: 'address' as const, label: 'Address', icon: '📍' },
        { key: 'details' as const, label: 'Details', icon: '🏠' },
        { key: 'description' as const, label: 'Description', icon: '📝' },
        { key: 'price' as const, label: 'Price', icon: '💰' },
        { key: 'photos' as const, label: 'Photos', icon: '📸' },
        { key: 'review' as const, label: 'Review', icon: '✅' },
      ],
    []
  )

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  const suggestedPrice = useMemo(() => {
    const beds = toNumber(form.beds)
    const baths = toNumber(form.baths)
    const sqft = toNumber(form.sqft)

    if (!Number.isFinite(sqft) || sqft <= 0) return null

    const base = sqft * 240
    const bedAdj = Number.isFinite(beds) ? beds * 18000 : 0
    const bathAdj = Number.isFinite(baths) ? baths * 12000 : 0

    const suggestion = Math.max(150000, Math.round((base + bedAdj + bathAdj) / 1000) * 1000)
    return suggestion
  }, [form.beds, form.baths, form.sqft])

  const setValue = (key: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value } as FormState))
    // Clear field error when user starts typing
    if (fieldErrors[key as string]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[key as string]
        return next
      })
    }
  }

  const handleAddressSelect = useCallback((components: { address: string; city: string; state: string; zip: string }) => {
    setForm((prev) => ({
      ...prev,
      address: components.address,
      city: components.city,
      state: components.state,
      zip: components.zip,
    }))
    // Clear all address-related errors
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.address
      delete next.city
      delete next.state
      delete next.zip
      return next
    })
  }, [])

  const getAddressErrors = (): Record<string, string> => {
    const next: Record<string, string> = {}

    if (!form.address.trim()) next.address = 'Street address is required.'
    if (!form.city.trim()) next.city = 'City is required.'

    const state = form.state.trim().toUpperCase()
    if (!state) next.state = 'State is required.'
    else if (!isValidUSState(state)) next.state = 'Use 2-letter state code (e.g., FL).'

    const zip = form.zip.trim()
    if (!zip) next.zip = 'ZIP is required.'
    else if (!/^\d{5}(-\d{4})?$/.test(zip)) next.zip = 'Enter a valid ZIP.'

    return next
  }

  const getDetailsErrors = (): Record<string, string> => {
    const next: Record<string, string> = {}

    const beds = toNumber(form.beds)
    if (!Number.isFinite(beds) || beds < 0) next.beds = 'Enter a valid number of bedrooms.'

    const baths = toNumber(form.baths)
    if (!Number.isFinite(baths) || baths < 0) next.baths = 'Enter a valid number of bathrooms.'

    const sqft = toNumber(form.sqft)
    if (!Number.isFinite(sqft) || sqft <= 0) next.sqft = 'Square footage must be greater than 0.'

    if (form.yearBuilt.trim()) {
      const year = toNumber(form.yearBuilt)
      const currentYear = new Date().getFullYear() + 1
      if (!Number.isFinite(year) || year < 1700 || year > currentYear) {
        next.yearBuilt = `Enter a valid year (1700–${currentYear}).`
      }
    }

    return next
  }

  const getDescriptionErrors = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!form.description.trim()) next.description = 'Description is required.'
    else if (form.description.trim().length < 40) next.description = 'Add a bit more detail (min 40 chars).'
    return next
  }

  const getPriceErrors = (): Record<string, string> => {
    const next: Record<string, string> = {}
    const price = toNumber(form.price)
    if (!Number.isFinite(price) || price < 1000) next.price = 'Enter a valid asking price.'
    return next
  }

  const getPhotosErrors = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!form.photos.length) next.photos = 'Please upload at least 1 photo.'
    return next
  }

  const validateWith = (errors: Record<string, string>) => {
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateAddress = () => validateWith(getAddressErrors())
  const validateDetails = () => validateWith(getDetailsErrors())
  const validateDescription = () => validateWith(getDescriptionErrors())
  const validatePrice = () => validateWith(getPriceErrors())
  const validatePhotos = () => validateWith(getPhotosErrors())

  const canGoNext = () => {
    if (step === 'address') return validateAddress
    if (step === 'details') return validateDetails
    if (step === 'description') return validateDescription
    if (step === 'price') return validatePrice
    if (step === 'photos') return validatePhotos
    return null
  }

  const goNext = () => {
    setError('')
    const validator = canGoNext()
    if (validator && !validator()) return

    const next = steps[currentStepIndex + 1]
    if (next) setStep(next.key)
  }

  const goBack = () => {
    setError('')
    setFieldErrors({})
    const prev = steps[currentStepIndex - 1]
    if (prev) setStep(prev.key)
  }

  const pickFiles = () => fileInputRef.current?.click()

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError('')
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.photos
      return next
    })

    setUploading(true)

    try {
      const allowed = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (allowed.length === 0) throw new Error('Please choose image files (JPG/PNG/HEIC).')

      const tooLarge = allowed.find((f) => f.size > 12 * 1024 * 1024)
      if (tooLarge) throw new Error('One or more files are too large (max 12MB each).')

      const uploads = allowed.map(async (file) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await uploadPhoto(fd)
        if (res?.error) throw new Error(res.error)
        if (!res?.url) throw new Error('Upload failed')
        return res.url
      })

      const urls = await Promise.all(uploads)
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to upload photo(s)')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePhoto = async (url: string) => {
    setError('')
    // Optimistic UI
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((p) => p !== url) }))
    try {
      const res = await deletePhoto(url)
      if (res?.error) setError(res.error)
    } catch {
      // ignore
    }
  }

  const handleDrop = async (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (uploading) return
    await handleFilesSelected(e.dataTransfer.files)
  }

  const submitListing = async () => {
    setError('')

    const allErrors = {
      ...getAddressErrors(),
      ...getDetailsErrors(),
      ...getDescriptionErrors(),
      ...getPriceErrors(),
      ...getPhotosErrors(),
    }

    setFieldErrors(allErrors)

    if (Object.keys(allErrors).length > 0) {
      setError('Please fix the highlighted fields before submitting.')
      return
    }

    setSubmitting(true)

    const listingData = {
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zip: form.zip.trim(),
      beds: Math.round(toNumber(form.beds)),
      baths: toNumber(form.baths),
      sqft: Math.round(toNumber(form.sqft)),
      yearBuilt: form.yearBuilt.trim() ? Math.round(toNumber(form.yearBuilt)) : undefined,
      description: form.description.trim(),
      price: Math.round(toNumber(form.price)),
      photos: form.photos,
    }

    console.log('Creating listing with data:', listingData)

    try {
      const res = await createListing(listingData)

      console.log('Create listing response:', res)

      if (res?.error) throw new Error(res.error)
      if (!res?.listing?.id) throw new Error('Failed to create listing - no ID returned.')

      router.push(`/listing/${res.listing.id}`)
      router.refresh()
    } catch (e: unknown) {
      console.error('Listing creation error:', e)
      setError(e instanceof Error ? e.message : 'Something went wrong creating your listing.')
      setSubmitting(false)
    }
  }

  const FieldError = ({ name }: { name: keyof FormState | 'photos' | 'price' }) => {
    const msg = fieldErrors[name as string]
    if (!msg) return null
    return <p className="mt-1 text-sm text-red-600">{msg}</p>
  }

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ✕ Cancel
          </Link>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                    i <= currentStepIndex ? 'bg-[#ff6b4a] text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                  aria-current={i === currentStepIndex ? 'step' : undefined}
                >
                  {s.icon}
                </div>
                <div className="hidden md:block ml-3 min-w-0">
                  <div
                    className={`text-sm font-semibold ${
                      i <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-xs text-gray-500">Step {i + 1} of {steps.length}</div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-1 rounded mx-2 md:mx-4 flex-1 ${
                      i < currentStepIndex ? 'bg-[#ff6b4a]' : 'bg-gray-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Address */}
        {step === 'address' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Property address</h1>
              <p className="text-gray-600">Where is your home located?</p>
            </div>

            <div className="card space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street address</label>
                <AddressAutocomplete
                  value={form.address}
                  onChange={(value) => setValue('address', value)}
                  onSelect={handleAddressSelect}
                  placeholder="Start typing your address..."
                  error={!!fieldErrors.address}
                />
                <FieldError name="address" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setValue('city', e.target.value)}
                    placeholder="Naples"
                    className={`input ${fieldErrors.city ? 'border-red-300 focus:border-red-400' : ''}`}
                    autoComplete="address-level2"
                  />
                  <FieldError name="city" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    value={form.state}
                    onChange={(e) => setValue('state', e.target.value.toUpperCase())}
                    placeholder="FL"
                    maxLength={2}
                    className={`input ${fieldErrors.state ? 'border-red-300 focus:border-red-400' : ''}`}
                    autoComplete="address-level1"
                  />
                  <FieldError name="state" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                  <input
                    value={form.zip}
                    onChange={(e) => setValue('zip', e.target.value)}
                    placeholder="34102"
                    inputMode="numeric"
                    className={`input ${fieldErrors.zip ? 'border-red-300 focus:border-red-400' : ''}`}
                    autoComplete="postal-code"
                  />
                  <FieldError name="zip" />
                </div>
              </div>

              <div className="p-4 bg-[#fff0eb] rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡️</span>
                  <div>
                    <p className="font-medium text-[#ff6b4a]">Tip</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Make sure the address matches USPS formatting so buyers can find you easily.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={goNext} className="btn-primary flex-1">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Details */}
        {step === 'details' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Home details</h1>
              <p className="text-gray-600">Beds, baths, square footage, and year built.</p>
            </div>

            <div className="card space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={form.beds}
                    onChange={(e) => setValue('beds', e.target.value)}
                    placeholder="3"
                    min={0}
                    className={`input ${fieldErrors.beds ? 'border-red-300 focus:border-red-400' : ''}`}
                  />
                  <FieldError name="beds" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={form.baths}
                    onChange={(e) => setValue('baths', e.target.value)}
                    placeholder="2"
                    min={0}
                    step={0.5}
                    className={`input ${fieldErrors.baths ? 'border-red-300 focus:border-red-400' : ''}`}
                  />
                  <FieldError name="baths" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Square feet</label>
                  <input
                    type="number"
                    value={form.sqft}
                    onChange={(e) => setValue('sqft', e.target.value)}
                    placeholder="1850"
                    min={0}
                    className={`input ${fieldErrors.sqft ? 'border-red-300 focus:border-red-400' : ''}`}
                  />
                  <FieldError name="sqft" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year built</label>
                  <input
                    type="number"
                    value={form.yearBuilt}
                    onChange={(e) => setValue('yearBuilt', e.target.value)}
                    placeholder="2005"
                    min={1700}
                    className={`input ${fieldErrors.yearBuilt ? 'border-red-300 focus:border-red-400' : ''}`}
                  />
                  <FieldError name="yearBuilt" />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                We’ll use these details to format your public listing page.
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={goBack} className="btn-secondary flex-1">
                ← Back
              </button>
              <button onClick={goNext} className="btn-primary flex-1">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        {step === 'description' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Description</h1>
              <p className="text-gray-600">Highlight upgrades, features, and the neighborhood.</p>
            </div>

            <div className="card space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setValue('description', e.target.value)}
                  placeholder="Sun-filled home with an updated kitchen, open living space, and a backyard perfect for entertaining..."
                  rows={9}
                  className={`input resize-none ${
                    fieldErrors.description ? 'border-red-300 focus:border-red-400' : ''
                  }`}
                />
                <div className="flex items-center justify-between mt-2">
                  <FieldError name="description" />
                  <p className="text-xs text-gray-500">{form.description.trim().length} chars</p>
                </div>
              </div>

              <div className="p-4 bg-[#fff0eb] rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-medium text-[#ff6b4a]">Quick checklist</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Mention: renovations, roof age, HVAC, schools, walkability, and standout features.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={goBack} className="btn-secondary flex-1">
                ← Back
              </button>
              <button onClick={goNext} className="btn-primary flex-1">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Price */}
        {step === 'price' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Set your price</h1>
              <p className="text-gray-600">Choose an asking price you’re comfortable with.</p>
            </div>

            <div className="card space-y-6">
              <div className="p-6 bg-[#e8f5e9] rounded-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Suggested price (placeholder)</p>
                    <p className="text-3xl font-bold text-[#2e7d32]">
                      {suggestedPrice ? `$${suggestedPrice.toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    onClick={() => suggestedPrice && setValue('price', String(suggestedPrice))}
                    disabled={!suggestedPrice}
                  >
                    Use this
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  We’ll plug in real comps later. For now, this is a simple estimate based on sqft + beds/baths.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asking price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-2xl font-bold pointer-events-none">$</span>
                  <input
                    value={form.price}
                    onChange={(e) => setValue('price', onlyDigits(e.target.value))}
                    placeholder={suggestedPrice ? String(suggestedPrice) : '425000'}
                    inputMode="numeric"
                    className={`input pl-12 text-2xl font-bold ${
                      fieldErrors.price ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                  />
                </div>
                <FieldError name="price" />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={goBack} className="btn-secondary flex-1">
                ← Back
              </button>
              <button onClick={goNext} className="btn-primary flex-1">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Photos */}
        {step === 'photos' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Add photos</h1>
              <p className="text-gray-600">Aim for 10–20. Great photos drive more showings.</p>
            </div>

            <div className="card">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <button
                type="button"
                onClick={pickFiles}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`w-full border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                  fieldErrors.photos ? 'border-red-300' : 'border-gray-200 hover:border-[#ff6b4a]'
                }`}
                disabled={uploading}
              >
                <div className="text-5xl mb-4">📸</div>
                <p className="font-semibold text-gray-900 mb-2">
                  {uploading ? 'Uploading…' : 'Drop photos here or click to browse'}
                </p>
                <p className="text-gray-500 text-sm">JPG/PNG/HEIC · max 12MB each</p>
              </button>

              <FieldError name="photos" />

              {form.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {form.photos.map((url) => (
                    <div
                      key={url}
                      className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Listing photo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-[#fff0eb] rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-medium text-[#ff6b4a]">Photo checklist</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Exterior · living room · kitchen · primary bedroom · bathrooms · backyard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={goBack} className="btn-secondary flex-1" disabled={uploading}>
                ← Back
              </button>
              <button onClick={goNext} className="btn-primary flex-1" disabled={uploading}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Review & submit</h1>
              <p className="text-gray-600">Double-check everything before creating your listing.</p>
            </div>

            <div className="card space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-gray-500 text-sm">Address</p>
                  <p className="font-semibold text-gray-900 truncate">
                    {form.address}, {form.city}, {form.state} {form.zip}
                  </p>
                </div>
                <button type="button" onClick={() => setStep('address')} className="text-[#ff6b4a] text-sm">
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Beds</div>
                  <div className="text-lg font-semibold">{form.beds || '—'}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Baths</div>
                  <div className="text-lg font-semibold">{form.baths || '—'}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Sqft</div>
                  <div className="text-lg font-semibold">
                    {form.sqft ? Number(form.sqft).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-gray-500 text-xs">Year</div>
                  <div className="text-lg font-semibold">{form.yearBuilt || '—'}</div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Asking price</p>
                  <p className="font-bold text-2xl text-[#ff6b4a]">${Number(form.price || 0).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => setStep('price')} className="text-[#ff6b4a] text-sm">
                  Edit
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 text-sm">Description</p>
                  <button type="button" onClick={() => setStep('description')} className="text-[#ff6b4a] text-sm">
                    Edit
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-line mt-2">{form.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 text-sm">Photos</p>
                  <button type="button" onClick={() => setStep('photos')} className="text-[#ff6b4a] text-sm">
                    Edit
                  </button>
                </div>
                {form.photos.length ? (
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {form.photos.slice(0, 8).map((url) => (
                      <div key={url} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 mt-2">No photos uploaded.</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={goBack} className="btn-secondary flex-1" disabled={submitting}>
                ← Back
              </button>
              <button
                onClick={submitListing}
                className="btn-primary flex-1 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Creating listing…' : 'Submit listing →'}
              </button>
            </div>

            <p className="text-center text-gray-500 text-sm">
              After submission, you’ll be redirected to your listing page.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
