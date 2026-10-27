'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Info, 
  Moon, 
  Calendar,
  HelpCircle
} from 'lucide-react';

export default function WorkloadBurdenPage() {
  const { currentPersona, refreshTrigger } = useApp();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkload();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/workload?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setAnalysis(json.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Workforce Equity Analytics
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <Scale className="w-6 h-6 text-emerald-400" />
            Hidden Burden Detector & Overtime Equity
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Detects systematic concentration of overtime, night shifts, or emergency call-outs among a subset of workers. Prevents chronic burnout without punitive employee scoring.
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-right">
          <span className="text-slate-400 block">Department Audited:</span>
          <span className="text-sm font-bold text-white">{analysis?.department || 'Operations'}</span>
        </div>
      </div>

      {/* 3 Metric Cards: Gini, Top 20% Share, Total OT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gini Coefficient Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Workload Gini Index</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analysis?.giniCoefficient?.toFixed(2) ?? '...'}
          </div>
          <div className="text-[11px] text-slate-400">
            0.0 = Equal allocation • 1.0 = Total disparity
          </div>
        </div>

        {/* Top 20% Share Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Top 20% Workers OT Share</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {analysis?.top20PercentShare ?? '...'}%
          </div>
          <div className="text-[11px] text-slate-400">
            {analysis?.isConcentrationFlagged ? '⚠️ Disproportionate burden flagged' : 'Within normal bounds'}
          </div>
        </div>

        {/* Total Overtime Hours */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cumulative Overtime Volume</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {analysis?.totalOvertimeHours?.toFixed(1) ?? '...'}h
          </div>
          <div className="text-[11px] text-slate-400">
            Across {analysis?.totalWorkers ?? 0} frontline staff
          </div>
        </div>
      </div>

      {/* Hidden Burden Alert Card (if concentration flagged) */}
      {analysis?.isConcentrationFlagged ? (
        <div className="p-6 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-300">
                  Overtime Concentration Pattern Detected
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Fairness Alert
                </span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {analysis?.insights[0]}
              </p>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {analysis?.insights[1]}
              </p>
            </div>
          </div>

          {/* Responsible Alternative Explanations */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Responsible AI Context & Alternative Explanations
            </span>
            <p className="text-slate-400 text-[11px]">
              Statistical concentration does not automatically establish favoritism or coercion. Supervisors should investigate the following valid operational reasons:
            </p>
            <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
              {analysis?.alternativeExplanations?.map((exp: string, i: number) => (
                <li key={i}>{exp}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">Workload Distribution is Balanced</span>
            <span className="text-slate-400">Overtime and night shift assignments are evenly distributed across the team.</span>
          </div>
        </div>
      )}

      {/* Workers Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Frontline Worker Workload Allocation
          </h2>
          <span className="text-[11px] text-slate-400">Sorted by Overtime Burden</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Worker</th>
                <th className="py-3 px-4 font-semibold">Job Title</th>
                <th className="py-3 px-4 font-semibold">Regular Hours</th>
                <th className="py-3 px-4 font-semibold">Overtime Hours</th>
                <th className="py-3 px-4 font-semibold">Night Shifts</th>
                <th className="py-3 px-4 font-semibold">Cumulative Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {analysis?.workerSummaries?.map((w: any) => (
                <tr key={w.userId} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {w.userName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {w.jobTitle}
                  </td>
                  <td className="py-3.5 px-4">
                    {w.regularHours.toFixed(1)} hrs
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={w.overtimeHours > 5 ? 'font-bold text-amber-400' : 'text-slate-300'}>
                      {w.overtimeHours.toFixed(1)} hrs
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {w.nightShiftCount > 0 ? (
                      <span className="text-purple-300 font-semibold">{w.nightShiftCount} shifts</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-white">
                    {w.totalHours.toFixed(1)} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
