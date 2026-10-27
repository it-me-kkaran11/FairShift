'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from './AppContext';
import { DEMO_PERSONAS } from '@/lib/auth/personas';
import { 
  ShieldCheck, 
  HardHat, 
  GraduationCap, 
  Globe, 
  Users, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  Award, 
  User, 
  LayoutDashboard, 
  Sliders, 
  Scale, 
  RotateCcw, 
  Menu, 
  X,
  History,
  Building2,
  ChevronDown
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentPersona, setPersonaId, language, setLanguage, t, resetDemoData, isResetting } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const isWorkerView = pathname.startsWith('/worker');
  const isEmployerView = pathname.startsWith('/employer');

  const workerNavLinks = [
    { href: '/worker', label: t.nav.home, icon: LayoutDashboard },
    { href: '/worker/attendance', label: t.nav.attendance, icon: Clock },
    { href: '/worker/payslips', label: t.nav.myPay, icon: DollarSign },
    { href: '/worker/report', label: t.nav.reportIssue, icon: AlertTriangle, highlight: true },
    { href: '/worker/cases', label: t.nav.myCases, icon: FileText },
    { href: '/worker/skills', label: t.nav.mySkills, icon: Award },
    { href: '/worker/profile', label: t.nav.myProfile, icon: User },
  ];

  const employerNavLinks = [
    { href: '/employer', label: t.nav.overview, icon: LayoutDashboard },
    { href: '/employer/workforce', label: t.nav.workforce, icon: Users },
    { href: '/employer/attendance', label: t.nav.shifts, icon: Clock },
    { href: '/employer/payroll', label: t.nav.payrollRecon, icon: DollarSign },
    { href: '/employer/fairness-engine', label: t.nav.fairnessEngine, icon: ShieldCheck, highlight: true },
    { href: '/employer/grievances', label: t.nav.grievances, icon: FileText },
    { href: '/employer/workload', label: t.nav.workload, icon: Scale },
    { href: '/employer/skills', label: t.nav.skillVerify, icon: Award },
    { href: '/employer/simulator', label: t.nav.simulator, icon: Sliders },
    { href: '/employer/audit-ledger', label: t.nav.auditLedger, icon: History },
    { href: '/employer/settings', label: t.nav.settings, icon: Building2 },
  ];

  const handleOrgSwitch = (orgId: string) => {
    // Pick the primary worker of that org
    const target = DEMO_PERSONAS.find(p => p.orgId === orgId);
    if (target) {
      setPersonaId(target.id);
      if (isEmployerView) {
        router.push('/employer');
      } else {
        router.push('/worker');
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Bar: Brand, Switchers, Personas, Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  FairShift
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                    SDG 8
                  </span>
                </span>
                <span className="hidden sm:block text-[11px] text-slate-400 font-medium">
                  Worker-First Fairness Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Center: View Switcher (Worker / Employer) */}
          <div className="hidden md:flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <Link
              href="/worker"
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isWorkerView
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              {t.app.navWorker}
            </Link>
            <Link
              href="/employer"
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isEmployerView
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              {t.app.navAdmin}
            </Link>
          </div>

          {/* Right Controls: Org, Persona, Language, Reset */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Industry Selector */}
            <div className="relative">
              <select
                value={currentPersona.orgId}
                onChange={(e) => handleOrgSwitch(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 pr-7 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer appearance-none"
                title="Switch Industry Profile"
              >
                <option value="org-construction">🏗️ Construction (Apex)</option>
                <option value="org-university">🎓 Higher Ed (MTU)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Persona Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 focus:outline-none"
                title="Switch Active Persona"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-semibold max-w-[90px] sm:max-w-[130px] truncate">{currentPersona.name}</span>
                <span className="text-[10px] text-slate-400 hidden lg:inline">({currentPersona.role})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {personaDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs"
                  onClick={() => setPersonaDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700 mb-1">
                    Select Interactive Persona
                  </div>
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPersonaId(p.id);
                        if (p.role === 'worker' && !isWorkerView) router.push('/worker');
                        if (p.role !== 'worker' && !isEmployerView) router.push('/employer');
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-slate-700 transition ${
                        p.id === currentPersona.id ? 'bg-slate-700/60 font-semibold' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {p.industry === 'Construction' ? (
                          <HardHat className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white flex items-center gap-1.5">
                          {p.name}
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-600 text-slate-300 font-normal">
                            {p.language.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{p.title}</div>
                        <div className="text-[10px] text-emerald-400/90">{p.badge}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Toggle: EN / TA */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition"
              title="Toggle Language / மொழி"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={resetDemoData}
              disabled={isResetting}
              className="bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs px-2 py-1.5 rounded-lg flex items-center gap-1 transition"
              title="Reset Demo Database to Initial State"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-rose-400' : ''}`} />
              <span className="hidden xl:inline">{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Subnav (Desktop) */}
      <nav className="hidden md:block bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-1.5 overflow-x-auto scrollbar-none">
            {(isWorkerView ? workerNavLinks : employerNavLinks).map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : link.highlight
                      ? 'text-amber-300 hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : ''}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">View Mode:</span>
            <div className="flex gap-2">
              <Link
                href="/worker"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2.5 py-1 text-xs rounded ${isWorkerView ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                {t.app.navWorker}
              </Link>
              <Link
                href="/employer"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2.5 py-1 text-xs rounded ${isEmployerView ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                {t.app.navAdmin}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {(isWorkerView ? workerNavLinks : employerNavLinks).map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
