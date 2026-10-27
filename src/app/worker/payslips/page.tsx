'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { 
  DollarSign, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  ChevronRight,
  Calculator,
  Printer
} from 'lucide-react';

export default function WorkerPayslipsPage() {
  const { currentPersona, t, refreshTrigger } = useApp();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    fetchPayslipData();
  }, [currentPersona.id, refreshTrigger]);

  const fetchPayslipData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/worker/payslips?userId=${currentPersona.id}`);
      if (res.ok) {
        const json = await res.json();
        setPayslips(json.payslips || []);
        setReceipts(json.receipts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const primaryPayslip = payslips[0];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            {t.nav.myPay} & Transparent Breakdown
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explainable calculations linking attendance logs to approved earnings with decimal precision.
          </p>
        </div>

        {receipts.length > 0 && (
          <button
            onClick={() => setSelectedReceipt(receipts[0])}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition shadow shadow-purple-900/30"
          >
            <ShieldCheck className="w-4 h-4" />
            {t.worker.downloadReceipt} ({receipts.length})
          </button>
        )}
      </div>

      {primaryPayslip ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payslip Breakdown Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payroll Period</span>
                  <div className="text-lg font-bold text-white">
                    {primaryPayslip.period_start} to {primaryPayslip.period_end}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Worker: {currentPersona.name} ({currentPersona.title})
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.worker.netPay}</span>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    ${primaryPayslip.net_pay.toFixed(2)}
                  </div>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    primaryPayslip.has_discrepancy 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {primaryPayslip.has_discrepancy ? 'Discrepancy Flagged' : 'Fully Reconciled'}
                  </span>
                </div>
              </div>

              {/* Discrepancy Warning Notice */}
              {primaryPayslip.has_discrepancy && (
                <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Unapproved Overtime Gap Identified:</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {primaryPayslip.discrepancy_details}
                  </p>
                  <div className="text-[11px] text-amber-400/80 font-medium">
                    Attendance records logged {primaryPayslip.recorded_overtime_hours} overtime hours on site, but only {primaryPayslip.approved_overtime_hours} hours were included in this disbursement.
                  </div>
                </div>
              )}

              {/* Earnings Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Earnings Calculation</h3>
                <div className="bg-slate-950/70 rounded-xl p-4 divide-y divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-white">{t.worker.basePay}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {primaryPayslip.regular_hours} hrs @ ${primaryPayslip.base_rate.toFixed(2)}/hr
                      </span>
                    </div>
                    <span className="font-bold text-slate-200">${primaryPayslip.base_pay.toFixed(2)}</span>
                  </div>

                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-white">{t.worker.overtimePay} (1.5x)</span>
                      <span className="text-[11px] text-slate-400 block">
                        {primaryPayslip.approved_overtime_hours} approved hrs @ ${primaryPayslip.overtime_rate.toFixed(2)}/hr
                      </span>
                    </div>
                    <span className="font-bold text-slate-200">${primaryPayslip.overtime_pay.toFixed(2)}</span>
                  </div>

                  {/* Allowances */}
                  {primaryPayslip.allowances?.map((a: any, i: number) => (
                    <div key={i} className="py-2.5 flex justify-between items-center text-slate-300">
                      <div>
                        <span className="font-semibold text-white">{a.name}</span>
                        <span className="text-[11px] text-slate-400 block">Standard itemized benefit allowance</span>
                      </div>
                      <span className="font-bold text-emerald-400">+${a.amount.toFixed(2)}</span>
                    </div>
                  ))}

                  <div className="py-2.5 flex justify-between items-center font-bold text-white pt-3 border-t border-slate-700">
                    <span>{t.worker.grossPay}</span>
                    <span className="text-sm">${primaryPayslip.gross_pay.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Itemized Deductions</h3>
                <div className="bg-slate-950/70 rounded-xl p-4 divide-y divide-slate-800 text-xs">
                  {primaryPayslip.deductions?.map((d: any, i: number) => (
                    <div key={i} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-white">{d.name}</span>
                        <span className="text-[11px] text-slate-400 block">{d.explanation}</span>
                      </div>
                      <span className="font-bold text-rose-400">-${d.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mathematical Calculation Trace & Auditable Evidence */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Deterministic Trace</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                FairShift guarantees that pay figures derive directly from verified mathematical business rules with zero hidden rounding.
              </p>

              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-[11px] font-mono text-emerald-300 space-y-2">
                <div className="text-slate-400 text-[10px] uppercase font-sans">Formula Applied:</div>
                <div className="break-all">{primaryPayslip.calculation_trace?.formula}</div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rules Applied:</div>
                {primaryPayslip.calculation_trace?.rules_applied?.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-emerald-400">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issued Fairness Receipts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Fairness Receipts</h3>
                </div>
                <span className="text-xs text-purple-400 font-bold">{receipts.length}</span>
              </div>

              {receipts.length === 0 ? (
                <div className="text-xs text-slate-400 py-3">
                  No discrepancy reconciliation receipts issued for this period yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {receipts.map((rcpt) => (
                    <div
                      key={rcpt.id}
                      onClick={() => setSelectedReceipt(rcpt)}
                      className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{rcpt.receipt_type.replace('_', ' ').toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400">{rcpt.decision_date}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">{rcpt.issue_summary}</p>
                      <div className="text-[10px] text-emerald-400 font-semibold">{rcpt.verification_status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
          <p className="text-sm text-slate-400">Loading transparent payslip records...</p>
        </div>
      )}

      {/* Fairness Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Official Document</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  {t.fairnessReceipt.title}
                </h3>
                <p className="text-[11px] text-slate-400">{t.fairnessReceipt.subtitle}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-semibold">{t.fairnessReceipt.org}:</span>
                <span className="text-white font-bold">{currentPersona.orgName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-semibold">{t.fairnessReceipt.worker}:</span>
                <span className="text-white">{currentPersona.name} ({currentPersona.title})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-semibold">{t.fairnessReceipt.decisionAuthority}:</span>
                <span className="text-white font-medium">{selectedReceipt.decided_by}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-semibold">{t.fairnessReceipt.verificationStatus}:</span>
                <span className="text-emerald-400 font-bold">{selectedReceipt.verification_status}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">{t.fairnessReceipt.discrepancyIdentified}:</span>
                <p className="text-slate-200 bg-slate-900 p-2.5 rounded-lg">{selectedReceipt.issue_summary}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-1">{t.fairnessReceipt.investigationFindings}:</span>
                <p className="text-slate-200 bg-slate-900 p-2.5 rounded-lg">{selectedReceipt.findings}</p>
              </div>
              {selectedReceipt.corrections_applied && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">{t.fairnessReceipt.correctionApplied}:</span>
                  <p className="text-emerald-300 bg-slate-900 p-2.5 rounded-lg">{selectedReceipt.corrections_applied}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Tamper-evident record • ID: {selectedReceipt.id}
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
