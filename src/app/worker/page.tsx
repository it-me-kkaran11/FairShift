'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  TrendingUp, 
  FileText 
} from 'lucide-react';

export default function WorkerHomePage() {
  const { currentPersona, t, refreshTrigger, triggerRefresh } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    todayShift: any;
    workRecordDiscrepancies: any[];
    latestPayslip: any;
    myCases: any[];
    clockStatus: 'in' | 'out';
    lastClockTime: string;
  }>({
    todayShift: null,
    workRecordDiscrepancies: [],
    latestPayslip: null,
    myCases: [],
    clockStatus: 'out',
    lastClockTime: ''
  });

  const [clockLoading, setClockLoading] = useState(false);
  const [clockMsg, setClockMsg] = useState('');

  useEffect(() => {
    fetchWorkerData();
  }, [currentPersona.id, refreshTrigger]);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      // In a real app we fetch from API. Let's create an API endpoint or fetch directly
      const res = await fetch(`/api/worker/dashboard?userId=${currentPersona.id}`);
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

  const handleClockToggle = async () => {
    setClockLoading(true);
    setClockMsg('');
    try {
      const nextEvent = data.clockStatus === 'in' ? 'clock_out' : 'clock_in';
      const res = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentPersona.id,
          eventType: nextEvent,
          siteId: data.todayShift?.site_id || 'site-apex-a',
          verificationMethod: 'site_kiosk'
        })
      });
      if (res.ok) {
        setClockMsg(nextEvent === 'clock_in' ? 'Successfully clocked in!' : 'Successfully clocked out!');
        triggerRefresh();
      }
    } catch (err) {
      setClockMsg('Failed to record clock event.');
    } finally {
      setClockLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Worker Header Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {t.worker.greeting}, {currentPersona.name}
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {currentPersona.industry}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentPersona.title} • {currentPersona.orgName}
          </p>
        </div>

        {/* Quick Clock-in Widget */}
        <div className="flex items-center gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400">Current Status</div>
            <div className={`text-xs font-bold ${data.clockStatus === 'in' ? 'text-emerald-400' : 'text-slate-300'}`}>
              {data.clockStatus === 'in' ? t.worker.statusOnDuty : t.worker.statusOffDuty}
            </div>
          </div>
          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
              data.clockStatus === 'in'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            {data.clockStatus === 'in' ? t.worker.clockOut : t.worker.clockIn}
          </button>
        </div>
      </div>

      {clockMsg && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{clockMsg}</span>
        </div>
      )}

      {/* Critical Fairness Alert Banner (e.g. Ramanathan's 4.0h Overtime Discrepancy!) */}
      {data.workRecordDiscrepancies.length > 0 && (
        <div className="p-5 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-300">
                  {t.worker.unresolvedAlerts}: Hours Discrepancy Flagged
                </h3>
                <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                FairShift detected that your shift on <strong>2026-10-22</strong> has <strong>12.0 recorded hours</strong> on the turnstile access system, but only <strong>8.0 hours were approved</strong> for payroll. 4.0 hours remain pending supervisory reconciliation.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-amber-500/20 text-xs">
            <Link
              href="/worker/payslips"
              className="font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
            >
              Inspect Payslip & Calculation Trace
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Shift Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.worker.todayShift}</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          {data.todayShift ? (
            <div>
              <div className="text-lg font-bold text-white">
                {data.todayShift.start_time} - {data.todayShift.end_time}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {data.todayShift.site_name || 'Main Construction Site'}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">
                {data.todayShift.planned_hours} hrs scheduled
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 py-2">
              {t.worker.noShift}
            </div>
          )}
        </div>

        {/* Weekly Hours Worked */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.worker.hoursThisWeek}</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">47.5 hrs</div>
            <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
              <span>{t.worker.regularHours}: 40.0h</span>
              <span className="text-amber-400 font-medium">{t.worker.overtimeHours}: 7.5h</span>
            </div>
          </div>
        </div>

        {/* Latest Net Pay Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.worker.payslipSummary}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          {data.latestPayslip ? (
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                ${data.latestPayslip.net_pay.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
                <span>Gross: ${data.latestPayslip.gross_pay.toFixed(2)}</span>
                <Link href="/worker/payslips" className="text-emerald-400 font-medium hover:underline">
                  Breakdown →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-2">No payslips yet.</div>
          )}
        </div>
      </div>

      {/* Two Action Columns: SafeSpeak Quick Report & Recent Shifts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SafeSpeak Banner */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SafeSpeak Confidential Reporting</h3>
              <p className="text-xs text-slate-400">Report safety risks, wage disputes, or unfair treatment safely.</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            {t.worker.anonymousDisclaimer}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/worker/report"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow"
            >
              <FileText className="w-4 h-4" />
              {t.worker.submitNewReport}
            </Link>
            <Link
              href="/worker/cases"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              View My Reported Cases ({data.myCases.length})
            </Link>
          </div>
        </div>

        {/* Skill Passport Summary */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t.skills.title}</h3>
                <p className="text-xs text-slate-400">Portable, worker-owned verified credentials.</p>
              </div>
            </div>
            <Link href="/worker/skills" className="text-xs font-semibold text-purple-400 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-white">OSHA 30-Hour Construction Safety</div>
                <div className="text-[11px] text-slate-400">Occupational Safety & Health Admin</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Certified
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-white">Heavy Excavator & Crane Class A</div>
                <div className="text-[11px] text-slate-400">Intl Union of Operating Engineers</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Licensed
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            {t.skills.reassurance}
          </p>
        </div>
      </div>
    </div>
  );
}
