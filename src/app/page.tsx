import Link from "next/link";
import HomeSearch from "./_components/HomeSearch";
import FeaturedListings from "./_components/FeaturedListings";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fffbf7]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-[#fffbf7]/90 backdrop-blur-xl z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-[#ff6b4a]">realza</div>
          <div className="flex gap-4">
            <Link href="/browse" className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium">
              Browse Homes
            </Link>
            <Link href="/login" className="btn-secondary text-sm">Log In</Link>
            <Link href="/signup" className="btn-primary text-sm">Get Started →</Link>
          </div>
        </div>
      </nav>

      {/* Hero with Search */}
      <section className="relative pt-24 pb-16 px-6 min-h-[85vh] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#fffbf7]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
          <div className="badge bg-white/20 text-white backdrop-blur-sm mb-6 border border-white/30">
            <span>🌴</span> Now launching in Florida
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
            Buy direct. Cut the BS.
          </h1>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow">
            Connect with sellers directly. On-demand showings. No 6% commission bleeding you dry.
          </p>
          
          {/* Search Component */}
          <HomeSearch />
          
          {/* Quick links */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/browse?q=Tampa" className="text-sm bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors border border-white/20">
              Tampa
            </Link>
            <Link href="/browse?q=Orlando" className="text-sm bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors border border-white/20">
              Orlando
            </Link>
            <Link href="/browse?q=St Petersburg" className="text-sm bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors border border-white/20">
              St. Petersburg
            </Link>
            <Link href="/browse?q=Clearwater" className="text-sm bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors border border-white/20">
              Clearwater
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <FeaturedListings />

      {/* Value Prop */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Real estate without the dinosaurs</h2>
            <p className="text-gray-600">The old way is 6% fees, endless paperwork, and agents who ghost you. This isn't that.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Buy */}
            <div className="card p-8 border-2 border-gray-100 hover:border-[#0d9488] transition-colors group">
              <div className="text-5xl mb-4">🚗</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Uber-Style Showings</h3>
              <p className="text-gray-600 mb-6">
                Request a showing, agents compete to host it. 
                No phone tag. No waiting. Just show up.
              </p>
              <Link href="/browse" className="inline-flex items-center gap-2 text-[#0d9488] font-semibold group-hover:gap-3 transition-all">
                Browse Listings <span>→</span>
              </Link>
            </div>
            
            {/* Sell */}
            <div className="card p-8 border-2 border-gray-100 hover:border-[#ff6b4a] transition-colors group">
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Keep Your $24,000</h3>
              <p className="text-gray-600 mb-6">
                List everywhere for $200. That's it. 
                Traditional agents charge $24k on a $400k home. We don't.
              </p>
              <Link href="/signup?type=seller" className="inline-flex items-center gap-2 text-[#ff6b4a] font-semibold group-hover:gap-3 transition-all">
                List My Home <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-[#ff6b4a]">$200</div>
            <div className="text-gray-500 text-sm">One-time fee</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900">0%</div>
            <div className="text-gray-500 text-sm">Commission</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900">24h</div>
            <div className="text-gray-500 text-sm">To go live</div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The old way is broken</h2>
            <p className="text-gray-600">See why sellers are switching to Realza</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional - looks bad */}
            <div className="bg-gray-100 rounded-3xl p-8 border-2 border-gray-200 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gray-300 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                Traditional Agent
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-6 mt-4">The Old Way</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500">6% Commission</div>
                    <div className="text-sm text-gray-400">$24,000 on a $400k home</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500">6-month contract</div>
                    <div className="text-sm text-gray-400">Locked in, can't leave</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500">Agent controls everything</div>
                    <div className="text-sm text-gray-400">You're out of the loop</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xl">✗</span>
                  <div>
                    <div className="font-semibold text-gray-500">2-4 weeks to list</div>
                    <div className="text-sm text-gray-400">Paperwork, photos, delays</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-gray-400 text-sm">Total cost on $400k home</div>
                <div className="text-3xl font-bold text-gray-400 line-through">$24,000</div>
              </div>
            </div>

            {/* Realza - looks great */}
            <div className="bg-gradient-to-br from-[#ff6b4a] to-[#ff8f6a] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                ⭐ Recommended
              </div>
              <h3 className="text-2xl font-bold mb-6 mt-4">The Realza Way</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-white text-xl">✓</span>
                  <div>
                    <div className="font-semibold">$200 flat fee</div>
                    <div className="text-sm text-white/80">That's it. No hidden costs.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white text-xl">✓</span>
                  <div>
                    <div className="font-semibold">No contracts</div>
                    <div className="text-sm text-white/80">Cancel anytime, no penalties</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white text-xl">✓</span>
                  <div>
                    <div className="font-semibold">You're in control</div>
                    <div className="text-sm text-white/80">Chat with buyers directly</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Live in 24 hours</div>
                    <div className="text-sm text-white/80">AI does the heavy lifting</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="text-white/80 text-sm">Total cost on $400k home</div>
                <div className="text-4xl font-bold">$200</div>
                <div className="text-sm text-white/80 mt-1">You save $23,800 💰</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge badge-coral mb-4">How It Works</div>
            <h2 className="text-4xl font-bold text-gray-900">Stupid simple</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Snap photos</h3>
              <p className="text-gray-600">Upload photos. AI detects rooms and creates your listing.</p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">AI magic</h3>
              <p className="text-gray-600">We write descriptions, suggest pricing, prep everything.</p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Go live</h3>
              <p className="text-gray-600">Pay $200, appear on Zillow, Redfin, and 100+ sites.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Showings Feature */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge bg-[#ff6b4a]/20 text-[#ff6b4a] mb-4">✨ Magic Feature</div>
            <h2 className="text-4xl font-bold">Uber for showings</h2>
            <p className="text-gray-400 mt-4 text-lg">Agents compete to show your home. You pick the best one.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: "🔔", title: "Buyer requests", desc: "Get notified instantly" },
              { icon: "🏃", title: "Agents bid", desc: "$75+ per showing" },
              { icon: "⭐", title: "Pick & approve", desc: "Best-rated agent wins" },
              { icon: "💬", title: "Chat direct", desc: "Negotiate yourself" },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to save <span className="text-[#ff6b4a]">$23,800</span>?
          </h2>
          <p className="text-gray-600 mb-8">Join now and be first when we launch in Florida.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/browse" className="btn-secondary text-lg px-8 py-4">
              Browse Homes
            </Link>
            <Link href="/signup" className="btn-primary text-lg px-8 py-4">
              Get Started →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 text-center text-gray-500 text-sm">
        © 2026 Realza · Launching in Florida
      </footer>
    </div>
  );
}
