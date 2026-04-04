'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

interface LegalDocumentPreviewProps {
  type: string;
  tenant: any;
  lease: any;
  landlord: any;
  answers: Record<string, string>;
}

export function LegalDocumentPreview({ type, tenant, lease, landlord, answers }: LegalDocumentPreviewProps) {
  
  const today = new Date()
  
  if (type === 'eviction') {
    const isNY = answers.state === 'NY'
    const noticeDays = isNY ? 14 : 3
    const reasonText = answers.reason === 'non_payment' ? 'Failure to pay rent' :
                       answers.reason === 'lease_violation' ? 'Violation of lease terms' : 'Holdover of tenancy'
    
    // Fake calculated late fee from lease
    const amountOwed = (lease?.monthly_rent || 1500) + (lease?.late_fee || 50)

    return (
      <div className="bg-white text-black p-10 md:p-14 rounded-lg shadow-2xl mx-auto w-full max-w-3xl aspect-[8.5/11] flex flex-col font-serif relative overflow-hidden" id="legal-document">
        
        {/* Print-only styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #legal-document, #legal-document * { visibility: visible; }
            #legal-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; padding: 0; }
          }
        `}} />

        {/* HEADER */}
        <div className="text-center border-b-2 border-black pb-6 mb-8 mt-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest">{noticeDays}-DAY NOTICE TO PAY RENT OR QUIT</h1>
          <p className="text-sm mt-2">{isNY ? 'Pursuant to New York State Real Property Law § 235-e' : 'Pursuant to State Statutory Requirements'}</p>
        </div>

        {/* BODY */}
        <div className="flex-1 space-y-6 text-sm leading-relaxed">
          <div className="flex justify-between">
            <div>
              <p className="font-bold">TO TENANT(S):</p>
              <p>{tenant?.first_name || 'John'} {tenant?.last_name || 'Doe'}</p>
              <p>And all other occupants in possession</p>
            </div>
            <div className="text-right">
              <p className="font-bold">DATE OF NOTICE:</p>
              <p>{formatDate(today.toISOString())}</p>
            </div>
          </div>

          <div>
            <p className="font-bold">PREMISES:</p>
            <p>{tenant?.properties?.address || '123 Main St'}</p>
            <p>{tenant?.properties?.city || 'City'}, {tenant?.properties?.state || answers.state || 'State'} {tenant?.properties?.zip || '12345'}</p>
          </div>

          <p className="mt-8 text-justify">
            <strong>YOU ARE HEREBY NOTIFIED</strong> that you are in default of your rental agreement for the premises described above, due to: <strong>{reasonText}</strong>.
          </p>
          
          {answers.reason === 'non_payment' && (
            <p className="text-justify">
              The total amount of rent now due and payable is <strong>{formatCurrency(amountOwed)}</strong>. This includes your base rent of {formatCurrency(lease?.monthly_rent || 1500)} and accrued late fees of {formatCurrency(lease?.late_fee || 50)}.
            </p>
          )}

          <p className="text-justify mt-4">
            <strong>WITHIN {noticeDays} DAYS</strong> after service of this notice, you are required to either pay the full amount due or vacate and deliver possession of the premises to the undersigned landlord or agent. 
          </p>

          <p className="text-justify font-bold mt-4">
            IF YOU FAIL TO COMPLY WITH THIS NOTICE, LEGAL PROCEEDINGS WILL BE INSTITUTED AGAINST YOU TO RECOVER POSSESSION OF THE PREMISES, DECLARE THE FORFEITURE OF THE RENTAL AGREEMENT, AND RECOVER MONETARY DAMAGES AND COURT COSTS.
          </p>
        </div>

        {/* SIGNATURE */}
        <div className="mt-16 pt-16">
          <div className="w-64 border-b border-black mb-2" />
          <p className="font-bold uppercase">{landlord?.full_name || 'Landlord Name'}</p>
          <p>Owner / Authorized Agent</p>
          <p>{tenant?.properties?.name || 'Property Portfolio'}</p>
        </div>
      </div>
    )
  }

  if (type === 'lease') {
    return (
      <div className="bg-white text-black p-10 md:p-14 rounded-lg shadow-2xl mx-auto w-full max-w-3xl aspect-[8.5/11] flex flex-col font-serif relative overflow-hidden" id="legal-document">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #legal-document, #legal-document * { visibility: visible; }
            #legal-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; padding: 0; }
          }
        `}} />
        <div className="text-center pb-6 mb-8 mt-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Standard Residential Lease Agreement</h1>
          <div className="w-16 border-b-2 border-black mx-auto mt-4" />
        </div>
        <div className="flex-1 space-y-4 text-sm leading-relaxed text-justify">
          <p>
            <strong>THIS LEASE AGREEMENT</strong> (hereinafter referred to as the "Agreement") is made and entered into this <strong>{formatDate(today.toISOString())}</strong>, by and between <strong>{landlord?.full_name || 'Landlord'}</strong> (hereinafter referred to as "Landlord") and <strong>{tenant?.first_name || 'Tenant'} {tenant?.last_name || 'Name'}</strong> (hereinafter referred to as "Tenant").
          </p>
          <p>
            <strong>1. PREMISES:</strong> Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the premises located at <strong>{tenant?.properties?.address || 'Property Address'}</strong>, in the City of <strong>{tenant?.properties?.city || 'City'}</strong>, State of <strong>{tenant?.properties?.state || answers.state || 'State'}</strong>, Zip <strong>{tenant?.properties?.zip || 'Zip'}</strong> (hereinafter referred to as the "Premises").
          </p>
          <p>
            <strong>2. TERM:</strong> This Agreement shall commence on <strong>{answers.start_date || 'Date'}</strong> and shall continue strictly for a period of <strong>{answers.duration || '12'} months</strong>. Upon expiration of the Term, this Agreement shall convert to a month-to-month tenancy unless otherwise stated in writing.
          </p>
          <p>
            <strong>3. RENT:</strong> Tenant agrees to pay Landlord the sum of <strong>{formatCurrency(lease?.monthly_rent || 1500)}</strong> per month, payable in advance on the 1st day of each calendar month. A late fee of <strong>{formatCurrency(lease?.late_fee || 50)}</strong> will be applied if rent is not received by the end of the statutory grace period.
          </p>
          <p>
            <strong>4. SECURITY DEPOSIT:</strong> Upon execution of this Agreement, Tenant shall deposit with Landlord the sum of <strong>{formatCurrency(lease?.security_deposit || 1500)}</strong> as a security deposit for the faithful performance of the terms contained herein.
          </p>
          <div className="pt-20 pb-4 border-b border-black w-64 mt-16" />
          <p className="font-bold">LANDLORD: {landlord?.full_name}</p>
          <div className="pt-20 pb-4 border-b border-black w-64 mt-10" />
          <p className="font-bold">TENANT: {tenant?.first_name} {tenant?.last_name}</p>
        </div>
      </div>
    )
  }

  if (type === 'maintenance') {
    return (
      <div className="bg-white text-black p-10 md:p-14 rounded-lg shadow-2xl mx-auto w-full max-w-3xl aspect-[8.5/11] flex flex-col font-serif relative overflow-hidden" id="legal-document">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #legal-document, #legal-document * { visibility: visible; }
            #legal-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; padding: 0; }
          }
        `}} />
        <div className="text-center border-b-2 border-black pb-6 mb-8 mt-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest">24-HOUR NOTICE OF INTENT TO ENTER PREMISES</h1>
          <p className="text-sm mt-2">Pursuant to standard statutory civil codes</p>
        </div>
        <div className="flex-1 space-y-6 text-sm leading-relaxed text-justify">
          <p className="font-bold">DATE: {formatDate(today.toISOString())}</p>
          <p>
            <strong>TO TENANT(S):</strong> {tenant?.first_name || 'Tenant'} {tenant?.last_name || 'Name'}
          </p>
          <p>
            <strong>RE: PREMISES AT:</strong> {tenant?.properties?.address || '123 Main St'}, {tenant?.properties?.city || 'City'}, {tenant?.properties?.state || answers.state || 'State'} {tenant?.properties?.zip || '12345'}
          </p>
          <p className="mt-8">
            <strong>YOU ARE HEREBY NOTIFIED</strong> that during normal business hours, approximately 24 hours from the date of this notice, the Landlord, Landlord's designated agents, or hired contractors will enter the Premises described above.
          </p>
          <p>
            <strong>PURPOSE OF ENTRY:</strong> To perform necessary or agreed-upon repairs, decorations, alterations, or improvements, specifically regarding: <strong>{answers.repair_type || 'Maintenance'}</strong>.
          </p>
          <p>
            The intended duration of the work is estimated to take {answers.duration || '1-2 hours'}. You are not required to be present during this entry. Our licensed contractors will ensure the premises are left secure upon departure.
          </p>
        </div>
        <div className="mt-16 pt-16">
          <div className="w-64 border-b border-black mb-2" />
          <p className="font-bold uppercase">{landlord?.full_name || 'Landlord Name'}</p>
          <p>Owner / Authorized Agent</p>
          <p>{tenant?.properties?.name || 'Property Portfolio'}</p>
        </div>
      </div>
    )
  }

  return null
