// Mock MLS data for development
// TODO: Replace with real MLS API integration (Spark API, RESO Web API, or Trestle)

export interface MLSListing {
  id: string
  address: string
  city: string
  state: string
  zip: string
  price: number
  beds: number
  baths: number
  sqft: number
  year_built?: number
  description: string
  photos: string[]
  property_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land'
  status: 'active' | 'pending' | 'sold'
  days_on_market: number
  lat: number
  lng: number
  is_realza: boolean // true = listed through Realza, false = other MLS listing
  mls_number?: string
  listing_agent?: string
  listing_office?: string
}

// Florida-focused mock data (Tampa Bay / Orlando area)
export const mockListings: MLSListing[] = [
  // Realza listings (orange pins)
  {
    id: 'realza-1',
    address: '1234 Palm Beach Dr',
    city: 'Tampa',
    state: 'FL',
    zip: '33601',
    price: 425000,
    beds: 3,
    baths: 2,
    sqft: 1850,
    year_built: 2018,
    description: 'Stunning modern home in a prime Tampa location. Open floor plan with high ceilings, chef\'s kitchen with stainless appliances, and a spacious backyard perfect for entertaining.',
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 5,
    lat: 27.9506,
    lng: -82.4572,
    is_realza: true,
  },
  {
    id: 'realza-2',
    address: '567 Bayshore Blvd',
    city: 'Tampa',
    state: 'FL',
    zip: '33606',
    price: 875000,
    beds: 4,
    baths: 3,
    sqft: 2800,
    year_built: 2020,
    description: 'Luxurious waterfront living on iconic Bayshore Boulevard. This stunning home features floor-to-ceiling windows, a gourmet kitchen, and breathtaking bay views from every room.',
    photos: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 12,
    lat: 27.9156,
    lng: -82.4706,
    is_realza: true,
  },
  {
    id: 'realza-3',
    address: '890 Orange Ave',
    city: 'Orlando',
    state: 'FL',
    zip: '32801',
    price: 349000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    year_built: 2015,
    description: 'Charming downtown Orlando condo with stunning city views. Walking distance to restaurants, shops, and nightlife. Modern finishes throughout.',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    ],
    property_type: 'condo',
    status: 'active',
    days_on_market: 3,
    lat: 28.5383,
    lng: -81.3792,
    is_realza: true,
  },
  {
    id: 'realza-4',
    address: '2345 Lakewood Dr',
    city: 'Clearwater',
    state: 'FL',
    zip: '33755',
    price: 550000,
    beds: 4,
    baths: 2.5,
    sqft: 2200,
    year_built: 2017,
    description: 'Beautiful family home near Clearwater Beach. Features a pool, updated kitchen, and large master suite. Perfect for beach lovers!',
    photos: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 8,
    lat: 27.9659,
    lng: -82.8001,
    is_realza: true,
  },

  // Other MLS listings (teal pins)
  {
    id: 'mls-1',
    address: '456 Sunset Ave',
    city: 'St Petersburg',
    state: 'FL',
    zip: '33701',
    price: 389000,
    beds: 3,
    baths: 2,
    sqft: 1650,
    year_built: 2010,
    description: 'Cozy bungalow in the heart of St Pete. Walking distance to downtown shops and restaurants.',
    photos: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 21,
    lat: 27.7676,
    lng: -82.6403,
    is_realza: false,
    mls_number: 'MLS-2024-001',
    listing_office: 'Sunshine Realty',
  },
  {
    id: 'mls-2',
    address: '789 Beach Rd',
    city: 'Sarasota',
    state: 'FL',
    zip: '34236',
    price: 725000,
    beds: 3,
    baths: 2.5,
    sqft: 2100,
    year_built: 2019,
    description: 'Gorgeous coastal home minutes from Siesta Key Beach. Open concept living with designer finishes.',
    photos: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 14,
    lat: 27.3364,
    lng: -82.5307,
    is_realza: false,
    mls_number: 'MLS-2024-002',
    listing_office: 'Gulf Coast Properties',
  },
  {
    id: 'mls-3',
    address: '321 Lake View Ct',
    city: 'Winter Park',
    state: 'FL',
    zip: '32789',
    price: 599000,
    beds: 4,
    baths: 3,
    sqft: 2400,
    year_built: 2016,
    description: 'Elegant lakefront property in prestigious Winter Park. Private dock, updated kitchen, and stunning views.',
    photos: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 7,
    lat: 28.5997,
    lng: -81.3392,
    is_realza: false,
    mls_number: 'MLS-2024-003',
    listing_office: 'Park Avenue Realty',
  },
  {
    id: 'mls-4',
    address: '1500 Channel Dr',
    city: 'Tampa',
    state: 'FL',
    zip: '33611',
    price: 475000,
    beds: 3,
    baths: 2,
    sqft: 1750,
    year_built: 2014,
    description: 'South Tampa gem in sought-after neighborhood. Updated throughout with modern amenities.',
    photos: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 18,
    lat: 27.8903,
    lng: -82.4814,
    is_realza: false,
    mls_number: 'MLS-2024-004',
    listing_office: 'Tampa Bay Homes',
  },
  {
    id: 'mls-5',
    address: '222 Harbor Town Way',
    city: 'Dunedin',
    state: 'FL',
    zip: '34698',
    price: 620000,
    beds: 3,
    baths: 2.5,
    sqft: 2050,
    year_built: 2021,
    description: 'New construction in charming Dunedin. Smart home features, energy efficient, near Honeymoon Island.',
    photos: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    ],
    property_type: 'townhouse',
    status: 'active',
    days_on_market: 4,
    lat: 28.0197,
    lng: -82.7718,
    is_realza: false,
    mls_number: 'MLS-2024-005',
    listing_office: 'Coastal Living Realty',
  },
  {
    id: 'mls-6',
    address: '888 Colonial Dr',
    city: 'Orlando',
    state: 'FL',
    zip: '32803',
    price: 415000,
    beds: 3,
    baths: 2,
    sqft: 1600,
    year_built: 2012,
    description: 'Classic Florida home in established neighborhood. Large yard, updated kitchen, close to everything.',
    photos: [
      'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 25,
    lat: 28.5550,
    lng: -81.3500,
    is_realza: false,
    mls_number: 'MLS-2024-006',
    listing_office: 'Magic City Realty',
  },
  {
    id: 'mls-7',
    address: '444 Gulf Blvd',
    city: 'Indian Rocks Beach',
    state: 'FL',
    zip: '33785',
    price: 925000,
    beds: 2,
    baths: 2,
    sqft: 1400,
    year_built: 2008,
    description: 'Direct gulf-front condo with incredible sunset views. Recently renovated with high-end finishes.',
    photos: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    property_type: 'condo',
    status: 'active',
    days_on_market: 10,
    lat: 27.8847,
    lng: -82.8461,
    is_realza: false,
    mls_number: 'MLS-2024-007',
    listing_office: 'Beach Dreams Realty',
  },
  {
    id: 'mls-8',
    address: '777 Magnolia St',
    city: 'Lakeland',
    state: 'FL',
    zip: '33801',
    price: 295000,
    beds: 3,
    baths: 2,
    sqft: 1500,
    year_built: 2015,
    description: 'Affordable gem in growing Lakeland area. Open floor plan, covered lanai, community pool.',
    photos: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800',
    ],
    property_type: 'single_family',
    status: 'active',
    days_on_market: 30,
    lat: 28.0395,
    lng: -81.9498,
    is_realza: false,
    mls_number: 'MLS-2024-008',
    listing_office: 'Central Florida Homes',
  },
]

// Helper function to filter listings
export function filterListings(
  listings: MLSListing[],
  filters: {
    minPrice?: number
    maxPrice?: number
    minBeds?: number
    maxBeds?: number
    minBaths?: number
    maxBaths?: number
    minSqft?: number
    maxSqft?: number
    propertyTypes?: string[]
    city?: string
    searchQuery?: string
  }
): MLSListing[] {
  return listings.filter((listing) => {
    if (filters.minPrice && listing.price < filters.minPrice) return false
    if (filters.maxPrice && listing.price > filters.maxPrice) return false
    if (filters.minBeds && listing.beds < filters.minBeds) return false
    if (filters.maxBeds && listing.beds > filters.maxBeds) return false
    if (filters.minBaths && listing.baths < filters.minBaths) return false
    if (filters.maxBaths && listing.baths > filters.maxBaths) return false
    if (filters.minSqft && listing.sqft < filters.minSqft) return false
    if (filters.maxSqft && listing.sqft > filters.maxSqft) return false
    if (filters.propertyTypes?.length && !filters.propertyTypes.includes(listing.property_type)) return false
    if (filters.city && !listing.city.toLowerCase().includes(filters.city.toLowerCase())) return false
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const searchableText = `${listing.address} ${listing.city} ${listing.state} ${listing.zip}`.toLowerCase()
      if (!searchableText.includes(query)) return false
    }
    return true
  })
}

// Get unique cities from listings
export function getUniqueCities(listings: MLSListing[]): string[] {
  const cities = new Set(listings.map((l) => l.city))
  return Array.from(cities).sort()
}
