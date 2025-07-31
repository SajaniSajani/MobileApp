export const PROJECTS = [
  { name: 'Defect Tracker', risk: 'High', defectDensity: 25, totalDefects: 445, linesOfCode: 18000 },
  { name: 'QA testing', risk: 'High', defectDensity: 22, totalDefects: 132, linesOfCode: 6000 },
  { name: 'project 1', risk: 'Low', defectDensity: 8, totalDefects: 24, linesOfCode: 3000 },
  { name: 'Heart', risk: 'Low', defectDensity: 5, totalDefects: 15, linesOfCode: 3000 },
  { name: 'Dashbord testing', risk: 'Medium', defectDensity: 15, totalDefects: 75, linesOfCode: 5000 },
  { name: 'JALI', risk: 'Low', defectDensity: 6, totalDefects: 18, linesOfCode: 3000 },
  { name: 'Hello world', risk: 'Medium', defectDensity: 12, totalDefects: 36, linesOfCode: 3000 },
  { name: 'dashboard test', risk: 'High', defectDensity: 28, totalDefects: 168, linesOfCode: 6000 },
  { name: 'Defect Tracker 2', risk: 'Low', defectDensity: 7, totalDefects: 21, linesOfCode: 3000 },
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

export const RISK_FILTER_LABELS = ['All', 'High Risk', 'Medium Risk', 'Low Risk']; 