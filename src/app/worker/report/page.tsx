'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Mic, 
  MicOff, 
  Lock, 
  EyeOff, 
  CheckCircle2, 
  Copy, 
  ArrowRight,
  Info
} from 'lucide-react';

export default function WorkerReportPage() {
  const { currentPersona, t, language } = useApp();

  const [category, setCategory] = useState('safety_hazard');
  const [priority, setPriority] = useState('high');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [siteId, setSiteId] = useState(currentPersona.orgId === 'org-construction' ? 'site-apex-a' : 'site-mtu-main');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<{
    caseNumber: string;
    anonymousPasscode?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Voice assist simulation: Speech-to-text prompt with editable draft
  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        const sampleText = language === 'ta'
          ? 'மேல் தளத்தில் உள்ள சாரக்கட்டு கம்பிகள் தளர்வாக உள்ளன. காற்று வீசும்போது அசைவு அதிகமாக இருக்கிறது.'
          : 'Scaffolding cross-braces on upper tier are loose and sway during wind gusts. Immediate safety hazard.';
        setDescription(prev => prev ? `${prev} ${sampleText}` : sampleText);
        setIsRecording(false);
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentPersona.orgId,
          isAnonymous,
          reporterUserId: currentPersona.id,
          category,
          priority,
          title,
          description,
          siteId,
          locationDetail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit case.');
      }

      setSuccessResult({
        caseNumber: data.caseNumber,
        anonymousPasscode: data.anonymousPasscode
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!successResult) return;
    const text = `FairShift Case: ${successResult.caseNumber}\nPasscode: ${successResult.anonymousPasscode || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {t.report.title}
            </h1>
            <p className="text-xs text-slate-400">
              {t.report.subheading}
            </p>
          </div>
        </div>

        {/* Anonymity disclaimer */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            {t.worker.anonymousDisclaimer} <em>FairShift decouples your identity on anonymous reports and stores credentials as salted cryptographic hashes.</em>
          </span>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {successResult ? (
        <div className="bg-slate-900 border border-emerald-500/40 p-6 sm:p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-white">{t.report.successTitle}</h2>
              <p className="text-xs text-emerald-300">{t.report.successMessage}</p>
            </div>
          </div>

          {successResult.anonymousPasscode ? (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                {t.worker.saveCredentialsWarning}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    {t.worker.trackingCodeLabel}
                  </span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {successResult.caseNumber}
                  </span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                    {t.worker.trackingPinLabel}
                  </span>
                  <span className="text-lg font-mono font-bold text-amber-400">
                    {successResult.anonymousPasscode}
                  </span>
                </div>
              </div>

              <button
                onClick={copyCredentials}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied to Clipboard!' : t.report.saveTrackingCode}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300">
              Report reference: <strong>{successResult.caseNumber}</strong>. You can follow updates directly under My Cases.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/worker/cases"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              Go to My Cases & Dialogue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Anonymity Switch */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                {t.report.isAnonymous}
              </span>
              <p className="text-[11px] text-slate-400 max-w-md">
                {t.report.anonymousHelper}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                {t.report.category} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="safety_hazard">⚠️ {t.report.hazard}</option>
                <option value="wage_dispute">💵 {t.report.wage}</option>
                <option value="harassment">🛑 {t.report.harassment}</option>
                <option value="unfair_scheduling">⏱️ {t.report.schedule}</option>
                <option value="facility_equipment">🔧 {t.report.facility}</option>
                <option value="other">📋 {t.report.other}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                {t.report.priority} *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="urgent">🔴 Urgent (Immediate safety danger / stop work)</option>
                <option value="high">🟠 High (Serious safety hazard / payroll error)</option>
                <option value="medium">🟡 Medium (Procedural dispute / equipment defect)</option>
                <option value="low">🟢 Low (General inquiry or minor issue)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="text-xs">
            <label className="block font-semibold text-slate-300 mb-1.5">
              {t.report.issueTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Unstable scaffolding on Tower A Level 4 / Missing overtime payment on Oct 22"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description with Voice Assist Prompt */}
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-300">
                {t.report.issueDescription} *
              </label>
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition ${
                  isRecording 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
                title="Dictate in regional language (Tamil / English)"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isRecording ? 'Listening (Speaking...)' : 'Voice Assist (தமிழ் / EN)'}</span>
              </button>
            </div>

            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what happened, exact machine or area, potential dangers, or payroll discrepancies..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Specific Location Detail */}
          <div className="text-xs">
            <label className="block font-semibold text-slate-300 mb-1.5">
              {t.report.location}
            </label>
            <input
              type="text"
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              placeholder="e.g., Tower A Level 4 north wall / Science Complex Basement B12"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-900/30"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? t.report.submitting : t.report.submitBtn}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
