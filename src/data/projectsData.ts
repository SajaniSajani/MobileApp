export const PROJECTS = [
  { name: 'Defect Tracker', risk: 'High' },
  { name: 'QA testing', risk: 'High' },
  { name: 'project 1', risk: 'Low' },
  { name: 'Heart', risk: 'Low' },
  { name: 'Dashbord testing', risk: 'Medium' },
  { name: 'JALI', risk: 'Low' },
  { name: 'Hello world', risk: 'Medium' },
  { name: 'dashboard test', risk: 'High' },
  { name: 'Defect Tracker 2', risk: 'Low' },
];

export const DEFECT_DATA = {
  'Defect Tracker': {
    High: { REOPEN: 2, NEW: 60, OPEN: 5, FIXED: 13, CLOSED: 27, REJECT: 0, DUPLICATE: 3, total: 110 },
    Medium: { REOPEN: 5, NEW: 129, OPEN: 10, FIXED: 32, CLOSED: 58, REJECT: 2, DUPLICATE: 1, total: 237 },
    Low: { REOPEN: 1, NEW: 59, OPEN: 0, FIXED: 11, CLOSED: 23, REJECT: 1, DUPLICATE: 3, total: 98 },
  },
  // Add more projects as needed
};

export const DEFECT_COLORS = {
  REOPEN: '#ef4444',
  NEW: '#3b82f6',
  OPEN: '#22d3ee',
  FIXED: '#22c55e',
  CLOSED: '#16a34a',
  REJECT: '#b91c1c',
  DUPLICATE: '#6b7280',
};

export const RISK_COLORS = {
  High: '#ef4444',
  Medium: '#facc15',
  Low: '#22c55e',
};

export const RISK_LABELS = {
  High: 'High Risk',
  Medium: 'Medium Risk',
  Low: 'Low Risk',
};

export const RISK_FILTER_LABELS = ['All Projects', 'High Risk', 'Medium Risk', 'Low Risk']; 