import * as XLSX from 'xlsx';
import { Beneficiary, Nikhom, MonthlyProgressReport } from '../types';

export const exportBeneficiariesToExcel = (
  beneficiaries: Beneficiary[],
  nikhoms: Nikhom[],
  filename = 'รายงานผู้ใช้บริการ_บ้านน้อยในนิคม.xlsx'
) => {
  const nikhomMap = new Map(nikhoms.map((n) => [n.id, `${n.name} (${n.province})`]));

  // Sheet 1: Beneficiary Roster
  const rosterData = beneficiaries.map((b, index) => {
    const latestScore = b.latestIRP ? b.latestIRP.totalScore : '-';
    const latestPercent = b.latestIRP ? `${b.latestIRP.scorePercentage.toFixed(1)}%` : '-';
    const isAlert = b.latestIRP?.isUnder50Percent ? '⚠️ ต่ำกว่า 50% (วิกฤต)' : 'ปกติ';

    const activitiesList: string[] = [];
    if (b.activities.agriculture) activitiesList.push('เกษตร');
    if (b.activities.livestock) activitiesList.push('ปศุสัตว์');
    if (b.activities.handicraft) activitiesList.push('หัตถกรรม');
    if (b.activities.service) activitiesList.push('งานบริการ');
    if (b.activities.wageLabor) activitiesList.push('รับจ้าง');
    if (b.activities.other) activitiesList.push('อื่นๆ');

    return {
      'ลำดับ': index + 1,
      'รหัสประจำตัวกลาง (Unique ID)': b.uniquePersonId,
      'ทะเบียนประวัติ': b.code,
      'ชื่อ-สกุล': b.fullName,
      'เพศ': b.gender === 'male' ? 'ชาย' : 'หญิง',
      'ปีเกิด (พ.ศ.)': b.tp1Profile?.birthYearBuddhist || '-',
      'อายุ (ปี)': b.age,
      'เลขบัตรประชาชน': b.nationalId,
      'หน่วยงานนำส่ง': b.referringAgency || '-',
      'นิคมที่พำนัก': nikhomMap.get(b.nikhomId) || b.nikhomId,
      'อาคาร/เรือนพัก': b.building,
      'สถานะการพำนัก': b.status === 'resident' ? 'อยู่จริง' : b.status === 'discharged' ? 'จำหน่ายแล้ว' : 'เตรียมความพร้อม',
      'กลุ่มเป้าหมาย': b.category === 'disabled' ? 'ผู้พิการ' : 'คนไร้ที่พึ่ง',
      'พิการซ้ำซ้อน': b.hasMultipleDisabilities ? 'ใช่' : 'ไม่ใช่',
      'โรคประจำตัว': b.chronicDiseases || '-',
      'คะแนน IRP ล่าสุด': latestScore,
      'เปอร์เซ็นต์ IRP': latestPercent,
      'การแจ้งเตือน IRP': isAlert,
      'กิจกรรมที่ทำ': activitiesList.join(', ') || '-',
      'รายได้ต่อเดือนรวม (บาท)': b.monthlyIncome,
      'ที่มาของรายได้': b.incomeSource || '-',
      'รูปแบบการจ้างงาน': b.careerPreparation.type === 'section35' ? 'ม.35' : b.careerPreparation.type === 'section33' ? 'ม.33' : b.careerPreparation.type === 'section25' ? 'ม.25' : b.careerPreparation.type === 'roundtrip_workplace' ? 'จ้างแบบไป-กลับ' : b.careerPreparation.type === 'homework' ? 'จ้างแบบรับงานมาทำ' : b.careerPreparation.type === 'trial_workplace' ? 'ทดลองอยู่สถานประกอบการ' : 'อาชีวบำบัด/ทั่วไป',
      'วันที่แรกรับ': b.admissionDate,
    };
  });

  // Sheet 2: Nikhoms Summary
  const nikhomData = nikhoms.map((nk, idx) => ({
    'ลำดับ': idx + 1,
    'ชื่อนิคม': nk.name,
    'จังหวัด': nk.province,
    'อัตราการรองรับ (คน)': nk.capacity,
    'อยู่จริง (คน)': nk.currentResidents,
    'ว่าง (คน)': nk.vacancies,
    'สถานะ': nk.isFull ? 'เต็ม' : `ว่าง ${nk.vacancies} คน`,
  }));

  const workbook = XLSX.utils.book_new();

  const sheet1 = XLSX.utils.json_to_sheet(rosterData);
  const sheet2 = XLSX.utils.json_to_sheet(nikhomData);

  XLSX.utils.book_append_sheet(workbook, sheet1, 'รายชื่อผู้ใช้บริการ_IRP');
  XLSX.utils.book_append_sheet(workbook, sheet2, 'สรุปภาพรวมรายนิคม');

  XLSX.writeFile(workbook, filename);
};

export const exportMonthlyReportToExcel = (
  report: MonthlyProgressReport,
  nikhoms: Nikhom[],
  filename = `สรุปผลการดำเนินงาน_บ้านน้อยในนิคม_${report.monthTh}_${report.yearTh}.xlsx`
) => {
  const summaryMetrics = [
    { 'ตัวชี้วัด': 'เดือนที่รายงาน', 'จำนวน/รายละเอียด': `${report.monthTh} ${report.yearTh}` },
    { 'ตัวชี้วัด': 'อัตราการรองรับทั้งหมด (คน)', 'จำนวน/รายละเอียด': report.totalCapacity },
    { 'ตัวชี้วัด': 'ผู้เข้าอยู่จริง (คน)', 'จำนวน/รายละเอียด': report.totalResidents },
    { 'ตัวชี้วัด': 'เพศชาย (คน)', 'จำนวน/รายละเอียด': report.maleCount },
    { 'ตัวชี้วัด': 'เพศหญิง (คน)', 'จำนวน/รายละเอียด': report.femaleCount },
    { 'ตัวชี้วัด': 'สามารถรับได้อีก (คน)', 'จำนวน/รายละเอียด': report.vacanciesCount },
    { 'ตัวชี้วัด': 'ผู้พิการ (คน)', 'จำนวน/รายละเอียด': report.disabledCount },
    { 'ตัวชี้วัด': 'คนไร้ที่พึ่ง (คน)', 'จำนวน/รายละเอียด': report.destituteCount },
    { 'ตัวชี้วัด': 'ผู้พิการซ้ำซ้อน (คน)', 'จำนวน/รายละเอียด': report.multipleDisabledCount },
    { 'ตัวชี้วัด': 'กิจกรรมเกษตรกรรม (ราย)', 'จำนวน/รายละเอียด': report.activitiesCount.agriculture },
    { 'ตัวชี้วัด': 'กิจกรรมปศุสัตว์ (ราย)', 'จำนวน/รายละเอียด': report.activitiesCount.livestock },
    { 'ตัวชี้วัด': 'กิจกรรมหัตถกรรม (ราย)', 'จำนวน/รายละเอียด': report.activitiesCount.handicraft },
    { 'ตัวชี้วัด': 'กิจกรรมงานบริการ (ราย)', 'จำนวน/รายละเอียด': report.activitiesCount.service },
    { 'ตัวชี้วัด': 'กิจกรรมรับจ้าง (ราย)', 'จำนวน/รายละเอียด': report.activitiesCount.wageLabor },
    { 'ตัวชี้วัด': 'กิจกรรมอื่นๆ (ราย)', 'จำนวน/รายละเอียด': report.activitiesCount.other },
    { 'ตัวชี้วัด': 'ผู้ใช้บริการที่มีรายได้ (คน)', 'จำนวน/รายละเอียด': report.earningBeneficiariesCount },
    { 'ตัวชี้วัด': 'รายได้รวมต่อเดือน (บาท)', 'จำนวน/รายละเอียด': report.totalIncomeBaht },
    { 'ตัวชี้วัด': 'การเตรียมพร้อมด้านอาชีพ รวม (คน)', 'จำนวน/รายละเอียด': report.careerPrepCounts.total },
    { 'ตัวชี้วัด': 'ม. 35 (คน)', 'จำนวน/รายละเอียด': report.careerPrepCounts.section35 },
    { 'ตัวชี้วัด': 'ไป-กลับสถานประกอบการ (คน)', 'จำนวน/รายละเอียด': report.careerPrepCounts.roundtrip },
    { 'ตัวชี้วัด': 'ทดลองอยู่สถานประกอบการ (คน)', 'จำนวน/รายละเอียด': report.careerPrepCounts.trial },
    { 'ตัวชี้วัด': 'การจำหน่าย (คน)', 'จำนวน/รายละเอียด': report.dischargeCounts.total },
    { 'ตัวชี้วัด': 'IRP ต่ำกว่า 50% (กลุ่มวิกฤตที่ต้องดูแลเร่งด่วน)', 'จำนวน/รายละเอียด': report.irpStats.under50Count },
  ];

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summaryMetrics);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'ภาพรวมรายเดือน');

  XLSX.writeFile(workbook, filename);
};
