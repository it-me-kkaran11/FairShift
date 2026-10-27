'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { 
  Award, 
  CheckCircle2, 
  Download, 
  Plus, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  Printer,
  Sparkles,
  Info
} from 'lucide-react';

export default function WorkerSkillsPage() {
  const { currentPersona, t, refreshTrigger, triggerRefresh } = useApp();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New skill form
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Safety & Compliance');
  const [credentialType, setCredentialType] = useState('competency');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, [currentPersona.id, refreshTrigger]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/worker/skills?userId=${currentPersona.id}`);
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

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/worker/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentPersona.id,
          orgId: currentPersona.orgId,
          skillName,
          category,
          credentialType,
          issuingOrg: issuingOrg || currentPersona.orgName,
          issueDate,
          expiryDate: expiryDate || null,
          notes
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setSkillName('');
        setNotes('');
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const exportPassportJson = () => {
    const passportData = {
      worker: {
        id: currentPersona.id,
        name: currentPersona.name,
        jobTitle: currentPersona.title,
        industry: currentPersona.industry
      },
      exportTimestamp: new Date().toISOString(),
      portableWalletVersion: '1.0-fairshift',
      credentials: skills
    };

    const blob = new Blob([JSON.stringify(passportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FairShift-Skill-Passport-${currentPersona.name.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-400" />
            {t.skills.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.skills.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" />
            {t.skills.addSkill}
          </button>
          <button
            onClick={exportPassportJson}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {t.skills.exportPassport}
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Portability Notice */}
      <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded-xl text-xs text-purple-200 flex items-start gap-2.5">
        <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Guaranteed Worker Credential Ownership:</span>
          <p className="mt-0.5 text-purple-300/90 leading-relaxed">
            {t.skills.reassurance} Your credentials and practical assessments remain in your permanent digital wallet and can be verified by future employers.
          </p>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {skills.map((s) => {
          const isCertified = s.verification_status === 'certified';
          const isVerified = s.verification_status === 'employer_verified';

          return (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-4 shadow transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {s.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isCertified
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : isVerified
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isCertified ? t.skills.certified : isVerified ? t.skills.verified : t.skills.selfReported}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{s.skill_name}</h3>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{s.issuing_org}</span>
                </div>

                {s.notes && (
                  <p className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    {s.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div>
                  Issued: <span className="text-slate-300">{s.issue_date}</span>
                </div>
                <div>
                  {s.expiry_date ? (
                    <span className="text-amber-400">Exp: {s.expiry_date}</span>
                  ) : (
                    <span className="text-slate-500">{t.skills.noExpiry}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  {t.skills.addSkill}
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Record training, practical competency, or certificate to your passport.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Skill or Certificate Title *</label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., First Aid & CPR Level 2 / Forklift Class 4 Operator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Safety & Compliance">Safety & Compliance</option>
                    <option value="Heavy Machinery">Heavy Machinery</option>
                    <option value="Civil Operations">Civil Operations</option>
                    <option value="Environmental Health">Environmental Health</option>
                    <option value="Custodial Excellence">Custodial Excellence</option>
                    <option value="Technical Maintenance">Technical Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={credentialType}
                    onChange={(e) => setCredentialType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="certification">Certification</option>
                    <option value="license">License</option>
                    <option value="safety_induction">Site Safety Induction</option>
                    <option value="competency">Practical Competency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Issuing Body or Organization</label>
                <input
                  type="text"
                  value={issuingOrg}
                  onChange={(e) => setIssuingOrg(e.target.value)}
                  placeholder="e.g., Red Cross, OSHA, or Employer name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Additional Notes / License Number</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Certificate ID #CR-88291"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow"
                >
                  {submitting ? 'Saving...' : 'Add to Passport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
