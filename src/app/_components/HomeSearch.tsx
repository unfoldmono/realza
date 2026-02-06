'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mockListings, getUniqueCities } from '@/lib/data/mockListings'

const SUGGESTIONS = getUniqueCities(mockListings)

export default function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredSuggestions = query
    ? SUGGESTIONS.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query
    if (q.trim()) {
      router.push(`/browse?q=${encodeURIComponent(q.trim())}`)
    } else {
      router.push('/browse')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        handleSearch(filteredSuggestions[highlightedIndex])
      } else {
        handleSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlightedIndex(-1)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Enter city, neighborhood, or ZIP"
          className="w-full px-6 py-5 pl-14 text-lg rounded-full border-0 shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#ff6b4a]/30 placeholder:text-gray-400"
        />
        <svg 
          className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button
          onClick={() => handleSearch()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff6b4a] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#e85a3a] transition-colors shadow-lg"
        >
          Search
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="py-2">
            {filteredSuggestions.slice(0, 6).map((city, index) => (
              <button
                key={city}
                onClick={() => {
                  setQuery(city)
                  handleSearch(city)
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  w-full px-6 py-3 text-left flex items-center gap-3 transition-colors
                  ${highlightedIndex === index ? 'bg-gray-50' : 'hover:bg-gray-50'}
                `}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">{city}</div>
                  <div className="text-sm text-gray-500">Florida</div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-6 py-3">
            <button
              onClick={() => handleSearch()}
              className="text-[#ff6b4a] font-medium text-sm hover:underline"
            >
              View all listings →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
