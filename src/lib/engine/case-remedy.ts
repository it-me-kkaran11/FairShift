import type { CaseStatus, CaseReport, CorrectiveAction } from '../../types/index.ts';

/**
 * Valid state transitions mapping
 */
export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  submitted: ['triaged', 'assigned', 'rejected'],
  triaged: ['assigned', 'rejected', 'under_investigation'],
  assigned: ['under_investigation', 'rejected'],
  under_investigation: ['action_proposed', 'awaiting_verification', 'rejected'],
  action_proposed: ['awaiting_verification', 'under_investigation'],
  awaiting_verification: ['resolved', 'action_proposed', 'under_investigation'],
  resolved: ['reopened', 'appealed'],
  rejected: ['reopened', 'appealed'],
  appealed: ['triaged', 'under_investigation', 'assigned'],
  reopened: ['triaged', 'under_investigation', 'assigned']
};

/**
 * Validates whether a requested transition is allowable according to the Remedy Tracker lifecycle rules
 */
export function validateCaseTransition(
  currentStatus: CaseStatus,
  targetStatus: CaseStatus,
  context?: {
    rejectionReason?: string;
    hasVerifiedAction?: boolean;
    requiresVerification?: boolean;
    actorRole?: string;
  }
): { valid: boolean; error?: string } {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid lifecycle transition: Cannot move case from "${currentStatus}" directly to "${targetStatus}". Permitted next states: ${allowed.join(', ')}.`
    };
  }

  // If transitioning to rejected, explanation is mandatory
  if (targetStatus === 'rejected') {
    if (!context?.rejectionReason || context.rejectionReason.trim().length < 10) {
      return {
        valid: false,
        error: 'A detailed explanatory reason (at least 10 characters) is required when rejecting a case.'
      };
    }
  }

  // If transitioning to resolved, verify that physical verification is complete if required
  if (targetStatus === 'resolved') {
    if (context?.requiresVerification && !context.hasVerifiedAction) {
      return {
        valid: false,
        error: 'Remedy integrity check failed: Cases requiring physical verification cannot be closed as "Resolved" without at least one verified corrective action signed off.'
      };
    }
  }

  return { valid: true };
}
