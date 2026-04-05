import { Resend } from 'resend'

let _resend: Resend | undefined

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM = process.env.RESEND_FROM || 'REALESTATEos <hello@realestateos.com>'
const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://realestateos.com'

const base = (content: string) => `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#0a0f1a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
  <div style="background:#1e2a87;padding:28px 32px;display:flex;align-items:center;gap:12px;">
    <span style="font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">REALESTATEos</span>
  </div>
  <div style="padding:32px;">${content}</div>
  <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#64748b;">
    REALESTATEos · The TurboTax of real estate · <a href="${APP}" style="color:#4f6ef7;">realestateos.com</a>
  </div>
</div>`

// ─── WELCOME ──────────────────────────────────────────────
export async function sendWelcome({ email, name, product }: { email: string; name: string; product: string }) {
  const urls: Record<string, string> = {
    landlord: `${APP}/landlord/dashboard`,
    seller:   `${APP}/seller/dashboard`,
    buyer:    `${APP}/buyer/dashboard`,
  }
  await getResend().emails.send({
    from: FROM, to: email,
    subject: `Welcome to REALESTATEos, ${name}! 🏠`,
    html: base(`
      <h1 style="color:#7b94ff;font-size:28px;margin:0 0 12px;">Welcome, ${name}!</h1>
      <p style="color:#94a3b8;margin-bottom:24px;">Your 14-day free trial has started. Here's what you can do right now:</p>
      <a href="${urls[product] || APP}" style="display:inline-block;background:#4f6ef7;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
        Open Your Dashboard →
      </a>
      <p style="color:#475569;font-size:13px;margin-top:24px;">No credit card required during your trial. Questions? Just reply to this email.</p>
    `),
  })
}

// ─── LATE RENT ALERT ──────────────────────────────────────
export async function sendLateRentAlert({ landlordEmail, tenantName, propertyName, amount, daysLate }: {
  landlordEmail: string; tenantName: string; propertyName: string; amount: number; daysLate: number
}) {
  await getResend().emails.send({
    from: FROM, to: landlordEmail,
    subject: `⚠️ Late rent: ${tenantName} — ${daysLate} days overdue`,
    html: base(`
      <h2 style="color:#f87171;margin:0 0 20px;">Late Rent Alert</h2>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p><strong>Tenant:</strong> ${tenantName}</p>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Amount Due:</strong> $${amount.toLocaleString()}</p>
        <p><strong>Days Overdue:</strong> <span style="color:#f87171;">${daysLate} days</span></p>
      </div>
      <a href="${APP}/landlord/easy-buttons?flow=non_payment" style="display:inline-block;background:#f87171;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
        Start Non-Payment Flow →
      </a>
    `),
  })
}

// ─── LEASE EXPIRY ─────────────────────────────────────────
export async function sendLeaseExpiry({ landlordEmail, tenantName, propertyName, expiryDate, daysLeft }: {
  landlordEmail: string; tenantName: string; propertyName: string; expiryDate: string; daysLeft: number
}) {
  await getResend().emails.send({
    from: FROM, to: landlordEmail,
    subject: `📋 Lease expiring in ${daysLeft} days — ${tenantName}`,
    html: base(`
      <h2 style="color:#fbbf24;margin:0 0 20px;">Lease Expiry Reminder</h2>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p><strong>Tenant:</strong> ${tenantName}</p>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Expires:</strong> ${expiryDate}</p>
        <p><strong>Days Remaining:</strong> <span style="color:#fbbf24;">${daysLeft} days</span></p>
      </div>
      <a href="${APP}/landlord/easy-buttons?flow=lease_expiry" style="display:inline-block;background:#4f6ef7;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
        Handle Lease Renewal →
      </a>
    `),
  })
}

// ─── RENT RECEIPT (to tenant) ─────────────────────────────
export async function sendRentReceipt({ tenantEmail, tenantName, amount, propertyName, period }: {
  tenantEmail: string; tenantName: string; amount: number; propertyName: string; period: string
}) {
  await getResend().emails.send({
    from: FROM, to: tenantEmail,
    subject: `✅ Rent payment confirmed — ${period}`,
    html: base(`
      <h2 style="color:#4ade80;margin:0 0 20px;">Payment Received</h2>
      <p>Hi ${tenantName}, your rent payment has been confirmed.</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;">
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Period:</strong> ${period}</p>
        <p style="font-size:24px;font-weight:700;color:#4ade80;">$${amount.toLocaleString()} ✓</p>
      </div>
      <p style="color:#64748b;font-size:13px;">Keep this as your receipt.</p>
    `),
  })
}

// ─── RENT REMINDER (to tenant) ────────────────────────────
export async function sendRentReminder({ tenantEmail, tenantName, amount, dueDate, propertyName }: {
  tenantEmail: string; tenantName: string; amount: number; dueDate: string; propertyName: string
}) {
  await getResend().emails.send({
    from: FROM, to: tenantEmail,
    subject: `🏠 Rent reminder — due ${dueDate}`,
    html: base(`
      <h2 style="color:#7b94ff;margin:0 0 20px;">Rent Due Soon</h2>
      <p>Hi ${tenantName}, your rent is due on <strong>${dueDate}</strong>.</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;">
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Amount Due:</strong> <strong>$${amount.toLocaleString()}</strong></p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
      </div>
    `),
  })
}

// ─── MAINTENANCE UPDATE ───────────────────────────────────
export async function sendMaintenanceUpdate({ tenantEmail, tenantName, title, status, scheduledDate }: {
  tenantEmail: string; tenantName: string; title: string; status: string; scheduledDate?: string
}) {
  await getResend().emails.send({
    from: FROM, to: tenantEmail,
    subject: `🔧 Maintenance update: ${title}`,
    html: base(`
      <h2 style="color:#60a5fa;margin:0 0 20px;">Maintenance Update</h2>
      <p>Hi ${tenantName},</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;">
        <p><strong>Request:</strong> ${title}</p>
        <p><strong>Status:</strong> <span style="color:#60a5fa;text-transform:capitalize;">${status.replace('_', ' ')}</span></p>
        ${scheduledDate ? `<p><strong>Scheduled:</strong> ${scheduledDate}</p>` : ''}
      </div>
    `),
  })
}

// ─── SELLER — OFFER RECEIVED ──────────────────────────────
export async function sendOfferReceived({ sellerEmail, sellerName, buyerName, offerAmount, address }: {
  sellerEmail: string; sellerName: string; buyerName: string; offerAmount: number; address: string
}) {
  await getResend().emails.send({
    from: FROM, to: sellerEmail,
    subject: `🎉 New offer received on ${address}`,
    html: base(`
      <h2 style="color:#4ade80;margin:0 0 20px;">New Offer Received!</h2>
      <p>Hi ${sellerName}, you have a new offer on your property.</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;">
        <p><strong>Property:</strong> ${address}</p>
        <p><strong>Buyer:</strong> ${buyerName}</p>
        <p style="font-size:28px;font-weight:700;color:#4ade80;">$${offerAmount.toLocaleString()}</p>
      </div>
      <a href="${APP}/seller/offers" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
        Review Offer →
      </a>
    `),
  })
}

// ─── DOCUMENT GENERATED ───────────────────────────────────
export async function sendDocumentReady({ email, name, docName, downloadUrl }: {
  email: string; name: string; docName: string; downloadUrl: string
}) {
  await getResend().emails.send({
    from: FROM, to: email,
    subject: `📄 Your document is ready: ${docName}`,
    html: base(`
      <h2 style="color:#7b94ff;margin:0 0 20px;">Document Ready</h2>
      <p>Hi ${name}, your document has been generated and is ready to download.</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;">
        <p><strong>Document:</strong> ${docName}</p>
      </div>
      <a href="${downloadUrl}" style="display:inline-block;background:#4f6ef7;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">
        Download Document →
      </a>
    `),
  })
}
