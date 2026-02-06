'use client'

import { useState, useRef, useEffect } from 'react'

interface FiltersBarProps {
  filters: {
    minPrice?: number
    maxPrice?: number
    minBeds?: number
    minBaths?: number
    minSqft?: number
    maxSqft?: number
    propertyTypes?: string[]
    searchQuery?: string
  }
  updateFilters: (filters: Record<string, string | undefined>) => void
}

const PRICE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '$100K', value: '100000' },
  { label: '$200K', value: '200000' },
  { label: '$300K', value: '300000' },
  { label: '$400K', value: '400000' },
  { label: '$500K', value: '500000' },
  { label: '$600K', value: '600000' },
  { label: '$750K', value: '750000' },
  { label: '$1M', value: '1000000' },
  { label: '$1.5M', value: '1500000' },
  { label: '$2M+', value: '2000000' },
]

const PROPERTY_TYPES = [
  { label: 'Houses', value: 'single_family' },
  { label: 'Condos', value: 'condo' },
  { label: 'Townhouses', value: 'townhouse' },
  { label: 'Multi-family', value: 'multi_family' },
  { label: 'Land', value: 'land' },
]

export default function FiltersBar({ filters, updateFilters }: FiltersBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeFilterCount = [
    filters.minPrice || filters.maxPrice,
    filters.minBeds,
    filters.minBaths,
    filters.propertyTypes?.length,
  ].filter(Boolean).length

  const getPriceLabel = () => {
    if (filters.minPrice && filters.maxPrice) {
      return `$${(filters.minPrice / 1000).toFixed(0)}K - $${(filters.maxPrice / 1000).toFixed(0)}K`
    }
    if (filters.minPrice) return `$${(filters.minPrice / 1000).toFixed(0)}K+`
    if (filters.maxPrice) return `Up to $${(filters.maxPrice / 1000).toFixed(0)}K`
    return 'Price'
  }

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2 sticky top-0 z-20" ref={dropdownRef}>
      <div className="max-w-[1800px] mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* Price dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
              ${filters.minPrice || filters.maxPrice 
                ? 'bg-[#ff6b4a] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {getPriceLabel()}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'price' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[280px] z-30">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
                  <select
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilters({ minPrice: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#ff6b4a] focus:outline-none"
                  >
                    {PRICE_OPTIONS.map((opt) => (
                      <option key={`min-${opt.value}`} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
                  <select
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#ff6b4a] focus:outline-none"
                  >
                    {PRICE_OPTIONS.map((opt) => (
                      <option key={`max-${opt.value}`} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  updateFilters({ minPrice: undefined, maxPrice: undefined })
                  setOpenDropdown(null)
                }}
                className="mt-3 text-sm text-[#ff6b4a] hover:underline"
              >
                Clear price
              </button>
            </div>
          )}
        </div>

        {/* Beds dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'beds' ? null : 'beds')}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
              ${filters.minBeds 
                ? 'bg-[#ff6b4a] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {filters.minBeds ? `${filters.minBeds}+ Beds` : 'Beds'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'beds' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-30">
              <div className="flex gap-1">
                {['Any', '1+', '2+', '3+', '4+', '5+'].map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => {
                      updateFilters({ beds: idx === 0 ? undefined : String(idx) })
                      setOpenDropdown(null)
                    }}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${(idx === 0 && !filters.minBeds) || filters.minBeds === idx
                        ? 'bg-[#ff6b4a] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Baths dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'baths' ? null : 'baths')}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
              ${filters.minBaths 
                ? 'bg-[#ff6b4a] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {filters.minBaths ? `${filters.minBaths}+ Baths` : 'Baths'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'baths' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-30">
              <div className="flex gap-1">
                {['Any', '1+', '2+', '3+', '4+'].map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => {
                      updateFilters({ baths: idx === 0 ? undefined : String(idx) })
                      setOpenDropdown(null)
                    }}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${(idx === 0 && !filters.minBaths) || filters.minBaths === idx
                        ? 'bg-[#ff6b4a] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Property Type dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
              ${filters.propertyTypes?.length 
                ? 'bg-[#ff6b4a] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {filters.propertyTypes?.length 
              ? `${filters.propertyTypes.length} Type${filters.propertyTypes.length > 1 ? 's' : ''}`
              : 'Home Type'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === 'type' && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 min-w-[180px] z-30">
              <div className="space-y-1">
                {PROPERTY_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.propertyTypes?.includes(type.value) || false}
                      onChange={(e) => {
                        const current = filters.propertyTypes || []
                        const updated = e.target.checked
                          ? [...current, type.value]
                          : current.filter((t) => t !== type.value)
                        updateFilters({ types: updated.length ? updated.join(',') : undefined })
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#ff6b4a] focus:ring-[#ff6b4a]"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => {
                  updateFilters({ types: undefined })
                  setOpenDropdown(null)
                }}
                className="mt-2 text-sm text-[#ff6b4a] hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Clear all filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => updateFilters({ 
              minPrice: undefined, 
              maxPrice: undefined, 
              beds: undefined, 
              baths: undefined,
              types: undefined,
              minSqft: undefined,
              maxSqft: undefined,
            })}
            className="px-3 py-2 text-sm text-[#ff6b4a] font-medium hover:underline whitespace-nowrap"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  )
}
