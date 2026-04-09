'use client'
import { Copy, Check, Mail, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function CopyPortalLink({ portalToken, tenantId }: { portalToken: string; tenantId: string }) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/tenant/${portalToken}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Portal link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  async function sendInvite() {
    setSending(true)
    try {
      const res = await fetch('/api/tenants/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId }),
      })
      if (res.ok) {
        toast.success('Portal invite sent!')
      } else {
        const { error } = await res.json()
        toast.error(error || 'Failed to send invite')
      }
    } catch {
      toast.error('Failed to send invite')
    }
    setSending(false)
  }

  return (
    <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20">
      <p className="text-xs text-slate-500 mb-2">Tenant Portal</p>
      <div className="flex items-center gap-2">
        <a
          href={`/tenant/${portalToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-400 hover:underline truncate flex-1"
        >
          /tenant/{portalToken.slice(0, 8)}…
        </a>
        <button
          onClick={copy}
          className="btn-ghost p-1.5 flex-shrink-0"
          title="Copy portal link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={sendInvite}
          disabled={sending}
          className="btn-ghost p-1.5 flex-shrink-0"
          title="Email portal invite to tenant"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
