'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { Users, Building2, MapPin, DollarSign, Globe, ShieldCheck } from 'lucide-react';

export default function EmployerWorkforcePage() {
  const { currentPersona, refreshTrigger } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkforce();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchWorkforce = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/workforce?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
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
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
            Directory & Roles
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <Users className="w-6 h-6 text-purple-400" />
            Workforce Directory — {currentPersona.orgName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Frontline workers, site supervisors, safety inspectors, and payroll administrators.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          Total Headcount: <strong className="text-white text-sm">{users.length}</strong>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Worker ID / Name</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Department & Job Title</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Site</th>
                <th className="py-3.5 px-4 font-semibold">Base Rate</th>
                <th className="py-3.5 px-4 font-semibold">Language</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{u.full_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{u.worker_number || u.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      u.role === 'worker'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : u.role === 'safety_officer'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{u.job_title}</div>
                    <div className="text-[11px] text-slate-400">{u.department}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {u.site_name || 'Main Campus / Site A'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    ${u.hourly_rate?.toFixed(2)}/hr
                  </td>
                  <td className="py-3.5 px-4 uppercase font-bold text-slate-400 text-[10px]">
                    {u.language_pref}
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
