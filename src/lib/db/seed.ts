import { getDb, execute, resetDatabase } from './index.ts';
import { hashPasscode } from '../engine/crypto.ts';
import { calculatePayBreakdown } from '../engine/payroll.ts';
import { recordAuditEvent } from '../engine/audit-ledger.ts';

export function seedDatabase(): void {
  console.log('Seeding FairShift database with 2 distinct industry profiles...');
  resetDatabase();

  const db = getDb();

  // 1. ORGANISATIONS
  const orgConstructionSettings = JSON.stringify({
    standard_daily_hours: 8,
    max_weekly_hours: 48,
    min_rest_hours_between_shifts: 11,
    max_consecutive_days: 6,
    overtime_multiplier: 1.5,
    currency: 'USD',
    currency_symbol: '$',
    grievance_categories: ['safety_hazard', 'wage_dispute', 'unfair_scheduling', 'equipment', 'harassment'],
    requires_remedy_verification: true
  });

  const orgUniversitySettings = JSON.stringify({
    standard_daily_hours: 7.5,
    max_weekly_hours: 40,
    min_rest_hours_between_shifts: 12,
    max_consecutive_days: 5,
    overtime_multiplier: 1.5,
    currency: 'USD',
    currency_symbol: '$',
    grievance_categories: ['safety_hazard', 'wage_dispute', 'workload_burden', 'facility_equipment', 'harassment'],
    requires_remedy_verification: true
  });

  execute(
    `INSERT INTO organisations (id, name, code, industry, settings_json) VALUES 
     ('org-construction', 'Apex Infrastructure Ltd', 'APEX-CON', 'construction', ?),
     ('org-university', 'Metropolitan Technical University', 'MTU-EDU', 'higher_education', ?)`,
    [orgConstructionSettings, orgUniversitySettings]
  );

  // 2. SITES
  execute(
    `INSERT INTO sites (id, org_id, name, location, site_type) VALUES 
     ('site-apex-a', 'org-construction', 'Metro Line Extension (Tower A)', 'Downtown Sector 4', 'Heavy Civil Construction'),
     ('site-apex-b', 'org-construction', 'Riverside Highway Bridge', 'Pier 12 North Basin', 'Infrastructure & Concrete'),
     ('site-mtu-main', 'org-university', 'Main Academic Quad & Science Complex', 'North Campus, Building B', 'Higher Education Facilities'),
     ('site-mtu-res', 'org-university', 'Student Residence Towers & Dining Hall', 'South Campus Zone 2', 'Student Services & Custodial')`
  );

  // 3. USERS (Workers, Supervisors, Safety Officers, Payroll Admins)
  const users = [
    // Construction
    ['usr-const-w1', 'org-construction', 'ramanathan.k@apex-infra.demo', 'Ramanathan K.', 'worker', 'Heavy Machinery', 'site-apex-a', 'Excavator & Crane Operator', 24.50, 'ta', '+1-555-0101', 'W-CON-8821'],
    ['usr-const-w2', 'org-construction', 'carlos.m@apex-infra.demo', 'Carlos Mendez', 'worker', 'Structural Scaffolding', 'site-apex-a', 'Scaffold Erector', 22.00, 'en', '+1-555-0102', 'W-CON-8822'],
    ['usr-const-w3', 'org-construction', 'david.kim@apex-infra.demo', 'David Kim', 'worker', 'Welding & Rigging', 'site-apex-b', 'Certified Structural Welder', 26.00, 'en', '+1-555-0103', 'W-CON-8823'],
    ['usr-const-mgr', 'org-construction', 'jack.bennett@apex-infra.demo', 'Jack Bennett', 'manager', 'Site Operations', 'site-apex-a', 'Senior Site Superintendent', 38.00, 'en', '+1-555-0104', 'M-CON-101'],
    ['usr-const-safe', 'org-construction', 'marcus.vance@apex-infra.demo', 'Marcus Vance', 'safety_officer', 'HSE Department', 'site-apex-a', 'Chief Health & Safety Officer', 35.00, 'en', '+1-555-0105', 'S-CON-201'],
    ['usr-const-pay', 'org-construction', 'sarah.jenkins@apex-infra.demo', 'Sarah Jenkins', 'payroll_admin', 'Finance & Payroll', 'site-apex-a', 'Payroll Operations Director', 34.00, 'en', '+1-555-0106', 'P-CON-301'],

    // Higher Education
    ['usr-univ-w1', 'org-university', 'priya.s@mtu-edu.demo', 'Priya Sundaram', 'worker', 'Housekeeping & Custodial', 'site-mtu-main', 'Lead Custodial Specialist', 19.50, 'ta', '+1-555-0201', 'W-MTU-4401'],
    ['usr-univ-w2', 'org-university', 'suresh.kumar@mtu-edu.demo', 'Suresh Kumar', 'worker', 'Housekeeping & Custodial', 'site-mtu-main', 'Senior Custodian', 18.00, 'ta', '+1-555-0202', 'W-MTU-4402'],
    ['usr-univ-w3', 'org-university', 'mary.oconnor@mtu-edu.demo', "Mary O'Connor", 'worker', 'Campus Security', 'site-mtu-res', 'Campus Safety Officer', 20.00, 'en', '+1-555-0203', 'W-MTU-4403'],
    ['usr-univ-w4', 'org-university', 'james.wilson@mtu-edu.demo', 'James Wilson', 'worker', 'Facilities Maintenance', 'site-mtu-main', 'HVAC Technician', 23.00, 'en', '+1-555-0204', 'W-MTU-4404'],
    ['usr-univ-mgr', 'org-university', 'anita.sharma@mtu-edu.demo', 'Dr. Anita Sharma', 'manager', 'Facilities & Operations', 'site-mtu-main', 'Director of Campus Operations', 42.00, 'en', '+1-555-0205', 'M-MTU-101'],
    ['usr-univ-safe', 'org-university', 'elena.rostova@mtu-edu.demo', 'Elena Rostova', 'safety_officer', 'Environmental Health', 'site-mtu-main', 'Chemical Hygiene & Safety Officer', 36.00, 'en', '+1-555-0206', 'S-MTU-201'],
    ['usr-univ-pay', 'org-university', 'robert.patel@mtu-edu.demo', 'Robert Patel', 'payroll_admin', 'Human Resources & Payroll', 'site-mtu-main', 'Compensation Specialist', 33.00, 'en', '+1-555-0207', 'P-MTU-301'],
  ];

  for (const u of users) {
    execute(
      `INSERT INTO users (id, org_id, email, full_name, role, department, site_id, job_title, hourly_rate, language_pref, phone, worker_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      u
    );
  }

  // 4. SHIFTS & ATTENDANCE
  // Construction Shifts: Ramanathan has 8h regular scheduled shift
  execute(
    `INSERT INTO shift_assignments (id, org_id, user_id, site_id, shift_date, start_time, end_time, planned_hours, status, notes) VALUES
     ('sh-con-101', 'org-construction', 'usr-const-w1', 'site-apex-a', '2026-10-22', '07:00', '15:30', 8.0, 'completed', 'Excavation phase 2 foundation'),
     ('sh-con-102', 'org-construction', 'usr-const-w1', 'site-apex-a', '2026-10-23', '07:00', '15:30', 8.0, 'completed', 'Soil stabilization work'),
     ('sh-con-103', 'org-construction', 'usr-const-w1', 'site-apex-a', '2026-10-24', '07:00', '15:30', 8.0, 'completed', 'Crane rig relocation'),
     ('sh-con-104', 'org-construction', 'usr-const-w1', 'site-apex-a', '2026-10-25', '07:00', '15:30', 8.0, 'completed', 'Concrete footing placement'),
     ('sh-con-105', 'org-construction', 'usr-const-w1', 'site-apex-a', '2026-10-26', '07:00', '15:30', 8.0, 'completed', 'Emergency trench backfill'),
     ('sh-con-106', 'org-construction', 'usr-const-w1', 'site-apex-a', '2026-10-27', '07:00', '15:30', 8.0, 'scheduled', 'Foundation pile cap inspection'),
     
     -- Rest violation scenario for Carlos Mendez: night shift ending at 06:00, next shift starts at 14:00 (only 8h rest!)
     ('sh-con-rest-1', 'org-construction', 'usr-const-w2', 'site-apex-a', '2026-10-25', '22:00', '06:00', 8.0, 'completed', 'Night scaffolding overhaul'),
     ('sh-con-rest-2', 'org-construction', 'usr-const-w2', 'site-apex-a', '2026-10-26', '14:00', '22:00', 8.0, 'completed', 'Daytime crane support (Flagged: only 8h rest)'),

     -- University Shifts
     ('sh-edu-101', 'org-university', 'usr-univ-w1', 'site-mtu-main', '2026-10-22', '08:00', '16:00', 7.5, 'completed', 'Science Complex Laboratories'),
     ('sh-edu-102', 'org-university', 'usr-univ-w1', 'site-mtu-main', '2026-10-23', '08:00', '16:00', 7.5, 'completed', 'Academic Hall sanitization'),
     ('sh-edu-103', 'org-university', 'usr-univ-w2', 'site-mtu-main', '2026-10-22', '16:00', '00:00', 7.5, 'completed', 'Evening shift deep clean'),
     ('sh-edu-104', 'org-university', 'usr-univ-w2', 'site-mtu-main', '2026-10-23', '16:00', '00:00', 7.5, 'completed', 'Evening event cleanup')`
  );

  // 5. WORK RECORDS (Demonstrating Signature Construction 12h vs 8h Overtime Discrepancy!)
  execute(
    `INSERT INTO work_records (id, org_id, user_id, shift_date, recorded_hours, approved_hours, overtime_hours, approved_by, status, reconciliation_notes) VALUES
     ('wr-con-101', 'org-construction', 'usr-const-w1', '2026-10-22', 12.0, 8.0, 4.0, 'usr-const-mgr', 'disputed', 'Biometric turnstile shows 12.0 recorded hours on concrete pour, but supervisor capped approved overtime to 8.0 hours without written justification.'),
     ('wr-con-102', 'org-construction', 'usr-const-w1', '2026-10-23', 8.0, 8.0, 0.0, 'usr-const-mgr', 'reconciled', 'Standard shift reconciled'),
     ('wr-con-103', 'org-construction', 'usr-const-w1', '2026-10-24', 9.5, 9.5, 1.5, 'usr-const-mgr', 'reconciled', '1.5h approved crane maintenance OT'),
     ('wr-con-104', 'org-construction', 'usr-const-w1', '2026-10-25', 8.0, 8.0, 0.0, 'usr-const-mgr', 'reconciled', 'Standard shift reconciled'),
     ('wr-con-105', 'org-construction', 'usr-const-w1', '2026-10-26', 10.0, 10.0, 2.0, 'usr-const-mgr', 'reconciled', 'Emergency trench backfill OT'),

     -- University Work Records
     ('wr-edu-201', 'org-university', 'usr-univ-w1', '2026-10-22', 11.5, 11.5, 4.0, 'usr-univ-mgr', 'reconciled', 'Conference prep overtime'),
     ('wr-edu-202', 'org-university', 'usr-univ-w2', '2026-10-22', 12.0, 12.0, 4.5, 'usr-univ-mgr', 'reconciled', 'Evening lab deep clean OT'),
     ('wr-edu-203', 'org-university', 'usr-univ-w3', '2026-10-22', 8.0, 8.0, 0.0, 'usr-univ-mgr', 'reconciled', 'Regular security patrol')`
  );

  // 6. ATTENDANCE CLOCK EVENTS
  execute(
    `INSERT INTO attendance_events (id, org_id, user_id, event_type, timestamp, site_id, verification_method, notes) VALUES
     ('att-101', 'org-construction', 'usr-const-w1', 'clock_in', '2026-10-22T06:55:00Z', 'site-apex-a', 'site_kiosk', 'Turnstile gate 1 scan'),
     ('att-102', 'org-construction', 'usr-const-w1', 'clock_out', '2026-10-22T19:02:00Z', 'site-apex-a', 'site_kiosk', 'Turnstile gate 1 exit (12.1h on site)'),
     ('att-103', 'org-construction', 'usr-const-w1', 'clock_in', '2026-10-27T06:58:00Z', 'site-apex-a', 'site_kiosk', 'Morning clock-in today')`
  );

  // 7. TRANSPARENT PAYSLIPS
  // Ramanathan payslip with the 4 unapproved OT hours discrepancy explicitly tracked!
  const ramanathanPayslip = calculatePayBreakdown({
    userId: 'usr-const-w1',
    orgId: 'org-construction',
    periodStart: '2026-10-15',
    periodEnd: '2026-10-26',
    baseRate: 24.50,
    regularHours: 80,
    recordedOvertimeHours: 12.0, // 12 hours recorded
    approvedOvertimeHours: 8.0,  // only 8 hours approved!
    overtimeMultiplier: 1.5,
    allowances: [
      { name: 'Heavy Machinery Tool Allowance', amount: 85.00 },
      { name: 'Site Safety Footwear Subsidy', amount: 50.00 }
    ],
    deductions: [
      { name: 'Statutory Social Security / FICA', amount: 148.50, explanation: 'Mandatory Federal labor contribution' },
      { name: 'Union Medical Benefit Trust', amount: 45.00, explanation: 'Local 402 Labor Health Trust' }
    ]
  });

  execute(
    `INSERT INTO payslips (id, org_id, user_id, period_start, period_end, regular_hours, recorded_overtime_hours, approved_overtime_hours, base_rate, overtime_rate, base_pay, overtime_pay, allowances_json, deductions_json, gross_pay, net_pay, status, has_discrepancy, discrepancy_details, calculation_trace_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ramanathanPayslip.id,
      ramanathanPayslip.org_id,
      ramanathanPayslip.user_id,
      ramanathanPayslip.period_start,
      ramanathanPayslip.period_end,
      ramanathanPayslip.regular_hours,
      ramanathanPayslip.recorded_overtime_hours,
      ramanathanPayslip.approved_overtime_hours,
      ramanathanPayslip.base_rate,
      ramanathanPayslip.overtime_rate,
      ramanathanPayslip.base_pay,
      ramanathanPayslip.overtime_pay,
      JSON.stringify(ramanathanPayslip.allowances),
      JSON.stringify(ramanathanPayslip.deductions),
      ramanathanPayslip.gross_pay,
      ramanathanPayslip.net_pay,
      ramanathanPayslip.status,
      ramanathanPayslip.has_discrepancy ? 1 : 0,
      ramanathanPayslip.discrepancy_details || null,
      JSON.stringify(ramanathanPayslip.calculation_trace)
    ]
  );

  // Priya Sundaram university payslip
  const priyaPayslip = calculatePayBreakdown({
    userId: 'usr-univ-w1',
    orgId: 'org-university',
    periodStart: '2026-10-15',
    periodEnd: '2026-10-26',
    baseRate: 19.50,
    regularHours: 75,
    recordedOvertimeHours: 14.0,
    approvedOvertimeHours: 14.0,
    overtimeMultiplier: 1.5,
    allowances: [
      { name: 'Biohazard Sanitization Allowance', amount: 60.00 }
    ],
    deductions: [
      { name: 'Public Employee Pension Plan', amount: 98.00, explanation: 'University Support Staff Pension' },
      { name: 'Campus Parking Pass', amount: 25.00, explanation: 'Monthly staff parking permit' }
    ]
  });

  execute(
    `INSERT INTO payslips (id, org_id, user_id, period_start, period_end, regular_hours, recorded_overtime_hours, approved_overtime_hours, base_rate, overtime_rate, base_pay, overtime_pay, allowances_json, deductions_json, gross_pay, net_pay, status, has_discrepancy, discrepancy_details, calculation_trace_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      priyaPayslip.id,
      priyaPayslip.org_id,
      priyaPayslip.user_id,
      priyaPayslip.period_start,
      priyaPayslip.period_end,
      priyaPayslip.regular_hours,
      priyaPayslip.recorded_overtime_hours,
      priyaPayslip.approved_overtime_hours,
      priyaPayslip.base_rate,
      priyaPayslip.overtime_rate,
      priyaPayslip.base_pay,
      priyaPayslip.overtime_pay,
      JSON.stringify(priyaPayslip.allowances),
      JSON.stringify(priyaPayslip.deductions),
      priyaPayslip.gross_pay,
      priyaPayslip.net_pay,
      priyaPayslip.status,
      priyaPayslip.has_discrepancy ? 1 : 0,
      priyaPayslip.discrepancy_details || null,
      JSON.stringify(priyaPayslip.calculation_trace)
    ]
  );

  // 8. FAIRNESS GAP ENGINE ALERTS
  execute(
    `INSERT INTO fairness_alerts (id, org_id, user_id, alert_type, severity, issue, evidence_json, record_ref, rule_id, rule_description, recommended_action, status, assigned_to, created_at) VALUES
     ('alert-con-001', 'org-construction', 'usr-const-w1', 'overtime_discrepancy', 'high', 
      '4.0 unapproved overtime hours detected on shift 2026-10-22 (12.0h recorded vs 8.0h approved)',
      '{"recorded_hours": 12.0, "approved_hours": 8.0, "unapproved_difference": 4.0, "shift_date": "2026-10-22", "estimated_wage_impact": 147.00}',
      'WORK_RECORD:wr-con-101', 'FGE_001_HOURS_DISCREPANCY',
      'Flags when biometric/physical turnstile recorded work hours exceed approved hours by > 0.5h without recorded justification.',
      'Operations Supervisor Jack Bennett must review concrete pour shift logs and record either approval or formal clarification.',
      'open', 'usr-const-mgr', '2026-10-23T08:00:00Z'),

     ('alert-con-002', 'org-construction', 'usr-const-w2', 'insufficient_rest', 'critical',
      'Insufficient rest period (8.0 hrs) between consecutive shifts on 2026-10-25 and 2026-10-26',
      '{"previous_shift_end": "2026-10-26T06:00:00Z", "next_shift_start": "2026-10-26T14:00:00Z", "actual_rest_hours": 8.0, "required_rest_hours": 11.0}',
      'SHIFTS:sh-con-rest-1,sh-con-rest-2', 'FGE_002_INSUFFICIENT_REST',
      'Statutory minimum 11-hour rest interval between shifts violated; high fatigue and workplace hazard risk.',
      'Reschedule shift start time to at least 17:00 or swap assignment with available relief worker.',
      'investigating', 'usr-const-safe', '2026-10-26T07:15:00Z'),

     ('alert-edu-001', 'org-university', NULL, 'uneven_allocation', 'medium',
      'Overtime Burden Concentration: 2 of 10 custodial workers hold 78% of all overtime hours in October cycle',
      '{"department": "Housekeeping & Custodial", "top_20_percent_share": 78, "gini_coefficient": 0.68, "primary_recipients": ["Priya Sundaram", "Suresh Kumar"]}',
      'DEPT:Housekeeping & Custodial', 'FGE_006_OVERTIME_CONCENTRATION',
      'Identifies disproportionate concentration of overtime or undesirable shifts causing chronic fatigue or exclusion.',
      'Facilities Director Dr. Anita Sharma should evaluate voluntary sign-up rosters and distribute weekend callouts across team.',
      'open', 'usr-univ-mgr', '2026-10-25T11:00:00Z'),

     ('alert-edu-002', 'org-university', NULL, 'overdue_action', 'high',
      'Overdue Chemical Storage Remediation in Science Complex Basement Room B12 (Awaiting Physical Verification)',
      '{"case_number": "FS-CHEM-9812", "assigned_to": "Elena Rostova", "deadline": "2026-10-24", "current_delay_days": 3}',
      'CASE:case-edu-9812', 'FGE_005_OVERDUE_REMEDY',
      'Remedy action administratively marked done by maintenance, but physical safety verification has not been signed off.',
      'Campus Safety Officer Elena Rostova must conduct physical site inspection and confirm chemical storage compliance.',
      'open', 'usr-univ-safe', '2026-10-25T09:30:00Z')`
  );

  // 9. CASES (SafeSpeak & Remedy Tracker)
  // Scenario Construction: Unsafe Scaffolding reported, assigned to safety officer, corrective action verified!
  const conPasscodeHash = hashPasscode('SAFE99');
  execute(
    `INSERT INTO cases (id, case_number, org_id, is_anonymous, reporter_user_id, anonymous_tracking_code, anonymous_passcode_hash, category, priority, title, description, site_id, location_detail, status, assigned_to, target_deadline, created_at, updated_at, resolved_at) VALUES
     ('case-con-1042', 'FS-SAFE-1042', 'org-construction', 0, 'usr-const-w2', 'FS-SAFE-1042', ?, 'safety_hazard', 'urgent',
      'Unstable Scaffolding on Tower A Level 4 near Crane 2',
      'Several cross-braces on the external scaffold frame are missing pin locks, causing significant sway during wind gusts. Workers on Level 4 feel unsafe working on the outer deck.',
      'site-apex-a', 'Tower A exterior, Level 4 north wall',
      'resolved', 'usr-const-safe', '2026-10-24T18:00:00Z', '2026-10-21T09:15:00Z', '2026-10-23T16:00:00Z', '2026-10-23T16:00:00Z')`,
    [conPasscodeHash]
  );

  // Corrective action for Construction Scaffolding (Verified by Marcus Vance!)
  execute(
    `INSERT INTO corrective_actions (id, case_id, action_description, assigned_to, due_date, completed_at, completion_evidence, verification_status, verified_by, verified_at, notes) VALUES
     ('ca-con-01', 'case-con-1042', 'Re-torque all scaffold clamps, install double safety pin locks, and conduct red-tag/green-tag safety re-certification.',
      'usr-const-mgr', '2026-10-23', '2026-10-23T14:30:00Z', 'Work order #WO-991 completed by scaffold crew. High-resolution photos attached showing all double-pin locks installed.',
      'verified', 'usr-const-safe', '2026-10-23T16:00:00Z', 'Chief Safety Officer Marcus Vance physically inspected Tower A Level 4 and confirmed 100% compliance.')`
  );

  // Case messages for Construction Scaffolding
  execute(
    `INSERT INTO case_messages (id, case_id, sender_role, sender_id, message, attachments_json, created_at) VALUES
     ('msg-con-01', 'case-con-1042', 'reporter', 'usr-const-w2', 'Sway was over 4 inches this morning during the material delivery hoist. Please send safety crew.', '[]', '2026-10-21T09:20:00Z'),
     ('msg-con-02', 'case-con-1042', 'reviewer', 'usr-const-safe', 'Marcus Vance (Safety Director): Scaffold shut down immediately with Red Tag. Scaffold crew dispatched for full re-bracing.', '[]', '2026-10-21T10:00:00Z'),
     ('msg-con-03', 'case-con-1042', 'reviewer', 'usr-const-safe', 'Remedy verified on site. Green Tag safety certification reinstated. Thank you for reporting this hazard promptly.', '[]', '2026-10-23T16:05:00Z')`
  );

  // Scenario University: Anonymous chemical storage report - AWAITING VERIFICATION (demonstrating that status != resolved until verified!)
  const univPasscodeHash = hashPasscode('CHEM88');
  execute(
    `INSERT INTO cases (id, case_number, org_id, is_anonymous, reporter_user_id, anonymous_tracking_code, anonymous_passcode_hash, category, priority, title, description, site_id, location_detail, status, assigned_to, target_deadline, created_at, updated_at) VALUES
     ('case-edu-9812', 'FS-CHEM-9812', 'org-university', 1, NULL, 'FS-CHEM-9812', ?, 'safety_hazard', 'high',
      'Unlabeled Solvent Drums in Science Basement near HVAC Intake',
      'Three 55-gallon drums of industrial stripper and concentrated solvent are stored unsealed within 10 feet of the main basement air return damper. Fumes are entering the ground floor lecture hall.',
      'site-mtu-main', 'Science Complex Basement B12 Mechanical Corridor',
      'awaiting_verification', 'usr-univ-safe', '2026-10-24T17:00:00Z', '2026-10-22T14:30:00Z', '2026-10-25T10:00:00Z')`,
    [univPasscodeHash]
  );

  // Corrective action for University Case (Pending verification!)
  execute(
    `INSERT INTO corrective_actions (id, case_id, action_description, assigned_to, due_date, completed_at, completion_evidence, verification_status, notes) VALUES
     ('ca-edu-01', 'case-edu-9812', 'Relocate drums to exterior flammables bunker with secondary spill containment and replace intake filters.',
      'usr-univ-mgr', '2026-10-24', '2026-10-24T16:00:00Z', 'Facilities maintenance notes: Drums moved to chemical shed.',
      'pending', 'Remedy recorded as complete by facilities maintenance. Pending physical verification by Environmental Health Officer Elena Rostova before case can be marked resolved.')`
  );

  execute(
    `INSERT INTO case_messages (id, case_id, sender_role, sender_id, message, attachments_json, created_at) VALUES
     ('msg-edu-01', 'case-edu-9812', 'reporter', NULL, 'Fumes were so strong students in Hall 101 were coughing. The drums have no labels.', '[]', '2026-10-22T14:35:00Z'),
     ('msg-edu-02', 'case-edu-9812', 'reviewer', 'usr-univ-safe', 'Elena Rostova: Priority case assigned. Facilities ordered to vent corridor immediately.', '[]', '2026-10-22T15:10:00Z'),
     ('msg-edu-03', 'case-edu-9812', 'reviewer', 'usr-univ-mgr', 'Facilities Ops: Maintenance moved drums this afternoon.', '[]', '2026-10-24T16:05:00Z')`
  );

  // 10. FAIRNESS RECEIPTS
  execute(
    `INSERT INTO fairness_receipts (id, org_id, user_id, case_or_record_ref, receipt_type, issue_summary, findings, corrections_applied, decision_date, decided_by, verification_status, verification_notes, appeal_status) VALUES
     ('rcpt-con-001', 'org-construction', 'usr-const-w2', 'CASE:case-con-1042', 'safety_resolution',
      'Unstable Scaffolding Level 4 Hazard Remediation',
      'Physical inspection confirmed missing structural cross-bracing and loose base plates.',
      'All structural clamps re-torqued, double-pin locks installed, and Green Tag safety recertification issued.',
      '2026-10-23', 'Marcus Vance (Chief HSE Officer)', 'Independently Verified on Site',
      'Field inspection verified that sway was reduced to < 0.25 inches and all fall arrest anchor points meet OSHA standards.',
      'eligible')`
  );

  // 11. PORTABLE SKILL PASSPORT CREDENTIALS
  execute(
    `INSERT INTO skill_credentials (id, user_id, org_id, skill_name, category, credential_type, issuing_org, issue_date, expiry_date, verification_status, verified_by, verified_at, notes) VALUES
     ('sk-con-01', 'usr-const-w1', 'org-construction', 'OSHA 30-Hour Construction Safety', 'Safety & Compliance', 'certification', 'Occupational Safety & Health Administration', '2024-03-15', '2029-03-15', 'certified', 'usr-const-safe', '2024-03-20T10:00:00Z', 'Standard card #OSHA-30-9921'),
     ('sk-con-02', 'usr-const-w1', 'org-construction', 'Heavy Excavator & Hydraulic Crane Class A', 'Heavy Equipment', 'license', 'International Union of Operating Engineers', '2023-06-10', '2027-06-10', 'certified', 'usr-const-safe', '2023-06-15T12:00:00Z', 'Endorsement for up to 75-ton lattice boom cranes'),
     ('sk-con-03', 'usr-const-w1', 'org-construction', 'Deep Trench Shoring & Excavation Competency', 'Civil Operations', 'competency', 'Apex Infrastructure Safety Committee', '2025-01-10', NULL, 'employer_verified', 'usr-const-mgr', '2025-01-11T09:00:00Z', 'Site induction and practical excavation trench trial verified'),
     
     -- University Worker Credentials
     ('sk-edu-01', 'usr-univ-w1', 'org-university', 'Chemical Hygiene & Hazardous Waste Management', 'Environmental Health', 'certification', 'State Department of Environmental Protection', '2024-08-20', '2027-08-20', 'certified', 'usr-univ-safe', '2024-08-25T11:00:00Z', 'Certified for Bio-safety Level 2 handling'),
     ('sk-edu-02', 'usr-univ-w1', 'org-university', 'Industrial Sanitization & Infection Control', 'Custodial Excellence', 'competency', 'Metropolitan Technical University Facilities', '2023-11-15', NULL, 'employer_verified', 'usr-univ-mgr', '2023-11-16T14:00:00Z', 'Lead custodian verification on campus laboratory protocols')`
  );

  // 12. FAIRNESS LEDGER (Audit Log events)
  recordAuditEvent({
    orgId: 'org-construction',
    entityType: 'shift',
    entityId: 'sh-con-101',
    actorId: 'usr-const-mgr',
    actorName: 'Jack Bennett',
    actorRole: 'Senior Site Superintendent',
    action: 'CREATE_SHIFT',
    reason: 'Published weekly concrete foundation crew roster',
    details: { shiftDate: '2026-10-22', plannedHours: 8.0 }
  });

  recordAuditEvent({
    orgId: 'org-construction',
    entityType: 'attendance',
    entityId: 'att-101',
    actorId: 'usr-const-w1',
    actorName: 'Ramanathan K.',
    actorRole: 'worker',
    action: 'CLOCK_IN',
    reason: 'Site turnstile check-in',
    details: { site: 'Metro Line Extension', timestamp: '2026-10-22T06:55:00Z' }
  });

  recordAuditEvent({
    orgId: 'org-construction',
    entityType: 'payroll',
    entityId: 'wr-con-101',
    actorId: 'usr-const-mgr',
    actorName: 'Jack Bennett',
    actorRole: 'Senior Site Superintendent',
    action: 'OVERTIME_MODIFICATION',
    reason: 'Supervisor capped approved hours to 8.0 hrs vs 12.0 hrs physical attendance',
    details: { recordedHours: 12.0, approvedHours: 8.0, difference: 4.0 }
  });

  recordAuditEvent({
    orgId: 'org-construction',
    entityType: 'grievance',
    entityId: 'case-con-1042',
    actorId: 'usr-const-w2',
    actorName: 'Carlos Mendez',
    actorRole: 'worker',
    action: 'SUBMIT_HAZARD_REPORT',
    reason: 'Unstable scaffolding on Level 4',
    details: { priority: 'urgent', location: 'Tower A exterior Level 4' }
  });

  recordAuditEvent({
    orgId: 'org-construction',
    entityType: 'verification',
    entityId: 'ca-con-01',
    actorId: 'usr-const-safe',
    actorName: 'Marcus Vance',
    actorRole: 'Chief Health & Safety Officer',
    action: 'VERIFY_RESOLUTION',
    reason: 'Physical inspection completed; double-pin locks verified on site',
    details: { caseNumber: 'FS-SAFE-1042', verificationStatus: 'verified' }
  });

  console.log('Seeding completed successfully!');
}
