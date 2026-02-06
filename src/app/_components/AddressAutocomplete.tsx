'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AddressComponents {
  address: string
  city: string
  state: string
  zip: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (components: AddressComponents) => void
  placeholder?: string
  className?: string
  error?: boolean
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete
        }
      }
    }
    initGooglePlaces?: () => void
  }
}

// Load Google Places script once
let scriptLoaded = false
let scriptLoading = false
const loadCallbacks: (() => void)[] = []

function loadGooglePlacesScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
      resolve()
      return
    }

    loadCallbacks.push(resolve)

    if (scriptLoading) return

    scriptLoading = true

    window.initGooglePlaces = () => {
      scriptLoaded = true
      scriptLoading = false
      loadCallbacks.forEach((cb) => cb())
      loadCallbacks.length = 0
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address...',
  className = '',
  error = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return

    const place = autocompleteRef.current.getPlace()
    if (!place.address_components) return

    let streetNumber = ''
    let route = ''
    let city = ''
    let state = ''
    let zip = ''

    for (const component of place.address_components) {
      const types = component.types

      if (types.includes('street_number')) {
        streetNumber = component.long_name
      } else if (types.includes('route')) {
        route = component.long_name
      } else if (types.includes('locality')) {
        city = component.long_name
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name
      } else if (types.includes('postal_code')) {
        zip = component.long_name
      }
    }

    const address = streetNumber ? `${streetNumber} ${route}` : route

    onSelect({ address, city, state, zip })
  }, [onSelect])

  useEffect(() => {
    if (!apiKey) return

    loadGooglePlacesScript(apiKey).then(() => {
      setIsLoaded(true)
    })
  }, [apiKey])

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) return

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      types: ['address'],
      fields: ['address_components', 'formatted_address'],
    })

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect)

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps.event?.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isLoaded, handlePlaceSelect])

  // If no API key, show regular input with a note
  if (!apiKey) {
    return (
      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input ${error ? 'border-red-300 focus:border-red-400' : ''} ${className}`}
          autoComplete="street-address"
        />
        <p className="text-xs text-gray-400 mt-1">
          💡 Tip: Add Google Places API key for address suggestions
        </p>
      </div>
    )
  }

  // Sync external value changes to input (for when address is auto-filled)
  useEffect(() => {
    if (inputRef.current && value && inputRef.current.value !== value) {
      inputRef.current.value = value
    }
  }, [value])

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      onBlur={(e) => onChange(e.target.value)} // Also sync on blur
      placeholder={placeholder}
      className={`input ${error ? 'border-red-300 focus:border-red-400' : ''} ${className}`}
      autoComplete="off"
    />
  )
}
