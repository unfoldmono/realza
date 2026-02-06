import Link from 'next/link'
import { UserDropdown } from '@/app/_components/UserDropdown'

const nav = [
  { href: '/agent', label: 'Dashboard' },
  { href: '/agent/showings', label: 'Available Showings' },
  { href: '/agent/my-showings', label: 'My Showings' },
  { href: '/agent/listings', label: 'Browse Listings' },
]

export function AgentHeader({ active, userName }: { active?: string; userName?: string }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between">
          <Link href="/agent" className="text-2xl font-bold text-[#ff6b4a]">
            realza
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => {
              const isActive = active ? item.href === active : false
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? 'px-4 py-2 rounded-full bg-[#fff0eb] text-[#ff6b4a] font-semibold'
                      : 'px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          {userName && <UserDropdown userName={userName} />}
        </div>
      </div>
    </header>
  )
}
