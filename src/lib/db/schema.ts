export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL CHECK(industry IN ('construction', 'higher_education')),
  settings_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  site_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('worker', 'manager', 'safety_officer', 'payroll_admin', 'super_admin')),
  department TEXT NOT NULL,
  site_id TEXT REFERENCES sites(id),
  job_title TEXT NOT NULL,
  hourly_rate REAL NOT NULL DEFAULT 0.0,
  language_pref TEXT NOT NULL DEFAULT 'en' CHECK(language_pref IN ('en', 'ta')),
  phone TEXT,
  worker_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_assignments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL REFERENCES sites(id),
  shift_date TEXT NOT NULL, -- YYYY-MM-DD
  start_time TEXT NOT NULL, -- HH:MM
  end_time TEXT NOT NULL,   -- HH:MM
  planned_hours REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS attendance_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('clock_in', 'clock_out')),
  timestamp DATETIME NOT NULL,
  site_id TEXT NOT NULL REFERENCES sites(id),
  verification_method TEXT NOT NULL DEFAULT 'site_kiosk',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS work_records (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_date TEXT NOT NULL,
  recorded_hours REAL NOT NULL DEFAULT 0.0,
  approved_hours REAL NOT NULL DEFAULT 0.0,
  overtime_hours REAL NOT NULL DEFAULT 0.0,
  approved_by TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reconciled', 'disputed')),
  reconciliation_notes TEXT
);

CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  regular_hours REAL NOT NULL DEFAULT 0.0,
  recorded_overtime_hours REAL NOT NULL DEFAULT 0.0,
  approved_overtime_hours REAL NOT NULL DEFAULT 0.0,
  base_rate REAL NOT NULL DEFAULT 0.0,
  overtime_rate REAL NOT NULL DEFAULT 0.0,
  base_pay REAL NOT NULL DEFAULT 0.0,
  overtime_pay REAL NOT NULL DEFAULT 0.0,
  allowances_json TEXT NOT NULL DEFAULT '[]',
  deductions_json TEXT NOT NULL DEFAULT '[]',
  gross_pay REAL NOT NULL DEFAULT 0.0,
  net_pay REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'paid', 'disputed')),
  has_discrepancy INTEGER NOT NULL DEFAULT 0,
  discrepancy_details TEXT,
  calculation_trace_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS fairness_alerts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  issue TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  record_ref TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'dismissed')),
  assigned_to TEXT REFERENCES users(id),
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  reporter_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  anonymous_tracking_code TEXT UNIQUE,
  anonymous_passcode_hash TEXT,
  category TEXT NOT NULL CHECK(category IN ('safety_hazard', 'wage_dispute', 'harassment', 'unfair_scheduling', 'facility_equipment', 'other')),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  site_id TEXT NOT NULL REFERENCES sites(id),
  location_detail TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'triaged', 'assigned', 'under_investigation', 'action_proposed', 'awaiting_verification', 'resolved', 'appealed', 'reopened', 'rejected')),
  assigned_to TEXT REFERENCES users(id),
  target_deadline DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  appeal_reason TEXT
);

CREATE TABLE IF NOT EXISTS case_messages (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('reporter', 'reviewer', 'system')),
  sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS corrective_actions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  assigned_to TEXT NOT NULL REFERENCES users(id),
  due_date TEXT NOT NULL,
  completed_at DATETIME,
  completion_evidence TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
  verified_by TEXT REFERENCES users(id),
  verified_at DATETIME,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS fairness_ledger (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  credential_type TEXT NOT NULL CHECK(credential_type IN ('certification', 'license', 'safety_induction', 'competency')),
  issuing_org TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  expiry_date TEXT,
  verification_status TEXT NOT NULL DEFAULT 'self_reported' CHECK(verification_status IN ('self_reported', 'employer_verified', 'certified')),
  verified_by TEXT REFERENCES users(id),
  verified_at DATETIME,
  evidence_url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS fairness_receipts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  case_or_record_ref TEXT NOT NULL,
  receipt_type TEXT NOT NULL CHECK(receipt_type IN ('payroll_reconciliation', 'safety_resolution', 'grievance_outcome')),
  issue_summary TEXT NOT NULL,
  findings TEXT NOT NULL,
  corrections_applied TEXT,
  decision_date TEXT NOT NULL,
  decided_by TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  verification_notes TEXT,
  appeal_status TEXT NOT NULL DEFAULT 'none' CHECK(appeal_status IN ('none', 'eligible', 'appealed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shift_assignments(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_events(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_work_records_user ON work_records(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_cases_org_status ON cases(org_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_tracking ON cases(anonymous_tracking_code);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON fairness_alerts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_ledger_org ON fairness_ledger(org_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skill_credentials(user_id);
`;
