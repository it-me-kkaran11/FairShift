'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Send, 
  FileText, 
  User, 
  RotateCcw,
  MessageSquare,
  Lock,
  EyeOff
} from 'lucide-react';

export default function WorkerCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { currentPersona, t, refreshTrigger, triggerRefresh } = useApp();

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Messages
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Appeal modal
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  useEffect(() => {
    fetchCaseDetails();
  }, [id, refreshTrigger]);

  const fetchCaseDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) {
        throw new Error('Case not found');
      }
      const json = await res.json();
      setCaseData(json.case);
      setMessages(json.messages || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading case');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSendingMsg(true);

    try {
      const res = await fetch(`/api/cases/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMsg,
          senderRole: 'reporter',
          senderId: currentPersona.id
        })
      });

      if (res.ok) {
        setNewMsg('');
        fetchCaseDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;
    setSubmittingAppeal(true);

    try {
      const res = await fetch(`/api/cases/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStatus: 'appealed',
          actorId: currentPersona.id,
          appealReason
        })
      });

      if (res.ok) {
        setShowAppealModal(false);
        setAppealReason('');
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs">
        Loading Remedy Tracker case details...
      </div>
    );
  }

  if (errorMsg || !caseData) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Case Not Found</h2>
        <p className="text-xs text-slate-400">{errorMsg || 'Unable to locate case records.'}</p>
        <Link href="/worker/cases" className="text-xs text-emerald-400 font-semibold hover:underline">
          ← Back to My Cases
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'triaged', label: 'Triaged' },
    { key: 'under_investigation', label: 'Under Investigation' },
    { key: 'action_proposed', label: 'Action Proposed' },
    { key: 'awaiting_verification', label: 'Awaiting Verification' },
    { key: 'resolved', label: 'Verified Resolved' }
  ];

  const currentStepIdx = steps.findIndex(s => s.key === caseData.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button & Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/worker/cases"
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <span className="font-mono text-xs font-bold text-emerald-400">
          {caseData.case_number}
        </span>
        {caseData.is_anonymous ? (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
            <EyeOff className="w-3 h-3" /> Anonymous Case
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold">
            Identified Worker Case
          </span>
        )}
      </div>

      {/* Case Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl font-bold text-white">{caseData.title}</h1>
          <span className="text-xs font-bold px-3 py-1 rounded-full uppercase bg-slate-800 text-emerald-400 border border-emerald-500/30">
            {caseData.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
          {caseData.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Category</span>
            <span className="text-slate-200 capitalize">{caseData.category.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Priority</span>
            <span className="text-slate-200 capitalize">{caseData.priority}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Reported At</span>
            <span className="text-slate-200">{new Date(caseData.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">SLA Deadline</span>
            <span className="text-amber-400 font-semibold">
              {caseData.target_deadline ? new Date(caseData.target_deadline).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Remedy Lifecycle Progress Stepper */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {t.cases.timeline}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border text-xs text-center space-y-1 transition ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                    : 'bg-slate-950/30 border-slate-850 text-slate-600'
                }`}
              >
                <div className="flex justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-[11px]">{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corrective Actions Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {t.cases.correctiveActions}
        </h2>

        {caseData.correctiveActions?.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No corrective action recorded yet. Assigned reviewer is conducting field triage.
          </p>
        ) : (
          <div className="space-y-3">
            {caseData.correctiveActions?.map((act: any) => (
              <div key={act.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white">{act.action_description}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    act.verification_status === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {act.verification_status === 'verified' ? 'Independently Verified' : 'Pending Verification'}
                  </span>
                </div>

                {act.completion_evidence && (
                  <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <strong>Evidence:</strong> {act.completion_evidence}
                  </div>
                )}

                {act.verified_at && (
                  <div className="text-[10px] text-emerald-400">
                    Signed off by Safety Inspector on {new Date(act.verified_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogue & Follow-up Messages */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          {t.cases.messages}
        </h2>

        <div className="space-y-3 max-h-80 overflow-y-auto p-1">
          {messages.map((m) => {
            const isReporter = m.sender_role === 'reporter';
            const isSystem = m.sender_role === 'system';

            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl text-xs space-y-1 ${
                  isSystem
                    ? 'bg-slate-950/90 border border-slate-800 text-slate-400 text-center font-mono text-[11px]'
                    : isReporter
                    ? 'bg-emerald-950/30 border border-emerald-500/20 ml-6 text-slate-200'
                    : 'bg-slate-800/60 border border-slate-700 mr-6 text-slate-200'
                }`}
              >
                {!isSystem && (
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>{isReporter ? 'You (Reporter)' : 'Assigned Case Reviewer'}</span>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                <div>{m.message}</div>
              </div>
            );
          })}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 text-xs pt-2">
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder={t.cases.addMessage}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={sendingMsg}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.cases.sendMsgBtn}</span>
          </button>
        </form>
      </div>

      {/* Appeal / Reopen Section */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            {t.cases.appealTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            {t.cases.appealHelper}
          </p>
        </div>

        <button
          onClick={() => setShowAppealModal(true)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 font-bold text-xs transition"
        >
          {t.cases.appealBtn}
        </button>
      </div>

      {/* Appeal Modal */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  {t.cases.appealTitle}
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Case reference: {caseData.case_number}
                </p>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Explain why this case is being appealed or reopened:
                </label>
                <textarea
                  rows={4}
                  required
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="e.g., The scaffold pins were tightened, but during heavy gusts today the platform still wobbled over 3 inches; hazard persists."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow"
                >
                  {submittingAppeal ? 'Submitting Appeal...' : 'Submit Formal Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
