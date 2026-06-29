/**
 * timeline-position-utils.ts
 *
 * Port of HotSeatersMVP/src/components/schedule/timelinePositionUtils.jsx.
 *
 * Pure geometry utilities — no I/O, no React.
 * Used by timeline-page.tsx and timeline-bars.tsx.
 */

import {
  differenceInDays,
  startOfWeek,
  endOfWeek,
  addDays,
  parseISO,
} from 'date-fns';
import type { TimelineGeometry } from './timeline-header';
import type { TimeScale } from './timeline-toolbar';

// ─── getTimelineData ──────────────────────────────────────────────────────────

/**
 * Compute the visible timeline window and unit count from a set of services.
 * Matches HotSeatersMVP logic exactly.
 */
export function getTimelineData(
  services: Array<{
    start_date?: string | null | undefined;
    end_date?: string | null | undefined;
    trial?: {
      start_date?: string | null | undefined;
      end_date?: string | null | undefined;
      completion_type?: string | null | undefined;
      continued_date_precision?: string | null | undefined;
    } | null;
  }>,
  timeScale: TimeScale,
): TimelineGeometry {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (services.length === 0) {
    return { start: today, end: addDays(today, 30), units: 4, totalDays: 30, daysPerUnit: 7 };
  }

  const isNoKnownDate = (trial: { completion_type?: string | null | undefined; continued_date_precision?: string | null | undefined } | null | undefined) =>
    trial?.completion_type === 'case_continued' && trial?.continued_date_precision === 'none';

  const allDates: Date[] = services.flatMap((s) => {
    const dates: Date[] = [];
    if (s.start_date) dates.push(parseISO(s.start_date));
    else if (s.trial?.start_date) dates.push(parseISO(s.trial.start_date));

    if (s.end_date) dates.push(parseISO(s.end_date));
    else if (s.trial?.end_date && !isNoKnownDate(s.trial)) dates.push(parseISO(s.trial.end_date));
    else if (s.start_date) dates.push(parseISO(s.start_date));
    else if (s.trial?.start_date) dates.push(parseISO(s.trial.start_date));

    if (s.trial?.start_date) dates.push(parseISO(s.trial.start_date));
    if (s.trial?.end_date && !isNoKnownDate(s.trial)) dates.push(parseISO(s.trial.end_date));
    return dates;
  });

  const allDatesWithToday = [...allDates, today];
  const minDate = new Date(Math.min(...allDatesWithToday.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDatesWithToday.map((d) => d.getTime())));

  let timelineStart: Date;
  let timelineEnd: Date;
  let units: number;
  let daysPerUnit: number;

  switch (timeScale) {
    case 'day':
      timelineStart = minDate;
      timelineEnd = maxDate;
      daysPerUnit = 1;
      units = differenceInDays(timelineEnd, timelineStart) + 1;
      break;
    case 'week':
      timelineStart = startOfWeek(minDate, { weekStartsOn: 0 });
      timelineEnd = endOfWeek(maxDate, { weekStartsOn: 0 });
      daysPerUnit = 7;
      units = Math.ceil((differenceInDays(timelineEnd, timelineStart) + 1) / 7);
      break;
    case 'month':
      timelineStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      timelineEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
      daysPerUnit = 30;
      units = Math.ceil(differenceInDays(timelineEnd, timelineStart) / 30) + 1;
      break;
    case 'quarter':
      timelineStart = new Date(minDate.getFullYear(), Math.floor(minDate.getMonth() / 3) * 3, 1);
      timelineEnd = new Date(maxDate.getFullYear(), Math.floor(maxDate.getMonth() / 3) * 3 + 3, 0);
      daysPerUnit = 91;
      units = Math.ceil(differenceInDays(timelineEnd, timelineStart) / 91) + 1;
      break;
    case 'year':
      timelineStart = new Date(minDate.getFullYear(), 0, 1);
      timelineEnd = new Date(maxDate.getFullYear(), 11, 31);
      daysPerUnit = 365;
      units = maxDate.getFullYear() - minDate.getFullYear() + 1;
      break;
    default:
      timelineStart = startOfWeek(minDate, { weekStartsOn: 0 });
      timelineEnd = endOfWeek(maxDate, { weekStartsOn: 0 });
      daysPerUnit = 7;
      units = Math.ceil((differenceInDays(timelineEnd, timelineStart) + 1) / 7);
  }

  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
  return { start: timelineStart, end: timelineEnd, units, totalDays, daysPerUnit };
}

// ─── unitWidth computation (matches bible) ────────────────────────────────────

export function computeUnitWidth(zoomLevel: number, daysPerUnit: number): number {
  return 9.8 * Math.pow(100, zoomLevel * 0.858) * (daysPerUnit / 7);
}

// ─── fitZoom ──────────────────────────────────────────────────────────────────

export function computeFitZoom(
  containerWidth: number,
  units: number,
  daysPerUnit: number,
): number {
  const available = containerWidth - 24;
  return (
    Math.log(available / (units * 9.8 * (daysPerUnit / 7))) /
    (Math.log(100) * 0.858)
  );
}
