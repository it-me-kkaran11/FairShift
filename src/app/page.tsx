'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  Scale, 
  ShieldCheck, 
  HardHat, 
  GraduationCap, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  FileText, 
  Award, 
  Sliders, 
  History, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function LandingPage() {
  const { currentPersona, setPersonaId, t } = useApp();

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SDG 8: Decent Work & Economic Growth • Prompt Wars 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            FairShift: A Worker-First Workplace Fairness Intelligence Platform
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Addressing opaque salaries, inconsistent overtime approvals, safety reporting retaliation fears, and fatigue risks in employee-intensive organisations. Powered by a deterministic rules engine, auditable fairness ledger, and anonymous SafeSpeak follow-up channels.
          </p>

          <div className="flex flex-wrap gap-4 pt-3">
            <Link
              href="/worker"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition-all hover:translate-y-[-1px]"
            >
              Enter Worker View (Ramanathan / Priya)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/employer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm transition-all"
            >
              Enter Employer / Admin View
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Industries, One Platform */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Two Distinct Industries, One Unified Platform</h2>
          <p className="text-sm text-slate-400">
            FairShift uses configurable industry rule profiles to resolve authentic workplace challenges without separate codebases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Industry 1: Construction */}
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-6 sm:p-8 space-y-5 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <HardHat className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">Industry 1 Profile</span>
                <h3 className="text-xl font-bold text-white">Apex Infrastructure Ltd (Construction)</h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Site turnstile attendance, heavy equipment operations, scaffolding safety compliance, and rest intervals across multi-tier civil sites.
            </p>

            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Overtime Discrepancy Scenario:</strong> Ramanathan has 12.0h recorded attendance vs 8.0h approved. FairShift flags the 4-hour gap for investigation without assuming misconduct.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Scaffolding Hazard Resolution:</strong> Level 4 unstable scaffolding reported by Carlos, assigned to HSE Officer Marcus Vance, and verified before status closure.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Rest Interval Risk:</strong> Carlos scheduled on night shift ending at 06:00 and next shift at 14:00 (only 8h rest vs required 11h).
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setPersonaId('usr-const-w1');
                window.location.href = '/worker';
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Test Construction Scenarios as Ramanathan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Industry 2: Higher Education Support Staff */}
          <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-6 sm:p-8 space-y-5 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">Industry 2 Profile</span>
                <h3 className="text-xl font-bold text-white">Metropolitan Technical University</h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Non-academic essential support staff: custodial teams, campus security, and facilities maintenance working across academic buildings and residence halls.
            </p>

            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Hidden Burden Concentration:</strong> Overtime repeatedly concentrated among 2 housekeeping staff (78% share, Gini 0.68). Evidenced-based workload alert.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Unverified Chemical Hazard:</strong> Anonymous solvent complaint (FS-CHEM-9812) administratively marked done by maintenance, but blocked until independent safety officer check.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Language Inclusion:</strong> Support staff Priya and Suresh view full Tamil (தமிழ்) localized payslips, attendance, and reporting.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setPersonaId('usr-univ-w1');
                window.location.href = '/worker';
              }}
              className="w-full py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              Test Higher Education Scenarios as Priya
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Signature Architectural Pillars */}
      <div>
        <div className="mb-6 space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Signature Product Capabilities</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Differentiated beyond generic HR tools through auditable evidence, explainability, and verified remedies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/employer/fairness-engine" className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 p-5 rounded-xl transition group">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white mb-1">Fairness Gap Engine</h4>
            <p className="text-xs text-slate-400">Deterministic rules engine identifying hours gaps, rest risks, and repeated hazards with explainable evidence.</p>
          </Link>

          <Link href="/worker/report" className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 p-5 rounded-xl transition group">
            <FileText className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white mb-1">SafeSpeak & Remedy</h4>
            <p className="text-xs text-slate-400">Confidential and anonymous reporting with hashed passcodes, two-way follow-up dialogue, and verified outcomes.</p>
          </Link>

          <Link href="/employer/simulator" className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 p-5 rounded-xl transition group">
            <Sliders className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white mb-1">What-If Shift Simulator</h4>
            <p className="text-xs text-slate-400">Preview proposed schedules against jurisdiction labor limits and rest periods before publishing.</p>
          </Link>

          <Link href="/employer/audit-ledger" className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 p-5 rounded-xl transition group">
            <History className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white mb-1">Fairness Ledger</h4>
            <p className="text-xs text-slate-400">Chronological, append-only event trail of all attendance, adjustments, grievance lifecycle, and verification events.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
