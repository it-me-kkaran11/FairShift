import { describe, it, expect } from 'vitest';
import { calculatePayBreakdown, roundCurrency } from '../src/lib/engine/payroll.ts';
import { 
  auditWorkHoursDiscrepancies, 
  auditRestPeriodViolations, 
  auditHazardRecurrence,
  auditOverdueCorrectiveActions 
} from '../src/lib/engine/fairness-gap.ts';
import { simulateSchedule } from '../src/lib/engine/shift-simulator.ts';
import { validateCaseTransition } from '../src/lib/engine/case-remedy.ts';
import { generateTrackingCode, generatePasscode, hashPasscode, verifyPasscode } from '../src/lib/engine/crypto.ts';
import { calculateGiniCoefficient, analyzeWorkloadBurden } from '../src/lib/engine/hidden-burden.ts';
import { validateTenantAccess, validateWorkerRecordOwnership } from '../src/lib/auth/session.ts';

describe('1. Payroll Breakdown & Decimal Precision', () => {
  it('correctly calculates base pay, overtime, and take-home pay with decimal safety', () => {
    const payslip = calculatePayBreakdown({
      userId: 'usr-1',
      orgId: 'org-test',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-15',
      baseRate: 24.50,
      regularHours: 80,
      recordedOvertimeHours: 10,
      approvedOvertimeHours: 10,
      overtimeMultiplier: 1.5,
      allowances: [{ name: 'Tool Allowance', amount: 50.00 }],
      deductions: [{ name: 'Tax', amount: 200.00, explanation: 'Income Tax' }]
    });

    // Base: 80 * 24.5 = 1960.00
    // OT Rate: 24.5 * 1.5 = 36.75; OT Pay: 10 * 36.75 = 367.50
    // Gross: 1960 + 367.50 + 50 = 2377.50
    // Net: 2377.50 - 200 = 2177.50
    expect(payslip.base_pay).toBe(1960.00);
    expect(payslip.overtime_rate).toBe(36.75);
    expect(payslip.overtime_pay).toBe(367.50);
    expect(payslip.gross_pay).toBe(2377.50);
    expect(payslip.net_pay).toBe(2177.50);
    expect(payslip.has_discrepancy).toBe(false);
  });

  it('detects unapproved overtime discrepancy (12h recorded vs 8h approved)', () => {
    const payslip = calculatePayBreakdown({
      userId: 'usr-ramanathan',
      orgId: 'org-construction',
      periodStart: '2026-10-15',
      periodEnd: '2026-10-26',
      baseRate: 24.50,
      regularHours: 80,
      recordedOvertimeHours: 12.0,
      approvedOvertimeHours: 8.0,
      overtimeMultiplier: 1.5
    });

    expect(payslip.has_discrepancy).toBe(true);
    expect(payslip.status).toBe('disputed');
    expect(payslip.discrepancy_details).toContain('4.0 recorded overtime hours were not approved');
    expect(payslip.recorded_overtime_hours).toBe(12.0);
    expect(payslip.approved_overtime_hours).toBe(8.0);
  });

  it('handles zero-hour and boundary edge cases cleanly', () => {
    const payslip = calculatePayBreakdown({
      userId: 'usr-zero',
      orgId: 'org-test',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-15',
      baseRate: 0,
      regularHours: 0,
      recordedOvertimeHours: 0,
      approvedOvertimeHours: 0,
      overtimeMultiplier: 1.5
    });

    expect(payslip.gross_pay).toBe(0);
    expect(payslip.net_pay).toBe(0);
    expect(payslip.has_discrepancy).toBe(false);
  });
});

describe('2. Fairness Gap Rules Engine', () => {
  it('flags recorded vs approved hours discrepancy with explainable evidence', () => {
    const records = [
      {
        id: 'wr-1',
        org_id: 'org-construction',
        user_id: 'usr-1',
        user_name: 'Ramanathan K.',
        shift_date: '2026-10-22',
        recorded_hours: 12.0,
        approved_hours: 8.0,
        overtime_hours: 4.0,
        status: 'disputed' as const,
        reconciliation_notes: 'Supervisor capped OT'
      }
    ];

    const alerts = auditWorkHoursDiscrepancies(records);
    expect(alerts.length).toBe(1);
    expect(alerts[0].rule_id).toBe('FGE_001_HOURS_DISCREPANCY');
    expect(alerts[0].evidence.difference).toContain('4.0 unapproved hours');
    expect(alerts[0].recommended_action).toContain('review site access logs');
  });

  it('detects insufficient rest between shifts (< 11 hours)', () => {
    const shifts = [
      {
        id: 'sh-1',
        org_id: 'org-construction',
        user_id: 'usr-carlos',
        site_id: 'site-1',
        shift_date: '2026-10-25',
        start_time: '22:00',
        end_time: '06:00',
        planned_hours: 8.0,
        status: 'completed' as const
      },
      {
        id: 'sh-2',
        org_id: 'org-construction',
        user_id: 'usr-carlos',
        site_id: 'site-1',
        shift_date: '2026-10-26',
        start_time: '14:00',
        end_time: '22:00',
        planned_hours: 8.0,
        status: 'completed' as const
      }
    ];

    const alerts = auditRestPeriodViolations(shifts, 11);
    expect(alerts.length).toBe(1);
    expect(alerts[0].rule_id).toBe('FGE_002_INSUFFICIENT_REST');
    expect(alerts[0].severity).toBe('critical'); // 8h rest is < 8.01h -> critical
    expect(alerts[0].evidence.difference).toContain('3.0 hours deficient');
  });

  it('detects recurring safety hazard patterns at the same site', () => {
    const cases = [
      {
        id: 'c-1',
        case_number: 'CASE-01',
        org_id: 'org-1',
        is_anonymous: false,
        category: 'safety_hazard' as const,
        priority: 'high' as const,
        title: 'Loose guard rail',
        description: 'Level 2 railing loose',
        site_id: 'site-tower-a',
        status: 'submitted' as const,
        created_at: '2026-10-10',
        updated_at: '2026-10-10'
      },
      {
        id: 'c-2',
        case_number: 'CASE-02',
        org_id: 'org-1',
        is_anonymous: false,
        category: 'safety_hazard' as const,
        priority: 'urgent' as const,
        title: 'Scaffold sway',
        description: 'Level 4 scaffold sway',
        site_id: 'site-tower-a',
        status: 'submitted' as const,
        created_at: '2026-10-14',
        updated_at: '2026-10-14'
      }
    ];

    const alerts = auditHazardRecurrence(cases, 30);
    expect(alerts.length).toBe(1);
    expect(alerts[0].rule_id).toBe('FGE_004_HAZARD_RECURRENCE');
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].evidence.recorded_value).toContain('2 hazard reports');
  });
});

describe('3. SafeSpeak Confidentiality & Passcode Security', () => {
  it('generates unique tracking code and high-entropy passcode', () => {
    const code = generateTrackingCode('SAFE');
    const pin = generatePasscode();

    expect(code).toMatch(/^FS-SAFE-\d{4}$/);
    expect(pin.length).toBe(6);
  });

  it('securely hashes passcode with salt and verifies without plaintext storage', () => {
    const pin = 'SAFE99';
    const hash = hashPasscode(pin);

    expect(hash.startsWith('pbkdf2:')).toBe(true);
    expect(hash).not.toContain(pin); // zero plaintext leak

    expect(verifyPasscode('SAFE99', hash)).toBe(true);
    expect(verifyPasscode('WRONG1', hash)).toBe(false);
  });
});

describe('4. Remedy Tracker State Machine & Verification', () => {
  it('allows valid state progression: submitted -> triaged -> assigned', () => {
    const res1 = validateCaseTransition('submitted', 'triaged');
    expect(res1.valid).toBe(true);

    const res2 = validateCaseTransition('triaged', 'assigned');
    expect(res2.valid).toBe(true);
  });

  it('blocks invalid lifecycle leap: submitted cannot jump straight to resolved', () => {
    const res = validateCaseTransition('submitted', 'resolved');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Cannot move case from "submitted" directly to "resolved"');
  });

  it('requires explanatory reason when rejecting a case', () => {
    const resNoReason = validateCaseTransition('submitted', 'rejected', { rejectionReason: '' });
    expect(resNoReason.valid).toBe(false);
    expect(resNoReason.error).toContain('A detailed explanatory reason');

    const resValidReason = validateCaseTransition('submitted', 'rejected', { 
      rejectionReason: 'Duplicate submission of CASE-1042 already under active investigation.' 
    });
    expect(resValidReason.valid).toBe(true);
  });

  it('enforces physical verification before marking case resolved', () => {
    const unverifiedAttempt = validateCaseTransition('awaiting_verification', 'resolved', {
      requiresVerification: true,
      hasVerifiedAction: false
    });
    expect(unverifiedAttempt.valid).toBe(false);
    expect(unverifiedAttempt.error).toContain('cannot be closed as "Resolved" without at least one verified corrective action');

    const verifiedAttempt = validateCaseTransition('awaiting_verification', 'resolved', {
      requiresVerification: true,
      hasVerifiedAction: true
    });
    expect(verifiedAttempt.valid).toBe(true);
  });
});

describe('5. What-If Shift Simulator', () => {
  it('detects rest-period violation between shifts in proposed schedule', () => {
    const simulation = simulateSchedule([
      {
        user_id: 'usr-1',
        user_name: 'Worker 1',
        site_id: 'site-a',
        shift_date: '2026-10-25',
        start_time: '22:00',
        end_time: '06:00',
        planned_hours: 8
      },
      {
        user_id: 'usr-1',
        user_name: 'Worker 1',
        site_id: 'site-a',
        shift_date: '2026-10-26',
        start_time: '14:00',
        end_time: '22:00',
        planned_hours: 8
      }
    ]);

    expect(simulation.is_valid).toBe(false);
    expect(simulation.conflicts.length).toBe(1);
    expect(simulation.conflicts[0].rule_violated).toBe('MIN_REST_INTERVAL');
  });

  it('detects excessive daily hours violation (> 10h)', () => {
    const simulation = simulateSchedule([
      {
        user_id: 'usr-2',
        user_name: 'Worker 2',
        site_id: 'site-a',
        shift_date: '2026-10-25',
        start_time: '07:00',
        end_time: '20:00',
        planned_hours: 13
      }
    ]);

    expect(simulation.is_valid).toBe(false);
    expect(simulation.conflicts[0].rule_violated).toBe('MAX_DAILY_HOURS');
  });
});

describe('6. Hidden Burden & Overtime Concentration', () => {
  it('calculates Gini index and flags overtime concentration', () => {
    const workers = [
      { userId: 'w1', userName: 'Alice', department: 'Custodial', jobTitle: 'Cleaner', regularHours: 40, overtimeHours: 25, nightShiftCount: 3, weekendShiftCount: 2, totalHours: 65 },
      { userId: 'w2', userName: 'Bob', department: 'Custodial', jobTitle: 'Cleaner', regularHours: 40, overtimeHours: 20, nightShiftCount: 2, weekendShiftCount: 2, totalHours: 60 },
      { userId: 'w3', userName: 'Charlie', department: 'Custodial', jobTitle: 'Cleaner', regularHours: 40, overtimeHours: 1, nightShiftCount: 0, weekendShiftCount: 0, totalHours: 41 },
      { userId: 'w4', userName: 'David', department: 'Custodial', jobTitle: 'Cleaner', regularHours: 40, overtimeHours: 0, nightShiftCount: 0, weekendShiftCount: 0, totalHours: 40 },
      { userId: 'w5', userName: 'Eve', department: 'Custodial', jobTitle: 'Cleaner', regularHours: 40, overtimeHours: 0, nightShiftCount: 0, weekendShiftCount: 0, totalHours: 40 }
    ];

    const analysis = analyzeWorkloadBurden('Custodial', workers);
    expect(analysis.isConcentrationFlagged).toBe(true);
    expect(analysis.top20PercentShare).toBeGreaterThanOrEqual(50);
    expect(analysis.giniCoefficient).toBeGreaterThan(0.5);
  });
});

describe('7. Security, Tenant Isolation & Worker Record Ownership', () => {
  it('prevents cross-tenant access between Construction and University', () => {
    expect(validateTenantAccess('org-construction', 'org-construction')).toBe(true);
    expect(validateTenantAccess('org-construction', 'org-university')).toBe(false);
  });

  it('enforces worker record ownership: Worker A cannot access Worker B payslip', () => {
    expect(validateWorkerRecordOwnership('usr-worker-A', 'usr-worker-A', 'worker')).toBe(true);
    expect(validateWorkerRecordOwnership('usr-worker-A', 'usr-worker-B', 'worker')).toBe(false);

    // Authorized supervisor can access within organization
    expect(validateWorkerRecordOwnership('usr-manager', 'usr-worker-B', 'manager')).toBe(true);
    expect(validateWorkerRecordOwnership('usr-payroll', 'usr-worker-B', 'payroll_admin')).toBe(true);
  });
});
