'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Calculator, 
  FileCheck, 
  Clock, 
  RotateCw, 
  Users,
  ShieldCheck
} from 'lucide-react';

export default function EmployerPayrollPage() {
  const { currentPersona, refreshTrigger, triggerRefresh } = useApp();
  const [workRecords, setWorkRecords] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reconciliation modal
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [approvedHoursInput, setApprovedHoursInput] = useState<number>(12);
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState('');

  useEffect(() => {
    fetchPayrollData();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/payroll?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setWorkRecords(json.workRecords || []);
        setPayslips(json.payslips || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReconcileModal = (rec: any) => {
    setSelectedRecord(rec);
    setApprovedHoursInput(rec.recorded_hours);
    setReconciliationNotes(`Supervisory verification of biometric turnstile attendance. Confirmed ${rec.recorded_hours}h on site.`);
    setReconcileSuccessMsg('');
  };

  const handleExecuteReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setReconciling(true);

    try {
      const res = await fetch('/api/payroll/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workRecordId: selectedRecord.id,
          approvedHours: approvedHoursInput,
          resolutionNotes: reconciliationNotes,
          reviewerId: currentPersona.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReconcileSuccessMsg(data.message || 'Reconciliation executed successfully!');
        setTimeout(() => {
          setSelectedRecord(null);
          setReconcileSuccessMsg('');
          triggerRefresh();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReconciling(false);
    }
  };

  const disputedRecords = workRecords.filter(r => r.status === 'disputed' || r.recorded_hours > r.approved_hours);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Finance & Compliance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Payroll Reconciliation & Hours Discrepancy Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Resolve variance between recorded clock entries and supervisor approvals. Issuing corrections automatically recalculates net pay and writes to the Fairness Ledger.
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div className="text-slate-400">Discrepancies Awaiting Review:</div>
          <div className="text-xl font-bold text-amber-400">{disputedRecords.length} record(s)</div>
        </div>
      </div>

      {/* Discrepancies Action Queue (Seeded 12h vs 8h scenario!) */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Hours Discrepancies Requiring Supervisory Review
        </h2>

        {disputedRecords.length === 0 ? (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All recorded shift hours have been reconciled with payroll inputs.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {disputedRecords.map((rec) => {
              const diff = rec.recorded_hours - rec.approved_hours;

              return (
                <div
                  key={rec.id}
                  className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{rec.user_name}</span>
                        <span className="text-[10px] text-slate-400">({rec.job_title})</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {diff.toFixed(1)} Unapproved Hours
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Shift Date: <strong className="text-slate-200">{rec.shift_date}</strong> • Hourly Rate: ${rec.hourly_rate?.toFixed(2)}/hr
                      </div>
                    </div>

                    <button
                      onClick={() => openReconcileModal(rec)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                    >
                      <FileCheck className="w-4 h-4" />
                      Investigate & Reconcile Hours
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Physical Turnstile Recorded</span>
                      <span className="text-sm font-bold text-white">{rec.recorded_hours.toFixed(1)} hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Supervisor Initially Approved</span>
                      <span className="text-sm font-bold text-amber-400">{rec.approved_hours.toFixed(1)} hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Unpaid Wage Gap</span>
                      <span className="text-sm font-bold text-rose-400">
                        ${((diff) * (rec.hourly_rate || 24.50) * 1.5).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {rec.reconciliation_notes && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <strong>Audit Log Note:</strong> {rec.reconciliation_notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Published Payslips Roster */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          Active Payroll Period Payslips & Mathematical Trace
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Worker</th>
                  <th className="py-3.5 px-4 font-semibold">Period</th>
                  <th className="py-3.5 px-4 font-semibold">Regular / OT Hours</th>
                  <th className="py-3.5 px-4 font-semibold">Gross Pay</th>
                  <th className="py-3.5 px-4 font-semibold">Net Pay</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{p.user_name}</div>
                      <div className="text-[11px] text-slate-400">{p.job_title}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {p.period_start} to {p.period_end}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>Regular: {p.regular_hours}h</div>
                      <div className="text-emerald-400 font-semibold">OT: {p.approved_overtime_hours}h</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      ${p.gross_pay?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-400 text-sm">
                      ${p.net_pay?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.has_discrepancy
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.has_discrepancy ? 'Discrepancy Pending' : 'Reconciled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reconcile Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  Supervisory Hours Reconciliation
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Worker: {selectedRecord.user_name} • Shift Date: {selectedRecord.shift_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {reconcileSuccessMsg ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{reconcileSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleExecuteReconciliation} className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Physical Biometric Logged:</span>
                    <strong className="text-white">{selectedRecord.recorded_hours.toFixed(1)} hours</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Initial Supervisor Approved:</span>
                    <strong className="text-amber-400">{selectedRecord.approved_hours.toFixed(1)} hours</strong>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Set Reconciled Approved Hours:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                    value={approvedHoursInput}
                    onChange={(e) => setApprovedHoursInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Approving {approvedHoursInput}h will resolve the {selectedRecord.recorded_hours - selectedRecord.approved_hours}h discrepancy and disburse overtime pay.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Reconciliation Audit Justification:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reconciliationNotes}
                    onChange={(e) => setReconciliationNotes(e.target.value)}
                    placeholder="Enter formal justification (e.g. Supervisor verified site access logs and work output during extended concrete pour)."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reconciling}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
                  >
                    {reconciling ? 'Updating Ledger & Payroll...' : 'Sign Off & Execute Reconciliation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
