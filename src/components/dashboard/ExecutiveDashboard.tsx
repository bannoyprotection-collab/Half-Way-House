import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, Download, Printer, AlertTriangle, 
  Calendar, ChevronRight, Sprout, Egg, Scissors, Wrench, 
  Briefcase, HeartHandshake, HeartPulse, Banknote, UserPlus, 
  UserMinus, Lock, Building2, Award, Home, CheckCircle2, Layers, BarChart2
} from 'lucide-react';
import { Beneficiary, Nikhom, MonthlyProgressReport, UserAccount } from '../../types';
import { MONTHLY_SNAPSHOTS_DATA } from '../../data/mockData';
import { exportMonthlyReportToExcel } from '../../services/exportService';
import { getDynamicMonthOptions, resolveMonthlySnapshot } from '../../utils/monthUtils';
import { ThailandNikhomMap } from './ThailandNikhomMap';
import { IRP6MonthMonitoringWidget } from './IRP6MonthMonitoringWidget';
import { AdmissionDischargeCards } from './AdmissionDischargeCards';
import { AgeDemographicsChart } from './AgeDemographicsChart';
import { ActivitiesAndEmploymentBreakdown } from './ActivitiesAndEmploymentBreakdown';

interface ExecutiveDashboardProps {
  beneficiaries: Beneficiary[];
  nikhoms: Nikhom[];
  monthlyReport: MonthlyProgressReport;
  currentUser: UserAccount;
  canAccessBeneficiary: (targetNikhomId: string) => boolean;
  onSelectBeneficiary: (beneficiaryId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenIRPModal?: (beneficiary: Beneficiary) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  beneficiaries,
  nikhoms,
  monthlyReport,
  currentUser,
  canAccessBeneficiary,
  onSelectBeneficiary,
  onNavigateToTab,
  onOpenIRPModal,
}) => {
  const monthOptions = useMemo(() => getDynamicMonthOptions(6), []);
  const latestMonthKey = monthOptions[0]?.monthKey || '2026-11';
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(latestMonthKey);
  const [dataViewMode, setDataViewMode] = useState<'cumulative' | 'month_only'>('cumulative');
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  const snapshot = useMemo(
    () => resolveMonthlySnapshot(selectedMonthKey, beneficiaries),
    [selectedMonthKey, beneficiaries]
  );

  // Live adjustments if user adds new beneficiaries in current month
  const liveActiveCount = beneficiaries.filter((b) => b.status !== 'discharged').length;
  const extraAdded = Math.max(0, liveActiveCount - 5); // 5 initial active residents in mock
  const displayTotalResidents = snapshot.totalResidents + (selectedMonthKey === latestMonthKey ? extraAdded : 0);
  const displayVacancies = Math.max(0, snapshot.totalCapacity - displayTotalResidents);
  const displayNewAdmissions = snapshot.newAdmissionsCount + (selectedMonthKey === latestMonthKey ? extraAdded : 0);

  // Month-only fallback data
  const monthOnly = snapshot.monthOnlyBreakdown || {
    admissionsDisabled: 3,
    admissionsDestitute: 1,
    admissionsMultipleDisabled: 1,
    admissionsDisabilityBreakdown: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 1, 6: 0 },
    dischargesBreakdown: snapshot.dischargeBreakdown,
  };

  const cumulativeDischargesTotal = snapshot.cumulativeDischargesTotal || 18;
  const cumulativeAdmissionsTotal = snapshot.cumulativeAdmissionsTotal || 231;

  // Critical IRP < 50%
  const criticalIRPList = beneficiaries.filter(
    (b) => b.latestIRP && b.latestIRP.isUnder50Percent && b.status !== 'discharged'
  );

  const nikhomMap = new Map(nikhoms.map((n) => [n.id, `${n.shortName} จ.${n.province}`]));

  const handleBeneficiaryClick = (b: Beneficiary) => {
    if (!canAccessBeneficiary(b.nikhomId)) {
      setPermissionNotice(
        `สิทธิ์ของคุณ (${currentUser.name}) สามารถดูภาพรวม Dashboard ทุกหน่วยได้ แต่ไม่สามารถเปิดดูหรือแก้ไขแฟ้มประวัติผู้ใช้บริการของ "${nikhomMap.get(b.nikhomId)}" ได้`
      );
      setTimeout(() => setPermissionNotice(null), 5000);
      return;
    }
    onSelectBeneficiary(b.id);
  };

  const handleExportExcel = () => {
    exportMonthlyReportToExcel(monthlyReport, nikhoms);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Permission Toast if unit officer clicks another unit's beneficiary */}
      {permissionNotice && (
        <div className="bg-amber-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{permissionNotice}</span>
          </div>
          <button
            onClick={() => setPermissionNotice(null)}
            className="text-amber-200 hover:text-white font-bold cursor-pointer"
          >
            รับทราบ
          </button>
        </div>
      )}

      {/* Top Executive Header & Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>กรมพัฒนาสังคมและสวัสดิการ · กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ผลการดำเนินงาน &ldquo;โครงการบ้านน้อยในนิคม&rdquo; ประจำเดือน{snapshot.monthLabelTh}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            แสดงข้อมูลสะสมและการเปลี่ยนแปลง ณ วันที่ {snapshot.dataAsOfDateTh} (ครอบคลุมนิคมสร้างตนเอง 17 แห่ง และศูนย์พัฒนาพื้นที่สูง จ.เชียงใหม่)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle: Cumulative vs Month-Only */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDataViewMode('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                dataViewMode === 'cumulative'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>ยอดสะสมโครงการ</span>
            </button>
            <button
              type="button"
              onClick={() => setDataViewMode('month_only')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                dataViewMode === 'month_only'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>เฉพาะเดือนนี้ ({snapshot.monthLabelTh})</span>
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-950">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>เดือน:</span>
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              aria-label="เลือกเดือนที่ต้องการดูข้อมูล"
              className="bg-transparent border-none outline-hidden cursor-pointer font-bold text-amber-900 pr-1"
            >
              {monthOptions.map((opt) => (
                <option key={opt.monthKey} value={opt.monthKey}>
                  {opt.displayLabel}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>พิมพ์ PDF</span>
          </button>
        </div>
      </div>

      {/* Top 4 Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: สถานะเข้าอยู่ & ความจุ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">เข้าอยู่จริง / รองรับได้</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-emerald-700 tabular-nums">
                  {displayTotalResidents}
                </span>
                <span className="text-sm font-bold text-slate-400 tabular-nums">
                  / {snapshot.totalCapacity} คน
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              ชาย <strong className="tabular-nums">{snapshot.maleCount}</strong> · หญิง <strong className="tabular-nums">{snapshot.femaleCount}</strong>
            </span>
            <span className="font-bold text-purple-700 tabular-nums">
              รับเพิ่มได้ {displayVacancies} คน
            </span>
          </div>
        </div>

        {/* Card 2: การรับเข้าและจำหน่าย */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <span>รับเข้า / จำหน่าย</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {dataViewMode === 'cumulative' ? 'สะสมโครงการ' : `เดือน${snapshot.monthLabelTh}`}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-500">รับเข้า</span>
                  <span className="text-2xl font-extrabold text-sky-700 tabular-nums">
                    +{dataViewMode === 'cumulative' ? cumulativeAdmissionsTotal : displayNewAdmissions}
                  </span>
                </div>
                <div className="h-5 w-px bg-slate-200"></div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-500">จำหน่าย</span>
                  <span className="text-2xl font-extrabold text-amber-700 tabular-nums">
                    {dataViewMode === 'cumulative' ? cumulativeDischargesTotal : snapshot.dischargesCount}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            {dataViewMode === 'cumulative' ? (
              <span>คืนครอบครัว 10 · ส่งต่อสถานฯ 6 · อื่นๆ 2</span>
            ) : (
              <span>ส่งต่อสถานฯ {snapshot.dischargeBreakdown.returnInstitute} · คืนครอบครัว {snapshot.dischargeBreakdown.returnFamily}</span>
            )}
            <span className="font-semibold text-slate-500">
              {dataViewMode === 'cumulative' ? 'รวม 18 คน' : `${snapshot.dischargesCount} คน`}
            </span>
          </div>
        </div>

        {/* Card 3: กลุ่มเป้าหมาย & ความพิการ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <span>กลุ่มเป้าหมาย</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {dataViewMode === 'cumulative' ? 'สะสมปัจจุบัน' : `รับเข้าเดือนนี้`}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  พิการ {dataViewMode === 'cumulative' ? snapshot.disabledCount : monthOnly.admissionsDisabled}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  · ไร้ที่พึ่ง {dataViewMode === 'cumulative' ? snapshot.destituteCount : monthOnly.admissionsDestitute}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-semibold">
              พิการซ้ำซ้อน {dataViewMode === 'cumulative' ? snapshot.multipleDisabledCount : monthOnly.admissionsMultipleDisabled} คน
            </span>
            <span className="text-slate-500">ประเมินตามเกณฑ์ พม.</span>
          </div>
        </div>

        {/* Card 4: รูปแบบการจ้างงาน & รายรับ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                รายรับรวมผู้ใช้บริการ ({snapshot.monthLabelTh})
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                  {snapshot.employmentAndIncomeSummary.grandTotalIncomeBaht.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">บาท/เดือน</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              ผู้มีรายได้ <strong className="tabular-nums">{snapshot.employmentAndIncomeSummary.earningBeneficiariesCount}</strong> คน
            </span>
            <span className="text-emerald-700 font-semibold">
              ม.35 ({snapshot.employmentAndIncomeSummary.section35Count}) · ไป-กลับ ({snapshot.employmentAndIncomeSummary.commuteCount})
            </span>
          </div>
        </div>
      </div>

      {/* Critical Automated IRP Alert Box */}
      {criticalIRPList.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-rose-950">
                    ระบบแจ้งเตือนอัตโนมัติ: ผู้ใช้บริการที่มีคะแนน IRP น้อยกว่า 50% ({criticalIRPList.length} ราย)
                  </h3>
                </div>
                <p className="text-xs text-rose-800 mt-0.5">
                  ระบบตรวจพบผู้ใช้บริการที่ต้องปรับปรุงแผนฟื้นฟูสมรรถภาพเร่งด่วน (เจ้าหน้าที่ประจำหน่วยสามารถเปิดแฟ้มเฉพาะหน่วยของตนเองได้)
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('beneficiaries')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span>ดูทะเบียนผู้ใช้บริการ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-rose-100">
            {criticalIRPList.map((crit) => {
              const allowed = canAccessBeneficiary(crit.nikhomId);
              return (
                <div
                  key={crit.id}
                  onClick={() => handleBeneficiaryClick(crit)}
                  className="bg-white/95 hover:bg-white p-3 rounded-xl border border-rose-200/80 hover:border-rose-300 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors flex items-center gap-1.5">
                      <span>{crit.fullName}</span>
                      <span className="font-mono text-[10px] text-slate-500">({crit.uniquePersonId})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {nikhomMap.get(crit.nikhomId)} · IRP:{' '}
                      <span className="font-bold text-rose-600 tabular-nums">
                        {crit.latestIRP?.scorePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    {!allowed && <Lock className="w-3 h-3 text-slate-400" />}
                    <span>{allowed ? 'เปิดแฟ้ม →' : 'หน่วยอื่น'}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6-Month IRP Monitoring & Evaluation Cycle Alert Card */}
      <IRP6MonthMonitoringWidget
        beneficiaries={beneficiaries}
        nikhoms={nikhoms}
        currentUser={currentUser}
        canAccessBeneficiary={canAccessBeneficiary}
        onOpenIRPModal={(b) => {
          if (onOpenIRPModal) onOpenIRPModal(b);
          else onSelectBeneficiary(b.id);
        }}
        onOpenBeneficiaryDetail={onSelectBeneficiary}
      />

      {/* Interactive Thailand Map of 18 Units */}
      <ThailandNikhomMap
        nikhoms={nikhoms}
        onSelectNikhom={() => {
          // Focuses unit
        }}
      />

      {/* Full 18-Unit Comparison Chart on a Single Screen (No horizontal scroll required) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                กราฟเปรียบเทียบจำนวนผู้เข้าอยู่จริงและอัตราว่างรายหน่วยงาน (แสดงครบทั้ง 18 แห่งในหน้าเดียว)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              นิคมสร้างตนเอง 17 แห่ง และศูนย์พัฒนาพื้นที่สูง จ.เชียงใหม่ (ศพพ.เชียงใหม่)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-amber-400 inline-block shadow-2xs"></span>
              <span className="text-slate-700 font-semibold">อยู่จริง ({displayTotalResidents} คน)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-lime-400 inline-block shadow-2xs"></span>
              <span className="text-slate-700 font-semibold">ว่างรองรับได้ ({displayVacancies} คน)</span>
            </div>
          </div>
        </div>

        {/* Compact Responsive Bar Chart Container (Fits on one screen, all bases aligned on the exact same horizontal line) */}
        <div className="w-full pt-4 pb-3 px-2 sm:px-4 select-none">
          {/* Plot Area + Baseline */}
          <div className="relative w-full pl-10 sm:pl-14 pr-1">
            {/* Horizontal Reference Grid Lines (20, 15, 10, 5, 0) aligned with the 160px max bar height */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[160px] flex flex-col justify-between z-0 pl-2 sm:pl-4 pr-1">
              {[20, 15, 10, 5, 0].map((val) => (
                <div key={val} className="w-full flex items-center">
                  <span className="w-7 sm:w-9 pr-2 text-right text-[10px] font-semibold text-slate-400 tabular-nums leading-none">
                    {val}
                  </span>
                  <div
                    className={`flex-1 ${
                      val === 0
                        ? 'border-b-2 border-slate-300'
                        : 'border-b border-dashed border-slate-200/90'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* 18 Bar Columns sitting flush on the shared bottom baseline */}
            <div className="relative z-10 w-full h-[212px] flex items-end gap-1 sm:gap-2 px-1">
              {nikhoms.map((nk) => {
                // Max capacity is 20 -> 160px max bar height
                const barHeightPx = Math.max(24, Math.round((Math.min(nk.capacity, 20) / 20) * 160));
                const occupiedRatio = nk.capacity > 0 ? (nk.currentResidents / nk.capacity) * 100 : 0;
                const vacancyRatio = Math.max(0, 100 - occupiedRatio);

                return (
                  <div
                    key={nk.id}
                    className="flex-1 min-w-0 h-full flex flex-col items-center justify-end group cursor-pointer"
                    title={`${nk.name} จ.${nk.province}: อยู่จริง ${nk.currentResidents}/${nk.capacity} คน (ว่าง ${nk.vacancies} คน)`}
                  >
                    {/* Top Badge: Vacancy Status (floats directly above each bar) */}
                    <div className="text-center mb-1.5 leading-tight flex flex-col items-center shrink-0">
                      {nk.vacancies > 0 ? (
                        <span className="text-[9px] sm:text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs tabular-nums whitespace-nowrap">
                          ว่าง {nk.vacancies}
                        </span>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80 whitespace-nowrap">
                          เต็ม
                        </span>
                      )}
                      <span className="text-[8px] sm:text-[9px] text-slate-500 tabular-nums mt-0.5 font-semibold whitespace-nowrap">
                        รองรับ {nk.capacity}
                      </span>
                    </div>

                    {/* Stacked Vertical Bar - Base sits 100% flush on the bottom baseline */}
                    <div
                      style={{ height: `${barHeightPx}px` }}
                      className="w-full max-w-[38px] shrink-0 flex flex-col justify-end rounded-t-md overflow-hidden bg-slate-100 border border-b-0 border-slate-300/90 shadow-2xs transition-all duration-200 group-hover:brightness-95 group-hover:shadow-md"
                    >
                      {/* Vacancy slice (lime/green) */}
                      {nk.vacancies > 0 && (
                        <div
                          style={{ height: `${vacancyRatio}%` }}
                          className="bg-lime-400 w-full transition-all border-b border-lime-500/30"
                        />
                      )}
                      {/* Occupied slice (amber) */}
                      <div
                        style={{ height: `${occupiedRatio}%` }}
                        className="bg-amber-400 w-full flex items-center justify-center text-[10px] sm:text-xs text-amber-950 font-black tabular-nums transition-all"
                      >
                        {nk.currentResidents}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dedicated X-Axis Label Row below the baseline */}
          <div className="w-full pl-10 sm:pl-14 pr-1">
            <div className="w-full h-24 flex items-start gap-1 sm:gap-2 px-1 pt-2">
              {nikhoms.map((nk) => (
                <div
                  key={`${nk.id}-label`}
                  className="flex-1 min-w-0 relative h-full"
                  title={`${nk.name} จ.${nk.province}`}
                >
                  <span
                    className="absolute top-0 right-1/2 translate-x-1 text-[9px] sm:text-[11px] font-semibold text-slate-700 rotate-[-42deg] origin-top-right whitespace-nowrap leading-tight hover:text-amber-700 transition-colors"
                  >
                    {nk.shortName} จ.{nk.province}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section: ข้อมูลการรับเข้าและการจำหน่ายผู้ใช้บริการ (ออกแบบตามแบบฟอร์ม พม. แยกคอลัมน์ เดือนนี้ vs สะสม) */}
      <AdmissionDischargeCards
          beneficiaries={beneficiaries}
          snapshot={snapshot}
          displayNewAdmissions={displayNewAdmissions}
          cumulativeAdmissionsTotal={cumulativeAdmissionsTotal}
          cumulativeDischargesTotal={cumulativeDischargesTotal}
        />

        {/* Section: กราฟแสดงช่วงอายุของผู้ใช้บริการ (จำแนกตามเกณฑ์มาตรฐาน พม.) */}
        <AgeDemographicsChart
          beneficiaries={beneficiaries}
          totalResidentsCount={displayTotalResidents}
        />

        {/* Section: กลุ่มเป้าหมายและจำแนกประเภทความพิการ */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">
                  กลุ่มเป้าหมายผู้ใช้บริการ และจำแนกประเภทความพิการ (รับเข้าเดือนนี้ vs ยอดสะสม)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                สัดส่วนคนพิการ คนไร้ที่พึ่ง และจำแนกประเภทความพิการ 6 ประเภทตามประกาศกระทรวง พม.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-semibold border border-sky-200/80">
                คอลัมน์ซ้าย: เฉพาะเดือน{snapshot.monthLabelTh}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200/80">
                คอลัมน์ขวา: ยอดสะสมโครงการ
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Box 2 (12 cols split in 2 cols): กลุ่มเป้าหมายและประเภทความพิการ */}
            <div className="lg:col-span-12 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      จำแนกกลุ่มเป้าหมายและประเภทความพิการ 6 ประเภท
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    เปรียบเทียบ 2 คอลัมน์
                  </span>
                </div>

                {/* 2-Column Comparison Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  {/* Left Column: รับเข้าเฉพาะเดือนนี้ */}
                  <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-2xs space-y-3">
                    <div className="text-center pb-2 border-b border-sky-100">
                      <span className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wide">
                        รับเข้าเดือน{snapshot.monthLabelTh}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">จำแนกกลุ่มเป้าหมายเคสใหม่</div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">ผู้พิการ</span>
                        <span className="font-black text-sky-900 tabular-nums">{monthOnly.admissionsDisabled} คน</span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">คนไร้ที่พึ่ง</span>
                        <span className="font-black text-amber-900 tabular-nums">{monthOnly.admissionsDestitute} คน</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-between">
                        <span className="text-rose-800 font-semibold">พิการซ้ำซ้อน</span>
                        <span className="font-black text-rose-700 tabular-nums">{monthOnly.admissionsMultipleDisabled} คน</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        ประเภทความพิการเคสใหม่
                      </div>
                      {[
                        { type: 4 as const, name: 'ประเภท 4 (จิตใจ/พฤติกรรม)', count: monthOnly.admissionsDisabilityBreakdown[4] },
                        { type: 5 as const, name: 'ประเภท 5 (สติปัญญา)', count: monthOnly.admissionsDisabilityBreakdown[5] },
                        { type: 3 as const, name: 'ประเภท 3 (การเคลื่อนไหว)', count: monthOnly.admissionsDisabilityBreakdown[3] },
                        { type: 6 as const, name: 'ประเภท 6 (ออทิสติก)', count: monthOnly.admissionsDisabilityBreakdown[6] },
                        { type: 2 as const, name: 'ประเภท 2 (การได้ยิน)', count: monthOnly.admissionsDisabilityBreakdown[2] },
                        { type: 1 as const, name: 'ประเภท 1 (การเห็น)', count: monthOnly.admissionsDisabilityBreakdown[1] },
                      ].map((item) => (
                        <div key={item.type} className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="truncate pr-1">{item.name}</span>
                          <span className="font-bold text-slate-800 tabular-nums shrink-0">{item.count} ราย</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: สะสมปัจจุบันทั้งโครงการ */}
                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                    <div className="text-center pb-2 border-b border-amber-100">
                      <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide">
                        ยอดสะสมในโครงการ
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">ผู้ใช้บริการเข้าอยู่จริงรวม {displayTotalResidents} คน</div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">ผู้พิการสะสม</span>
                        <span className="font-black text-sky-900 tabular-nums">{snapshot.disabledCount} คน</span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">คนไร้ที่พึ่งสะสม</span>
                        <span className="font-black text-amber-900 tabular-nums">{snapshot.destituteCount} คน</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-between">
                        <span className="text-rose-800 font-semibold">พิการซ้ำซ้อนสะสม</span>
                        <span className="font-black text-rose-700 tabular-nums">{snapshot.multipleDisabledCount} คน</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        ประเภทความพิการสะสม
                      </div>
                      {[
                        { type: 4 as const, name: 'ประเภท 4 (จิตใจ/พฤติกรรม)', count: snapshot.disabilityBreakdown[4], color: 'bg-sky-500' },
                        { type: 5 as const, name: 'ประเภท 5 (สติปัญญา)', count: snapshot.disabilityBreakdown[5], color: 'bg-indigo-500' },
                        { type: 3 as const, name: 'ประเภท 3 (การเคลื่อนไหว)', count: snapshot.disabilityBreakdown[3], color: 'bg-amber-500' },
                        { type: 6 as const, name: 'ประเภท 6 (ออทิสติก)', count: snapshot.disabilityBreakdown[6], color: 'bg-emerald-500' },
                        { type: 2 as const, name: 'ประเภท 2 (การได้ยิน)', count: snapshot.disabilityBreakdown[2], color: 'bg-purple-500' },
                        { type: 1 as const, name: 'ประเภท 1 (การเห็น)', count: snapshot.disabilityBreakdown[1], color: 'bg-rose-500' },
                      ].map((item) => (
                        <div key={item.type} className="flex items-center gap-2 text-[11px]">
                          <span className="w-32 truncate text-slate-600">{item.name}</span>
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, Math.max(8, (item.count / 140) * 100))}%` }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                          <span className="w-7 text-right font-bold text-slate-800 tabular-nums">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 text-center">
                * ข้อมูลผ่านการรับรองและตรวจคัดกรองตามมาตรฐานกรมพัฒนาสังคมและสวัสดิการ
              </div>
            </div>
          </div>
      </div>

      {/* Middle Row: ข้อมูลสุขภาพ และการดูแลทางการแพทย์ */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">ภาวะสุขภาพและการดูแลทางการแพทย์ผู้ใช้บริการ</h3>
            <p className="text-xs text-slate-500">ข้อมูลคัดกรองสุขภาพและอาการเจ็บป่วยสะสมถึงเดือน{snapshot.monthLabelTh}</p>
          </div>
          <HeartPulse className="w-5 h-5 text-rose-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-950">สุขภาพแข็งแรง / ปกติ</div>
              <div className="text-[10px] text-emerald-700">ช่วยเหลือตนเองได้เต็มที่</div>
            </div>
            <span className="text-xl font-extrabold text-emerald-800 tabular-nums">
              {snapshot.healthSummary.normal} คน
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-sky-950">โรคเรื้อรัง / อาการสงบ</div>
              <div className="text-[10px] text-sky-700">รับประทานยาต่อเนื่อง</div>
            </div>
            <span className="text-xl font-extrabold text-sky-800 tabular-nums">
              {snapshot.healthSummary.chronicStable} คน
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-950">เฝ้าระวัง / ดูแลใกล้ชิด</div>
              <div className="text-[10px] text-amber-700">มีพี่เลี้ยงประกบดูแล</div>
            </div>
            <span className="text-xl font-extrabold text-amber-800 tabular-nums">
              {snapshot.healthSummary.needsCloseCare} คน
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-950">ส่งรักษาในโรงพยาบาล</div>
              <div className="text-[10px] text-rose-700">รักษาเฉพาะทางชั่วคราว</div>
            </div>
            <span className="text-xl font-extrabold text-rose-800 tabular-nums">
              {snapshot.healthSummary.hospitalized} คน
            </span>
          </div>
        </div>
      </div>

      {/* Activities & Employment Breakdown: อาชีวบำบัด vs การจ้างงาน แยกประเภทและรายรับชัดเจน */}
      <ActivitiesAndEmploymentBreakdown snapshot={snapshot} />

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
        <div>
          <span>โครงการบ้านน้อยในนิคม · กรมพัฒนาสังคมและสวัสดิการ (พม.)</span>
        </div>
        <div className="font-medium text-slate-700">
          ข้อมูล ณ วันที่ {snapshot.dataAsOfDateTh} · ผู้เข้าใช้งาน: {currentUser.name} ({currentUser.username})
        </div>
      </div>
    </div>
  );
};
