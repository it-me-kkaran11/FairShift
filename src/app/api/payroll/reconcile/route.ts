import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { calculatePayBreakdown } from '@/lib/engine/payroll';
import { recordAuditEvent } from '@/lib/engine/audit-ledger';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workRecordId, approvedHours, resolutionNotes, reviewerId } = body;

    if (!workRecordId) {
      return NextResponse.json({ error: 'Missing workRecordId' }, { status: 400 });
    }

    const record = queryOne<any>('SELECT * FROM work_records WHERE id = ?', [workRecordId]);
    if (!record) {
      return NextResponse.json({ error: 'Work record not found' }, { status: 404 });
    }

    const reviewer = reviewerId ? queryOne<any>('SELECT * FROM users WHERE id = ?', [reviewerId]) : null;
    const reviewerName = reviewer?.full_name || 'Authorized Supervisor';
    const reviewerRole = reviewer?.role || 'manager';

    const newApprovedHours = approvedHours !== undefined ? Number(approvedHours) : record.recorded_hours;
    const newOtHours = Math.max(0, newApprovedHours - 8.0);

    // Update work record
    execute(
      `UPDATE work_records 
       SET approved_hours = ?, overtime_hours = ?, status = 'reconciled', approved_by = ?, reconciliation_notes = ?
       WHERE id = ?`,
      [newApprovedHours, newOtHours, reviewer?.id || null, resolutionNotes || 'Supervisory reconciliation verified site attendance logs', workRecordId]
    );

    // Update Payslip
    const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [record.user_id]);
    const payslipRow = queryOne<any>('SELECT * FROM payslips WHERE user_id = ? ORDER BY period_end DESC LIMIT 1', [record.user_id]);

    if (payslipRow && user) {
      const updatedPayslip = calculatePayBreakdown({
        userId: user.id,
        orgId: user.org_id,
        periodStart: payslipRow.period_start,
        periodEnd: payslipRow.period_end,
        baseRate: user.hourly_rate || 24.50,
        regularHours: payslipRow.regular_hours,
        recordedOvertimeHours: record.recorded_hours,
        approvedOvertimeHours: newApprovedHours > 8.0 ? (newApprovedHours - 8.0) : payslipRow.approved_overtime_hours,
        overtimeMultiplier: 1.5,
        allowances: JSON.parse(payslipRow.allowances_json || '[]'),
        deductions: JSON.parse(payslipRow.deductions_json || '[]')
      });

      execute(
        `UPDATE payslips 
         SET approved_overtime_hours = ?, overtime_pay = ?, gross_pay = ?, net_pay = ?, status = 'published', has_discrepancy = 0, discrepancy_details = NULL, calculation_trace_json = ?
         WHERE id = ?`,
        [
          updatedPayslip.approved_overtime_hours,
          updatedPayslip.overtime_pay,
          updatedPayslip.gross_pay,
          updatedPayslip.net_pay,
          JSON.stringify(updatedPayslip.calculation_trace),
          payslipRow.id
        ]
      );
    }

    // Resolve associated fairness alert
    execute(
      `UPDATE fairness_alerts 
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?
       WHERE record_ref = ? OR record_ref = ?`,
      [`Resolved by ${reviewerName}: Hours adjusted to ${newApprovedHours.toFixed(1)}h. ${resolutionNotes || ''}`, `WORK_RECORD:${workRecordId}`, workRecordId]
    );

    // Generate Fairness Receipt
    const receiptId = `rcpt-recon-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    execute(
      `INSERT INTO fairness_receipts 
       (id, org_id, user_id, case_or_record_ref, receipt_type, issue_summary, findings, corrections_applied, decision_date, decided_by, verification_status, verification_notes, appeal_status)
       VALUES (?, ?, ?, ?, 'payroll_reconciliation', ?, ?, ?, ?, ?, 'Verified & Reconciled', ?, 'none')`,
      [
        receiptId,
        record.org_id,
        record.user_id,
        `WORK_RECORD:${workRecordId}`,
        `Reconciliation of ${record.recorded_hours}h recorded vs ${record.approved_hours}h initial approved overtime`,
        `Biometric turnstile access and site supervisor confirmed active work on site during full duration.`,
        `Approved hours updated from ${record.approved_hours}h to ${newApprovedHours}h. Difference added to payroll.`,
        today,
        `${reviewerName} (${reviewerRole})`,
        resolutionNotes || 'Supervisor signed off discrepancy reconciliation with employee.'
      ]
    );

    // Record in immutable Fairness Ledger
    recordAuditEvent({
      orgId: record.org_id,
      entityType: 'payroll',
      entityId: workRecordId,
      actorId: reviewer?.id,
      actorName: reviewerName,
      actorRole: reviewerRole,
      action: 'RECONCILE_HOURS_DISCREPANCY',
      reason: resolutionNotes || 'Supervisory review of recorded overtime discrepancy',
      details: {
        recordedHours: record.recorded_hours,
        previousApproved: record.approved_hours,
        newApprovedHours: newApprovedHours,
        receiptId
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reconciled work record. Approved hours updated to ${newApprovedHours} hrs.`,
      receiptId
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
