import { Beneficiary } from '../types';

export interface IRP6MonthStatus {
  beneficiaryId: string;
  beneficiaryName: string;
  uniquePersonId: string;
  nikhomId: string;
  lastDate: string;
  lastDateTh: string;
  lastType: 'irp' | 'admission';
  elapsedDays: number;
  daysRemaining: number;
  isOverdue: boolean; // >= 180 days
  isApproaching: boolean; // >= 150 days and < 180 days (within 30 days)
  status: 'overdue' | 'approaching' | 'normal';
  statusLabel: string;
  round: number;
}

/**
 * Convert YYYY-MM-DD or ISO date string to Thai formatted date string
 */
export function formatThaiDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const thaiYear = y < 2500 ? y + 543 : y;
      return `${d} ${thaiMonths[m - 1]} ${thaiYear}`;
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates 6-month cycle evaluation status for a beneficiary.
 * Standard requirement: Staff must assess IRP for each individual at least once every 6 months (~180 days).
 */
export function getIRP6MonthStatus(b: Beneficiary): IRP6MonthStatus {
  // Determine reference date: latest IRP evaluationDate, or admissionDate as baseline
  let lastDate = b.admissionDate || '2026-05-01';
  let lastType: 'irp' | 'admission' = 'admission';
  let round = 1;

  if (b.latestIRP && b.latestIRP.evaluationDate) {
    lastDate = b.latestIRP.evaluationDate;
    lastType = 'irp';
    round = (b.latestIRP.round || 1) + 1;
  } else if (b.irpHistory && b.irpHistory.length > 0) {
    const sorted = [...b.irpHistory].sort((x, y) => new Date(y.evaluationDate).getTime() - new Date(x.evaluationDate).getTime());
    lastDate = sorted[0].evaluationDate;
    lastType = 'irp';
    round = (sorted[0].round || 1) + 1;
  }

  // Calculate elapsed days
  const now = new Date();
  const refTime = new Date(lastDate).getTime();
  const diffTime = Math.max(0, now.getTime() - refTime);
  const elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = 180 - elapsedDays;

  const isOverdue = elapsedDays >= 180;
  // ปรับการแจ้งเตือนล่วงหน้า 7 วัน ก่อนครบกำหนด 6 เดือน (180 วัน)
  const isApproaching = daysRemaining <= 7 && daysRemaining >= 0;

  let status: 'overdue' | 'approaching' | 'normal' = 'normal';
  let statusLabel = '';

  if (isOverdue) {
    status = 'overdue';
    const overdueDays = elapsedDays - 180;
    statusLabel = overdueDays === 0 ? 'ครบกำหนด 6 เดือนพอดีวันนี้' : `เกินกำหนด ${overdueDays} วัน (ครบ 6 เดือนแล้ว)`;
  } else if (isApproaching) {
    status = 'approaching';
    statusLabel = daysRemaining === 0 
      ? 'ครบกำหนด 6 เดือนพอดีวันนี้' 
      : `ใกล้ครบกำหนด 6 เดือน (เหลืออีก ${daysRemaining} วัน - แจ้งเตือนล่วงหน้า 7 วัน)`;
  } else {
    status = 'normal';
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    statusLabel = `ตามเกณฑ์ปกติ (เหลืออีก ${daysRemaining} วัน / ~${monthsRemaining} เดือน)`;
  }

  return {
    beneficiaryId: b.id,
    beneficiaryName: b.fullName,
    uniquePersonId: b.uniquePersonId,
    nikhomId: b.nikhomId,
    lastDate,
    lastDateTh: formatThaiDate(lastDate),
    lastType,
    elapsedDays,
    daysRemaining,
    isOverdue,
    isApproaching,
    status,
    statusLabel,
    round,
  };
}
