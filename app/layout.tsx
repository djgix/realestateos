import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const dmSerif = DM_Serif_Display({ subsets:['latin'], weight:['400'], variable:'--font-display' })
const dmSans  = DM_Sans({ subsets:['latin'], weight:['300','400','500','600'], variable:'--font-body' })

export const metadata: Metadata = {
  title: 'REALESTATEos — The TurboTax of Real Estate',
  description: 'Whether you\'re a landlord, selling your home, or buying — REALESTATEos guides you through every step and saves you thousands.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${dmSans.variable}`}>
      <body className="bg-slate-950 text-slate-100 font-body antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background:'#1e293b', color:'#f1f5f9', border:'1px solid rgba(148,163,184,0.1)', borderRadius:'10px', fontSize:'14px' },
            success: { iconTheme: { primary:'#4ade80', secondary:'#1e293b' } },
            error:   { iconTheme: { primary:'#f87171', secondary:'#1e293b' } },
          }}
        />
      </body>
    </html>
  )
}
