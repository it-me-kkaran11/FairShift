import type { FairnessAlert, FairnessAlertType, AlertSeverity, WorkRecord, ShiftAssignment, CaseReport, CorrectiveAction, User } from '../../types/index.ts';

export interface AuditContext {
  orgId: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  category: FairnessAlertType;
  defaultSeverity: AlertSeverity;
}

export const FAIRNESS_RULES: Record<string, RuleDefinition> = {
  FGE_001_HOURS_DISCREPANCY: {
    id: 'FGE_001_HOURS_DISCREPANCY',
    name: 'Recorded vs Approved Work Hours Discrepancy',
    description: 'Flags when physical or biometric recorded hours exceed supervisor-approved hours by more than 0.5 hours without recorded justification.',
    category: 'overtime_discrepancy',
    defaultSeverity: 'high',
  },
  FGE_002_INSUFFICIENT_REST: {
    id: 'FGE_002_INSUFFICIENT_REST',
    name: 'Insufficient Rest Between Consecutive Shifts',
    description: 'Flags when rest interval between consecutive shifts is less than the statutory minimum (e.g., 11 hours).',
    category: 'insufficient_rest',
    defaultSeverity: 'critical',
  },
  FGE_003_EXCESSIVE_HOURS: {
    id: 'FGE_003_EXCESSIVE_HOURS',
    name: 'Excessive Working Hours Detected',
    description: 'Flags when daily hours exceed 12 hours or scheduled weekly hours exceed 60 hours, posing fatigue and safety hazards.',
    category: 'excessive_hours',
    defaultSeverity: 'high',
  },
  FGE_004_HAZARD_RECURRENCE: {
    id: 'FGE_004_HAZARD_RECURRENCE',
    name: 'Recurring Safety Hazard Pattern',
    description: 'Flags when 2 or more safety hazard reports are filed at the same site/department within a 30-day window.',
    category: 'hazard_recurrence',
    defaultSeverity: 'critical',
  },
  FGE_005_OVERDUE_REMEDY: {
    id: 'FGE_005_OVERDUE_REMEDY',
    name: 'Overdue Corrective Safety Action',
    description: 'Flags when an assigned safety remedy or corrective action has passed its target deadline without completion.',
    category: 'overdue_action',
    defaultSeverity: 'high',
  },
  FGE_006_OVERTIME_CONCENTRATION: {
    id: 'FGE_006_OVERTIME_CONCENTRATION',
    name: 'Uneven Overtime Distribution / Burden Concentration',
    description: 'Flags when top 20% of workers in a team account for more than 70% of all assigned overtime hours over a 30-day period.',
    category: 'uneven_allocation',
    defaultSeverity: 'medium',
  },
  FGE_007_UNEXPLAINED_DEDUCTION: {
    id: 'FGE_007_UNEXPLAINED_DEDUCTION',
    name: 'Unexplained Payroll Deduction',
    description: 'Flags any deduction on a worker payslip exceeding statutory tax/pension without a specific authorized itemized reason.',
    category: 'unexplained_deduction',
    defaultSeverity: 'high',
  }
};

/**
 * Deterministically audits work records to detect overtime discrepancies
 */
export function auditWorkHoursDiscrepancies(
  records: (WorkRecord & { user_name?: string })[],
  thresholdHours: number = 0.5
): FairnessAlert[] {
  const alerts: FairnessAlert[] = [];
  const rule = FAIRNESS_RULES.FGE_001_HOURS_DISCREPANCY;

  for (const rec of records) {
    const diff = rec.recorded_hours - rec.approved_hours;
    if (diff >= thresholdHours) {
      alerts.push({
        id: `alert-ot-${rec.id}`,
        org_id: rec.org_id,
        user_id: rec.user_id,
        alert_type: 'overtime_discrepancy',
        severity: diff >= 3.0 ? 'high' : 'medium',
        issue: `Discrepancy of ${diff.toFixed(1)} hrs between recorded attendance (${rec.recorded_hours.toFixed(1)} hrs) and supervisor-approved hours (${rec.approved_hours.toFixed(1)} hrs)`,
        evidence: {
          recorded_value: `${rec.recorded_hours.toFixed(1)} hours recorded`,
          expected_or_approved_value: `${rec.approved_hours.toFixed(1)} hours approved`,
          difference: `${diff.toFixed(1)} unapproved hours`,
          context: `Shift on ${rec.shift_date}. Worker: ${rec.user_name || rec.user_id}. Notes: ${rec.reconciliation_notes || 'No explanation provided'}`,
          related_record_ids: [rec.id],
        },
        record_ref: `WORK_RECORD:${rec.id}`,
        rule_id: rule.id,
        rule_description: rule.description,
        recommended_action: 'Supervisor must review site access logs or GPS attendance timestamps with worker and record formal reconciliation or approval reason.',
        status: 'open',
        created_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

/**
 * Deterministically checks for rest period violations between consecutive shifts
 */
export function auditRestPeriodViolations(
  shifts: (ShiftAssignment & { user_name?: string })[],
  minRestHours: number = 11
): FairnessAlert[] {
  const alerts: FairnessAlert[] = [];
  const rule = FAIRNESS_RULES.FGE_002_INSUFFICIENT_REST;

  // Group shifts by worker
  const userShiftsMap = new Map<string, typeof shifts>();
  for (const s of shifts) {
    const list = userShiftsMap.get(s.user_id) || [];
    list.push(s);
    userShiftsMap.set(s.user_id, list);
  }

  for (const [userId, userShifts] of userShiftsMap.entries()) {
    // Sort chronologically by date and start time
    const sorted = [...userShifts].sort((a, b) => {
      const dtA = new Date(`${a.shift_date}T${a.start_time}:00`).getTime();
      const dtB = new Date(`${b.shift_date}T${b.start_time}:00`).getTime();
      return dtA - dtB;
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentStart = new Date(`${current.shift_date}T${current.start_time}:00`);
      let currentEnd = new Date(`${current.shift_date}T${current.end_time}:00`);
      if (currentEnd.getTime() <= currentStart.getTime()) {
        // Overnight shift spanning midnight
        currentEnd = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
      }

      const nextStart = new Date(`${next.shift_date}T${next.start_time}:00`);
      const restHours = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);

      if (restHours >= 0 && restHours < minRestHours) {
        alerts.push({
          id: `alert-rest-${current.id}-${next.id}`,
          org_id: current.org_id,
          user_id: userId,
          alert_type: 'insufficient_rest',
          severity: restHours <= 8 ? 'critical' : 'high',
          issue: `Insufficient rest period: only ${restHours.toFixed(1)} hours between consecutive shifts (statutory minimum is ${minRestHours} hours)`,
          evidence: {
            recorded_value: `${restHours.toFixed(1)} rest hours`,
            expected_or_approved_value: `>= ${minRestHours} rest hours`,
            difference: `${(minRestHours - restHours).toFixed(1)} hours deficient`,
            context: `Shift 1 ended ${current.shift_date} ${current.end_time}; Shift 2 begins ${next.shift_date} ${next.start_time}`,
            related_record_ids: [current.id, next.id],
          },
          record_ref: `SHIFTS:${current.id},${next.id}`,
          rule_id: rule.id,
          rule_description: rule.description,
          recommended_action: 'Reschedule shift assignment or assign relief personnel to guarantee worker fatigue recovery.',
          status: 'open',
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return alerts;
}

/**
 * Deterministically checks for recurring safety hazards
 */
export function auditHazardRecurrence(
  cases: CaseReport[],
  windowDays: number = 30
): FairnessAlert[] {
  const alerts: FairnessAlert[] = [];
  const rule = FAIRNESS_RULES.FGE_004_HAZARD_RECURRENCE;

  // Filter safety cases
  const safetyCases = cases.filter(c => c.category === 'safety_hazard');
  // Group by site and keyword/area
  const siteMap = new Map<string, CaseReport[]>();
  for (const c of safetyCases) {
    const list = siteMap.get(c.site_id) || [];
    list.push(c);
    siteMap.set(c.site_id, list);
  }

  for (const [siteId, siteCases] of siteMap.entries()) {
    if (siteCases.length >= 2) {
      alerts.push({
        id: `alert-hazard-recur-${siteId}`,
        org_id: siteCases[0].org_id,
        alert_type: 'hazard_recurrence',
        severity: 'critical',
        issue: `Repeated safety hazards reported at site (${siteCases.length} incidents in observation window)`,
        evidence: {
          recorded_value: `${siteCases.length} hazard reports`,
          expected_or_approved_value: '0 recurring hazards',
          context: `Cases: ${siteCases.map(c => `${c.case_number} (${c.title})`).join('; ')}`,
          related_record_ids: siteCases.map(c => c.id),
        },
        record_ref: `SITE:${siteId}`,
        rule_id: rule.id,
        rule_description: rule.description,
        recommended_action: 'Site Safety Director must conduct comprehensive physical walk-through and verify corrective actions with safety committee.',
        status: 'open',
        created_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

/**
 * Deterministically checks for overdue corrective actions
 */
export function auditOverdueCorrectiveActions(
  actions: (CorrectiveAction & { case_number?: string; org_id: string })[]
): FairnessAlert[] {
  const alerts: FairnessAlert[] = [];
  const rule = FAIRNESS_RULES.FGE_005_OVERDUE_REMEDY;
  const now = new Date();

  for (const act of actions) {
    const dueDate = new Date(`${act.due_date}T23:59:59`);
    const isOverdue = !act.completed_at && now > dueDate;

    if (isOverdue) {
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `alert-overdue-${act.id}`,
        org_id: act.org_id,
        alert_type: 'overdue_action',
        severity: daysOverdue > 7 ? 'critical' : 'high',
        issue: `Corrective action overdue by ${daysOverdue} days: "${act.action_description}"`,
        evidence: {
          recorded_value: `Due date was ${act.due_date}`,
          expected_or_approved_value: 'Completed prior to deadline',
          difference: `${daysOverdue} days past target deadline`,
          context: `Case: ${act.case_number || act.case_id}. Assigned owner: ${act.assigned_to}`,
          related_record_ids: [act.id, act.case_id],
        },
        record_ref: `CORRECTIVE_ACTION:${act.id}`,
        rule_id: rule.id,
        rule_description: rule.description,
        recommended_action: 'Escalate to Department Head for immediate execution and field verification.',
        status: 'open',
        assigned_to: act.assigned_to,
        created_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}
