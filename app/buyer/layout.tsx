import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { LayoutDashboard, Search, FileText, CheckSquare, Calculator, Settings } from 'lucide-react'

const navItems = [
  { href:'/buyer/dashboard',  label:'Dashboard',   icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
  { href:'/buyer/search',     label:'Properties',  icon: <Search className="w-4 h-4 flex-shrink-0" /> },
  { href:'/buyer/offer',      label:'Make Offer',  icon: <FileText className="w-4 h-4 flex-shrink-0" /> },
  { href:'/buyer/checklist',  label:'Checklist',   icon: <CheckSquare className="w-4 h-4 flex-shrink-0" /> },
  { href:'/buyer/calculator', label:'Calculator',  icon: <Calculator className="w-4 h-4 flex-shrink-0" /> },
  { href:'/buyer/settings',    label:'Settings',    icon: <Settings className="w-4 h-4 flex-shrink-0" /> },
]

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar product="buyer" navItems={navItems}
        user={{ email: user.email!, full_name: profile?.full_name, plan: profile?.plan }}
        accentColor="bg-buyer" logo="B" />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
