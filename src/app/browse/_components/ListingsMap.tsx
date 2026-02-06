'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { MLSListing } from '@/lib/data/mockListings'
import { ListingCardCompact } from './ListingCard'

// Mapbox GL types - using any for dynamically loaded library
declare global {
  interface Window {
    mapboxgl?: any
  }
}

interface ListingsMapProps {
  listings: MLSListing[]
  hoveredListingId: string | null
  selectedListingId: string | null
  onListingHover: (id: string | null) => void
  onListingSelect: (id: string | null) => void
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
const REALZA_COLOR = '#ff6b4a' // Orange for Realza listings
const MLS_COLOR = '#0d9488'    // Teal for other MLS listings

// Florida center coordinates (Tampa Bay area)
const DEFAULT_CENTER: [number, number] = [-82.4572, 27.9506]
const DEFAULT_ZOOM = 8

export default function ListingsMap({
  listings,
  hoveredListingId,
  selectedListingId,
  onListingHover,
  onListingSelect,
}: ListingsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Load Mapbox GL JS
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.mapboxgl) {
      setIsLoaded(true)
      return
    }

    // Load CSS
    const link = document.createElement('link')
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    // Load JS
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'
    script.async = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => setMapError('Failed to load map')
    document.head.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapContainer.current || map.current) return
    if (!MAPBOX_TOKEN) {
      setMapError('Map token not configured')
      return
    }

    try {
      const mapboxgl = window.mapboxgl!
      mapboxgl.accessToken = MAPBOX_TOKEN

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      })

      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Fit bounds to all listings when loaded
      mapInstance.on('load', () => {
        if (listings.length > 0) {
          fitBounds(listings)
        }
      })
      
      map.current = mapInstance
    } catch (err) {
      console.error('Map initialization error:', err)
      setMapError('Failed to initialize map')
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [isLoaded])

  // Fit map to bounds of listings
  const fitBounds = useCallback((listingsToFit: MLSListing[]) => {
    if (!map.current || listingsToFit.length === 0) return

    const mapboxgl = window.mapboxgl!
    const bounds = new mapboxgl.LngLatBounds()
    listingsToFit.forEach((listing) => {
      bounds.extend([listing.lng, listing.lat])
    })

    map.current.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 13,
    })
  }, [])

  // Update markers when listings change
  useEffect(() => {
    if (!map.current || !isLoaded || !window.mapboxgl) return

    const mapboxgl = window.mapboxgl
    const currentMarkers = markersRef.current
    const listingIds = new Set(listings.map((l) => l.id))

    // Remove markers that are no longer in listings
    currentMarkers.forEach((marker, id) => {
      if (!listingIds.has(id)) {
        marker.remove()
        currentMarkers.delete(id)
      }
    })

    // Add/update markers
    listings.forEach((listing) => {
      if (currentMarkers.has(listing.id)) {
        // Update existing marker color if needed
        const marker = currentMarkers.get(listing.id)!
        const el = marker.getElement()
        const isHighlighted = listing.id === hoveredListingId || listing.id === selectedListingId
        updateMarkerStyle(el, listing.is_realza, isHighlighted)
      } else {
        // Create new marker
        const el = createMarkerElement(listing)
        
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([listing.lng, listing.lat])
          .addTo(map.current!)

        // Click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onListingSelect(listing.id)
          showPopup(listing)
        })

        // Hover handlers
        el.addEventListener('mouseenter', () => onListingHover(listing.id))
        el.addEventListener('mouseleave', () => onListingHover(null))

        currentMarkers.set(listing.id, marker)
      }
    })

    // Fit bounds if listings changed significantly
    if (listings.length > 0) {
      fitBounds(listings)
    }
  }, [listings, isLoaded, hoveredListingId, selectedListingId, onListingHover, onListingSelect, fitBounds])

  // Update marker styles on hover
  useEffect(() => {
    if (!isLoaded) return

    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      const listing = listings.find((l) => l.id === id)
      if (!listing) return
      
      const isHighlighted = id === hoveredListingId || id === selectedListingId
      updateMarkerStyle(el, listing.is_realza, isHighlighted)
    })
  }, [hoveredListingId, selectedListingId, listings, isLoaded])

  // Show popup for selected listing
  const showPopup = useCallback((listing: MLSListing) => {
    if (!map.current || !window.mapboxgl) return

    // Remove existing popup
    popupRef.current?.remove()

    const mapboxgl = window.mapboxgl
    
    // Create popup content
    const popupContent = document.createElement('div')
    popupContent.innerHTML = `
      <div class="listing-popup">
        <div class="popup-image" style="background-image: url('${listing.photos[0] || ''}')">
          ${listing.is_realza ? '<span class="popup-badge">Realza</span>' : ''}
        </div>
        <div class="popup-content">
          <div class="popup-price">$${listing.price.toLocaleString()}</div>
          <div class="popup-details">${listing.beds} bd • ${listing.baths} ba • ${listing.sqft.toLocaleString()} sqft</div>
          <div class="popup-address">${listing.address}</div>
          <div class="popup-city">${listing.city}, ${listing.state}</div>
          <a href="/listing/${listing.id}" class="popup-link">View Details →</a>
        </div>
      </div>
    `

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '280px',
    })
      .setLngLat([listing.lng, listing.lat])
      .setDOMContent(popupContent)
      .addTo(map.current)

    popup.on('close', () => {
      onListingSelect(null)
    })
    
    popupRef.current = popup
  }, [onListingSelect])

  // Show popup when selection changes externally
  useEffect(() => {
    if (!selectedListingId) {
      popupRef.current?.remove()
      return
    }

    const listing = listings.find((l) => l.id === selectedListingId)
    if (listing) {
      showPopup(listing)
      // Pan to selected listing
      map.current?.flyTo({
        center: [listing.lng, listing.lat],
        zoom: Math.max(map.current.getZoom(), 12),
      })
    }
  }, [selectedListingId, listings, showPopup])

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-600">{mapError}</p>
          <p className="text-sm text-gray-400 mt-2">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the map
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .listing-popup {
          width: 260px;
        }
        .popup-image {
          height: 140px;
          background-size: cover;
          background-position: center;
          background-color: #f3f4f6;
          border-radius: 8px 8px 0 0;
          position: relative;
        }
        .popup-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #ff6b4a;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .popup-content {
          padding: 12px;
        }
        .popup-price {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .popup-details {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }
        .popup-address {
          font-size: 13px;
          color: #374151;
          margin-top: 6px;
          font-weight: 500;
        }
        .popup-city {
          font-size: 12px;
          color: #9ca3af;
        }
        .popup-link {
          display: block;
          margin-top: 10px;
          background: #ff6b4a;
          color: white;
          text-align: center;
          padding: 8px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
        }
        .popup-link:hover {
          background: #e85a3a;
        }
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .mapboxgl-popup-close-button {
          font-size: 18px;
          padding: 4px 8px;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .mapboxgl-popup-close-button:hover {
          background: transparent;
        }
      `}</style>
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
    </>
  )
}

function createMarkerElement(listing: MLSListing): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'listing-marker'
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `
  updateMarkerStyle(el, listing.is_realza, false)
  
  // Price label inside marker
  const priceLabel = document.createElement('span')
  priceLabel.style.cssText = `
    transform: rotate(45deg);
    font-size: 9px;
    font-weight: 700;
    color: white;
  `
  priceLabel.textContent = listing.price >= 1000000 
    ? `${(listing.price / 1000000).toFixed(1)}M`
    : `${Math.round(listing.price / 1000)}K`
  el.appendChild(priceLabel)
  
  return el
}

function updateMarkerStyle(el: HTMLElement, isRealza: boolean, isHighlighted: boolean) {
  const baseColor = isRealza ? REALZA_COLOR : MLS_COLOR
  const scale = isHighlighted ? 1.3 : 1
  const zIndex = isHighlighted ? 1000 : 1
  
  el.style.backgroundColor = baseColor
  el.style.transform = `rotate(-45deg) scale(${scale})`
  el.style.zIndex = String(zIndex)
  el.style.border = isHighlighted ? '3px solid white' : 'none'
}
