'use client'

import { useMemo, useState } from 'react'

export default function ListingGallery({
  photos,
  address,
}: {
  photos: string[]
  address: string
}) {
  const safePhotos = useMemo(() => (Array.isArray(photos) ? photos.filter(Boolean) : []), [photos])
  const [activeIdx, setActiveIdx] = useState(0)

  const activePhoto = safePhotos[activeIdx] ?? safePhotos[0]

  if (safePhotos.length === 0) {
    return (
      <div className="card p-4">
        <div className="aspect-[16/9] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
          No photos yet
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activePhoto} alt={`Photo of ${address}`} className="w-full h-full object-cover" />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {safePhotos.map((url, idx) => {
          const isActive = idx === activeIdx
          return (
            <button
              key={url + idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={
                'shrink-0 rounded-xl overflow-hidden border-2 transition-colors ' +
                (isActive ? 'border-[#ff6b4a]' : 'border-transparent hover:border-gray-200')
              }
              aria-label={`View photo ${idx + 1} of ${safePhotos.length}`}
            >
              <div className="w-20 h-14 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Photo {activeIdx + 1} of {safePhotos.length}
      </div>
    </div>
  )
}
