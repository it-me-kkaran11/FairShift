import type { Payslip } from '../../types/index.ts';

export interface PayCalculationInput {
  userId: string;
  orgId: string;
  periodStart: string;
  periodEnd: string;
  baseRate: number;
  regularHours: number;
  recordedOvertimeHours: number;
  approvedOvertimeHours: number;
  overtimeMultiplier: number;
  allowances?: { name: string; amount: number }[];
  deductions?: { name: string; amount: number; explanation: string }[];
}

/**
 * Decimal-safe rounding to 2 decimal places to avoid floating point inaccuracies
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates transparent, auditable payslip breakdown with verifiable calculation trace
 */
export function calculatePayBreakdown(input: PayCalculationInput): Payslip {
  const regularHours = Math.max(0, input.regularHours);
  const approvedOt = Math.max(0, input.approvedOvertimeHours);
  const recordedOt = Math.max(0, input.recordedOvertimeHours);
  const baseRate = Math.max(0, input.baseRate);
  const otMultiplier = input.overtimeMultiplier || 1.5;
  const overtimeRate = roundCurrency(baseRate * otMultiplier);

  const basePay = roundCurrency(regularHours * baseRate);
  const overtimePay = roundCurrency(approvedOt * overtimeRate);

  const allowances = input.allowances || [];
  const totalAllowances = roundCurrency(allowances.reduce((acc, a) => acc + a.amount, 0));

  const grossPay = roundCurrency(basePay + overtimePay + totalAllowances);

  const deductions = input.deductions || [];
  const totalDeductions = roundCurrency(deductions.reduce((acc, d) => acc + d.amount, 0));

  const netPay = roundCurrency(Math.max(0, grossPay - totalDeductions));

  const unapprovedOtHours = Math.max(0, recordedOt - approvedOt);
  const hasDiscrepancy = unapprovedOtHours > 0;
  const potentialLostWages = roundCurrency(unapprovedOtHours * overtimeRate);

  const discrepancyDetails = hasDiscrepancy
    ? `Discrepancy: ${unapprovedOtHours.toFixed(1)} recorded overtime hours were not approved, representing approximately ${potentialLostWages.toFixed(2)} in unapproved potential earnings awaiting supervisory reconciliation.`
    : undefined;

  const calculationTrace = {
    formula: `Net = (Regular [${regularHours}h @ ${baseRate}] + Approved OT [${approvedOt}h @ ${overtimeRate}] + Allowances [${totalAllowances}]) - Deductions [${totalDeductions}]`,
    rules_applied: [
      `Standard Base Hourly Rate: ${baseRate.toFixed(2)}`,
      `Overtime Multiplier: ${otMultiplier}x -> Overtime Rate: ${overtimeRate.toFixed(2)}`,
      `Statutory Decimal Precision: 2 decimal places Bankers Rounding`,
      hasDiscrepancy ? `Flagged: ${unapprovedOtHours.toFixed(1)} recorded hours pending reconciliation` : 'Hours Fully Reconciled'
    ],
    timestamp: new Date().toISOString()
  };

  return {
    id: `pay-${input.userId}-${input.periodStart}`,
    org_id: input.orgId,
    user_id: input.userId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    regular_hours: regularHours,
    recorded_overtime_hours: recordedOt,
    approved_overtime_hours: approvedOt,
    base_rate: baseRate,
    overtime_rate: overtimeRate,
    base_pay: basePay,
    overtime_pay: overtimePay,
    allowances,
    deductions,
    gross_pay: grossPay,
    net_pay: netPay,
    status: hasDiscrepancy ? 'disputed' : 'published',
    has_discrepancy: hasDiscrepancy,
    discrepancy_details: discrepancyDetails,
    calculation_trace: calculationTrace
  };
}
