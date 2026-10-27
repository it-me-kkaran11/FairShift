export const DEMO_PERSONAS = [
  // Construction
  {
    id: 'usr-const-w1',
    name: 'Ramanathan K.',
    role: 'worker' as const,
    title: 'Excavator & Crane Operator',
    orgId: 'org-construction',
    orgName: 'Apex Infrastructure Ltd',
    industry: 'Construction',
    language: 'ta',
    badge: 'Worker (Discrepancy Affected)'
  },
  {
    id: 'usr-const-w2',
    name: 'Carlos Mendez',
    role: 'worker' as const,
    title: 'Scaffold Erector',
    orgId: 'org-construction',
    orgName: 'Apex Infrastructure Ltd',
    industry: 'Construction',
    language: 'en',
    badge: 'Worker (Safety Reporter)'
  },
  {
    id: 'usr-const-mgr',
    name: 'Jack Bennett',
    role: 'manager' as const,
    title: 'Senior Site Superintendent',
    orgId: 'org-construction',
    orgName: 'Apex Infrastructure Ltd',
    industry: 'Construction',
    language: 'en',
    badge: 'Site Manager'
  },
  {
    id: 'usr-const-safe',
    name: 'Marcus Vance',
    role: 'safety_officer' as const,
    title: 'Chief Health & Safety Officer',
    orgId: 'org-construction',
    orgName: 'Apex Infrastructure Ltd',
    industry: 'Construction',
    language: 'en',
    badge: 'Safety Officer'
  },
  {
    id: 'usr-const-pay',
    name: 'Sarah Jenkins',
    role: 'payroll_admin' as const,
    title: 'Payroll Operations Director',
    orgId: 'org-construction',
    orgName: 'Apex Infrastructure Ltd',
    industry: 'Construction',
    language: 'en',
    badge: 'Payroll Admin'
  },
  // Higher Education
  {
    id: 'usr-univ-w1',
    name: 'Priya Sundaram',
    role: 'worker' as const,
    title: 'Lead Custodial Specialist',
    orgId: 'org-university',
    orgName: 'Metropolitan Technical University',
    industry: 'Higher Education',
    language: 'ta',
    badge: 'Support Staff (Housekeeping)'
  },
  {
    id: 'usr-univ-w2',
    name: 'Suresh Kumar',
    role: 'worker' as const,
    title: 'Senior Custodian',
    orgId: 'org-university',
    orgName: 'Metropolitan Technical University',
    industry: 'Higher Education',
    language: 'ta',
    badge: 'Support Staff (OT Concentration)'
  },
  {
    id: 'usr-univ-mgr',
    name: 'Dr. Anita Sharma',
    role: 'manager' as const,
    title: 'Director of Campus Operations',
    orgId: 'org-university',
    orgName: 'Metropolitan Technical University',
    industry: 'Higher Education',
    language: 'en',
    badge: 'Campus Director'
  },
  {
    id: 'usr-univ-safe',
    name: 'Elena Rostova',
    role: 'safety_officer' as const,
    title: 'Chemical Hygiene & Safety Officer',
    orgId: 'org-university',
    orgName: 'Metropolitan Technical University',
    industry: 'Higher Education',
    language: 'en',
    badge: 'Campus EHS Officer'
  }
] as const;
