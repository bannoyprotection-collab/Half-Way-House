import React, { useState } from 'react';
import { 
  X, Calendar, AlertTriangle, Clock, ShieldCheck, 
  HeartPulse, FileText, Briefcase, Plus, Edit3, Save, 
  ArrowUpRight, ArrowDownRight, Minus, UserCheck, UserMinus, CheckCircle2,
  Camera, Image as ImageIcon, ZoomIn, Eye, Sparkles, Printer
} from 'lucide-react';
import { 
  Beneficiary, Nikhom, DISABILITY_TYPE_LABELS, 
  HealthRecordEntry, CivilRegistrationRecord, ActivityWorkItem, 
  ACTIVITY_CATEGORY_LABELS, DischargeRecordTP1 
} from '../../types';
import { createDefaultActivityDetails } from '../../data/mockData';
import { EditBeneficiaryProfileModal } from './EditBeneficiaryProfileModal';
import { BeneficiaryDossierPrintModal } from './BeneficiaryDossierPrintModal';
import { storageService } from '../../services/storageService';

interface BeneficiaryDetailModalProps {
  beneficiary: Beneficiary;
  nikhoms: Nikhom[];
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenIRPModal: () => void;
  onOpenRehabModal: () => void;
  onAddHealthUpdate: (beneficiaryId: string, entry: Omit<HealthRecordEntry, 'id'>) => void;
  onUpdateCivilRegistration: (beneficiaryId: string, reg: CivilRegistrationRecord) => void;
  onUpdateActivitiesAndMonthlyIncome: (
    beneficiaryId: string,
    activityDetails: ActivityWorkItem[],
    monthYearTh: string,
    notes?: string
  ) => void;
  onDischargeBeneficiary: (
    beneficiaryId: string,
    params: {
      reason: DischargeRecordTP1['reason'];
      reasonDetail: string;
      dischargeDate: string;
      followUpResult: string;
    }
  ) => void;
  onUpdateBeneficiary?: (updated: Beneficiary) => void;
}

export const BeneficiaryDetailModal: React.FC<BeneficiaryDetailModalProps> = ({
  beneficiary,
  nikhoms,
  currentUserName,
  isOpen,
  onClose,
  onOpenIRPModal,
  onOpenRehabModal,
  onAddHealthUpdate,
  onUpdateCivilRegistration,
  onUpdateActivitiesAndMonthlyIncome,
  onDischargeBeneficiary,
  onUpdateBeneficiary,
}) => {
  const [activeBeneficiary, setActiveBeneficiary] = useState<Beneficiary>(beneficiary);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPrintDossierOpen, setIsPrintDossierOpen] = useState(false);

  React.useEffect(() => {
    setActiveBeneficiary(beneficiary);
  }, [beneficiary]);

  const [activeTab, setActiveTab] = useState<
    'tp1' | 'irp' | 'health' | 'activities' | 'rehab' | 'registration' | 'timeline'
  >('irp');
  const [previewZoomImage, setPreviewZoomImage] = useState<{ url: string; title: string } | null>(null);

  const handleProfileSave = (updated: Beneficiary) => {
    setActiveBeneficiary(updated);
    storageService.updateBeneficiary(updated.id, updated);
    if (onUpdateBeneficiary) {
      onUpdateBeneficiary(updated);
    }
  };

  // Health Form State
  const [isAddingHealth, setIsAddingHealth] = useState(false);
  const [hlDate, setHlDate] = useState(new Date().toISOString().split('T')[0]);
  const [hlIsInitial, setHlIsInitial] = useState(false);
  const [hlBp, setHlBp] = useState('120/80 mmHg');
  const [hlWeight, setHlWeight] = useState<number>(beneficiary.tp1Profile?.weightKg || 60);
  const [hlPhysical, setHlPhysical] = useState(beneficiary.chronicDiseases || '');
  const [hlMental, setHlMental] = useState('อาการสงบ สื่อสารเข้าใจดี');
  const [hlMeds, setHlMeds] = useState(beneficiary.initialHealth?.medications || '');
  const [hlAllergies, setHlAllergies] = useState(beneficiary.initialHealth?.drugAllergies || 'ไม่มี');
  const [hlStatus, setHlStatus] = useState<HealthRecordEntry['healthStatusLevel']>('normal');
  const [hlNotes, setHlNotes] = useState('');

  // Civil Registration Edit State
  const [isEditingReg, setIsEditingReg] = useState(false);
  const [regState, setRegState] = useState<CivilRegistrationRecord>(() => ({
    ...beneficiary.civilRegistration,
  }));

  // Activities & Monthly Income Edit State
  const [isEditingActivities, setIsEditingActivities] = useState(false);
  const [selectedMonthTh, setSelectedMonthTh] = useState('ตุลาคม 2569');
  const [actNotes, setActNotes] = useState('');
  const [actItems, setActItems] = useState<ActivityWorkItem[]>(() =>
    beneficiary.activityDetails && beneficiary.activityDetails.length > 0
      ? beneficiary.activityDetails
      : createDefaultActivityDetails()
  );

  // Discharge Modal State
  const [isDischarging, setIsDischarging] = useState(false);
  const [disReason, setDisReason] = useState<DischargeRecordTP1['reason']>('return_family');
  const [disDetail, setDisDetail] = useState('');
  const [disDate, setDisDate] = useState(new Date().toISOString().split('T')[0]);
  const [disFollowUp, setDisFollowUp] = useState('ประสานงานติดตามผลร่วมกับ พมจ. ในพื้นที่');

  if (!isOpen) return null;

  const nikhom = nikhoms.find((n) => n.id === beneficiary.nikhomId);
  const irp = beneficiary.latestIRP;
  const isUnder50 = irp?.isUnder50Percent;

  // Sort IRP history chronologically ascending (Round 1 -> Round 2 -> Round 3) to compute Previous vs New cleanly
  const chronologicalIRPs = [...(beneficiary.irpHistory || [])].sort((a, b) => a.round - b.round);

  const handleSaveHealth = (e: React.FormEvent) => {
    e.preventDefault();
    onAddHealthUpdate(beneficiary.id, {
      recordDate: hlDate,
      isInitialAdmission: hlIsInitial,
      bloodPressure: hlBp,
      weightKg: hlWeight,
      physicalCondition: hlPhysical,
      mentalCondition: hlMental,
      medications: hlMeds,
      drugAllergies: hlAllergies,
      healthStatusLevel: hlStatus,
      recordedBy: currentUserName,
      notes: hlNotes,
    });
    setIsAddingHealth(false);
  };

  const handleSaveReg = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCivilRegistration(beneficiary.id, regState);
    setIsEditingReg(false);
  };

  const handleSaveActivities = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateActivitiesAndMonthlyIncome(beneficiary.id, actItems, selectedMonthTh, actNotes);
    setIsEditingActivities(false);
  };

  const handleSaveDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    onDischargeBeneficiary(beneficiary.id, {
      reason: disReason,
      reasonDetail: disDetail || 'จำหน่ายตามมติคณะกรรมการสหวิชาชีพ',
      dischargeDate: disDate,
      followUpResult: disFollowUp,
    });
    setIsDischarging(false);
  };

  const updateActItem = (cat: ActivityWorkItem['category'], updates: Partial<ActivityWorkItem>) => {
    setActItems((prev) => prev.map((it) => (it.category === cat ? { ...it, ...updates } : it)));
  };

  const updateEmpIncome = (
    cat: ActivityWorkItem['category'],
    field: keyof ActivityWorkItem['employmentIncome'],
    val: number
  ) => {
    setActItems((prev) =>
      prev.map((it) =>
        it.category === cat
          ? {
              ...it,
              employmentIncome: {
                ...it.employmentIncome,
                [field]: val,
              },
            }
          : it
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col my-auto overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-slate-50">
          <div className="flex items-start gap-3">
            {activeBeneficiary.photoUrl || activeBeneficiary.tp1Profile?.photoUrl ? (
              <button
                type="button"
                onClick={() => setPreviewZoomImage({
                  url: activeBeneficiary.photoUrl || activeBeneficiary.tp1Profile?.photoUrl || '',
                  title: `รูปถ่ายหน้าตรง ${activeBeneficiary.fullName} (รหัสประจำตัว ${activeBeneficiary.uniquePersonId})`
                })}
                className="relative group w-13 h-13 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xs shrink-0 cursor-pointer"
                title="คลิกเพื่อดูภาพขยาย"
              >
                <img
                  src={activeBeneficiary.photoUrl || activeBeneficiary.tp1Profile?.photoUrl}
                  alt={activeBeneficiary.fullName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                  <ZoomIn className="w-3.5 h-3.5" />
                </div>
              </button>
            ) : (
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
                  activeBeneficiary.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeBeneficiary.gender === 'male' ? 'ชาย' : 'หญิง'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">
                  {activeBeneficiary.fullName}
                </h2>
                <span className="text-xs font-mono font-black text-amber-950 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300 shadow-2xs">
                  รหัสประจำตัว BNN: {activeBeneficiary.uniquePersonId}
                </span>
                {activeBeneficiary.hasMultipleDisabilities && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    พิการซ้ำซ้อน
                  </span>
                )}
                {isUnder50 && (
                  <span className="text-[11px] font-bold text-white bg-rose-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    IRP &lt; 50% วิกฤต
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">
                  {nikhom ? `${nikhom.name} (จ.${nikhom.province})` : activeBeneficiary.nikhomId}
                </span>
                <span>·</span>
                <span>{activeBeneficiary.building}</span>
                <span>·</span>
                <span>อายุ {activeBeneficiary.age} ปี</span>
                <span>·</span>
                <span>หน่วยงานนำส่ง: <strong className="text-slate-700">{activeBeneficiary.referringAgency}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPrintDossierOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs cursor-pointer transition-colors"
              title="พิมพ์เอกสารแฟ้มประวัติชุดสมบูรณ์ (PDF / กระดาษ A4) สำหรับเก็บไว้ที่หน่วยงาน"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>พิมพ์แฟ้มประวัติ (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs cursor-pointer transition-colors"
              title="แก้ไขข้อมูลประวัติ และอัปโหลดรูปถ่ายใหม่"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-800" />
              <span>แก้ไขประวัติ / รูปภาพ</span>
            </button>
            <button
              onClick={onOpenIRPModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ประเมิน IRP ใหม่</span>
            </button>
            <button
              onClick={onOpenRehabModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              <span>แผนฟื้นฟู</span>
            </button>
            <button
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white text-xs font-medium overflow-x-auto">
          {[
            { id: 'irp', label: `ตารางเปรียบเทียบ IRP (${beneficiary.irpHistory?.length || 0})` },
            { id: 'tp1', label: 'บัตรทะเบียนประวัติ (แบบ ท.ป.๑)' },
            { id: 'health', label: 'ข้อมูลสุขภาพ (แรกเข้า & อัปเดต)' },
            { id: 'activities', label: 'กิจกรรม อาชีวบำบัด & การจ้างงาน' },
            { id: 'registration', label: 'สถานะทางทะเบียน & สืบหาญาติ' },
            { id: 'rehab', label: `แผนฟื้นฟู (${beneficiary.rehabPlans?.length || 0})` },
            { id: 'timeline', label: 'ไทม์ไลน์บุคคล' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-amber-600 text-amber-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* ==================== TAB 1: IRP COMPARISON TABLE (ตารางแสดงการเปลี่ยนแปลงแต่ละครั้ง) ==================== */}
          {activeTab === 'irp' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ตารางเปรียบเทียบผลการประเมินสมรรถภาพรายบุคคล (IRP) ในแต่ละครั้ง
                  </h3>
                  <p className="text-xs text-slate-500">
                    แสดงวันที่ทำการประเมิน ผล IRP ครั้งก่อน เทียบกับผล IRP ครั้งใหม่ และค่าความเปลี่ยนแปลง (+/-)
                  </p>
                </div>
                <button
                  onClick={onOpenIRPModal}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer shrink-0"
                >
                  + บันทึกผลประเมิน IRP ครั้งถัดไป
                </button>
              </div>

              {chronologicalIRPs.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">ยังไม่มีประวัติการประเมินสมรรถภาพรายบุคคล (IRP)</p>
                </div>
              ) : (
                <>
                  {/* Main Comparison Table: วันที่ประเมิน | IRP ครั้งก่อน | ผล IRP ครั้งใหม่ | การเปลี่ยนแปลง */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-semibold">
                            <th className="py-3 px-4">ครั้งที่ประเมิน</th>
                            <th className="py-3 px-4">วันที่ทำประเมิน</th>
                            <th className="py-3 px-4 text-center">ผล IRP ครั้งก่อน (คะแนน / %)</th>
                            <th className="py-3 px-4 text-center bg-amber-900/40">ผล IRP ครั้งใหม่ (คะแนน / %)</th>
                            <th className="py-3 px-4 text-center">การเปลี่ยนแปลง (+/-)</th>
                            <th className="py-3 px-4 text-center">รายด้าน (ก/จ/ส/ศ)</th>
                            <th className="py-3 px-4">ระดับผลการประเมิน</th>
                            <th className="py-3 px-4">ผู้ประเมิน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {chronologicalIRPs.map((item, idx) => {
                            const prevItem = idx > 0 ? chronologicalIRPs[idx - 1] : null;
                            const scoreDiff = prevItem ? item.totalScore - prevItem.totalScore : 0;
                            const pctDiff = prevItem ? item.scorePercentage - prevItem.scorePercentage : 0;

                            const physicalSum =
                              item.scores.hygiene +
                              item.scores.clothingCleanliness +
                              item.scores.physicalHealth +
                              item.scores.selfCareAbility;
                            const emotionalSum =
                              item.scores.communication +
                              item.scores.emotionalExpression +
                              item.scores.emotionalControl;
                            const cognitiveSum =
                              item.scores.followInstructions +
                              item.scores.expressNeeds +
                              item.scores.basicMathAccounting;
                            const potentialSum =
                              item.scores.dailyDutyAndRoutine +
                              item.scores.fundamentalRightsAwareness +
                              item.scores.careerAndIncome +
                              item.scores.selfDevelopmentEagerness;

                            return (
                              <tr
                                key={item.id}
                                className={`hover:bg-slate-50 ${
                                  item.isUnder50Percent ? 'bg-rose-50/30' : ''
                                }`}
                              >
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  ครั้งที่ {item.round}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-700">
                                  {item.evaluationDate}
                                </td>

                                {/* ผล IRP ครั้งก่อน */}
                                <td className="py-3 px-4 text-center tabular-nums">
                                  {prevItem ? (
                                    <div>
                                      <span className="font-bold text-slate-700">
                                        {prevItem.totalScore}/140
                                      </span>
                                      <span className="text-slate-500 ml-1">
                                        ({prevItem.scorePercentage.toFixed(1)}%)
                                      </span>
                                      <div className="text-[10px] text-slate-400">
                                        เมื่อ {prevItem.evaluationDate}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">
                                      - (ประเมินครั้งแรก)
                                    </span>
                                  )}
                                </td>

                                {/* ผล IRP ครั้งใหม่ */}
                                <td className="py-3 px-4 text-center bg-amber-50/40 tabular-nums">
                                  <span
                                    className={`text-sm font-extrabold ${
                                      item.isUnder50Percent
                                        ? 'text-rose-600'
                                        : item.evaluationResult === 'high_potential'
                                        ? 'text-emerald-700'
                                        : 'text-amber-800'
                                    }`}
                                  >
                                    {item.totalScore}/140
                                  </span>
                                  <div className="text-[11px] font-bold text-slate-700">
                                    ({item.scorePercentage.toFixed(1)}%)
                                  </div>
                                </td>

                                {/* การเปลี่ยนแปลง */}
                                <td className="py-3 px-4 text-center tabular-nums">
                                  {!prevItem ? (
                                    <span className="text-slate-400">ฐานข้อมูลตั้งต้น</span>
                                  ) : scoreDiff > 0 ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                      +{scoreDiff} คะแนน (+{pctDiff.toFixed(1)}%)
                                    </span>
                                  ) : scoreDiff < 0 ? (
                                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                      <ArrowDownRight className="w-3.5 h-3.5" />
                                      {scoreDiff} คะแนน ({pctDiff.toFixed(1)}%)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                                      <Minus className="w-3.5 h-3.5" /> คงที่ (0)
                                    </span>
                                  )}
                                </td>

                                {/* คะแนนรายด้าน 4 ด้าน */}
                                <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600 tabular-nums">
                                  {physicalSum}/{emotionalSum}/{cognitiveSum}/{potentialSum}
                                </td>

                                {/* ระดับผลประเมิน */}
                                <td className="py-3 px-4">
                                  {item.isUnder50Percent ? (
                                    <span className="font-bold text-rose-700">
                                      ต่ำกว่า 50% (ต้องฟื้นฟูเร่งด่วน)
                                    </span>
                                  ) : item.evaluationResult === 'high_potential' ? (
                                    <span className="font-bold text-emerald-700">
                                      มีศักยภาพ (94-140)
                                    </span>
                                  ) : (
                                    <span className="font-bold text-amber-700">
                                      ปานกลาง (47-94)
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-slate-600">
                                  {item.evaluatorName}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================== TAB 2: บัตรทะเบียนประวัติ (แบบ ท.ป. ๑) ==================== */}
          {activeTab === 'tp1' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-[11px] font-bold text-amber-800">
                      แบบ ท.ป. ๑ · กองคุ้มครองสวัสดิภาพและเสริมสร้างคุณภาพชีวิต กรมพัฒนาสังคมและสวัสดิการ
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      บัตรทะเบียนประวัติผู้ใช้บริการ (เลขประจำตัวติดตัวตลอดชีพ: {beneficiary.uniquePersonId})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-xl cursor-pointer transition-colors shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      <span>แก้ไขแบบ ท.ป.๑ / รูปถ่าย</span>
                    </button>

                    {activeBeneficiary.status !== 'discharged' && (
                      <button
                        onClick={() => setIsDischarging(!isDischarging)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>บันทึกการให้พ้นการสงเคราะห์ (จำหน่าย)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Discharge Form if toggled */}
                {isDischarging && (
                  <form
                    onSubmit={handleSaveDischarge}
                    className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-3"
                  >
                    <div className="font-bold text-rose-950">
                      บันทึกการให้พ้นการดูแล / จำหน่าย (ตามแบบ ท.ป. ๑ หน้า ๒)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">สาเหตุการจำหน่าย</label>
                        <select
                          value={disReason}
                          onChange={(e) => setDisReason(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="return_family">กลับสู่ครอบครัว</option>
                          <option value="return_institute">กลับสถาน/หน่วยงานต้นทาง</option>
                          <option value="return_protection_center">ศูนย์คุ้มครองคนไร้ที่พึ่ง</option>
                          <option value="independent_living">ดำรงชีวิตอิสระ</option>
                          <option value="escaped">หลบหนี</option>
                          <option value="legal_prosecution">ถูกจำคุกดำเนินคดี / ถูกดำเนินคดีตามกฎหมาย</option>
                          <option value="deceased">เสียชีวิต</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">เมื่อวันที่</label>
                        <input
                          type="date"
                          required
                          value={disDate}
                          onChange={(e) => setDisDate(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">รายละเอียดสาเหตุ</label>
                        <input
                          type="text"
                          required
                          value={disDetail}
                          onChange={(e) => setDisDetail(e.target.value)}
                          placeholder="ระบุรายละเอียดสถานที่ส่งต่อ/ญาติที่รับตัว..."
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">การติดตามผล</label>
                      <input
                        type="text"
                        value={disFollowUp}
                        onChange={(e) => setDisFollowUp(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDischarging(false)}
                        className="px-3 py-1.5 text-slate-600 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg cursor-pointer"
                      >
                        ยืนยันการจำหน่าย (คงรหัส {beneficiary.uniquePersonId} ไว้ในระบบ)
                      </button>
                    </div>
                  </form>
                )}

                {/* TP1 Official Photos Header Banner */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>รูปถ่ายประจำตัวผู้รับการสงเคราะห์ และรูปถ่ายตำหนิรูปพรรณสัณฐาน (ตามแบบ ท.ป.๑)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Official Beneficiary Profile Photo */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-20 h-26 bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center">
                        {beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl ? (
                          <img
                            src={beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl}
                            alt={beneficiary.fullName}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewZoomImage({
                              url: beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl || '',
                              title: `รูปถ่ายหน้าตรงผู้รับการสงเคราะห์: ${beneficiary.fullName} (รหัส ${beneficiary.uniquePersonId})`
                            })}
                          />
                        ) : (
                          <div className="text-center p-2 text-slate-400 text-[10px]">
                            <ImageIcon className="w-7 h-7 mx-auto mb-1 opacity-40" />
                            <span>ไม่มีรูปถ่าย</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-xs">รูปถ่ายหน้าตรงผู้รับการสงเคราะห์</div>
                        <p className="text-[11px] text-slate-500">
                          {beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl
                            ? 'ติดบัตรทะเบียนประวัติ ท.ป.๑'
                            : 'ยังไม่มีการบันทึกรูปถ่ายหน้าตรง'}
                        </p>
                        {(beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl) && (
                          <button
                            type="button"
                            onClick={() => setPreviewZoomImage({
                              url: beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl || '',
                              title: `รูปถ่ายหน้าตรงผู้รับการสงเคราะห์: ${beneficiary.fullName} (รหัส ${beneficiary.uniquePersonId})`
                            })}
                            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer pt-0.5"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>คลิกดูภาพขยาย</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Physical Marks Photo */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-20 h-26 bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center">
                        {beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl ? (
                          <img
                            src={beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl}
                            alt="รูปตำหนิรูปพรรณ"
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewZoomImage({
                              url: beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl || '',
                              title: `รูปถ่ายตำหนิรูปพรรณ / แผลเป็น / รอยสัก (${beneficiary.fullName})`
                            })}
                          />
                        ) : (
                          <div className="text-center p-2 text-slate-400 text-[10px]">
                            <Sparkles className="w-7 h-7 mx-auto mb-1 opacity-40" />
                            <span>ไม่มีรูปตำหนิ</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-xs">รูปถ่ายตำหนิรูปพรรณ / แผลเป็น / รอยสัก</div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">
                          {beneficiary.tp1Profile?.distinguishingMarks || 'ไม่มีตำหนิรูปพรรณพิเศษ'}
                        </p>
                        {(beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl) ? (
                          <button
                            type="button"
                            onClick={() => setPreviewZoomImage({
                              url: beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl || '',
                              title: `รูปถ่ายตำหนิรูปพรรณ / แผลเป็น / รอยสัก (${beneficiary.fullName})`
                            })}
                            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer pt-0.5"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>คลิกดูภาพขยาย</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">(ไม่มีรูปถ่าย)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TP1 Page 1 Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                      ข้อมูลส่วนบุคคลและครอบครัว
                    </div>
                    <div><span className="text-slate-500">ชื่อ-นามสกุล:</span> <strong>{beneficiary.fullName}</strong></div>
                    <div>
                      <span className="text-slate-500">วันเดือนปีเกิด (พ.ศ.):</span>{' '}
                      <strong>
                        {beneficiary.tp1Profile?.birthDateKnown
                          ? `${beneficiary.tp1Profile.birthDay || ''} ${beneficiary.tp1Profile.birthMonthTh || ''} พ.ศ. ${beneficiary.tp1Profile.birthYearBuddhist || ''}`
                          : 'ไม่ทราบวันเดือนปีเกิด'}
                      </strong>{' '}
                      (อายุ {beneficiary.age} ปี)
                    </div>
                    <div><span className="text-slate-500">ภูมิลำเนาเดิม:</span> {beneficiary.tp1Profile?.hometownAddress || '-'}</div>
                    <div><span className="text-slate-500">ชื่อบิดา:</span> {beneficiary.tp1Profile?.fatherName || '-'}</div>
                    <div><span className="text-slate-500">ชื่อมารดา:</span> {beneficiary.tp1Profile?.motherName || '-'}</div>
                    <div><span className="text-slate-500">สถานภาพสมรส:</span> {
                      beneficiary.tp1Profile?.maritalStatus === 'single' ? 'โสด' :
                      beneficiary.tp1Profile?.maritalStatus === 'married' ? 'สมรส' :
                      beneficiary.tp1Profile?.maritalStatus === 'divorced' ? 'หย่าร้าง' :
                      beneficiary.tp1Profile?.maritalStatus === 'widowed' ? 'หม้าย' : 'อื่นๆ'
                    }</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                      บุคลิกลักษณะ ความพิการ & การศึกษา
                    </div>
                    <div>
                      <span className="text-slate-500">ส่วนสูง / น้ำหนัก:</span>{' '}
                      <strong>{beneficiary.tp1Profile?.heightCm || '-'} ซ.ม. / {beneficiary.tp1Profile?.weightKg || '-'} ก.ก.</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">ตำหนิรูปพรรณ:</span>{' '}
                      <strong>{beneficiary.tp1Profile?.distinguishingMarks || '-'}</strong>
                      {(beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl) && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <img
                            src={beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl}
                            alt="รูปตำหนิรูปพรรณ"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:opacity-90"
                            onClick={() => setPreviewZoomImage({
                              url: beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl || '',
                              title: `รูปถ่ายตำหนิรูปพรรณ / แผลเป็น / รอยสัก (${beneficiary.fullName})`
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewZoomImage({
                              url: beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl || '',
                              title: `รูปถ่ายตำหนิรูปพรรณ / แผลเป็น / รอยสัก (${beneficiary.fullName})`
                            })}
                            className="text-[10px] text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                          >
                            ดูรูปถ่ายตำหนิ
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">ความพิการ:</span>{' '}
                      {beneficiary.disabilityTypes?.length > 0
                        ? beneficiary.disabilityTypes.map((d) => DISABILITY_TYPE_LABELS[d]).join(', ')
                        : 'คนไร้ที่พึ่ง (ไม่มีความพิการ)'}
                    </div>
                    <div>
                      <span className="text-slate-500">สถานะพิการซ้ำซ้อน:</span>{' '}
                      <strong className={beneficiary.hasMultipleDisabilities ? 'text-rose-700' : 'text-slate-700'}>
                        {beneficiary.hasMultipleDisabilities ? 'ใช่ (พิการซ้ำซ้อน)' : 'ไม่ใช่'}
                      </strong>
                    </div>
                    <div><span className="text-slate-500">ประวัติการศึกษา:</span> {beneficiary.tp1Profile?.educationHistory || '-'}</div>
                    <div><span className="text-slate-500">อาชีพเดิม:</span> {beneficiary.tp1Profile?.previousOccupation || '-'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                      ประวัติการรับการสงเคราะห์ & จำหน่าย
                    </div>
                    <div className="space-y-2">
                      {(beneficiary.admissionHistory || []).map((adm) => (
                        <div key={adm.round} className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/80 text-[11px]">
                          <div className="font-bold text-amber-950">
                            รับการสงเคราะห์ ครั้งที่ {adm.round} (ทะเบียน {adm.registrationNumber})
                          </div>
                          <div>รับจาก: <strong>{adm.referringAgency}</strong></div>
                          <div>เมื่อ: {adm.dateThText}</div>
                        </div>
                      ))}
                      {(beneficiary.dischargeHistory || []).map((dis) => (
                        <div key={dis.round} className="p-2 rounded-lg bg-rose-50/60 border border-rose-200/80 text-[11px]">
                          <div className="font-bold text-rose-950">
                            ให้พ้นการสงเคราะห์ ครั้งที่ {dis.round}
                          </div>
                          <div>เนื่องจาก: {dis.reasonDetail}</div>
                          <div>ติดตามผล: {dis.followUpResult}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TP1 Page 2 (Back) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900">สรุปประวัติความเป็นมา</div>
                    <p className="text-slate-600 leading-relaxed">{beneficiary.tp1Profile?.backgroundSummary || '-'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900">การวิเคราะห์ของนักสังคมสงเคราะห์</div>
                    <p className="text-slate-600 leading-relaxed">{beneficiary.tp1Profile?.socialWorkAnalysis || '-'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900">การฝึกอาชีพระหว่างรับการสงเคราะห์</div>
                    <p className="text-slate-600 leading-relaxed">{beneficiary.tp1Profile?.vocationalTrainingInCare || '-'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900">การเปลี่ยนแปลงพฤติกรรม & การเข้ากลุ่มกิจกรรมบำบัด</div>
                    <p className="text-slate-600 leading-relaxed">
                      {beneficiary.tp1Profile?.behaviorChangesNote || '-'} | กลุ่มบำบัด: {beneficiary.tp1Profile?.groupTherapyParticipation || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: ข้อมูลสุขภาพแรกเข้า และประวัติการอัปเดต ==================== */}
          {activeTab === 'health' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ข้อมูลสุขภาพแรกเข้า และประวัติการติดตามอัปเดตสุขภาพ
                  </h3>
                  <p className="text-xs text-slate-500">
                    บันทึกผลการตรวจสุขภาพแรกรับและการเปลี่ยนแปลงด้านสุขภาพกาย/สุขภาพจิต/การรับยา
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingHealth(!isAddingHealth)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shrink-0"
                >
                  + อัปเดตข้อมูลสุขภาพ
                </button>
              </div>

              {isAddingHealth && (
                <form
                  onSubmit={handleSaveHealth}
                  className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">บันทึกการอัปเดตข้อมูลสุขภาพ</span>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={hlIsInitial}
                        onChange={(e) => setHlIsInitial(e.target.checked)}
                      />
                      <span>บันทึกเป็นการแก้ไขข้อมูลสุขภาพแรกเข้า</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">วันที่ตรวจ/อัปเดต</label>
                      <input
                        type="date"
                        required
                        value={hlDate}
                        onChange={(e) => setHlDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ความดันโลหิต</label>
                      <input
                        type="text"
                        value={hlBp}
                        onChange={(e) => setHlBp(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">น้ำหนัก (ก.ก.)</label>
                      <input
                        type="number"
                        value={hlWeight}
                        onChange={(e) => setHlWeight(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ระดับสถานะสุขภาพ</label>
                      <select
                        value={hlStatus}
                        onChange={(e) => setHlStatus(e.target.value as any)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="normal">ปกติ / แข็งแรง</option>
                        <option value="chronic_stable">โรคเรื้อรัง / จิตเวชอาการสงบ</option>
                        <option value="needs_close_care">ต้องดูแลใกล้ชิด / เฝ้าระวัง</option>
                        <option value="hospitalized">ส่งต่อรักษาในโรงพยาบาล</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สุขภาพทางกาย / โรคประจำตัว</label>
                      <input
                        type="text"
                        required
                        value={hlPhysical}
                        onChange={(e) => setHlPhysical(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สุขภาพจิต / อาการทางอารมณ์</label>
                      <input
                        type="text"
                        required
                        value={hlMental}
                        onChange={(e) => setHlMental(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ยาที่ได้รับประจำ</label>
                      <input
                        type="text"
                        value={hlMeds}
                        onChange={(e) => setHlMeds(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">หมายเหตุการรักษา</label>
                      <input
                        type="text"
                        value={hlNotes}
                        onChange={(e) => setHlNotes(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingHealth(false)}
                      className="px-3 py-1.5 text-slate-600 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                    >
                      บันทึกข้อมูลสุขภาพ
                    </button>
                  </div>
                </form>
              )}

              {/* Initial Health Card */}
              {beneficiary.initialHealth && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">
                      ข้อมูลสุขภาพแรกเข้า (วันที่แรกรับ: {beneficiary.initialHealth.recordDate})
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ผู้บันทึก: {beneficiary.initialHealth.recordedBy}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div><span className="text-slate-500">สุขภาพกายแรกรับ:</span> <strong>{beneficiary.initialHealth.physicalCondition}</strong></div>
                    <div><span className="text-slate-500">สุขภาพจิตแรกรับ:</span> <strong>{beneficiary.initialHealth.mentalCondition}</strong></div>
                    <div><span className="text-slate-500">ยาที่ใช้ประจำ:</span> {beneficiary.initialHealth.medications}</div>
                    <div><span className="text-slate-500">ความดัน / น้ำหนัก:</span> {beneficiary.initialHealth.bloodPressure || '-'} / {beneficiary.initialHealth.weightKg || '-'} ก.ก.</div>
                  </div>
                </div>
              )}

              {/* Health Updates History */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800">ประวัติการอัปเดตสุขภาพรายครั้ง</h4>
                {(beneficiary.healthHistory || []).length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                    ยังไม่มีรายการอัปเดตสุขภาพเพิ่มเติมหลังแรกรับ
                  </div>
                ) : (
                  beneficiary.healthHistory.map((h) => (
                    <div key={h.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800">
                          วันที่ตรวจติดตาม: {h.recordDate}
                        </span>
                        <span className="text-[11px] text-slate-500">ผู้บันทึก: {h.recordedBy}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                        <div><strong>สุขภาพกาย:</strong> {h.physicalCondition}</div>
                        <div><strong>สุขภาพจิต:</strong> {h.mentalCondition}</div>
                        <div><strong>ยาปัจจุบัน:</strong> {h.medications}</div>
                        <div><strong>ความดัน / น้ำหนัก:</strong> {h.bloodPressure || '-'} / {h.weightKg || '-'} ก.ก.</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 4: กิจกรรมดำเนินการ อาชีวบำบัด และการจ้างงานรายเดือน ==================== */}
          {activeTab === 'activities' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    การดำเนินกิจกรรม อาชีวบำบัด และการจ้างงานรายเดือน
                  </h3>
                  <p className="text-xs text-slate-500">
                    ระบุรายละเอียดกิจกรรม เลือกอาชีวบำบัดหรือการจ้างงาน (ไป-กลับ, รับงานมาทำ, ม.25, ม.33, ม.35) และอัปเดตเป็นรายเดือน
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingActivities(!isEditingActivities)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingActivities ? 'ปิดฟอร์มแก้ไข' : 'อัปเดตกิจกรรม & รายรับประจำเดือน'}</span>
                </button>
              </div>

              {isEditingActivities && (
                <form
                  onSubmit={handleSaveActivities}
                  className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
                    <div className="font-bold text-slate-900 text-sm">
                      บันทึกอัปเดตกิจกรรมและรายรับประจำเดือน
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="font-semibold text-slate-700">ประจำเดือน:</label>
                      <select
                        value={selectedMonthTh}
                        onChange={(e) => setSelectedMonthTh(e.target.value)}
                        className="p-2 border border-amber-300 rounded-lg bg-white font-bold"
                      >
                        <option value="พฤศจิกายน 2569">พฤศจิกายน 2569</option>
                        <option value="ตุลาคม 2569">ตุลาคม 2569</option>
                        <option value="กันยายน 2569">กันยายน 2569</option>
                        <option value="สิงหาคม 2569">สิงหาคม 2569</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {actItems.map((item) => (
                      <div
                        key={item.category}
                        className={`p-3.5 rounded-xl border ${
                          item.enabled ? 'bg-white border-amber-400' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => updateActItem(item.category, { enabled: e.target.checked })}
                            />
                            <span>{ACTIVITY_CATEGORY_LABELS[item.category]}</span>
                          </label>

                          {item.enabled && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateActItem(item.category, { participationType: 'occupational_therapy' })
                                }
                                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                                  item.participationType === 'occupational_therapy'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                อาชีวบำบัด
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateActItem(item.category, { participationType: 'employment' })
                                }
                                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                                  item.participationType === 'employment'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                การจ้างงาน
                              </button>
                            </div>
                          )}
                        </div>

                        {item.enabled && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  รายละเอียดกิจกรรม
                                </label>
                                <input
                                  type="text"
                                  value={item.details}
                                  onChange={(e) => updateActItem(item.category, { details: e.target.value })}
                                  placeholder="ระบุรายละเอียดกิจกรรม..."
                                  className="w-full p-2 border border-slate-200 rounded-lg"
                                />
                              </div>

                              {item.participationType === 'occupational_therapy' ? (
                                <div>
                                  <label className="block text-[11px] font-bold text-teal-800 mb-1">
                                    รายรับอาชีวบำบัด (บาท/เดือน)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.occupationalTherapyIncome}
                                    onChange={(e) =>
                                      updateActItem(item.category, {
                                        occupationalTherapyIncome: Number(e.target.value),
                                      })
                                    }
                                    className="w-full p-2 border border-teal-300 rounded-lg font-bold tabular-nums"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    ชื่อสถานประกอบการ / แหล่งจ้างงาน
                                  </label>
                                  <input
                                    type="text"
                                    value={item.workplaceName || ''}
                                    onChange={(e) =>
                                      updateActItem(item.category, { workplaceName: e.target.value })
                                    }
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                  />
                                </div>
                              )}
                            </div>

                            {item.participationType === 'employment' && (
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                                <div>
                                  <label className="block text-[10px] text-slate-600 mb-1">จ้างไป-กลับ (บ.)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.employmentIncome.commuteIncome}
                                    onChange={(e) =>
                                      updateEmpIncome(item.category, 'commuteIncome', Number(e.target.value))
                                    }
                                    className="w-full p-1.5 border border-slate-200 rounded bg-white font-bold tabular-nums"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-600 mb-1">รับงานมาทำ (บ.)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.employmentIncome.homeWorkIncome}
                                    onChange={(e) =>
                                      updateEmpIncome(item.category, 'homeWorkIncome', Number(e.target.value))
                                    }
                                    className="w-full p-1.5 border border-slate-200 rounded bg-white font-bold tabular-nums"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-600 mb-1">จ้าง ม.25 (บ.)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.employmentIncome.section25Income}
                                    onChange={(e) =>
                                      updateEmpIncome(item.category, 'section25Income', Number(e.target.value))
                                    }
                                    className="w-full p-1.5 border border-slate-200 rounded bg-white font-bold tabular-nums"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-600 mb-1">จ้าง ม.33 (บ.)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.employmentIncome.section33Income}
                                    onChange={(e) =>
                                      updateEmpIncome(item.category, 'section33Income', Number(e.target.value))
                                    }
                                    className="w-full p-1.5 border border-slate-200 rounded bg-white font-bold tabular-nums"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-amber-900 font-bold mb-1">จ้าง ม.35 (บ.)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.employmentIncome.section35Income}
                                    onChange={(e) =>
                                      updateEmpIncome(item.category, 'section35Income', Number(e.target.value))
                                    }
                                    className="w-full p-1.5 border border-amber-300 rounded bg-white font-bold tabular-nums"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingActivities(false)}
                      className="px-4 py-2 text-slate-600 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกอัปเดตประจำเดือน {selectedMonthTh}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Current Active Activities Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(beneficiary.activityDetails || [])
                  .filter((a) => a.enabled)
                  .map((a) => (
                    <div key={a.category} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{ACTIVITY_CATEGORY_LABELS[a.category]}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.participationType === 'occupational_therapy'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.participationType === 'occupational_therapy' ? 'อาชีวบำบัด' : 'การจ้างงาน'}
                        </span>
                      </div>
                      <div className="text-slate-600">รายละเอียด: <strong>{a.details || '-'}</strong></div>
                      {a.participationType === 'occupational_therapy' ? (
                        <div className="text-teal-800 font-bold tabular-nums">
                          รายรับอาชีวบำบัด: {a.occupationalTherapyIncome.toLocaleString()} บาท/เดือน
                        </div>
                      ) : (
                        <div className="text-amber-900 space-y-1 pt-1 border-t border-slate-100">
                          {a.workplaceName && <div>สถานประกอบการ: <strong>{a.workplaceName}</strong></div>}
                          <div className="flex flex-wrap gap-2 text-[11px] font-bold tabular-nums">
                            {a.employmentIncome.commuteIncome > 0 && <span>ไป-กลับ: {a.employmentIncome.commuteIncome.toLocaleString()} บ.</span>}
                            {a.employmentIncome.homeWorkIncome > 0 && <span>รับงานมาทำ: {a.employmentIncome.homeWorkIncome.toLocaleString()} บ.</span>}
                            {a.employmentIncome.section25Income > 0 && <span>ม.25: {a.employmentIncome.section25Income.toLocaleString()} บ.</span>}
                            {a.employmentIncome.section33Income > 0 && <span>ม.33: {a.employmentIncome.section33Income.toLocaleString()} บ.</span>}
                            {a.employmentIncome.section35Income > 0 && <span>ม.35: {a.employmentIncome.section35Income.toLocaleString()} บ.</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==================== TAB 5: สถานะทางทะเบียน สิทธิ์ และการสืบหาญาติ (กดแก้ไขและอัปเดตได้) ==================== */}
          {activeTab === 'registration' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    สถานะทางทะเบียนราษฎร สิทธิสวัสดิการ และการสืบหาญาติ
                  </h3>
                  <p className="text-xs text-slate-500">
                    เจ้าหน้าที่สามารถกดแก้ไขและบันทึกความคืบหน้าการทำบัตรประชาชน การตรวจ DNA และการสืบหาญาติได้ทันที
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingReg(!isEditingReg)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingReg ? 'ยกเลิกการแก้ไข' : 'แก้ไข / อัปเดตสถานะทางทะเบียน'}</span>
                </button>
              </div>

              {isEditingReg ? (
                <form
                  onSubmit={handleSaveReg}
                  className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="inline-flex items-center gap-2 font-bold text-slate-900 cursor-pointer mb-1.5">
                        <input
                          type="checkbox"
                          checked={regState.hasNationalIdCard}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, hasNationalIdCard: e.target.checked }))
                          }
                        />
                        <span>มีบัตรประจำตัวประชาชน</span>
                      </label>
                      <input
                        type="text"
                        disabled={!regState.hasNationalIdCard}
                        value={regState.nationalIdNumber || ''}
                        onChange={(e) =>
                          setRegState((p) => ({ ...p, nationalIdNumber: e.target.value }))
                        }
                        placeholder="เลข 13 หลัก"
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">สิทธิการรักษาพยาบาล</label>
                      <input
                        type="text"
                        value={regState.medicalRights || ''}
                        onChange={(e) =>
                          setRegState((p) => ({ ...p, medicalRights: e.target.value }))
                        }
                        placeholder="เช่น บัตรทอง ท.74, ประกันสังคม"
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">บัตรประจำตัวคนพิการ</label>
                      <select
                        value={regState.disabilityCardStatus || 'none'}
                        onChange={(e) =>
                          setRegState((p) => ({ ...p, disabilityCardStatus: e.target.value as any }))
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="has_card">มีบัตรคนพิการแล้ว</option>
                        <option value="in_progress">อยู่ระหว่างยื่นทำบัตรคนพิการ</option>
                        <option value="expired">บัตรหมดอายุ (รอต่ออายุ)</option>
                        <option value="none">ไม่ได้เป็นผู้พิการ / ไม่มี</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200/60">
                    <div>
                      <label className="inline-flex items-center gap-2 font-bold text-slate-800 cursor-pointer mb-1">
                        <input
                          type="checkbox"
                          checked={regState.civilRegistrationChecked}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, civilRegistrationChecked: e.target.checked }))
                          }
                        />
                        <span>ตรวจสอบทะเบียนราษฎรแล้ว</span>
                      </label>
                      <input
                        type="text"
                        value={regState.civilRegistrationNote || ''}
                        onChange={(e) =>
                          setRegState((p) => ({ ...p, civilRegistrationNote: e.target.value }))
                        }
                        placeholder="ระบุผลการตรวจสอบทะเบียนราษฎร..."
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-2 font-bold text-slate-800 cursor-pointer mb-1">
                        <input
                          type="checkbox"
                          checked={regState.homeVisitCoordinated}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, homeVisitCoordinated: e.target.checked }))
                          }
                        />
                        <span>ประสานเยี่ยมบ้านและสืบหาญาติแล้ว</span>
                      </label>
                      <input
                        type="text"
                        value={regState.homeVisitNote || ''}
                        onChange={(e) =>
                          setRegState((p) => ({ ...p, homeVisitNote: e.target.value }))
                        }
                        placeholder="ระบุผลการเยี่ยมบ้าน/การติดต่อญาติ..."
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">ตรวจลายพิมพ์นิ้วมือ</label>
                      <div className="flex gap-2">
                        <select
                          value={regState.fingerprintStatus}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, fingerprintStatus: e.target.value as any }))
                          }
                          className="p-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="found">พบ</option>
                          <option value="not_found">ไม่พบ</option>
                          <option value="pending">รอผล</option>
                        </select>
                        <input
                          type="text"
                          value={regState.fingerprintNote || ''}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, fingerprintNote: e.target.value }))
                          }
                          placeholder="รายละเอียดการตรวจลายนิ้วมือ..."
                          className="flex-1 p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">ตรวจสอบประวัติอาชญากร / คนหายพลัดหลง</label>
                      <div className="flex gap-2">
                        <select
                          value={regState.criminalRecordStatus}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, criminalRecordStatus: e.target.value as any }))
                          }
                          className="p-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="not_found">ไม่พบประวัติ</option>
                          <option value="found">พบประวัติ</option>
                          <option value="pending">รอผล</option>
                        </select>
                        <input
                          type="text"
                          value={regState.criminalRecordNote || ''}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, criminalRecordNote: e.target.value }))
                          }
                          placeholder="ระบุรายละเอียด..."
                          className="flex-1 p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">ประสานตรวจ DNA</label>
                      <div className="flex gap-2">
                        <select
                          value={regState.dnaTestStatus}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, dnaTestStatus: e.target.value as any }))
                          }
                          className="p-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="found">พบความเชื่อมโยง</option>
                          <option value="not_found">ไม่พบ</option>
                          <option value="pending">รอการประสานตรวจ</option>
                        </select>
                        <input
                          type="text"
                          value={regState.dnaNote || ''}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, dnaNote: e.target.value }))
                          }
                          placeholder="ระบุรายละเอียดผล DNA..."
                          className="flex-1 p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">ประสานนายทะเบียนท้องที่ทำบัตรประชาชน</label>
                      <div className="flex gap-2">
                        <select
                          value={regState.idCardCoordinationStatus}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, idCardCoordinationStatus: e.target.value as any }))
                          }
                          className="p-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="completed">ดำเนินการเสร็จสิ้น</option>
                          <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                          <option value="none">ยังไม่เริ่มดำเนินการ</option>
                        </select>
                        <input
                          type="text"
                          value={regState.idCardNote || ''}
                          onChange={(e) =>
                            setRegState((p) => ({ ...p, idCardNote: e.target.value }))
                          }
                          placeholder="ระบุรายละเอียด..."
                          className="flex-1 p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingReg(false)}
                      className="px-4 py-2 text-slate-600 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกการอัปเดตสถานะทางทะเบียน</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-medium text-slate-700">1. สถานะบัตรประจำตัวประชาชน</span>
                    <span className="font-bold text-slate-900">
                      {beneficiary.civilRegistration.hasNationalIdCard
                        ? `มีบัตรประชาชน (${beneficiary.civilRegistration.nationalIdNumber})`
                        : 'ไม่มีบัตรประจำตัวประชาชน (อยู่ระหว่างสืบหา)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-medium text-slate-700">2. สิทธิการรักษาพยาบาล & สวัสดิการ</span>
                    <span className="font-bold text-emerald-800">
                      {beneficiary.civilRegistration.medicalRights || 'สิทธิบัตรทอง ท.74'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-medium text-slate-700">3. การตรวจสอบทะเบียนราษฎร</span>
                    <span className="font-bold text-slate-900">
                      {beneficiary.civilRegistration.civilRegistrationChecked ? 'ตรวจสอบแล้ว' : 'ยังไม่ตรวจสอบ'}
                      {beneficiary.civilRegistration.civilRegistrationNote && ` — ${beneficiary.civilRegistration.civilRegistrationNote}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-medium text-slate-700">4. การประสานเยี่ยมบ้านและสืบหาญาติ</span>
                    <span className="font-bold text-slate-900">
                      {beneficiary.civilRegistration.homeVisitCoordinated ? 'ดำเนินการแล้ว' : 'ยังไม่ดำเนินการ'}
                      {beneficiary.civilRegistration.homeVisitNote && ` — ${beneficiary.civilRegistration.homeVisitNote}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-medium text-slate-700">5. ตรวจลายพิมพ์นิ้วมือ</span>
                    <span className="font-bold text-slate-900">
                      {beneficiary.civilRegistration.fingerprintStatus === 'found'
                        ? 'พบในฐานข้อมูล'
                        : beneficiary.civilRegistration.fingerprintStatus === 'not_found'
                        ? 'ไม่พบ'
                        : 'รอผลตรวจสอบ'}
                      {beneficiary.civilRegistration.fingerprintNote && ` (${beneficiary.civilRegistration.fingerprintNote})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-medium text-slate-700">6. ตรวจสอบทะเบียนประวัติอาชญากร / คนหายพลัดหลง</span>
                    <span className="font-bold text-slate-900">
                      {beneficiary.civilRegistration.criminalRecordStatus === 'found'
                        ? 'พบประวัติ'
                        : beneficiary.civilRegistration.criminalRecordStatus === 'not_found'
                        ? 'ไม่พบประวัติ'
                        : 'อยู่ระหว่างตรวจสอบ'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-medium text-slate-700">7. การประสานตรวจ DNA</span>
                    <span className="font-bold text-slate-900">
                      {beneficiary.civilRegistration.dnaTestStatus === 'found'
                        ? 'ตรวจพบและยืนยันตัวบุคคลแล้ว'
                        : beneficiary.civilRegistration.dnaTestStatus === 'not_found'
                        ? 'ไม่พบความเชื่อมโยง'
                        : 'รอการประสานตรวจ'}
                      {beneficiary.civilRegistration.dnaNote && ` (${beneficiary.civilRegistration.dnaNote})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">8. ประสานนายทะเบียนท้องที่ทำบัตรประชาชน</span>
                    <span className="font-bold text-slate-900">
                      {beneficiary.civilRegistration.idCardCoordinationStatus === 'completed'
                        ? 'ดำเนินการเรียบร้อยแล้ว'
                        : beneficiary.civilRegistration.idCardCoordinationStatus === 'in_progress'
                        ? 'อยู่ระหว่างดำเนินการ'
                        : 'ยังไม่เริ่มดำเนินการ'}
                      {beneficiary.civilRegistration.idCardNote && ` (${beneficiary.civilRegistration.idCardNote})`}
                    </span>
                  </div>

                  {beneficiary.civilRegistration.lastUpdatedDate && (
                    <div className="pt-2 text-right text-[11px] text-slate-400">
                      อัปเดตล่าสุดเมื่อ {beneficiary.civilRegistration.lastUpdatedDate} โดย {beneficiary.civilRegistration.lastUpdatedBy}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 6: แผนฟื้นฟูสมรรถภาพ ==================== */}
          {activeTab === 'rehab' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">แผนการฟื้นฟูสมรรถภาพรายบุคคล</h3>
                <button
                  onClick={onOpenRehabModal}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  + จัดทำ/ปรับปรุงแผนฟื้นฟู
                </button>
              </div>
              {beneficiary.rehabPlans?.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                  ยังไม่มีแผนฟื้นฟูสมรรถภาพรายบุคคล
                </div>
              ) : (
                beneficiary.rehabPlans.map((plan) => (
                  <div key={plan.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900">
                        {plan.planType === 'initial' ? 'แผนฉบับแรก' : `แผนปรับปรุง ครั้งที่ ${plan.revisionNumber || 1}`} (วันที่ {plan.planDate})
                      </span>
                      <span className="text-slate-500">ผู้จัดทำ: {plan.plannerName}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800">1. ด้านการแพทย์และสุขภาพ</div>
                        <div className="text-slate-600 mt-1">{plan.medicalAndHealth.issuesAndGoals}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800">2. ด้านจิตใจและอารมณ์</div>
                        <div className="text-slate-600 mt-1">{plan.emotionalAndPsychological.issuesAndGoals}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800">3. ด้านการศึกษาและสติปัญญา</div>
                        <div className="text-slate-600 mt-1">{plan.cognitiveAndEducation.issuesAndGoals}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800">4. ด้านอาชีพและศักยภาพ</div>
                        <div className="text-slate-600 mt-1">{plan.careerAndPotential.issuesAndGoals}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==================== TAB 7: ไทม์ไลน์รายบุคคล ==================== */}
          {activeTab === 'timeline' && (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {(beneficiary.timeline || []).map((ev) => (
                <div key={ev.id} className="relative">
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                      ev.severity === 'urgent'
                        ? 'bg-rose-600'
                        : ev.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  />
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ev.title}</span>
                      <span className="font-mono text-[11px] text-slate-500">{ev.date}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{ev.description}</p>
                    <div className="text-[10px] text-slate-400 mt-1.5">ผู้บันทึก: {ev.actor}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Preview Modal */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-xs">{previewZoomImage.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl flex items-center justify-center bg-slate-950">
              <img
                src={previewZoomImage.url}
                alt={previewZoomImage.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Photo Modal */}
      {isEditProfileOpen && (
        <EditBeneficiaryProfileModal
          beneficiary={activeBeneficiary}
          nikhoms={nikhoms}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleProfileSave}
        />
      )}

      {/* Official A4-Printable Dossier Modal */}
      {isPrintDossierOpen && (
        <BeneficiaryDossierPrintModal
          beneficiary={activeBeneficiary}
          nikhoms={nikhoms}
          isOpen={isPrintDossierOpen}
          onClose={() => setIsPrintDossierOpen(false)}
        />
      )}
    </div>
  );
};
