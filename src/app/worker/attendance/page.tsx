'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  HelpCircle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function WorkerAttendancePage() {
  const { currentPersona, t, refreshTrigger, triggerRefresh } = useApp();
  const [shifts, setShifts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockMsg, setClockMsg] = useState('');
  const [isClocking, setIsClocking] = useState(false);
  const [activeTab, setActiveTab] = useState<'shifts' | 'logs'>('shifts');

  // Correction request modal
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [currentPersona.id, refreshTrigger]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/worker/attendance?userId=${currentPersona.id}`);
      if (res.ok) {
        const json = await res.json();
        setShifts(json.shifts || []);
        setEvents(json.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClock = async (eventType: 'clock_in' | 'clock_out') => {
    setIsClocking(true);
    setClockMsg('');
    try {
      const res = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentPersona.id,
          eventType,
          siteId: currentPersona.orgId === 'org-construction' ? 'site-apex-a' : 'site-mtu-main',
          verificationMethod: 'site_kiosk',
          notes: `Turnstile scan by ${currentPersona.name}`
        })
      });
      if (res.ok) {
        setClockMsg(eventType === 'clock_in' ? 'Successfully clocked in at site gate!' : 'Successfully clocked out!');
        triggerRefresh();
      }
    } catch (err) {
      setClockMsg('Clock submission failed. Try again.');
    } finally {
      setIsClocking(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmittingCorrection(true);
    try {
      const res = await fetch('/api/worker/attendance/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workRecordId: selectedRecord.id,
          userId: currentPersona.id,
          notes: correctionNote
        })
      });
      if (res.ok) {
        setCorrectionSuccess(true);
        setTimeout(() => {
          setSelectedRecord(null);
          setCorrectionSuccess(false);
          setCorrectionNote('');
          triggerRefresh();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Clock Simulation Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" />
            {t.nav.attendance} & Shifts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate biometric gate access, review scheduled shifts, and inspect recorded hours discrepancies.
          </p>
        </div>

        {/* Live Clock-in / Out Buttons */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <button
            onClick={() => handleClock('clock_in')}
            disabled={isClocking}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Clock className="w-4 h-4" />
            {t.worker.clockIn}
          </button>
          <button
            onClick={() => handleClock('clock_out')}
            disabled={isClocking}
            className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Clock className="w-4 h-4" />
            {t.worker.clockOut}
          </button>
        </div>
      </div>

      {clockMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{clockMsg}</span>
        </div>
      )}

      {/* Navigation tabs: Shifts / Raw Clock Events */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'shifts'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Work Records & Shift History ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Raw Access Kiosk Logs ({events.length})
        </button>
      </div>

      {/* Shifts & Work Records Table */}
      {activeTab === 'shifts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">{t.worker.shiftDate}</th>
                  <th className="py-3.5 px-4 font-semibold">{t.worker.scheduled}</th>
                  <th className="py-3.5 px-4 font-semibold">{t.worker.recorded}</th>
                  <th className="py-3.5 px-4 font-semibold">{t.worker.approved}</th>
                  <th className="py-3.5 px-4 font-semibold">{t.worker.discrepancy}</th>
                  <th className="py-3.5 px-4 font-semibold">{t.worker.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {shifts.map((s) => {
                  const hasDiscrepancy = s.recorded_hours > s.approved_hours;
                  const diff = s.recorded_hours - s.approved_hours;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-800/50 transition ${
                        hasDiscrepancy ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="font-semibold">{s.shift_date}</div>
                        <div className="text-[11px] text-slate-400">{s.site_name || 'Main Job Site'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold">{s.planned_hours || 8.0}h</span>
                        <span className="text-[10px] text-slate-400 block">{s.start_time || '07:00'} - {s.end_time || '15:30'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {s.recorded_hours ? `${s.recorded_hours.toFixed(1)}h` : '8.0h'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-emerald-400">
                        {s.approved_hours ? `${s.approved_hours.toFixed(1)}h` : '8.0h'}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasDiscrepancy ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            +{diff.toFixed(1)}h Unapproved
                          </div>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Reconciled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasDiscrepancy && (
                          <button
                            onClick={() => setSelectedRecord(s)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition"
                          >
                            {t.worker.requestCorrection}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Access Kiosk Raw Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800">
          {events.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">No clock events recorded yet.</div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${evt.event_type === 'clock_in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white capitalize">{evt.event_type.replace('_', ' ')}</div>
                    <div className="text-[11px] text-slate-400">{evt.notes || 'Biometric gate scan'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-200 font-medium">{new Date(evt.timestamp).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{evt.verification_method}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Correction Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  {t.worker.requestCorrection}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shift date: {selectedRecord.shift_date} • Recorded: {selectedRecord.recorded_hours}h vs Approved: {selectedRecord.approved_hours}h
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {correctionSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Correction request submitted and logged in the Fairness Ledger. Supervisor notified.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Describe reason for additional hours worked:
                  </label>
                  <textarea
                    rows={4}
                    value={correctionNote}
                    onChange={(e) => setCorrectionNote(e.target.value)}
                    required
                    placeholder="e.g., Concrete pour was delayed due to cement truck arrival; remained on site with foreman's oral instructions until 19:00."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCorrection}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow"
                  >
                    {submittingCorrection ? 'Submitting...' : 'Submit Formal Correction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
