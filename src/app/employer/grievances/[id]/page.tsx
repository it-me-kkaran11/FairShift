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
  EyeOff,
  Check,
  XCircle,
  Plus
} from 'lucide-react';

export default function EmployerCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { currentPersona, refreshTrigger, triggerRefresh } = useApp();

  const [caseData, setCaseData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusActionMsg, setStatusActionMsg] = useState('');

  // Status transition state
  const [targetStatus, setTargetStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // New corrective action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionDesc, setActionDesc] = useState('');
  const [actionEvidence, setActionEvidence] = useState('');
  const [verifyDirectly, setVerifyDirectly] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Messages
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    fetchCase();
  }, [id, refreshTrigger]);

  const fetchCase = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) throw new Error('Case not found');
      const json = await res.json();
      setCaseData(json.case);
      setMessages(json.messages || []);
      setTargetStatus(json.case.status);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading case');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus: string) => {
    setTransitioning(true);
    setStatusActionMsg('');
    try {
      const res = await fetch(`/api/cases/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStatus: newStatus,
          actorId: currentPersona.id,
          rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
          notes: `Updated by ${currentPersona.name} (${currentPersona.role})`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transition failed');
      }

      setStatusActionMsg(`Status successfully transitioned to ${newStatus}.`);
      triggerRefresh();
    } catch (err: any) {
      setStatusActionMsg(`Transition blocked: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const handleAddCorrectiveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/cases/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionDescription: actionDesc,
          completionEvidence: actionEvidence,
          verifyNow: verifyDirectly,
          verifiedBy: currentPersona.id,
          assignedTo: currentPersona.id
        })
      });

      if (res.ok) {
        setShowActionModal(false);
        setActionDesc('');
        setActionEvidence('');
        setVerifyDirectly(false);
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
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
          senderRole: 'reviewer',
          senderId: currentPersona.id
        })
      });

      if (res.ok) {
        setNewMsg('');
        fetchCase();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-xs">Loading case...</div>;
  }

  if (errorMsg || !caseData) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Case Not Found</h2>
        <Link href="/employer/grievances" className="text-xs text-blue-400 font-semibold hover:underline">
          ← Back to Cases Queue
        </Link>
      </div>
    );
  }

  const hasVerifiedAction = caseData.correctiveActions?.some((a: any) => a.verification_status === 'verified');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back & Case Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/employer/grievances"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Queue
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
              Identified Worker
            </span>
          )}
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          caseData.status === 'resolved'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : caseData.status === 'awaiting_verification'
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }`}>
          {caseData.status.replace('_', ' ')}
        </span>
      </div>

      {statusActionMsg && (
        <div className={`p-3.5 rounded-xl text-xs border flex items-center gap-2 ${
          statusActionMsg.includes('blocked')
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{statusActionMsg}</span>
        </div>
      )}

      {/* Main Case Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <h1 className="text-xl font-bold text-white">{caseData.title}</h1>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
          {caseData.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Category</span>
            <span className="text-slate-200 capitalize">{caseData.category.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Priority Level</span>
            <span className="text-rose-400 font-bold uppercase">{caseData.priority}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Deadline</span>
            <span className="text-amber-400 font-semibold">
              {caseData.target_deadline ? new Date(caseData.target_deadline).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Resolution Verified</span>
            <span className={hasVerifiedAction ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {hasVerifiedAction ? 'Yes (Signed off)' : 'No (Pending Check)'}
            </span>
          </div>
        </div>
      </div>

      {/* Lifecycle Transition Action Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Remedy Lifecycle Transition Controls
        </h2>
        <p className="text-xs text-slate-400">
          Enforces server-side transition state validation. Cases requiring physical verification will be rejected by the server if attempted without verified completion evidence.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {caseData.status === 'submitted' && (
            <button
              onClick={() => handleStatusTransition('triaged')}
              disabled={transitioning}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow"
            >
              Move to Triaged
            </button>
          )}

          {(caseData.status === 'submitted' || caseData.status === 'triaged') && (
            <button
              onClick={() => handleStatusTransition('under_investigation')}
              disabled={transitioning}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow"
            >
              Start Investigation
            </button>
          )}

          {caseData.status === 'under_investigation' && (
            <button
              onClick={() => handleStatusTransition('action_proposed')}
              disabled={transitioning}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow"
            >
              Move to Action Proposed
            </button>
          )}

          {(caseData.status === 'action_proposed' || caseData.status === 'under_investigation') && (
            <button
              onClick={() => handleStatusTransition('awaiting_verification')}
              disabled={transitioning}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition shadow"
            >
              Mark Awaiting Physical Verification
            </button>
          )}

          {caseData.status !== 'resolved' && (
            <button
              onClick={() => handleStatusTransition('resolved')}
              disabled={transitioning}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Sign Off Verified Resolution
            </button>
          )}

          {caseData.status !== 'rejected' && caseData.status !== 'resolved' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason to reject (min 10 chars)..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                onClick={() => handleStatusTransition('rejected')}
                disabled={transitioning || rejectionReason.length < 10}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition shadow"
              >
                Reject Case
              </button>
            </div>
          )}

          {(caseData.status === 'resolved' || caseData.status === 'rejected') && (
            <button
              onClick={() => handleStatusTransition('reopened')}
              disabled={transitioning}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition"
            >
              Reopen Investigation
            </button>
          )}
        </div>
      </div>

      {/* Corrective Actions Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Corrective Actions & Safety Verification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Specific physical measures taken to address reported hazard or grievance.
            </p>
          </div>

          <button
            onClick={() => setShowActionModal(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition shadow"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </button>
        </div>

        {caseData.correctiveActions?.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No corrective action recorded yet. Add an action and complete safety verification to close this case.
          </p>
        ) : (
          <div className="space-y-3">
            {caseData.correctiveActions?.map((act: any) => {
              const isVerified = act.verification_status === 'verified';

              return (
                <div key={act.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{act.action_description}</span>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      isVerified
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {isVerified ? '✓ Verified on Site' : 'Pending Physical Verification'}
                    </span>
                  </div>

                  {act.completion_evidence && (
                    <div className="text-[11px] text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <strong>Completion Evidence:</strong> {act.completion_evidence}
                    </div>
                  )}

                  {act.notes && (
                    <p className="text-[11px] text-slate-400">
                      <strong>Audit Note:</strong> {act.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two-Way Follow-up Dialogue Messages */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          Dialogue Channel with Reporter
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
                    ? 'bg-amber-950/20 border border-amber-500/20 mr-6 text-slate-200'
                    : 'bg-blue-950/30 border border-blue-500/30 ml-6 text-slate-200'
                }`}
              >
                {!isSystem && (
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>{isReporter ? 'Worker / Anonymous Reporter' : 'You (Investigator)'}</span>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                <div>{m.message}</div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 text-xs pt-2">
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Reply or request additional details from reporter..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sendingMsg}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            Send Response
          </button>
        </form>
      </div>

      {/* Add Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  Record Corrective Action
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Case: {caseData.case_number}
                </p>
              </div>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCorrectiveAction} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Corrective Action Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="e.g., Re-torqued all scaffold pin clamps, relocated solvent barrels to exterior bunker with secondary spill tray."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Evidence of Completion
                </label>
                <input
                  type="text"
                  value={actionEvidence}
                  onChange={(e) => setActionEvidence(e.target.value)}
                  placeholder="e.g., Maintenance Work Order #4018 completed; safety photos attached."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Sign Off Physical Verification Now?</span>
                  <span className="text-[11px] text-slate-400">
                    Confirms that safety officer has physically inspected the site.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={verifyDirectly}
                  onChange={(e) => setVerifyDirectly(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow"
                >
                  {submittingAction ? 'Recording Action...' : 'Save Corrective Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
