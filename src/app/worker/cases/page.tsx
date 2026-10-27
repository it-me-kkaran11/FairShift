'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  MessageSquare,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function WorkerCasesPage() {
  const { currentPersona, t, refreshTrigger } = useApp();
  const [identifiedCases, setIdentifiedCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Anonymous lookup form state
  const [trackCode, setTrackCode] = useState('');
  const [trackPin, setTrackPin] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [anonymousCase, setAnonymousCase] = useState<any>(null);

  useEffect(() => {
    fetchMyCases();
  }, [currentPersona.id, refreshTrigger]);

  const fetchMyCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases?orgId=${currentPersona.orgId}&userId=${currentPersona.id}&role=worker`);
      if (res.ok) {
        const json = await res.json();
        setIdentifiedCases(json.cases || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackAnonymous = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackingLoading(true);
    setAnonymousCase(null);

    try {
      const res = await fetch('/api/cases/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode: trackCode,
          passcode: trackPin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate case.');
      }

      setAnonymousCase(data.case);
    } catch (err: any) {
      setTrackError(err.message || 'Authentication error.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Verified Resolved</span>;
      case 'awaiting_verification':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Pending Physical Verification</span>;
      case 'action_proposed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Action Proposed</span>;
      case 'under_investigation':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Under Investigation</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            {t.cases.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track investigation lifecycles, communicate with reviewers, and appeal if issues persist.
          </p>
        </div>

        <Link
          href="/worker/report"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
        >
          {t.worker.submitNewReport}
        </Link>
      </div>

      {/* Two Column Layout: Identified Cases vs Anonymous Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identified Cases List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              My Logged Reports ({identifiedCases.length})
            </h2>
            <span className="text-[11px] text-slate-400">Authenticated cases</span>
          </div>

          {identifiedCases.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p>You have not filed any identified reports yet.</p>
              <p className="text-slate-500">If you filed an anonymous report, use the private tracking tool on the right.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {identifiedCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/worker/cases/${c.id}`}
                  className="block p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl transition space-y-3 shadow-sm group"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {c.case_number}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {c.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                        {c.title}
                      </h3>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(c.status)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span>Filed: {new Date(c.created_at).toLocaleDateString()}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      View Remedy Timeline <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Anonymous Case Tracking Card (1 Col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
            <div className="flex items-center gap-2 text-amber-400">
              <Lock className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">{t.cases.lookupTitle}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.cases.lookupHelper}
            </p>

            <form onSubmit={handleTrackAnonymous} className="space-y-3 text-xs">
              {trackError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-xl text-[11px]">
                  {trackError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t.cases.trackingCode}
                </label>
                <input
                  type="text"
                  required
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="e.g., FS-SAFE-1042 or FS-CHEM-9812"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {t.cases.trackingPin}
                </label>
                <input
                  type="password"
                  required
                  value={trackPin}
                  onChange={(e) => setTrackPin(e.target.value)}
                  placeholder="6-character Secret PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="text-[10px] text-slate-500">
                💡 Tip for Demo: Try code <code>FS-CHEM-9812</code> with PIN <code>CHEM88</code> or <code>FS-SAFE-1042</code> with PIN <code>SAFE99</code>.
              </div>

              <button
                type="submit"
                disabled={trackingLoading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                <Search className="w-4 h-4" />
                {trackingLoading ? 'Verifying Credentials...' : t.cases.lookupBtn}
              </button>
            </form>
          </div>

          {/* Anonymous Case Retrieved Card */}
          {anonymousCase && (
            <div className="p-5 bg-slate-900 border border-emerald-500/40 rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Authenticated Case</span>
                  <div className="text-base font-bold text-white">{anonymousCase.title}</div>
                  <div className="text-[11px] font-mono text-slate-400">{anonymousCase.case_number}</div>
                </div>
                {getStatusBadge(anonymousCase.status)}
              </div>

              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {anonymousCase.description}
              </p>

              {anonymousCase.correctiveActions?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase">Corrective Actions:</span>
                  {anonymousCase.correctiveActions.map((a: any) => (
                    <div key={a.id} className="p-2.5 bg-slate-950 rounded-lg text-xs space-y-1">
                      <div className="text-slate-200">{a.action_description}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        Verification: {a.verification_status}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href={`/worker/cases/${anonymousCase.id}`}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
              >
                Open Full Anonymous Dialogue
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
