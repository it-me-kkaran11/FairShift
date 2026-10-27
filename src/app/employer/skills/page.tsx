'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { Award, CheckCircle2, ShieldCheck, User, Calendar, Building2 } from 'lucide-react';

export default function EmployerSkillsPage() {
  const { currentPersona, refreshTrigger, triggerRefresh } = useApp();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, [currentPersona.orgId, refreshTrigger]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/skills?orgId=${currentPersona.orgId}`);
      if (res.ok) {
        const json = await res.json();
        setSkills(json.skills || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (skillId: string) => {
    setVerifyingId(skillId);
    try {
      const res = await fetch('/api/employer/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          verifiedBy: currentPersona.id,
          status: 'employer_verified'
        })
      });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
            Credential Governance
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
            <Award className="w-6 h-6 text-purple-400" />
            Worker Skill Verification Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Review worker-submitted licenses, safety inductions, and equipment certifications. Verified credentials are permanently added to the worker's portable passport.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Worker</th>
                <th className="py-3.5 px-4 font-semibold">Skill / Certification</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Issuing Org</th>
                <th className="py-3.5 px-4 font-semibold">Verification Status</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {skills.map((s) => {
                const isVerified = s.verification_status !== 'self_reported';

                return (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{s.user_name}</div>
                      <div className="text-[11px] text-slate-400">{s.job_title}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {s.skill_name}
                      {s.expiry_date && (
                        <span className="text-[10px] text-amber-400 block font-mono">Exp: {s.expiry_date}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {s.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {s.issuing_org}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {s.verification_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {!isVerified ? (
                        <button
                          onClick={() => handleVerify(s.id)}
                          disabled={verifyingId === s.id}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow"
                        >
                          {verifyingId === s.id ? 'Signing...' : 'Verify Credential'}
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
