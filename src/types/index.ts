export type IndustryType = 'construction' | 'higher_education';

export type UserRole = 
  | 'worker'
  | 'manager'
  | 'safety_officer'
  | 'payroll_admin'
  | 'super_admin';

export type LanguageCode = 'en' | 'ta';

export interface Organisation {
  id: string;
  name: string;
  code: string;
  industry: IndustryType;
  settings: OrgSettings;
  created_at: string;
}

export interface OrgSettings {
  standard_daily_hours: number;
  max_weekly_hours: number;
  min_rest_hours_between_shifts: number;
  max_consecutive_days: number;
  overtime_multiplier: number;
  currency: string;
  currency_symbol: string;
  grievance_categories: string[];
  requires_remedy_verification: boolean;
}

export interface Site {
  id: string;
  org_id: string;
  name: string;
  location: string;
  site_type: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  site_id: string;
  job_title: string;
  hourly_rate: number;
  language_pref: LanguageCode;
  phone?: string;
  worker_number?: string;
  created_at: string;
}

export interface ShiftAssignment {
  id: string;
  org_id: string;
  user_id: string;
  site_id: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  planned_hours: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface AttendanceEvent {
  id: string;
  org_id: string;
  user_id: string;
  event_type: 'clock_in' | 'clock_out';
  timestamp: string; // ISO 8601
  site_id: string;
  verification_method: 'site_kiosk' | 'mobile_geo' | 'manual_entry';
  notes?: string;
}

export interface WorkRecord {
  id: string;
  org_id: string;
  user_id: string;
  shift_date: string;
  recorded_hours: number;
  approved_hours: number;
  overtime_hours: number;
  approved_by?: string;
  status: 'pending' | 'reconciled' | 'disputed';
  reconciliation_notes?: string;
}

export interface Payslip {
  id: string;
  org_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  regular_hours: number;
  recorded_overtime_hours: number;
  approved_overtime_hours: number;
  base_rate: number;
  overtime_rate: number;
  base_pay: number;
  overtime_pay: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number; explanation: string }[];
  gross_pay: number;
  net_pay: number;
  status: 'draft' | 'published' | 'paid' | 'disputed';
  has_discrepancy: boolean;
  discrepancy_details?: string;
  calculation_trace: {
    formula: string;
    rules_applied: string[];
    timestamp: string;
  };
}

export type FairnessAlertType = 
  | 'overtime_discrepancy'
  | 'insufficient_rest'
  | 'excessive_hours'
  | 'unexplained_deduction'
  | 'hazard_recurrence'
  | 'overdue_action'
  | 'uneven_allocation';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FairnessAlert {
  id: string;
  org_id: string;
  user_id?: string;
  alert_type: FairnessAlertType;
  severity: AlertSeverity;
  issue: string;
  evidence: {
    recorded_value?: string | number;
    expected_or_approved_value?: string | number;
    difference?: string | number;
    context: string;
    sample_period?: string;
    affected_workers_count?: number;
    related_record_ids?: string[];
  };
  record_ref: string;
  rule_id: string;
  rule_description: string;
  recommended_action: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export type CaseCategory = 
  | 'safety_hazard'
  | 'wage_dispute'
  | 'harassment'
  | 'unfair_scheduling'
  | 'facility_equipment'
  | 'other';

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';

export type CaseStatus = 
  | 'submitted'
  | 'triaged'
  | 'assigned'
  | 'under_investigation'
  | 'action_proposed'
  | 'awaiting_verification'
  | 'resolved'
  | 'appealed'
  | 'reopened'
  | 'rejected';

export interface CaseReport {
  id: string;
  case_number: string;
  org_id: string;
  is_anonymous: boolean;
  reporter_user_id?: string; // null if anonymous
  anonymous_tracking_code?: string; // e.g. FS-SAFE-8492
  anonymous_passcode_hash?: string; // hashed PIN/passcode
  category: CaseCategory;
  priority: CasePriority;
  title: string;
  description: string;
  site_id: string;
  location_detail?: string;
  status: CaseStatus;
  assigned_to?: string;
  target_deadline?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  appeal_reason?: string;
}

export interface CaseMessage {
  id: string;
  case_id: string;
  sender_role: 'reporter' | 'reviewer' | 'system';
  sender_id?: string; // redacted/null for anonymous reporter
  message: string;
  attachments?: { name: string; url: string; size: number }[];
  created_at: string;
}

export interface CorrectiveAction {
  id: string;
  case_id: string;
  action_description: string;
  assigned_to: string;
  due_date: string;
  completed_at?: string;
  completion_evidence?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
}

export interface FairnessLedgerEvent {
  id: string;
  org_id: string;
  entity_type: 'attendance' | 'shift' | 'payroll' | 'grievance' | 'corrective_action' | 'verification' | 'alert';
  entity_id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action: string;
  reason?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface SkillCredential {
  id: string;
  user_id: string;
  org_id: string;
  skill_name: string;
  category: string;
  credential_type: 'certification' | 'license' | 'safety_induction' | 'competency';
  issuing_org: string;
  issue_date: string;
  expiry_date?: string;
  verification_status: 'self_reported' | 'employer_verified' | 'certified';
  verified_by?: string;
  verified_at?: string;
  evidence_url?: string;
  notes?: string;
}

export interface FairnessReceipt {
  id: string;
  org_id: string;
  user_id?: string;
  case_or_record_ref: string;
  receipt_type: 'payroll_reconciliation' | 'safety_resolution' | 'grievance_outcome';
  issue_summary: string;
  findings: string;
  corrections_applied?: string;
  decision_date: string;
  decided_by: string;
  verification_status: string;
  verification_notes?: string;
  appeal_status: 'none' | 'eligible' | 'appealed';
  created_at: string;
}
