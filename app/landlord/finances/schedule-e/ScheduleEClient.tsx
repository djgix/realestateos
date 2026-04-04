'use client'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Download, Calculator, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function ScheduleEClient({ rents, deductions, totalExpenses, netIncome, year }: any) {
  
  const handlePrint = () => window.print()

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-20 print:p-0 print:m-0 print:-mt-10">
      
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/landlord/finances" className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Finances
        </Link>
        <button onClick={handlePrint} className="btn bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/20">
          <Download className="w-4 h-4" /> Export CPA-Ready PDF
        </button>
      </div>

      <div className="print:hidden mb-6 p-6 card border-green-500/20 bg-green-500/5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/20 flex-shrink-0 mt-1">
          <ShieldCheck className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h2 className="text-slate-100 font-medium text-lg">Automated Tax Extraction Complete</h2>
          <p className="text-slate-400 text-sm mt-1">
            RealEstateOS successfully parsed all synchronized banking transactions and manual expense logs, mapped them strictly to IRS 1040 Schedule E line items, and computed automated depreciation schedules.
          </p>
        </div>
      </div>

      {/* The Printable Schedule E Layout */}
      <div className="bg-white text-black p-10 shadow-2xl rounded-xl font-sans" id="printable-schedule-e">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #printable-schedule-e, #printable-schedule-e * { visibility: visible; }
            #printable-schedule-e { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `}} />

        <div className="flex justify-between border-b-2 border-black pb-2 mb-6">
          <div className="w-1/4">
            <p className="text-[10px] uppercase font-bold">SCHEDULE E</p>
            <p className="text-[10px]">(Form 1040)</p>
          </div>
          <div className="w-1/2 text-center text-xl font-bold font-serif leading-tight">
            Supplemental Income and Loss<br/>
            <span className="text-sm font-normal italic">(From rental real estate, royalties, partnerships, etc.)</span>
          </div>
          <div className="w-1/4 text-right">
            <p className="text-xs font-bold">OMB No. 1545-0074</p>
            <p className="text-2xl font-bold">{year}</p>
          </div>
        </div>

        <div className="text-sm border border-black mb-4">
          <div className="bg-gray-200 font-bold p-1 border-b border-black">Part I: Income or Loss From Rental Real Estate</div>
          
          <table className="w-full text-xs text-left">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="w-8 border-r border-gray-300 text-center font-bold">3</td>
                <td className="p-1 font-semibold">Rents received</td>
                <td className="w-24 border-l border-gray-300 p-1 text-right font-mono">{formatCurrency(rents)}</td>
              </tr>
              
              <tr><td colSpan={3} className="bg-gray-100 p-1 font-bold italic border-b border-gray-300">Expenses</td></tr>

              {[
                { line: '5', label: 'Advertising', val: deductions.line5_advertising },
                { line: '6', label: 'Auto and travel', val: deductions.line6_auto },
                { line: '7', label: 'Cleaning and maintenance', val: deductions.line7_cleaning },
                { line: '8', label: 'Commissions', val: deductions.line8_commissions },
                { line: '9', label: 'Insurance', val: deductions.line9_insurance },
                { line: '10', label: 'Legal and other professional fees', val: deductions.line10_legal },
                { line: '11', label: 'Management fees', val: deductions.line11_management },
                { line: '12', label: 'Mortgage interest', val: deductions.line12_mortgage },
                { line: '13', label: 'Other interest', val: deductions.line13_other_interest },
                { line: '14', label: 'Repairs', val: deductions.line14_repairs },
                { line: '15', label: 'Supplies', val: deductions.line15_supplies },
                { line: '16', label: 'Taxes', val: deductions.line16_taxes },
                { line: '17', label: 'Utilities', val: deductions.line17_utilities },
                { line: '18', label: 'Depreciation expense', val: deductions.line18_depreciation },
                { line: '19', label: 'Other', val: deductions.line19_other },
              ].map(row => (
                <tr key={row.line} className="border-b border-gray-300">
                  <td className="w-8 border-r border-gray-300 text-center">{row.line}</td>
                  <td className="p-1">{row.label}</td>
                  <td className="w-24 border-l border-gray-300 p-1 text-right font-mono">{row.val > 0 ? formatCurrency(row.val) : ''}</td>
                </tr>
              ))}
              
              <tr className="border-b border-black border-t-2 border-t-black">
                <td className="w-8 border-r border-gray-300 text-center font-bold">20</td>
                <td className="p-1 font-bold">Total expenses. Add lines 5 through 19</td>
                <td className="w-24 border-l border-gray-300 p-1 text-right font-mono font-bold bg-gray-100">{formatCurrency(totalExpenses)}</td>
              </tr>

              <tr>
                <td className="w-8 border-r border-gray-300 text-center font-bold">21</td>
                <td className="p-1 font-bold">Subtract line 20 from line 3. (Rental Real Estate Income)</td>
                <td className="w-24 border-l border-gray-300 p-1 text-right font-mono font-bold bg-gray-200 border-b-4 border-black">{formatCurrency(netIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-gray-500 text-center italic mt-12">
          Automatically generated by RealEstateOS Tax Compliance Engine. 
          Information provided should be verified by a licensed CPA.
        </p>

      </div>
    </div>
  )
}
