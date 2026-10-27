'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/AppContext';
import { 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Clock, 
  User, 
  Calendar, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  ArrowRight,
  Info
} from 'lucide-react';
import { ProposedShift, SimulationResult } from '@/lib/engine/shift-simulator';

export default function ShiftSimulatorPage() {
  const { currentPersona, t } = useApp();

  // Initial draft shifts containing a seeded rest violation for demonstration!
  const [draftShifts, setDraftShifts] = useState<ProposedShift[]>([
    {
      user_id: 'usr-const-w2',
      user_name: 'Carlos Mendez',
      site_id: 'site-apex-a',
      shift_date: '2026-10-28',
      start_time: '22:00',
      end_time: '06:00',
      planned_hours: 8.0
    },
    {
      user_id: 'usr-const-w2',
      user_name: 'Carlos Mendez',
      site_id: 'site-apex-a',
      shift_date: '2026-10-29',
      start_time: '14:00',
      end_time: '22:00',
      planned_hours: 8.0 // ONLY 8 hours rest between 06:00 and 14:00! Violates statutory 11 hours!
    },
    {
      user_id: 'usr-const-w1',
      user_name: 'Ramanathan K.',
      site_id: 'site-apex-a',
      shift_date: '2026-10-28',
      start_time: '07:00',
      end_time: '19:30',
      planned_hours: 12.5 // Daily excessive hours violation (> 10h)!
    },
    {
      user_id: 'usr-const-w3',
      user_name: 'David Kim',
      site_id: 'site-apex-a',
      shift_date: '2026-10-28',
      start_time: '08:00',
      end_time: '16:30',
      planned_hours: 8.0
    }
  ]);

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/simulator/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentPersona.orgId,
          shifts: draftShifts
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSimulationResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const removeShift = (index: number) => {
    setDraftShifts(prev => prev.filter((_, i) => i !== index));
  };

  const applyCompliantPreset = () => {
    // Replaces draft with compliant shifts
    setDraftShifts([
      {
        user_id: 'usr-const-w2',
        user_name: 'Carlos Mendez',
        site_id: 'site-apex-a',
        shift_date: '2026-10-28',
        start_time: '22:00',
        end_time: '06:00',
        planned_hours: 8.0
      },
      {
        user_id: 'usr-const-w2',
        user_name: 'Carlos Mendez',
        site_id: 'site-apex-a',
        shift_date: '2026-10-29',
        start_time: '18:00', // Compliant 12 hours rest!
        end_time: '02:00',
        planned_hours: 8.0
      },
      {
        user_id: 'usr-const-w1',
        user_name: 'Ramanathan K.',
        site_id: 'site-apex-a',
        shift_date: '2026-10-28',
        start_time: '07:00',
        end_time: '15:30', // Compliant 8.0 hours!
        planned_hours: 8.0
      },
      {
        user_id: 'usr-const-w3',
        user_name: 'David Kim',
        site_id: 'site-apex-a',
        shift_date: '2026-10-28',
        start_time: '08:00',
        end_time: '16:30',
        planned_hours: 8.0
      }
    ]);
    setSimulationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              Fatigue & Compliance Prevention
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <Sliders className="w-6 h-6 text-blue-400" />
            {t.simulator.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t.simulator.subtitle} Test proposed rosters before publishing to guarantee statutory rest intervals and avoid worker fatigue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={applyCompliantPreset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            Load Compliant Roster Preset
          </button>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-blue-900/30"
          >
            <ShieldCheck className="w-4 h-4" />
            {simulating ? 'Validating Rules...' : t.simulator.checkButton}
          </button>
        </div>
      </div>

      {/* Jurisdiction Rules Config Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Daily Fatigue Cap</span>
          <span className="text-white font-bold">{t.simulator.ruleMaxHours}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Statutory Rest Interval</span>
          <span className="text-white font-bold">{t.simulator.ruleMinRest}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Weekly Labor Limit</span>
          <span className="text-white font-bold">Max Weekly Hours: 48 hrs</span>
        </div>
      </div>

      {/* Simulation Conflicts Result Banner */}
      {simulationResult && (
        <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
          simulationResult.is_valid
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {simulationResult.is_valid ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-rose-400 shrink-0" />
            )}
            <div>
              <h2 className="text-base font-bold text-white">
                {simulationResult.is_valid ? t.simulator.noViolations : `${simulationResult.conflicts_count} Labor Compliance Conflict(s) Detected`}
              </h2>
              <p className="text-xs opacity-90">
                {simulationResult.recommendations[0]}
              </p>
            </div>
          </div>

          {/* List of Detected Conflicts */}
          {simulationResult.conflicts.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                Detected Schedule Violations:
              </span>
              <div className="space-y-2.5">
                {simulationResult.conflicts.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-950/90 rounded-xl border border-rose-500/30 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{c.user_name} ({c.shift_date})</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase">
                        {c.rule_violated}
                      </span>
                    </div>

                    <p className="text-rose-200">{c.description}</p>
                    <div className="text-[11px] text-slate-400 font-mono">{c.evidence}</div>

                    {c.suggested_fix && (
                      <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20 mt-1">
                        <strong>Suggested Adjustment:</strong> {c.suggested_fix}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proposed Draft Shifts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Proposed Roster Draft ({draftShifts.length} shifts)
          </h2>
          <span className="text-[11px] text-slate-400">
            Unpublished Preview
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Worker</th>
                <th className="py-3 px-4 font-semibold">Shift Date</th>
                <th className="py-3 px-4 font-semibold">Start Time</th>
                <th className="py-3 px-4 font-semibold">End Time</th>
                <th className="py-3 px-4 font-semibold">Planned Hours</th>
                <th className="py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {draftShifts.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-white">
                    {s.user_name}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {s.shift_date}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {s.start_time}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {s.end_time}
                  </td>
                  <td className="py-3 px-4 font-bold">
                    <span className={s.planned_hours > 10 ? 'text-rose-400' : 'text-slate-200'}>
                      {s.planned_hours} hrs
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => removeShift(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Remove draft shift"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
