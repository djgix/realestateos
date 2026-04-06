import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { LayoutDashboard, Home, FileText, MessageSquare, CheckSquare, Settings } from 'lucide-react'

const navItems = [
  { href:'/seller/dashboard', label:'Dashboard',   icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
  { href:'/seller/listing',   label:'My Listing',  icon: <Home className="w-4 h-4 flex-shrink-0" /> },
  { href:'/seller/documents', label:'Documents',   icon: <FileText className="w-4 h-4 flex-shrink-0" /> },
  { href:'/seller/offers',    label:'Offers',      icon: <MessageSquare className="w-4 h-4 flex-shrink-0" /> },
  { href:'/seller/closing',   label:'Closing',     icon: <CheckSquare className="w-4 h-4 flex-shrink-0" /> },
  { href:'/seller/settings',  label:'Settings',    icon: <Settings className="w-4 h-4 flex-shrink-0" /> },
]

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar product="seller" navItems={navItems}
        user={{ email: user.email!, full_name: profile?.full_name, plan: profile?.plan }}
        accentColor="bg-seller" logo="S" />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pt-16 md:pt-8">{children}</div>
      </main>
    </div>
  )
}
