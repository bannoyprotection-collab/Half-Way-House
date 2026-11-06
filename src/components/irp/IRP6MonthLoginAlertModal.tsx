import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Clock, Calendar, ChevronRight, X, ShieldAlert,
  UserCheck, ArrowRight, CheckCircle2, FileText
} from 'lucide-react';
import { Beneficiary, Nikhom, UserAccount } from '../../types';
import { getIRP6MonthStatus, IRP6MonthStatus } from '../../utils/irpUtils';

interface IRP6MonthLoginAlertModalProps {
  currentUser: UserAccount;
  beneficiaries: Beneficiary[];
  nikhoms: Nikhom[];
  canAccessBeneficiary: (targetNikhomId: string) => boolean;
  onOpenIRPModal: (beneficiary: Beneficiary) => void;
  onOpenBeneficiaryDetail: (beneficiaryId: string) => void;
}

export const IRP6MonthLoginAlertModal: React.FC<IRP6MonthLoginAlertModalProps> = ({
  currentUser,
  beneficiaries,
  nikhoms,
  canAccessBeneficiary,
  onOpenIRPModal,
  onOpenBeneficiaryDetail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissForSession, setDismissForSession] = useState(false);

  // Find all accessible active beneficiaries needing 6-month evaluation
  const activeBeneficiaries = beneficiaries.filter(
    (b) => b.status !== 'discharged' && canAccessBeneficiary(b.nikhomId)
  );

  const irpStatuses: { beneficiary: Beneficiary; status: IRP6MonthStatus }[] = activeBeneficiaries
    .map((b) => ({
      beneficiary: b,
      status: getIRP6MonthStatus(b),
    }))
    .filter((item) => item.status.isOverdue || item.status.isApproaching);

  // Sort: overdue first, then approaching
  irpStatuses.sort((a, b) => {
    if (a.status.isOverdue && !b.status.isOverdue) return -1;
    if (!a.status.isOverdue && b.status.isOverdue) return 1;
    return b.status.elapsedDays - a.status.elapsedDays;
  });

  const overdueList = irpStatuses.filter((i) => i.status.isOverdue);
  const approachingList = irpStatuses.filter((i) => i.status.isApproaching);

  const nikhomMap = new Map(nikhoms.map((n) => [n.id, `${n.shortName} (จ.${n.province})`]));

  useEffect(() => {
    // Check if dismissed in this session
    const sessionKey = `irp_6m_alert_dismissed_${currentUser.id}_${new Date().toDateString()}`;
    const alreadyDismissed = sessionStorage.getItem(sessionKey);

    if (!alreadyDismissed && irpStatuses.length > 0) {
      setIsOpen(true);
    }
  }, [currentUser.id, irpStatuses.length]);

  const handleClose = () => {
    if (dismissForSession) {
      const sessionKey = `irp_6m_alert_dismissed_${currentUser.id}_${new Date().toDateString()}`;
      sessionStorage.setItem(sessionKey, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || irpStatuses.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-amber-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-5 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-amber-100">
                  แจ้งเตือนรอบการประเมิน
                </span>
                <span className="text-xs text-amber-100">
                  ผู้เข้าใช้งาน: {currentUser.name}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                แจ้งเตือนกำหนดประเมิน IRP ครบรอบ 6 เดือน (แจ้งเตือนล่วงหน้า 7 วัน)
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                ตามเกณฑ์มาตรฐาน เจ้าหน้าที่ต้องประเมินศักยภาพ IRP ของผู้ใช้บริการอย่างน้อยทุก 6 เดือน (ระบบแจ้งเตือนล่วงหน้า 7 วัน)
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-amber-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Badge Bar */}
        <div className="bg-amber-50/80 px-6 py-3 border-b border-amber-100 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              พบผู้ใช้บริการที่ต้องประเมินรวม: <strong className="text-amber-900 font-bold">{irpStatuses.length} ราย</strong>
            </span>
            <div className="flex items-center gap-1.5">
              {overdueList.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                  เกิน 6 เดือน: {overdueList.length} ราย
                </span>
              )}
              {approachingList.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200">
                  ใกล้ครบใน 7 วัน: {approachingList.length} ราย
                </span>
              )}
            </div>
          </div>
          <span className="text-slate-500 text-[11px]">
            รอบประเมินอย่างน้อย 6 เดือน/ครั้ง
          </span>
        </div>

        {/* Beneficiary List Section */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {irpStatuses.map(({ beneficiary: b, status }) => {
            const isOver = status.isOverdue;
            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isOver
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                    : 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {b.fullName}
                      </span>
                      <span className="font-mono text-xs font-semibold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
                        {b.uniquePersonId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOver
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-amber-600 text-white shadow-2xs'
                        }`}
                      >
                        {status.statusLabel}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                      <span>{nikhomMap.get(b.nikhomId) || b.nikhomId}</span>
                      <span>·</span>
                      <span>{b.building}</span>
                      <span>·</span>
                      <span className="text-slate-500">
                        {status.lastType === 'irp' ? 'ประเมินครั้งก่อน' : 'แรกรับเข้า'}: {status.lastDateTh} (ผ่านมา {status.elapsedDays} วัน)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onOpenIRPModal(b);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ประเมิน IRP (รอบ {status.round})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onOpenBeneficiaryDetail(b.id);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      title="เปิดดูประวัติผู้ใช้บริการ"
                    >
                      <span>ดูแฟ้ม</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dismissForSession}
              onChange={(e) => setDismissForSession(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span>ไม่ต้องแสดงการแจ้งเตือนนี้อีกในวันนี้</span>
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            รับทราบและดำเนินการภายหลัง
          </button>
        </div>
      </div>
    </div>
  );
};
