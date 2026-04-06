import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import {
  LayoutDashboard, Building2, Users, FileText,
  Wrench, DollarSign, Scale, MessageSquare, Settings, HardHat, Bell
} from 'lucide-react'

const navItems = [
  // PM Autopilot Domains
  { href:'/landlord/dashboard',            label:'Command Center',   icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0 text-brand-400" /> },
  { href:'/landlord/finances/collections', label:'The Collector',    icon: <DollarSign className="w-4 h-4 flex-shrink-0 text-orange-400" /> },
  { href:'/landlord/maintenance',          label:'The Fixer',        icon: <Wrench className="w-4 h-4 flex-shrink-0 text-blue-400" /> },
  { href:'/landlord/properties',           label:'Leasing',          icon: <Building2 className="w-4 h-4 flex-shrink-0 text-green-400" /> },
  { href:'/landlord/finances/schedule-e',  label:'The Bookkeeper',   icon: <FileText className="w-4 h-4 flex-shrink-0 text-purple-400" /> },

  // Standard CRM Context
  { href:'/landlord/finances',     label:'Finances',         icon: <DollarSign className="w-4 h-4 flex-shrink-0 opacity-50" /> },
  { href:'/landlord/tenants',      label:'Tenants',          icon: <Users className="w-4 h-4 flex-shrink-0 opacity-50" /> },
  { href:'/landlord/leases',       label:'Leases',           icon: <FileText className="w-4 h-4 flex-shrink-0 opacity-50" /> },
  { href:'/landlord/messages',       label:'Messages',         icon: <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" /> },
  { href:'/landlord/contractors',   label:'Contractors',      icon: <HardHat className="w-4 h-4 flex-shrink-0 opacity-50" /> },
  { href:'/landlord/notifications', label:'Notifications',    icon: <Bell className="w-4 h-4 flex-shrink-0 opacity-50" /> },
  { href:'/landlord/legal',         label:'Legal',            icon: <Scale className="w-4 h-4 flex-shrink-0 opacity-50" /> },
  { href:'/landlord/settings',      label:'Settings',         icon: <Settings className="w-4 h-4 flex-shrink-0 opacity-50" /> },
]

export default async function LandlordLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar
        product="landlord"
        navItems={navItems}
        user={{ email: user.email!, full_name: profile?.full_name, plan: profile?.plan }}
        accentColor="bg-landlord"
        logo="L"
      />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pt-16 md:pt-8">{children}</div>
      </main>
    </div>
  )
}
