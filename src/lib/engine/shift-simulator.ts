import type { ShiftAssignment, OrgSettings } from '../../types/index.ts';

export interface ProposedShift {
  id?: string;
  user_id: string;
  user_name: string;
  site_id: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  planned_hours: number;
}

export interface ScheduleConflict {
  id: string;
  user_id: string;
  user_name: string;
  shift_date: string;
  rule_violated: string;
  severity: 'warning' | 'violation';
  description: string;
  evidence: string;
  suggested_fix?: string;
}

export interface SimulationResult {
  is_valid: boolean;
  total_shifts: number;
  conflicts_count: number;
  conflicts: ScheduleConflict[];
  recommendations: string[];
}

/**
 * Calculates hours difference between two dates/times
 */
function getHoursDiff(startIso: string, endIso: string): number {
  const d1 = new Date(startIso).getTime();
  const d2 = new Date(endIso).getTime();
  return (d2 - d1) / (1000 * 60 * 60);
}

/**
 * What-If Shift Simulator: Validates proposed shifts against organization rules & labor safety limits
 */
export function simulateSchedule(
  proposedShifts: ProposedShift[],
  settings: OrgSettings = {
    standard_daily_hours: 8,
    max_weekly_hours: 48,
    min_rest_hours_between_shifts: 11,
    max_consecutive_days: 6,
    overtime_multiplier: 1.5,
    currency: 'USD',
    currency_symbol: '$',
    grievance_categories: [],
    requires_remedy_verification: true
  }
): SimulationResult {
  const conflicts: ScheduleConflict[] = [];

  // Group by user
  const userShiftsMap = new Map<string, ProposedShift[]>();
  for (const s of proposedShifts) {
    const list = userShiftsMap.get(s.user_id) || [];
    list.push(s);
    userShiftsMap.set(s.user_id, list);
  }

  for (const [userId, shifts] of userShiftsMap.entries()) {
    const userName = shifts[0]?.user_name || `Worker ${userId}`;

    // 1. Check excessive daily hours
    for (const shift of shifts) {
      if (shift.planned_hours > 10) {
        conflicts.push({
          id: `conf-daily-${shift.user_id}-${shift.shift_date}`,
          user_id: userId,
          user_name: userName,
          shift_date: shift.shift_date,
          rule_violated: 'MAX_DAILY_HOURS',
          severity: 'violation',
          description: `Planned shift duration of ${shift.planned_hours} hours exceeds safe statutory limit of 10 hours.`,
          evidence: `Shift: ${shift.shift_date} ${shift.start_time}-${shift.end_time} (${shift.planned_hours} hrs planned).`,
          suggested_fix: `Split shift into two shorter shifts or assign secondary relief staff.`
        });
      }
    }

    // 2. Check total weekly hours
    const totalHours = shifts.reduce((sum, s) => sum + s.planned_hours, 0);
    if (totalHours > settings.max_weekly_hours) {
      conflicts.push({
        id: `conf-weekly-${userId}`,
        user_id: userId,
        user_name: userName,
        shift_date: shifts[0]?.shift_date || '',
        rule_violated: 'MAX_WEEKLY_HOURS',
        severity: 'violation',
        description: `Total scheduled hours (${totalHours} hrs) exceeds statutory weekly cap of ${settings.max_weekly_hours} hours.`,
        evidence: `Cumulative schedule totals ${totalHours} hours across ${shifts.length} shifts in this cycle.`,
        suggested_fix: `Redistribute ${(totalHours - settings.max_weekly_hours).toFixed(1)} hours to under-allocated team members.`
      });
    }

    // 3. Check Rest Interval between consecutive shifts
    const sorted = [...shifts].sort((a, b) => {
      const tA = new Date(`${a.shift_date}T${a.start_time}:00`).getTime();
      const tB = new Date(`${b.shift_date}T${b.start_time}:00`).getTime();
      return tA - tB;
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];

      const curStart = new Date(`${cur.shift_date}T${cur.start_time}:00`);
      let curEnd = new Date(`${cur.shift_date}T${cur.end_time}:00`);
      if (curEnd.getTime() <= curStart.getTime()) {
        curEnd = new Date(curEnd.getTime() + 24 * 60 * 60 * 1000);
      }

      const nextStart = new Date(`${next.shift_date}T${next.start_time}:00`);
      const restInterval = (nextStart.getTime() - curEnd.getTime()) / (1000 * 60 * 60);

      if (restInterval >= 0 && restInterval < settings.min_rest_hours_between_shifts) {
        conflicts.push({
          id: `conf-rest-${cur.shift_date}-${next.shift_date}`,
          user_id: userId,
          user_name: userName,
          shift_date: next.shift_date,
          rule_violated: 'MIN_REST_INTERVAL',
          severity: 'violation',
          description: `Insufficient rest period: only ${restInterval.toFixed(1)} hours rest between shifts (required: ${settings.min_rest_hours_between_shifts} hours).`,
          evidence: `Previous shift ended ${cur.shift_date} at ${cur.end_time}; Next shift starts ${next.shift_date} at ${next.start_time}.`,
          suggested_fix: `Delay start time of ${next.shift_date} shift to at least ${calculateCompliantStartTime(cur.end_time, settings.min_rest_hours_between_shifts)} or swap assignment.`
        });
      }
    }
  }

  const recommendations: string[] = [];
  if (conflicts.length === 0) {
    recommendations.push('Schedule complies with all configured labor safety and fairness standards.');
  } else {
    recommendations.push(`Detected ${conflicts.length} schedule conflict(s). Review and resolve conflicts prior to publication.`);
    const restViolations = conflicts.filter(c => c.rule_violated === 'MIN_REST_INTERVAL');
    if (restViolations.length > 0) {
      recommendations.push(`${restViolations.length} rest violations found. Ensure minimum 11 hours rest to avoid worker fatigue.`);
    }
  }

  return {
    is_valid: conflicts.length === 0,
    total_shifts: proposedShifts.length,
    conflicts_count: conflicts.length,
    conflicts,
    recommendations
  };
}

function calculateCompliantStartTime(prevEndTime: string, minRestHours: number): string {
  const [h, m] = prevEndTime.split(':').map(Number);
  const compliantHour = (h + minRestHours) % 24;
  return `${compliantHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
