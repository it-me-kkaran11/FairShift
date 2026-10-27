'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { Clock, Calendar, MapPin, User, CheckCircle2, Sliders, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EmployerAttendancePage() {
  const { currentPersona, refreshTrigger } = useApp();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/attendance?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setShifts(json.shifts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Scheduling & Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <Clock className="w-6 h-6 text-emerald-400" />
            Shifts & Attendance Roster
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live operations roster showing worker shift assignments, planned hours, and location assignments.
          </p>
        </div>

        <Link
          href="/employer/simulator"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
        >
          <Sliders className="w-4 h-4" />
          Test in Shift Simulator
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Worker</th>
                <th className="py-3.5 px-4 font-semibold">Shift Date</th>
                <th className="py-3.5 px-4 font-semibold">Hours Schedule</th>
                <th className="py-3.5 px-4 font-semibold">Location</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{s.user_name}</div>
                    <div className="text-[11px] text-slate-400">{s.job_title}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                    {s.shift_date}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white">{s.start_time} - {s.end_time}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">{s.planned_hours} hrs</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {s.site_name || 'Main Job Site'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                    {s.notes || '—'}
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
