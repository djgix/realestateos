'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ChevronRight, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import { ReactNode } from 'react'

interface NavItem { href: string; label: string; icon: ReactNode }

interface SidebarProps {
  product: 'landlord' | 'seller' | 'buyer'
  navItems: NavItem[]
  user: { email: string; full_name?: string; plan?: string }
  accentColor: string
  logo: string
}

export function Sidebar({ product, navItems, user, accentColor, logo }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const planColors: Record<string, string> = {
    trial:   'bg-yellow-400/10 text-yellow-400',
    starter: 'bg-green-400/10 text-green-400',
    growth:  'bg-blue-400/10 text-blue-400',
    pro:     'bg-purple-400/10 text-purple-400',
    paid:    'bg-green-400/10 text-green-400',
  }

  // Fix active state: don't highlight parent when a more-specific child route is in the list
  function isActive(item: NavItem) {
    if (pathname === item.href) return true
    if (!pathname.startsWith(item.href + '/')) return false
    // Don't activate parent if another nav item is a more specific match
    return !navItems.some(
      other => other.href !== item.href && other.href.startsWith(item.href + '/')
    )
  }

  const sidebarContent = (
    <aside
      className={cn(
        'w-64 h-screen flex flex-col bg-slate-900 border-r border-slate-800 fixed left-0 top-0 z-40',
        'transition-transform duration-200 ease-in-out',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      aria-label="Main navigation"
    >
      {/* LOGO */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className={`w-8 h-8 rounded-lg ${accentColor} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-xs font-bold">{logo}</span>
          </div>
          <div>
            <p className="font-display text-base text-white leading-none">REAL<span className="text-brand-400">ESTATE</span>os</p>
            <p className="text-xs text-slate-500 capitalize mt-0.5">{product}OS</p>
          </div>
        </Link>
        {/* Close button on mobile */}
        <button
          className="md:hidden text-slate-500 hover:text-slate-300 transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto p-3" role="navigation">
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(active ? 'nav-item-active' : 'nav-item')}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.icon}
                  {item.label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto text-slate-600" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* USER */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className={`w-8 h-8 ${accentColor} rounded-lg flex items-center justify-center flex-shrink-0 opacity-80`}>
            <span className="text-white text-xs font-semibold">{getInitials(user.full_name || user.email || 'U')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user.full_name || 'User'}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${planColors[user.plan || 'trial'] || planColors.trial}`}>
              {user.plan || 'trial'}
            </span>
          </div>
          <button onClick={signOut} className="text-slate-600 hover:text-slate-400 transition-colors" title="Sign out" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile hamburger — fixed top-left, hidden on md+ */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay backdrop on mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {sidebarContent}
    </>
  )
}
