'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { Building2, Save, CheckCircle2, ShieldCheck, Sliders } from 'lucide-react';

export default function EmployerSettingsPage() {
  const { currentPersona, refreshTrigger, triggerRefresh } = useApp();
  const [settings, setSettings] = useState<any>({
    standard_daily_hours: 8,
    max_weekly_hours: 48,
    min_rest_hours_between_shifts: 11,
    max_consecutive_days: 6,
    overtime_multiplier: 1.5,
    currency: 'USD',
    currency_symbol: '$',
    requires_remedy_verification: true
  });
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/settings?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setSettings(json.org.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await fetch('/api/employer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentPersona.orgId,
          settings,
          updatedBy: currentPersona.id
        })
      });
      if (res.ok) {
        setSavedMsg('Organization settings and labor rules updated successfully!');
        triggerRefresh();
        setTimeout(() => setSavedMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Jurisdiction & Tenant Rules
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Organisation Settings — {currentPersona.orgName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure statutory labor limits, rest period requirements, and remedy verification policies.
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow text-xs">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Labor & Scheduling Rules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Standard Daily Hours Cap (Regular)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.standard_daily_hours}
              onChange={(e) => setSettings({ ...settings, standard_daily_hours: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Maximum Weekly Scheduled Hours
            </label>
            <input
              type="number"
              step="1"
              value={settings.max_weekly_hours}
              onChange={(e) => setSettings({ ...settings, max_weekly_hours: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Statutory Min Rest Between Shifts (Hours)
            </label>
            <input
              type="number"
              step="1"
              value={settings.min_rest_hours_between_shifts}
              onChange={(e) => setSettings({ ...settings, min_rest_hours_between_shifts: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Triggers critical Fairness Gap alert if violated</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Overtime Pay Rate Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.overtime_multiplier}
              onChange={(e) => setSettings({ ...settings, overtime_multiplier: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>
        </div>

        <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 pt-2">
          Safety & Remedy Policy
        </h2>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="font-bold text-white block">Require Independent Physical Verification for Closure</span>
            <span className="text-[11px] text-slate-400">
              When enabled, cases cannot be marked 'Resolved' by managers without a verified safety check.
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.requires_remedy_verification}
            onChange={(e) => setSettings({ ...settings, requires_remedy_verification: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700"
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
