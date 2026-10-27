'use client';

import React from 'react';
import { useApp } from '@/components/AppContext';
import { DEMO_PERSONAS } from '@/lib/auth/personas';
import { 
  User, 
  Globe, 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  HardHat, 
  GraduationCap,
  Scale
} from 'lucide-react';

export default function WorkerProfilePage() {
  const { currentPersona, setPersonaId, language, setLanguage, t } = useApp();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 shadow">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xl text-white shadow-lg">
          {currentPersona.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {currentPersona.name}
          </h1>
          <p className="text-xs text-slate-400">
            {currentPersona.title} • {currentPersona.orgName}
          </p>
          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {currentPersona.badge}
          </span>
        </div>
      </div>

      {/* Language Preference Settings */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <Globe className="w-5 h-5" />
          <h2 className="text-sm font-bold text-white">Preferred Interface Language / மொழி</h2>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Select your regional language for all payslips, attendance records, and SafeSpeak confidential reporting.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => setLanguage('en')}
            className={`p-3.5 rounded-xl border text-center transition font-semibold ${
              language === 'en'
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-sm font-bold">English</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Default Platform Language</div>
          </button>

          <button
            onClick={() => setLanguage('ta')}
            className={`p-3.5 rounded-xl border text-center transition font-semibold ${
              language === 'ta'
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-sm font-bold">தமிழ் (Tamil)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">முழுமையான தமிழ் இடைமுகம்</div>
          </button>
        </div>
      </div>

      {/* Account & Tenant Security Information */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow text-xs">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Tenant Isolation & Privacy Controls
        </h2>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Employer Organisation:</span>
            <span className="text-white font-semibold">{currentPersona.orgName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tenant ID:</span>
            <span className="font-mono text-emerald-400">{currentPersona.orgId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Base Hourly Rate:</span>
            <span className="text-white font-semibold">${currentPersona.id === 'usr-const-w1' ? '24.50' : '19.50'}/hr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Overtime Multiplier:</span>
            <span className="text-emerald-400 font-semibold">1.5x (Statutory)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          FairShift enforces strict tenant isolation. Workers from other companies or campuses cannot access your attendance logs, payslips, or cases.
        </p>
      </div>
    </div>
  );
}
