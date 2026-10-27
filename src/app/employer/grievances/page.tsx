'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  EyeOff, 
  User, 
  Filter,
  Building2
} from 'lucide-react';

export default function EmployerGrievancesPage() {
  const { currentPersona, refreshTrigger } = useApp();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCases();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases?orgId=${currentPersona.orgId}&role=manager`);
      if (res.ok) {
        const json = await res.json();
        setCases(json.cases || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return c.status !== 'resolved' && c.status !== 'rejected';
    if (statusFilter === 'awaiting_verification') return c.status === 'awaiting_verification';
    if (statusFilter === 'resolved') return c.status === 'resolved';
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              Health, Safety & Grievance Governance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <FileText className="w-6 h-6 text-blue-400" />
            Remedy Tracker — Verified Resolution Lifecycle
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Audit-grade accountability for workplace concerns. Cases cannot be closed as resolved until independent physical safety verification is executed and signed off.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 block">Pending Verification:</span>
            <span className="text-lg font-bold text-purple-400">
              {cases.filter(c => c.status === 'awaiting_verification').length} case(s)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { key: 'all', label: `All Cases (${cases.length})` },
          { key: 'open', label: 'Active Investigation' },
          { key: 'awaiting_verification', label: 'Pending Verification 🛡️' },
          { key: 'resolved', label: 'Verified Resolved' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg border transition ${
              statusFilter === tab.key
                ? 'bg-blue-600 text-white border-blue-500 shadow'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cases Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Case Reference</th>
                <th className="py-3.5 px-4 font-semibold">Identity Mode</th>
                <th className="py-3.5 px-4 font-semibold">Category & Priority</th>
                <th className="py-3.5 px-4 font-semibold">Title & Description</th>
                <th className="py-3.5 px-4 font-semibold">Remedy Status</th>
                <th className="py-3.5 px-4 font-semibold">SLA Deadline</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCases.map((c) => {
                const isAnonymous = Boolean(c.is_anonymous);
                const isAwaitingVerification = c.status === 'awaiting_verification';
                const isResolved = c.status === 'resolved';

                return (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {c.case_number}
                    </td>

                    <td className="py-3.5 px-4">
                      {isAnonymous ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <EyeOff className="w-3 h-3" /> Anonymous
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          <User className="w-3 h-3 text-slate-400" /> Identified
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white capitalize">{c.category.replace('_', ' ')}</div>
                      <span className={`text-[10px] font-bold ${
                        c.priority === 'urgent' ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {c.priority.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-200">{c.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{c.description}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isResolved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isAwaitingVerification
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {isAwaitingVerification ? 'Pending Physical Check' : c.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {c.target_deadline ? new Date(c.target_deadline).toLocaleDateString() : 'None'}
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/employer/grievances/${c.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1 transition shadow"
                      >
                        Triage & Remedy <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
