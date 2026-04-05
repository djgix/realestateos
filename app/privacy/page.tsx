import Link from 'next/link'

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'We collect the information needed to run REALESTATEos, including account details, portfolio records, tenant and property data you enter, and operational event logs such as webhook or automation activity.',
  },
  {
    title: 'How we use it',
    body: 'We use your information to provide the products you signed up for, process payments, send operational emails or SMS when configured, improve reliability, and secure the platform.',
  },
  {
    title: 'Third-party processors',
    body: 'Depending on your configuration, REALESTATEos may use providers such as Supabase, Stripe, Polar, Resend, Twilio, and analytics or AI services to operate product features.',
  },
  {
    title: 'Your controls',
    body: 'You can update account settings, download your portfolio export, and request account deletion from the product. You are responsible for verifying legal and tax outputs before relying on them.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Back to home
        </Link>
        <div className="mt-6 mb-10">
          <h1 className="font-display text-4xl text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400">
            Effective April 5, 2026. This summary explains how REALESTATEos handles account, portfolio, and transaction data.
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
