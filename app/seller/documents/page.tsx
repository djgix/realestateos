'use client'
import { useState } from 'react'
import { FileText, Download, Check, ChevronRight, AlertCircle } from 'lucide-react'

const DOCUMENTS = [
  {
    category: 'Required Disclosures',
    docs: [
      { id: 'seller_disclosure', title: 'Seller Property Disclosure', desc: 'Required in most states. Disclose known defects and material facts about the property.', required: true, generated: false },
      { id: 'lead_paint', title: 'Lead Paint Disclosure', desc: 'Federal requirement for homes built before 1978.', required: true, generated: false },
      { id: 'hoa_disclosure', title: 'HOA Disclosure', desc: 'Required if property is in an HOA. Includes fees, rules, and financials.', required: false, generated: false },
    ]
  },
  {
    category: 'Listing Documents',
    docs: [
      { id: 'listing_description', title: 'MLS Listing Description', desc: 'Professional property description optimized for buyers.', required: false, generated: true },
      { id: 'showing_instructions', title: 'Showing Instructions', desc: 'Instructions for buyer agents scheduling showings.', required: false, generated: true },
      { id: 'property_fact_sheet', title: 'Property Fact Sheet', desc: 'One-page summary to hand to buyers during showings.', required: false, generated: false },
    ]
  },
  {
    category: 'Contract Documents',
    docs: [
      { id: 'purchase_agreement', title: 'Purchase Agreement', desc: 'The main contract between you and the buyer. Generated when you accept an offer.', required: true, generated: false },
      { id: 'counteroffer', title: 'Counteroffer Form', desc: 'Used when you want to change the terms of a received offer.', required: false, generated: false },
      { id: 'addendum', title: 'Contract Addendum', desc: 'Used to add or change terms after the purchase agreement is signed.', required: false, generated: false },
    ]
  },
  {
    category: 'Closing Documents',
    docs: [
      { id: 'closing_checklist', title: 'Seller Closing Checklist', desc: 'Every step from accepted offer to handing over keys.', required: false, generated: true },
      { id: 'possession_agreement', title: 'Possession Agreement', desc: 'If closing and possession dates differ.', required: false, generated: false },
    ]
  },
]

export default function SellerDocumentsPage() {
  const [selectedState, setSelectedState] = useState('CA')
  const [generating, setGenerating] = useState<string | null>(null)

  function generate(docId: string) {
    setGenerating(docId)
    setTimeout(() => setGenerating(null), 2000)
  }

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">All required and helpful documents for your sale</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">State:</label>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="select w-auto">
            {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-4 border-yellow-400/20 bg-yellow-400/5 flex gap-3 mb-6">
        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-300 text-sm">These are templates for {selectedState}. Real estate laws vary — for complex situations consult a real estate attorney in your state.</p>
      </div>

      <div className="space-y-6">
        {DOCUMENTS.map(category => (
          <div key={category.category}>
            <h2 className="section-title">{category.category}</h2>
            <div className="card divide-y divide-slate-800/50 overflow-hidden">
              {category.docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-4 p-5 hover:bg-slate-800/30 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.generated ? 'bg-green-400/10' : 'bg-slate-800'}`}>
                    {doc.generated
                      ? <Check className="w-5 h-5 text-green-400" />
                      : <FileText className="w-5 h-5 text-slate-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-200 text-sm">{doc.title}</p>
                      {doc.required && <span className="badge bg-red-400/10 text-red-400 text-xs">Required</span>}
                    </div>
                    <p className="text-xs text-slate-500">{doc.desc}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {doc.generated ? (
                      <button className="btn-secondary text-sm py-1.5 px-3">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    ) : (
                      <button
                        onClick={() => generate(doc.id)}
                        disabled={generating === doc.id}
                        className="btn-seller text-sm py-1.5 px-3"
                      >
                        {generating === doc.id ? 'Generating...' : 'Generate'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
