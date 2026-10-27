'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { 
  History, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  FileText, 
  Filter, 
  User, 
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AuditLedgerPage() {
  const { currentPersona, refreshTrigger } = useApp();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchLedger();
  }, [currentPersona.orgId, filterType, refreshTrigger]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/ledger?orgId=${currentPersona.orgId}&entityType=${filterType}`);
      if (res.ok) {
        const json = await res.json();
        setEvents(json.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEntityBadge = (type: string) => {
    switch (type) {
      case 'payroll':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">PAYROLL</span>;
      case 'grievance':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">GRIEVANCE</span>;
      case 'verification':
        return <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">VERIFICATION</span>;
      case 'attendance':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">ATTENDANCE</span>;
      case 'shift':
        return <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold text-[10px]">SHIFT</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[10px]">{type.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
              Append-Only Auditable Ledger
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <History className="w-6 h-6 text-purple-400" />
            Fairness Ledger — Complete Event Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Chronological audit log recording all clock events, shift modifications, overtime adjustments, grievance filings, and independent safety verifications.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Strictly Append-Only</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { key: 'all', label: 'All Audit Events' },
          { key: 'payroll', label: 'Payroll & Reconciliations' },
          { key: 'grievance', label: 'SafeSpeak & Grievances' },
          { key: 'verification', label: 'Safety Verifications' },
          { key: 'attendance', label: 'Clock-In / Out Logs' },
          { key: 'shift', label: 'Shift Roster Changes' }
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterType === f.key
                ? 'bg-purple-600 text-white border-purple-500 shadow'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Audit Events List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="divide-y divide-slate-800">
          {events.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit events found for this filter.
            </div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="p-5 hover:bg-slate-850/50 transition space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    {getEntityBadge(evt.entity_type)}
                    <span className="font-bold text-white text-sm">
                      {evt.action.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      [{evt.entity_id}]
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Actor: <strong className="text-white">{evt.actor_name}</strong> ({evt.actor_role})
                  </span>
                  {evt.reason && (
                    <span className="text-slate-400 italic">
                      • "{evt.reason}"
                    </span>
                  )}
                </div>

                {evt.details && Object.keys(evt.details).length > 0 && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(evt.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
