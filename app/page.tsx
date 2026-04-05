'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Building2, Home, Search, ArrowRight, Check, Star, ChevronRight, Shield, Zap } from 'lucide-react'

const products = [
  {
    id: 'landlord',
    icon: Building2,
    label: 'I own rental properties',
    sublabel: 'LandlordOS',
    desc: 'Manage tenants, leases, maintenance, and finances. Guided flows for every hard situation — evictions, non-payment, lease renewals.',
    color: 'landlord',
    border: 'hover:border-landlord/40',
    glow: 'glow-landlord',
    bg: 'bg-landlord/10',
    iconColor: 'text-landlord',
    cta: 'Manage my properties',
    href: '/auth/signup?product=landlord',
    pricing: 'From $19/month',
    savings: 'Save $400+/mo vs. property manager',
    features: ['Evict button — guided step by step', 'Legal center all 50 states', 'Lease generation + e-sign', 'ACH rent collection', 'Schedule E tax report'],
  },
  {
    id: 'seller',
    icon: Home,
    label: "I'm selling my home",
    sublabel: 'SellerOS',
    desc: 'Sell without an agent and keep the commission. Guided from listing to closing — disclosures, offers, contracts, and every step in between.',
    color: 'seller',
    border: 'hover:border-seller/40',
    glow: 'glow-seller',
    bg: 'bg-seller/10',
    iconColor: 'text-seller',
    cta: 'Sell my home',
    href: '/auth/signup?product=seller',
    pricing: '$299 flat fee',
    savings: 'Save $15,000–30,000 in agent fees',
    features: ['State disclosure generator', 'How to list on Zillow & MLS', 'Offer review & analysis', 'Purchase contract generator', 'Closing checklist & guide'],
  },
  {
    id: 'buyer',
    icon: Search,
    label: "I'm buying a home",
    sublabel: 'BuyerOS',
    desc: "Navigate the buying process with confidence. Offer letter generator, negotiation scripts, inspection checklist, mortgage calculator, and closing guide.",
    color: 'buyer',
    border: 'hover:border-buyer/40',
    glow: 'glow-buyer',
    bg: 'bg-buyer/10',
    iconColor: 'text-buyer',
    cta: 'Buy my home',
    href: '/auth/signup?product=buyer',
    pricing: '$149 flat fee',
    savings: 'Know exactly what you\'re signing',
    features: ['Offer letter generator', 'Negotiation scripts', 'Inspection checklist', 'Mortgage payment calculator', 'Full closing cost breakdown'],
  },
]

export default function HomePage() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-display text-xl text-white tracking-tight">
            REAL<span className="text-brand-400">ESTATE</span>os
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign in</Link>
            <Link href="#products" className="btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            The TurboTax of Real Estate
          </div>

          <h1 className="font-display text-5xl md:text-7xl text-white leading-none mb-6">
            Real estate done right.<br />
            <span className="text-gradient-landlord">Without the middleman.</span>
          </h1>

          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Agents, lawyers, and property managers charge you thousands for things you can do yourself with the right guidance. REALESTATEos guides you through every step.
          </p>

          {/* TRUST */}
          <div className="flex items-center justify-center gap-8 flex-wrap mb-4">
            {[
              { icon: Shield, text: '14-day free trial' },
              { icon: Zap, text: 'Set up in minutes' },
              { icon: Star, text: 'No hidden fees' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-slate-500 text-sm">
                <item.icon className="w-4 h-4 text-brand-400" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SELECTOR */}
      <section id="products" className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-500 text-sm font-medium uppercase tracking-widest mb-10">
            What brings you here today?
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {products.map(product => (
              <div
                key={product.id}
                onMouseEnter={() => setHovered(product.id)}
                onMouseLeave={() => setHovered(null)}
                className={`card p-7 border transition-all duration-300 cursor-pointer flex flex-col ${product.border} ${hovered === product.id ? product.glow : ''}`}
              >
                {/* Icon + Label */}
                <div className={`w-12 h-12 rounded-2xl ${product.bg} flex items-center justify-center mb-5`}>
                  <product.icon className={`w-6 h-6 ${product.iconColor}`} />
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{product.sublabel}</div>
                <h2 className="font-display text-2xl text-white mb-3">{product.label}</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{product.desc}</p>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {product.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <Check className={`w-4 h-4 flex-shrink-0 ${product.iconColor}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Pricing */}
                <div className="mb-5 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <p className="font-display text-2xl text-white mb-0.5">{product.pricing}</p>
                  <p className={`text-xs font-medium ${product.iconColor}`}>{product.savings}</p>
                </div>

                <Link href={product.href} className={`btn-${product.color} w-full justify-center`}>
                  {product.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* BUNDLE */}
          <div className="mt-6 card p-6 border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">REALESTATEos Pro Bundle</div>
              <h3 className="font-display text-2xl text-white">All three products for $99/month</h3>
              <p className="text-slate-500 text-sm mt-1">Perfect for real estate investors who buy, sell, and rent. One subscription covers everything.</p>
            </div>
            <Link href="/auth/signup?product=bundle" className="btn-primary whitespace-nowrap">
              Get the bundle <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl text-white mb-4">The math speaks for itself.</h2>
            <p className="text-slate-400 text-lg">What professionals charge vs. what REALESTATEos costs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Property Manager', old: '$4,800/yr', on: 'LandlordOS', new: '$468/yr', save: 'Save $4,332', color: 'text-landlord' },
              { label: 'Real Estate Agent', old: '$18,000', on: 'SellerOS', new: '$299', save: 'Save $17,701', color: 'text-seller' },
              { label: 'Real Estate Attorney', old: '$2,000+', on: 'BuyerOS', new: '$149', save: 'Save $1,851+', color: 'text-buyer' },
            ].map(item => (
              <div key={item.label} className="card p-6 text-center">
                <p className="text-slate-500 text-sm mb-2">{item.label}</p>
                <p className="text-3xl text-slate-600 line-through mb-1">{item.old}</p>
                <p className="text-xs text-slate-500 mb-3">{item.on}</p>
                <p className="font-display text-4xl text-white mb-2">{item.new}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.save}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display text-xl text-white">REAL<span className="text-brand-400">ESTATE</span>os</div>
          <p className="text-slate-500 text-sm">© 2026 REALESTATEos · The TurboTax of real estate</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">Privacy</Link>
            <Link href="/terms" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
