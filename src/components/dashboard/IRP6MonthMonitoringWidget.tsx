import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, User, Calendar, ShieldCheck, Filter } from 'lucide-react';
import { Beneficiary, Nikhom, UserAccount } from '../../types';
import { getIRP6MonthStatus, IRP6MonthStatus } from '../../utils/irpUtils';

interface IRP6MonthMonitoringWidgetProps {
  beneficiaries: Beneficiary[];
  nikhoms: Nikhom[];
  currentUser: UserAccount;
  canAccessBeneficiary: (targetNikhomId: string) => boolean;
  onOpenIRPModal: (beneficiary: Beneficiary) => void;
  onOpenBeneficiaryDetail: (beneficiaryId: string) => void;
}

export const IRP6MonthMonitoringWidget: React.FC<IRP6MonthMonitoringWidgetProps> = ({
  beneficiaries,
  nikhoms,
  currentUser,
  canAccessBeneficiary,
  onOpenIRPModal,
  onOpenBeneficiaryDetail,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'approaching' | 'normal'>('overdue');

  const activeBeneficiaries = beneficiaries.filter((b) => b.status !== 'discharged');
  const nikhomMap = new Map(nikhoms.map((n) => [n.id, `${n.shortName} จ.${n.province}`]));

  const listWithStatus = activeBeneficiaries.map((b) => ({
    beneficiary: b,
    status: getIRP6MonthStatus(b),
    allowed: canAccessBeneficiary(b.nikhomId),
  }));

  const overdueList = listWithStatus.filter((i) => i.status.isOverdue);
  const approachingList = listWithStatus.filter((i) => i.status.isApproaching);
  const normalList = listWithStatus.filter((i) => i.status.status === 'normal');

  // Display filtered items
  let displayList = listWithStatus;
  if (filterTab === 'overdue') displayList = overdueList;
  else if (filterTab === 'approaching') displayList = approachingList;
  else if (filterTab === 'normal') displayList = normalList;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              ระบบติดตามการประเมินศักยภาพ IRP รอบ 6 เดือน (6-Month Evaluation Cycle)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามและแจ้งเตือนผู้ใช้บริการที่ใกล้ครบกำหนด (แจ้งเตือนล่วงหน้า 7 วัน) หรือ เกินกำหนดการประเมินแผนฟื้นฟูรายบุคคลตามมาตรฐานกรมฯ
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('overdue')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>เกิน 6 เดือน: {overdueList.length} ราย</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('approaching')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'approaching'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ใกล้ครบใน 7 วัน: {approachingList.length} ราย</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('normal')}
            className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'normal'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ตามเกณฑ์ปกติ: {normalList.length} ราย</span>
          </button>
        </div>
      </div>

      {/* Beneficiary List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {displayList.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            ไม่มีรายการในหมวดนี้
          </div>
        ) : (
          displayList.map(({ beneficiary: b, status, allowed }) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                status.isOverdue
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  : status.isApproaching
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900">{b.fullName}</span>
                  <span className="font-mono text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {b.uniquePersonId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      status.isOverdue
                        ? 'bg-rose-600 text-white'
                        : status.isApproaching
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {status.statusLabel}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>{nikhomMap.get(b.nikhomId) || b.nikhomId}</span>
                  <span>·</span>
                  <span>{b.building}</span>
                  <span>·</span>
                  <span>
                    {status.lastType === 'irp' ? 'ประเมินล่าสุด' : 'วันแรกรับ'}: {status.lastDateTh} (ผ่านมา {status.elapsedDays} วัน)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {allowed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenIRPModal(b)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ประเมิน IRP รอบ {status.round}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenBeneficiaryDetail(b.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      เปิดแฟ้ม
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                    หน่วยงานอื่น
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
