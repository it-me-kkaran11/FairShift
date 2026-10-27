-- =========================================================================
-- FairShift: Worker-First Workplace Fairness Intelligence Platform
-- PostgreSQL / Supabase Schema & Row-Level Security (RLS) Policies
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organisations (Isolated Tenants)
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL CHECK(industry IN ('construction', 'higher_education')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sites & Campuses
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  site_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users & Worker Profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  auth_user_id UUID, -- References auth.users(id) in Supabase Auth
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('worker', 'manager', 'safety_officer', 'payroll_admin', 'super_admin')),
  department TEXT NOT NULL,
  site_id UUID REFERENCES sites(id),
  job_title TEXT NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  language_pref TEXT NOT NULL DEFAULT 'en' CHECK(language_pref IN ('en', 'ta')),
  phone TEXT,
  worker_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Shift Assignments & Scheduling
CREATE TABLE shift_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  planned_hours NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attendance Events (Clock in/out)
CREATE TABLE attendance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('clock_in', 'clock_out')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site_id UUID NOT NULL REFERENCES sites(id),
  verification_method TEXT NOT NULL DEFAULT 'site_kiosk',
  notes TEXT
);

-- 6. Work Records (Reconciliation between recorded and approved hours)
CREATE TABLE work_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  recorded_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  approved_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  overtime_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  approved_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reconciled', 'disputed')),
  reconciliation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Transparent Payslips
CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  regular_hours NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  recorded_overtime_hours NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  approved_overtime_hours NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  overtime_rate NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  base_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  overtime_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  allowances JSONB NOT NULL DEFAULT '[]'::jsonb,
  deductions JSONB NOT NULL DEFAULT '[]'::jsonb,
  gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'paid', 'disputed')),
  has_discrepancy BOOLEAN NOT NULL DEFAULT FALSE,
  discrepancy_details TEXT,
  calculation_trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Fairness Gap Engine Alerts
CREATE TABLE fairness_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  issue TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  record_ref TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'dismissed')),
  assigned_to UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 9. SafeSpeak & Remedy Cases
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number TEXT NOT NULL UNIQUE,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_tracking_code TEXT UNIQUE,
  anonymous_passcode_hash TEXT,
  category TEXT NOT NULL CHECK(category IN ('safety_hazard', 'wage_dispute', 'harassment', 'unfair_scheduling', 'facility_equipment', 'other')),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id),
  location_detail TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'triaged', 'assigned', 'under_investigation', 'action_proposed', 'awaiting_verification', 'resolved', 'appealed', 'reopened', 'rejected')),
  assigned_to UUID REFERENCES users(id),
  target_deadline TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  appeal_reason TEXT
);

-- 10. Case Dialogue & Follow-up Messages
CREATE TABLE case_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('reporter', 'reviewer', 'system')),
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Corrective Actions (Remedy Tracker)
CREATE TABLE corrective_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  assigned_to UUID NOT NULL REFERENCES users(id),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  completion_evidence TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Fairness Ledger (Auditable History)
CREATE TABLE fairness_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Portable Skill Passport
CREATE TABLE skill_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  credential_type TEXT NOT NULL CHECK(credential_type IN ('certification', 'license', 'safety_induction', 'competency')),
  issuing_org TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  verification_status TEXT NOT NULL DEFAULT 'self_reported' CHECK(verification_status IN ('self_reported', 'employer_verified', 'certified')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  evidence_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Fairness Receipts
CREATE TABLE fairness_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  case_or_record_ref TEXT NOT NULL,
  receipt_type TEXT NOT NULL CHECK(receipt_type IN ('payroll_reconciliation', 'safety_resolution', 'grievance_outcome')),
  issue_summary TEXT NOT NULL,
  findings TEXT NOT NULL,
  corrections_applied TEXT,
  decision_date DATE NOT NULL,
  decided_by TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  verification_notes TEXT,
  appeal_status TEXT NOT NULL DEFAULT 'none' CHECK(appeal_status IN ('none', 'eligible', 'appealed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE fairness_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fairness_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE fairness_receipts ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's org_id from JWT
CREATE OR REPLACE FUNCTION get_current_user_org_id() RETURNS UUID AS $$
  SELECT org_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Helper function: check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin() RETURNS BOOLEAN AS $$
  SELECT role IN ('manager', 'super_admin', 'safety_officer', 'payroll_admin') FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Payslips: Worker can only view their own payslips; Payroll Admins/Managers can view within org
CREATE POLICY "Worker can view own payslips" ON payslips
  FOR SELECT USING (
    (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
    OR
    (org_id = get_current_user_org_id() AND is_manager_or_admin())
  );

-- Cases: Reporter can see their own reported case, or managers/safety officers in org
CREATE POLICY "Reporter can view own cases" ON cases
  FOR SELECT USING (
    (reporter_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
    OR
    (org_id = get_current_user_org_id() AND is_manager_or_admin())
  );

-- Skills: Worker controls their own skill passport; can view and insert
CREATE POLICY "Worker controls own skill passport" ON skill_credentials
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR
    (org_id = get_current_user_org_id() AND is_manager_or_admin())
  );

-- Fairness Ledger: Strictly append-only. Users cannot UPDATE or DELETE!
CREATE POLICY "Ledger is read-only for inspection" ON fairness_ledger
  FOR SELECT USING (org_id = get_current_user_org_id());

CREATE POLICY "Ledger is insert-only" ON fairness_ledger
  FOR INSERT WITH CHECK (org_id = get_current_user_org_id());
