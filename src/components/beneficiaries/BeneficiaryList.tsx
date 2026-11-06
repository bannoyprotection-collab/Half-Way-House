import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, AlertTriangle, User, Download, 
  Eye, Lock, ShieldCheck, RotateCcw, Printer 
} from 'lucide-react';
import { Beneficiary, Nikhom, UserAccount, DISABILITY_TYPE_LABELS } from '../../types';
import { exportBeneficiariesToExcel } from '../../services/exportService';
import { BeneficiaryDossierPrintModal } from './BeneficiaryDossierPrintModal';

interface BeneficiaryListProps {
  beneficiaries: Beneficiary[];
  nikhoms: Nikhom[];
  currentUser: UserAccount;
  canAccessBeneficiary: (targetNikhomId: string) => boolean;
  onSelectBeneficiary: (id: string) => void;
  onOpenNewModal: () => void;
  onOpenIRPModal: (beneficiary: Beneficiary) => void;
  onOpenRehabModal: (beneficiary: Beneficiary) => void;
}

export const BeneficiaryList: React.FC<BeneficiaryListProps> = ({
  beneficiaries,
  nikhoms,
  currentUser,
  canAccessBeneficiary,
  onSelectBeneficiary,
  onOpenNewModal,
  onOpenIRPModal,
  onOpenRehabModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNikhom, setSelectedNikhom] = useState<string>(
    currentUser.role === 'unit_officer' && currentUser.nikhomId ? currentUser.nikhomId : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'moderate' | 'high' | 'discharged'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'disabled' | 'destitute'>('all');
  const [printingBeneficiary, setPrintingBeneficiary] = useState<Beneficiary | null>(null);

  useEffect(() => {
    if (currentUser.role === 'unit_officer' && currentUser.nikhomId) {
      setSelectedNikhom(currentUser.nikhomId);
    } else {
      setSelectedNikhom('all');
    }
  }, [currentUser]);

  const nikhomMap = new Map(nikhoms.map((n) => [n.id, `${n.name} (${n.province})`]));

  const filtered = beneficiaries.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      b.fullName.toLowerCase().includes(q) ||
      b.uniquePersonId.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.referringAgency.toLowerCase().includes(q) ||
      b.building.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (selectedNikhom !== 'all' && b.nikhomId !== selectedNikhom) return false;
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;

    if (statusFilter === 'critical') {
      return b.latestIRP?.isUnder50Percent && b.status !== 'discharged';
    }
    if (statusFilter === 'moderate') {
      return b.latestIRP && !b.latestIRP.isUnder50Percent && b.latestIRP.evaluationResult === 'moderate';
    }
    if (statusFilter === 'high') {
      return b.latestIRP?.evaluationResult === 'high_potential';
    }
    if (statusFilter === 'discharged') {
      return b.status === 'discharged';
    }

    return true;
  });

  const accessibleBeneficiaries = beneficiaries.filter((b) => canAccessBeneficiary(b.nikhomId));
  const criticalCount = accessibleBeneficiaries.filter(
    (b) => b.latestIRP?.isUnder50Percent && b.status !== 'discharged'
  ).length;

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-amber-700 mb-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {currentUser.role === 'unit_officer'
                ? `สิทธิ์เจ้าหน้าที่ประจำหน่วย: เข้าถึงและแก้ไขเฉพาะข้อมูลของ ${nikhomMap.get(currentUser.nikhomId || '')}`
                : 'สิทธิ์ส่วนกลาง / Super Admin: เข้าถึงและแก้ไขข้อมูลได้ทุกหน่วยงานทั่วประเทศ'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            ทะเบียนประวัติผู้ใช้บริการ (แบบ ท.ป.๑) & ติดตามแผนฟื้นฟู IRP
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ระบบรันรหัสประจำตัวเฉพาะ (BNN-69-XXXX) ติดตัวตลอดชีพ แม้จำหน่ายออกแล้วหากกลับเข้าใหม่จะเชื่อมต่อประวัติเดิมทันที
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportBeneficiariesToExcel(accessibleBeneficiaries, nikhoms)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>รับเข้าใหม่ / รับกลับเข้าซ้ำ (ท.ป.๑)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัสประจำตัว (BNN-69-XXXX), ชื่อ-สกุล, ทะเบียนประวัติ, หน่วยงานนำส่ง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-slate-50/50"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedNikhom}
              onChange={(e) => setSelectedNikhom(e.target.value)}
              aria-label="เลือกนิคม"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-slate-50/50 cursor-pointer"
            >
              <option value="all">ทุกหน่วยงาน (18 แห่ง)</option>
              {nikhoms.map((nk) => (
                <option key={nk.id} value={nk.id}>
                  {nk.name} ({nk.province})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              aria-label="เลือกกลุ่มเป้าหมาย"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-slate-50/50 cursor-pointer"
            >
              <option value="all">กลุ่มเป้าหมายทั้งหมด</option>
              <option value="disabled">ผู้พิการ</option>
              <option value="destitute">คนไร้ที่พึ่ง</option>
            </select>
          </div>
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 shrink-0">ตัวกรองสถานะ:</span>
          
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ทั้งหมด ({filtered.length})
          </button>

          <button
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'critical'
                ? 'bg-rose-600 text-white font-medium'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>กลุ่มวิกฤต IRP &lt; 50% ({criticalCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('moderate')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'moderate'
                ? 'bg-amber-600 text-white font-medium'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            ปานกลาง (47-94)
          </button>

          <button
            onClick={() => setStatusFilter('high')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'high'
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            มีศักยภาพ (&gt; 94)
          </button>

          <button
            onClick={() => setStatusFilter('discharged')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              statusFilter === 'discharged'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>จำหน่ายแล้ว (คงรหัสเดิมสำหรับรับซ้ำ)</span>
          </button>
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">ไม่พบข้อมูลผู้ใช้บริการ</h3>
            <p className="text-xs text-slate-400 mt-1">
              ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองหน่วยงาน
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">รหัสประจำตัว / ชื่อ-สกุล</th>
                  <th className="py-3 px-4">หน่วยงาน / หน่วยงานนำส่ง</th>
                  <th className="py-3 px-4">กลุ่มเป้าหมาย & ความพิการ</th>
                  <th className="py-3 px-4 text-center">ผลประเมิน IRP ล่าสุด</th>
                  <th className="py-3 px-4 text-center">รูปแบบกิจกรรม & รายรับ</th>
                  <th className="py-3 px-4 text-right">การเข้าถึงและจัดการข้อมูล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const hasAccess = canAccessBeneficiary(b.nikhomId);
                  const irp = b.latestIRP;
                  const isUnder50 = irp?.isUnder50Percent;
                  const nikhomName = nikhomMap.get(b.nikhomId) || b.nikhomId;

                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors ${
                        !hasAccess
                          ? 'bg-slate-50/60 opacity-75'
                          : isUnder50
                          ? 'bg-rose-50/20 hover:bg-rose-50/40'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Unique ID & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              b.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.gender === 'male' ? 'ช' : 'ญ'}
                          </div>
                          <div>
                            <div className="mb-0.5">
                              <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                {b.uniquePersonId}
                              </span>
                            </div>

                            {hasAccess ? (
                              <button
                                onClick={() => onSelectBeneficiary(b.id)}
                                className="font-bold text-slate-900 hover:text-amber-700 transition-colors cursor-pointer text-left mt-0.5 block"
                              >
                                {b.fullName}
                              </button>
                            ) : (
                              <div className="font-bold text-slate-600 mt-0.5 flex items-center gap-1">
                                <span>{b.fullName}</span>
                                <Lock className="w-3 h-3 text-slate-400" />
                              </div>
                            )}

                            <div className="text-[11px] text-slate-500 mt-0.5">
                              อายุ {b.age} ปี · รับเข้า {b.admissionHistory?.length || 1} ครั้ง
                              {b.status === 'discharged' && (
                                <span className="ml-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                                  จำหน่ายแล้ว
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nikhom & Referring Agency */}
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-semibold text-slate-900">{nikhomName}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.building} · นำส่งโดย: <span className="text-slate-700">{b.referringAgency}</span>
                        </div>
                      </td>

                      {/* Category & Disabilities */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">
                            {b.category === 'disabled' ? 'ผู้พิการ' : 'คนไร้ที่พึ่ง'}
                          </span>
                          {b.hasMultipleDisabilities && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              พิการซ้ำซ้อน ({b.disabilityTypes.length} ประเภท)
                            </span>
                          )}
                        </div>
                        {b.disabilityTypes?.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {b.disabilityTypes.map((t) => `ประเภท ${t}`).join(', ')}
                          </div>
                        )}
                        {hasAccess && b.chronicDiseases && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                            สุขภาพ: {b.chronicDiseases}
                          </div>
                        )}
                      </td>

                      {/* IRP Score */}
                      <td className="py-3 px-4 text-center">
                        {!hasAccess ? (
                          <span className="text-[11px] text-slate-400 italic">จำกัดสิทธิ์เฉพาะหน่วย</span>
                        ) : irp ? (
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-sm font-extrabold tabular-nums ${
                                  isUnder50
                                    ? 'text-rose-600'
                                    : irp.evaluationResult === 'high_potential'
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {irp.scorePercentage.toFixed(1)}%
                              </span>
                              <span className="text-[11px] text-slate-500 tabular-nums">
                                ({irp.totalScore}/140)
                              </span>
                            </div>
                            {isUnder50 ? (
                              <span className="text-[10px] font-bold text-rose-700 mt-0.5">
                                เตือน: &lt; 50% (ครั้งที่ {irp.round})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                ครั้งที่ {irp.round} ({irp.evaluationDate})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">ยังไม่ประเมิน</span>
                        )}
                      </td>

                      {/* Income & Activities */}
                      <td className="py-3 px-4 text-center">
                        {!hasAccess ? (
                          <span className="text-[11px] text-slate-400">-</span>
                        ) : (
                          <>
                            <div className="font-bold text-slate-900 tabular-nums">
                              {b.monthlyIncome > 0 ? `${b.monthlyIncome.toLocaleString()} บาท/ด.` : '-'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[180px] mx-auto" title={b.incomeSource}>
                              {b.incomeSource || 'ไม่มีรายรับ'}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {hasAccess ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPrintingBeneficiary(b)}
                              className="px-2 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              title="พิมพ์แฟ้มประวัติชุดสมบูรณ์ (PDF)"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-700" />
                              <span>พิมพ์ชุดแฟ้ม</span>
                            </button>

                            <button
                              onClick={() => onSelectBeneficiary(b.id)}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>แฟ้ม ท.ป.๑ / IRP</span>
                            </button>

                            <button
                              onClick={() => onOpenIRPModal(b)}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              ประเมิน IRP
                            </button>

                            <button
                              onClick={() => onOpenRehabModal(b)}
                              className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                                isUnder50
                                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              แผนฟื้นฟู
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Lock className="w-3.5 h-3.5" />
                            <span>เฉพาะเจ้าหน้าที่หน่วยนี้</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official A4-Printable Dossier Modal */}
      {printingBeneficiary && (
        <BeneficiaryDossierPrintModal
          beneficiary={printingBeneficiary}
          nikhoms={nikhoms}
          isOpen={Boolean(printingBeneficiary)}
          onClose={() => setPrintingBeneficiary(null)}
        />
      )}
    </div>
  );
};
