export interface WorkerWorkloadSummary {
  userId: string;
  userName: string;
  department: string;
  jobTitle: string;
  regularHours: number;
  overtimeHours: number;
  nightShiftCount: number;
  weekendShiftCount: number;
  totalHours: number;
}

export interface WorkloadDistributionAnalysis {
  department: string;
  totalWorkers: number;
  totalOvertimeHours: number;
  giniCoefficient: number;
  top20PercentShare: number; // percentage of OT held by top 20% workers
  isConcentrationFlagged: boolean;
  workerSummaries: WorkerWorkloadSummary[];
  insights: string[];
  alternativeExplanations: string[];
}

/**
 * Calculates Gini coefficient for a set of values (e.g. overtime hours)
 * 0.0 = completely equal distribution
 * 1.0 = completely concentrated in a single individual
 */
export function calculateGiniCoefficient(values: number[]): number {
  if (values.length <= 1) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;

  let cumulativeSum = 0;
  for (let i = 0; i < n; i++) {
    cumulativeSum += (2 * (i + 1) - n - 1) * sorted[i];
  }

  const gini = cumulativeSum / (n * sum);
  return Math.round((Math.max(0, gini) + Number.EPSILON) * 100) / 100;
}

/**
 * Analyzes workload distribution across a team/department to detect hidden burden
 */
export function analyzeWorkloadBurden(
  department: string,
  workers: WorkerWorkloadSummary[]
): WorkloadDistributionAnalysis {
  if (workers.length === 0) {
    return {
      department,
      totalWorkers: 0,
      totalOvertimeHours: 0,
      giniCoefficient: 0,
      top20PercentShare: 0,
      isConcentrationFlagged: false,
      workerSummaries: [],
      insights: ['No worker records found for this department.'],
      alternativeExplanations: []
    };
  }

  const sortedByOt = [...workers].sort((a, b) => b.overtimeHours - a.overtimeHours);
  const totalOt = workers.reduce((sum, w) => sum + w.overtimeHours, 0);

  // Gini coefficient
  const gini = calculateGiniCoefficient(workers.map(w => w.overtimeHours));

  // Top 20% share calculation
  const top20Count = Math.max(1, Math.ceil(workers.length * 0.2));
  const top20OtSum = sortedByOt.slice(0, top20Count).reduce((sum, w) => sum + w.overtimeHours, 0);
  const top20Share = totalOt > 0 ? Math.round((top20OtSum / totalOt) * 100) : 0;

  const isConcentrationFlagged = (top20Share >= 50 || gini >= 0.5) && totalOt >= 10;

  const insights: string[] = [];
  const alternativeExplanations: string[] = [
    'Worker voluntary availability preferences or requested overtime hours.',
    'Specialized machinery or safety certifications only held by specific workers.',
    'Shift proximity or transport accessibility for emergency call-outs.'
  ];

  if (isConcentrationFlagged) {
    const topWorkerNames = sortedByOt.slice(0, top20Count).map(w => w.userName).join(', ');
    insights.push(
      `Overtime Concentration Detected: Top ${top20Count} worker(s) (${topWorkerNames}) account for ${top20Share}% of all overtime in ${department}.`
    );
    insights.push(
      `Gini coefficient is ${gini.toFixed(2)}, indicating severe workload disparity and fatigue risk.`
    );
  } else {
    insights.push(`Workload and overtime distribution in ${department} is reasonably balanced (Gini index: ${gini.toFixed(2)}).`);
  }

  return {
    department,
    totalWorkers: workers.length,
    totalOvertimeHours: totalOt,
    giniCoefficient: gini,
    top20PercentShare: top20Share,
    isConcentrationFlagged,
    workerSummaries: sortedByOt,
    insights,
    alternativeExplanations
  };
}
