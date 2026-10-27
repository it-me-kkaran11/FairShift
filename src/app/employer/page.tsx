'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Users, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  HardHat,
  GraduationCap
} from 'lucide-react';

export default function EmployerOverviewPage() {
  const { currentPersona, refreshTrigger } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/dashboard?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isConstruction = currentPersona.orgId === 'org-construction';

  return (
    <div className="space-y-8">
      {/* Overview Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border ${
            isConstruction 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {isConstruction ? <HardHat className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Operational Fairness Intelligence
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              {currentPersona.orgName}
            </h1>
            <p className="text-xs text-slate-400">
              Active Reviewer: {currentPersona.name} ({currentPersona.title})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/employer/fairness-engine"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            <ShieldCheck className="w-4 h-4" />
            Launch Fairness Engine
          </Link>
          <Link
            href="/employer/simulator"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            Shift Simulator
          </Link>
        </div>
      </div>

      {/* 5 Aggregated Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Alerts */}
        <Link href="/employer/fairness-engine" className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-1 transition group">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Fairness Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {data?.metrics?.activeAlertsCount ?? '...'}
          </div>
          <div className="text-[11px] text-slate-500 group-hover:text-slate-300">
            Action required →
          </div>
        </Link>

        {/* Payroll Discrepancies */}
        <Link href="/employer/payroll" className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-1 transition group">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pay Discrepancies</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {data?.metrics?.disputedPayrollCount ?? '...'}
          </div>
          <div className="text-[11px] text-slate-500 group-hover:text-slate-300">
            Hours review queue →
          </div>
        </Link>

        {/* Open Cases */}
        <Link href="/employer/grievances" className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-1 transition group">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Cases</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {data?.metrics?.openCasesCount ?? '...'}
          </div>
          <div className="text-[11px] text-slate-500 group-hover:text-slate-300">
            SafeSpeak queue →
          </div>
        </Link>

        {/* Verified Resolutions */}
        <Link href="/employer/grievances" className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-1 transition group">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {data?.metrics?.verifiedCasesCount ?? '...'}
          </div>
          <div className="text-[11px] text-slate-500 group-hover:text-slate-300">
            Audited & closed →
          </div>
        </Link>

        {/* Active Workforce */}
        <Link href="/employer/workforce" className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-2xl space-y-1 transition group">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Frontline Workers</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {data?.metrics?.workersCount ?? '...'}
          </div>
          <div className="text-[11px] text-slate-500 group-hover:text-slate-300">
            Directory & teams →
          </div>
        </Link>
      </div>

      {/* Urgent Operational Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Fairness Gap Engine Alerts</h2>
          </div>
          <Link href="/employer/fairness-engine" className="text-xs font-semibold text-emerald-400 hover:underline">
            View All Alerts ({data?.recentAlerts?.length || 0}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.recentAlerts?.map((alert: any) => (
            <div
              key={alert.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-3 transition shadow flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    alert.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : alert.severity === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {alert.severity} • {alert.alert_type.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    alert.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {alert.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{alert.issue}</h3>

                <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <strong>Triggered Rule:</strong> {alert.rule_description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">Ref: {alert.record_ref}</span>
                <Link
                  href={alert.alert_type === 'overtime_discrepancy' ? '/employer/payroll' : '/employer/fairness-engine'}
                  className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Investigate & Reconcile <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grievances & Remedy Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">SafeSpeak & Remedy Queue</h2>
          </div>
          <Link href="/employer/grievances" className="text-xs font-semibold text-blue-400 hover:underline">
            Manage Cases ({data?.recentCases?.length || 0}) →
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Case Reference</th>
                  <th className="py-3 px-4 font-semibold">Category & Priority</th>
                  <th className="py-3 px-4 font-semibold">Summary</th>
                  <th className="py-3 px-4 font-semibold">Lifecycle Status</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.recentCases?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {c.case_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold capitalize">{c.category.replace('_', ' ')}</div>
                      <span className={`text-[10px] font-bold ${c.priority === 'urgent' ? 'text-rose-400' : 'text-slate-400'}`}>
                        {c.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-200">
                      {c.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'resolved' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : c.status === 'awaiting_verification'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {c.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/employer/grievances/${c.id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition inline-flex items-center gap-1"
                      >
                        Inspect Case <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
