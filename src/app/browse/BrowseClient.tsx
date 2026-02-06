'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { mockListings, filterListings, type MLSListing } from '@/lib/data/mockListings'
import ListingCard from './_components/ListingCard'
import ListingsMap from './_components/ListingsMap'
import FiltersBar from './_components/FiltersBar'

type ViewMode = 'split' | 'list' | 'map'

export default function BrowseClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  
  // Get filters from URL params
  const filters = useMemo(() => ({
    searchQuery: searchParams.get('q') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    minBeds: searchParams.get('beds') ? Number(searchParams.get('beds')) : undefined,
    minBaths: searchParams.get('baths') ? Number(searchParams.get('baths')) : undefined,
    minSqft: searchParams.get('minSqft') ? Number(searchParams.get('minSqft')) : undefined,
    maxSqft: searchParams.get('maxSqft') ? Number(searchParams.get('maxSqft')) : undefined,
    propertyTypes: searchParams.get('types')?.split(',').filter(Boolean) || undefined,
  }), [searchParams])

  const filteredListings = useMemo(() => 
    filterListings(mockListings, filters),
    [filters]
  )

  const updateFilters = useCallback((newFilters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/browse?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleListingClick = (listing: MLSListing) => {
    setSelectedListingId(listing.id)
  }

  return (
    <div className="min-h-screen bg-[#fffbf7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 z-30">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-[#ff6b4a] shrink-0">
            realza
          </Link>
          
          {/* Search in header */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by city, zip, or address..."
                defaultValue={filters.searchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  // Debounce search
                  clearTimeout((window as any).searchTimeout)
                  ;(window as any).searchTimeout = setTimeout(() => {
                    updateFilters({ q: value || undefined })
                  }, 300)
                }}
                className="w-full px-4 py-2.5 pl-10 rounded-full border-2 border-gray-200 focus:border-[#ff6b4a] focus:outline-none transition-colors text-sm"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* View toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'split' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'map' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Map
              </button>
            </div>
            
            <Link href="/login" className="btn-secondary text-sm !px-4 !py-2">
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <FiltersBar filters={filters} updateFilters={updateFilters} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Listings panel */}
        <div 
          className={`
            ${viewMode === 'map' ? 'hidden' : 'flex'}
            ${viewMode === 'split' ? 'w-full lg:w-1/2 xl:w-2/5' : 'w-full'}
            flex-col overflow-hidden bg-[#fffbf7]
          `}
        >
          {/* Results count */}
          <div className="px-4 py-3 border-b border-gray-100 bg-white">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filteredListings.length}</span> homes in Florida
            </p>
          </div>
          
          {/* Listings grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className={`grid gap-4 ${viewMode === 'list' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isHovered={hoveredListingId === listing.id}
                  isSelected={selectedListingId === listing.id}
                  onMouseEnter={() => setHoveredListingId(listing.id)}
                  onMouseLeave={() => setHoveredListingId(null)}
                  onClick={() => handleListingClick(listing)}
                />
              ))}
            </div>
            
            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🏠</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No homes found</h3>
                <p className="text-gray-600 text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Map panel */}
        <div 
          className={`
            ${viewMode === 'list' ? 'hidden' : 'flex'}
            ${viewMode === 'split' ? 'hidden lg:flex lg:w-1/2 xl:w-3/5' : 'w-full'}
            flex-col
          `}
        >
          <ListingsMap
            listings={filteredListings}
            hoveredListingId={hoveredListingId}
            selectedListingId={selectedListingId}
            onListingHover={setHoveredListingId}
            onListingSelect={setSelectedListingId}
          />
        </div>
      </div>

      {/* Mobile view toggle (fixed bottom) */}
      <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex bg-white rounded-full shadow-lg p-1 border border-gray-200">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-[#ff6b4a] text-white' : 'text-gray-600'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'map' ? 'bg-[#ff6b4a] text-white' : 'text-gray-600'
            }`}
          >
            Map
          </button>
        </div>
      </div>
    </div>
  )
}
