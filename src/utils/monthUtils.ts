import { Beneficiary, MonthlySnapshotData, DisabilityType } from '../types';
import { MONTHLY_SNAPSHOTS_DATA } from '../data/mockData';

export const THAI_FULL_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_SHORT_MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export interface MonthOption {
  monthKey: string; // e.g. '2026-11'
  labelTh: string; // e.g. 'พฤศจิกายน 2569'
  displayLabel: string; // e.g. 'พฤศจิกายน 2569 (ล่าสุด)'
  isLatest: boolean;
  yearCe: number;
  yearBe: number;
  monthIndex: number; // 0-11
}

/**
 * Automatically generates month options from current calendar date backwards.
 * When a new month arrives (e.g., December, January, etc.), it will automatically
 * become the latest month without needing code updates!
 */
export function getDynamicMonthOptions(monthsBack: number = 6): MonthOption[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  const options: MonthOption[] = [];

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const yCe = d.getFullYear();
    const mIdx = d.getMonth();
    const mStr = String(mIdx + 1).padStart(2, '0');
    const monthKey = `${yCe}-${mStr}`;
    const yearBe = yCe + 543;
    const monthName = THAI_FULL_MONTHS[mIdx];
    const isLatest = i === 0;

    options.push({
      monthKey,
      labelTh: `${monthName} ${yearBe}`,
      displayLabel: isLatest ? `${monthName} ${yearBe} (ล่าสุด)` : `${monthName} ${yearBe}`,
      isLatest,
      yearCe: yCe,
      yearBe,
      monthIndex: mIdx,
    });
  }

  return options;
}

/**
 * Returns formatted Thai date for "ข้อมูล ณ วันที่..."
 */
export function getFormattedCurrentDateTh(): string {
  const now = new Date();
  const day = now.getDate();
  const monthShort = THAI_SHORT_MONTHS[now.getMonth()];
  const yearBe = now.getFullYear() + 543;
  return `${day} ${monthShort} ${yearBe}`;
}

/**
 * Resolves snapshot data for any month. If predefined snapshot exists in mockData,
 * it uses it as high-fidelity baseline. If a new month arrives that has no predefined snapshot,
 * it builds a dynamic snapshot so the system never breaks.
 */
export function resolveMonthlySnapshot(
  monthKey: string,
  beneficiaries: Beneficiary[]
): MonthlySnapshotData {
  if (MONTHLY_SNAPSHOTS_DATA[monthKey]) {
    return MONTHLY_SNAPSHOTS_DATA[monthKey];
  }

  // Fallback to most recent known snapshot as structural baseline
  const fallback =
    MONTHLY_SNAPSHOTS_DATA['2026-11'] ||
    MONTHLY_SNAPSHOTS_DATA['2026-10'] ||
    Object.values(MONTHLY_SNAPSHOTS_DATA)[0];

  const [yStr, mStr] = monthKey.split('-');
  const y = parseInt(yStr, 10) || new Date().getFullYear();
  const m = parseInt(mStr, 10) || new Date().getMonth() + 1;
  const monthName = THAI_FULL_MONTHS[m - 1] || 'พฤศจิกายน';
  const yearBe = y + 543;

  // Compute live counts from current active beneficiaries
  const activeResidents = beneficiaries.filter((b) => b.status !== 'discharged');
  const dischargedResidents = beneficiaries.filter((b) => b.status === 'discharged');

  const maleCount = activeResidents.filter((b) => b.gender === 'male').length;
  const femaleCount = activeResidents.filter((b) => b.gender === 'female').length;

  return {
    ...fallback,
    monthKey,
    monthLabelTh: `${monthName} ${yearBe}`,
    dataAsOfDateTh: getFormattedCurrentDateTh(),
    newAdmissionsCount: 0,
    dischargesCount: 0,
    totalCapacity: 247,
    totalResidents: activeResidents.length || fallback.totalResidents,
    maleCount: maleCount || fallback.maleCount,
    femaleCount: femaleCount || fallback.femaleCount,
    vacanciesCount: Math.max(0, 247 - (activeResidents.length || fallback.totalResidents)),
    cumulativeDischargesTotal: (fallback.cumulativeDischargesTotal || 18) + dischargedResidents.length,
    cumulativeAdmissionsTotal: (fallback.cumulativeAdmissionsTotal || 231) + activeResidents.length,
  };
}
