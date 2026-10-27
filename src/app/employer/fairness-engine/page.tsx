'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Info, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Scale, 
  FileText,
  HelpCircle,
  RotateCw
} from 'lucide-react';

export default function FairnessEnginePage() {
  const { currentPersona, t, refreshTrigger, triggerRefresh } = useApp();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Resolve modal
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/fairness-engine?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.alerts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setResolving(true);

    try {
      const res = await fetch('/api/employer/fairness-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: selectedAlert.id,
          status: 'resolved',
          resolutionNotes: resolutionNote,
          reviewerId: currentPersona.id
        })
      });

      if (res.ok) {
        setSelectedAlert(null);
        setResolutionNote('');
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'all') return true;
    return a.alert_type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Title & Core Principle */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-3 shadow">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                Signature Feature
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                Deterministic Engine
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {t.engine.title}
            </h1>
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          {t.engine.subtitle} Alerts highlight discrepancies requiring investigation; they do not assume misconduct, wage theft, or employee fault.
        </p>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Deterministic Logic:</strong> All alerts derive from verifiable mathematical comparison between turnstile records, supervisor rosters, labor rest statutes, and case deadlines.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { key: 'all', label: `All Alerts (${alerts.length})` },
          { key: 'overtime_discrepancy', label: 'Overtime Gaps' },
          { key: 'insufficient_rest', label: 'Rest Period Risks' },
          { key: 'hazard_recurrence', label: 'Recurring Hazards' },
          { key: 'overdue_action', label: 'Overdue Actions' },
          { key: 'uneven_allocation', label: 'Workload Concentration' }
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterType === f.key
                ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Active Alerts in this Category</h3>
          <p>All recorded shifts, rest intervals, and case actions are compliant with configured organization rules.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'resolved';

            return (
              <div
                key={alert.id}
                className={`bg-slate-900 border rounded-2xl p-6 space-y-4 shadow transition ${
                  isResolved
                    ? 'border-slate-800 opacity-75'
                    : alert.severity === 'critical'
                    ? 'border-rose-500/30'
                    : 'border-amber-500/30'
                }`}
              >
                {/* Header: Severity, Rule, Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : alert.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {alert.severity} • {alert.alert_type.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      [{alert.rule_id}]
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isResolved
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {alert.status.toUpperCase()}
                  </span>
                </div>

                {/* Issue Headline */}
                <h3 className="text-base font-bold text-white leading-snug">
                  {alert.issue}
                </h3>

                {/* Evidence Grid (Explainable Intelligence) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Deterministic Evidence</span>
                    <div className="text-slate-200">
                      {alert.evidence.difference && (
                        <div className="text-amber-400 font-semibold mb-1">
                          Gap: {alert.evidence.difference}
                        </div>
                      )}
                      <div className="text-slate-300 text-[11px]">
                        Recorded: {alert.evidence.recorded_value || alert.evidence.recorded_hours || 'Logged on turnstile'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Expected / Approved: {alert.evidence.expected_or_approved_value || alert.evidence.approved_hours || 'Standard approval limit'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Context & Associated Records</span>
                    <p className="text-[11px] text-slate-300">
                      {alert.evidence.context || `Referenced Record: ${alert.record_ref}`}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Record: {alert.record_ref}
                    </div>
                  </div>
                </div>

                {/* Rule Triggered & Recommended Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Triggered Labor Safety Rule:</span>
                    <p className="text-slate-300 text-[11px]">{alert.rule_description}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Recommended Next Action:</span>
                    <p className="text-emerald-300 text-[11px]">{alert.recommended_action}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
                  <span className="text-[10px] text-slate-500">
                    Detected: {new Date(alert.created_at).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {alert.alert_type === 'overtime_discrepancy' && (
                      <Link
                        href="/employer/payroll"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition shadow"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Reconcile in Payroll
                      </Link>
                    )}

                    {!isResolved && (
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/40 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-600 text-xs font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Record Resolution
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Resolve Fairness Alert
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Alert: {selectedAlert.issue}
                </p>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveAlert} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Investigation Findings & Corrective Action Taken:
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g., Reviewed site camera footage and turnstile logs. Supervisor confirmed valid work during overtime hours. Payroll adjusted accordingly."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
                >
                  {resolving ? 'Logging to Ledger...' : 'Mark Alert Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
