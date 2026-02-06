'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { MLSListing } from '@/lib/data/mockListings'

interface ListingCardProps {
  listing: MLSListing
  isHovered?: boolean
  isSelected?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  compact?: boolean
}

function formatPrice(price: number) {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`
  }
  return `$${(price / 1000).toFixed(0)}K`
}

function formatPriceFull(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export default function ListingCard({
  listing,
  isHovered,
  isSelected,
  onMouseEnter,
  onMouseLeave,
  onClick,
  compact = false,
}: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement save functionality with auth check
    setIsSaved(!isSaved)
  }

  return (
    <Link
      href={`/browse/${listing.id}`}
      className={`
        block bg-white rounded-2xl overflow-hidden transition-all duration-200
        ${isHovered || isSelected ? 'shadow-lg ring-2 ring-[#ff6b4a] scale-[1.02]' : 'shadow-sm hover:shadow-md'}
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {listing.photos[0] && !imageError ? (
          <img
            src={listing.photos[0]}
            alt={listing.address}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
            </svg>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {listing.is_realza && (
            <span className="bg-[#ff6b4a] text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
              Listed by Realza
            </span>
          )}
          {listing.days_on_market <= 7 && (
            <span className="bg-[#0d9488] text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
              New
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`
            absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors
            ${isSaved ? 'bg-[#ff6b4a] text-white' : 'bg-white/90 text-gray-600 hover:text-[#ff6b4a]'}
            shadow-sm
          `}
        >
          <svg 
            className="w-4 h-4" 
            fill={isSaved ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        </button>

        {/* Price overlay on image */}
        <div className="absolute bottom-2 left-2">
          <span className="bg-white/95 backdrop-blur-sm text-gray-900 font-bold text-lg px-3 py-1 rounded-lg shadow-sm">
            {formatPriceFull(listing.price)}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-3">
        {/* Beds/Baths/Sqft */}
        <div className="flex items-center gap-3 text-sm text-gray-700 mb-1">
          <span className="font-semibold">{listing.beds}</span>
          <span className="text-gray-400">bd</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold">{listing.baths}</span>
          <span className="text-gray-400">ba</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold">{listing.sqft.toLocaleString()}</span>
          <span className="text-gray-400">sqft</span>
        </div>

        {/* Address */}
        <p className="text-gray-900 font-medium truncate">{listing.address}</p>
        <p className="text-gray-500 text-sm truncate">
          {listing.city}, {listing.state} {listing.zip}
        </p>

        {/* Property type */}
        {!compact && (
          <p className="text-xs text-gray-400 mt-1 capitalize">
            {listing.property_type.replace('_', ' ')} • {listing.days_on_market}d on market
          </p>
        )}
      </div>
    </Link>
  )
}

// Compact version for map popups
export function ListingCardCompact({ listing }: { listing: MLSListing }) {
  return (
    <div className="w-64 bg-white rounded-xl overflow-hidden shadow-xl">
      <div className="relative aspect-[16/10] bg-gray-100">
        {listing.photos[0] ? (
          <img
            src={listing.photos[0]}
            alt={listing.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            🏠
          </div>
        )}
        {listing.is_realza && (
          <span className="absolute top-2 left-2 bg-[#ff6b4a] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Realza
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-gray-900">{formatPriceFull(listing.price)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
          <span>{listing.beds} bd</span>
          <span>•</span>
          <span>{listing.baths} ba</span>
          <span>•</span>
          <span>{listing.sqft.toLocaleString()} sqft</span>
        </div>
        <p className="text-sm text-gray-700 truncate">{listing.address}</p>
        <p className="text-xs text-gray-500">{listing.city}, {listing.state}</p>
        <Link
          href={`/listing/${listing.id}`}
          className="mt-2 block w-full text-center bg-[#ff6b4a] text-white text-sm font-medium py-1.5 rounded-lg hover:bg-[#e85a3a] transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
