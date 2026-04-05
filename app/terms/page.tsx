import Link from 'next/link'

const SECTIONS = [
  {
    title: 'Product scope',
    body: 'REALESTATEos provides software tools, templates, automation, and workflow support for landlords, sellers, and buyers. Unless explicitly stated otherwise, it does not act as your broker, lawyer, CPA, or property manager.',
  },
  {
    title: 'No legal or tax advice',
    body: 'Legal guides, lease hints, notices, tax reports, and AI-generated drafts are informational tools. You are responsible for reviewing them and consulting licensed professionals when needed.',
  },
  {
    title: 'Payments and third parties',
    body: 'Some features depend on third-party services such as Stripe, Polar, Resend, Twilio, and Supabase. Availability may depend on your environment configuration and those providers’ terms.',
  },
  {
    title: 'Account responsibility',
    body: 'You are responsible for the accuracy of portfolio data, tenant communications, and any actions you take from the platform, including collections, maintenance dispatch, leasing, and real estate transactions.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Back to home
        </Link>
        <div className="mt-6 mb-10">
          <h1 className="font-display text-4xl text-white mb-3">Terms of Use</h1>
          <p className="text-slate-400">
            Effective April 5, 2026. These terms summarize how REALESTATEos should be used and where your responsibility begins.
          </p>
        </div>
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">{section.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
