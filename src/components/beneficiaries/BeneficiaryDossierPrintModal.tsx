import React from 'react';
import { 
  X, Printer, Download, User, ShieldCheck, HeartPulse, 
  Briefcase, Activity, Calendar, FileText, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';
import { Beneficiary, Nikhom, DISABILITY_TYPE_LABELS } from '../../types';
import { formatThaiDate } from '../../utils/irpUtils';

interface BeneficiaryDossierPrintModalProps {
  beneficiary: Beneficiary;
  nikhoms: Nikhom[];
  isOpen: boolean;
  onClose: () => void;
}

export const BeneficiaryDossierPrintModal: React.FC<BeneficiaryDossierPrintModalProps> = ({
  beneficiary,
  nikhoms,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const nikhom = nikhoms.find((n) => n.id === beneficiary.nikhomId);
  const nikhomName = nikhom ? `${nikhom.name} (จ.${nikhom.province})` : beneficiary.nikhomId;

  const todayTh = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const latestIRP = beneficiary.latestIRP;
  const latestPlan = beneficiary.rehabPlans && beneficiary.rehabPlans[0];
  const chronologicalIRPs = [...(beneficiary.irpHistory || [])].sort((a, b) => a.round - b.round);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 max-h-[94vh] flex flex-col my-auto overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:m-0">
        
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm font-bold">
                แฟ้มประวัติและแผนฟื้นฟูสมรรถภาพรายบุคคล (ชุดสมบูรณ์จัดเก็บ ณ หน่วยงาน)
              </div>
              <div className="text-xs text-slate-300">
                รหัสประจำตัว BNN: <span className="font-mono text-amber-400 font-bold">{beneficiary.uniquePersonId}</span> · {beneficiary.fullName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร / บันทึกเป็น PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          id="printable-dossier" 
          className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-['Prompt',sans-serif] print:p-0 print:overflow-visible text-[12px] leading-relaxed"
        >
          {/* ================= PAGE 1 ================= */}
          <div className="dossier-page break-after-page space-y-6">
            {/* Official Header with Insignia */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                {/* Garuda / Thai Government Emblem Graphic */}
                <svg viewBox="0 0 100 100" className="w-16 h-16 text-slate-900 fill-current">
                  <path d="M50 8 C40 18 35 30 25 35 C35 38 42 35 45 42 C40 46 32 45 28 50 C38 52 44 48 48 55 C42 62 30 65 20 72 C32 72 40 68 47 64 C45 72 40 82 50 92 C60 82 55 72 53 64 C60 68 68 72 80 72 C70 65 58 62 52 55 C56 48 62 52 72 50 C68 45 60 46 55 42 C58 35 65 38 75 35 C65 30 60 18 50 8 Z" opacity="0.85"/>
                </svg>
              </div>

              <div className="text-xs font-semibold text-slate-700 tracking-wider">
                กรมพัฒนาสังคมและสวัสดิการ · กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                แฟ้มประวัติผู้ใช้บริการและแผนการฟื้นฟูสมรรถภาพรายบุคคล (IRP)
              </h1>
              <div className="text-xs font-bold text-slate-800">
                โครงการบ้านน้อยในนิคม · แบบฟอร์มมาตรฐานจัดเก็บประจำหน่วยงาน
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 px-2">
                <div>
                  <strong>หน่วยงานสังกัด:</strong> {nikhomName}
                </div>
                <div>
                  <strong>วันที่ออกเอกสาร:</strong> {todayTh}
                </div>
              </div>
            </div>

            {/* Official Primary Identifier Bar (BNN ID) */}
            <div className="bg-slate-100 border-2 border-slate-900 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  รหัสประจำตัวผู้ใช้บริการเฉพาะติดตัวตลอดชีพ (BNN ID)
                </span>
                <span className="font-mono text-2xl font-black text-slate-950 tracking-wider">
                  {beneficiary.uniquePersonId}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-600 block">สถานะปัจจุบัน</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-400 inline-block text-slate-900">
                  {beneficiary.status === 'resident'
                    ? 'พำนักในโครงการบ้านน้อย'
                    : beneficiary.status === 'discharged'
                    ? 'จำหน่ายออกจากโครงการ'
                    : 'เตรียมความพร้อมก่อนเข้า'}
                </span>
              </div>
            </div>

            {/* SECTION 1: Personal Profile & Photos */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3">
              <div className="font-bold text-sm text-slate-950 border-b border-slate-300 pb-1.5 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>ตอนที่ ๑: ข้อมูลประวัติแรกรับและอัตลักษณ์บุคคล</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Photos column */}
                <div className="md:col-span-4 flex flex-col items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {/* Profile photo */}
                  <div className="text-center">
                    <div className="w-28 h-36 bg-slate-200 rounded border border-slate-400 overflow-hidden shadow-xs mx-auto flex items-center justify-center">
                      {beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl ? (
                        <img
                          src={beneficiary.photoUrl || beneficiary.tp1Profile?.photoUrl}
                          alt={beneficiary.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-400 text-center p-2">
                          <User className="w-10 h-10 mx-auto opacity-50" />
                          <span className="text-[10px] block mt-1">รูปถ่ายหน้าตรง</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 block mt-1">รูปถ่ายหน้าตรง</span>
                  </div>

                  {/* Physical marks photo (if available) */}
                  {(beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl) && (
                    <div className="text-center pt-2 border-t border-slate-200 w-full">
                      <div className="w-24 h-24 bg-slate-200 rounded border border-slate-400 overflow-hidden shadow-xs mx-auto flex items-center justify-center">
                        <img
                          src={beneficiary.physicalMarksPhotoUrl || beneficiary.tp1Profile?.physicalMarksPhotoUrl}
                          alt="ตำหนิรูปพรรณ"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 block mt-1">รูปถ่ายตำหนิรูปพรรณ</span>
                    </div>
                  )}
                </div>

                {/* Profile info fields */}
                <div className="md:col-span-8 space-y-2 text-[11px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">ชื่อ - นามสกุล:</span>
                      <strong className="text-sm text-slate-950 font-bold">{beneficiary.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">เลขประจำตัวประชาชน (๑๓ หลัก):</span>
                      <strong className="font-mono text-slate-900">{beneficiary.nationalId || 'ไม่มีเอกสาร / อยู่ระหว่างสืบค้น'}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">เพศ:</span>
                      <strong>{beneficiary.gender === 'male' ? 'ชาย' : 'หญิง'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">อายุ:</span>
                      <strong>{beneficiary.age} ปี</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">วันเดือนปีเกิด (พ.ศ.):</span>
                      <strong>
                        {beneficiary.tp1Profile?.birthDateKnown
                          ? `${beneficiary.tp1Profile.birthDay || ''} ${beneficiary.tp1Profile.birthMonthTh || ''} พ.ศ. ${beneficiary.tp1Profile.birthYearBuddhist || ''}`
                          : 'ไม่ทราบแน่ชัด'}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">ภูมิลำเนาเดิม:</span>
                      <span>{beneficiary.tp1Profile?.hometownAddress || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">อาคาร / เรือนพักในนิคม:</span>
                      <strong>{beneficiary.building}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">ชื่อบิดา:</span>
                      <span>{beneficiary.tp1Profile?.fatherName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ชื่อมารดา:</span>
                      <span>{beneficiary.tp1Profile?.motherName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">สถานภาพสมรส:</span>
                      <span>
                        {beneficiary.tp1Profile?.maritalStatus === 'single' ? 'โสด' :
                         beneficiary.tp1Profile?.maritalStatus === 'married' ? 'สมรส' :
                         beneficiary.tp1Profile?.maritalStatus === 'divorced' ? 'หย่าร้าง' :
                         beneficiary.tp1Profile?.maritalStatus === 'widowed' ? 'หม้าย' : 'อื่นๆ'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">ระดับการศึกษาสูงสุด:</span>
                      <span>{beneficiary.tp1Profile?.educationHistory || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">อาชีพเดิมก่อนเข้าโครงการ:</span>
                      <span>{beneficiary.tp1Profile?.previousOccupation || '-'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">วันที่รับเข้าโครงการ:</span>
                      <strong>{formatThaiDate(beneficiary.admissionDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">หน่วยงานที่นำส่ง:</span>
                      <span>{beneficiary.referringAgency}</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-slate-500 block">ตำหนิรูปพรรณ / รอยสัก / แผลเป็น:</span>
                    <span>{beneficiary.tp1Profile?.distinguishingMarks || 'ไม่มีตำหนิรูปพรรณพิเศษ'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">บุคลิกลักษณะและอุปนิสัย:</span>
                    <span>{beneficiary.personalityTraits || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Health & Medical Profile */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3">
              <div className="font-bold text-sm text-slate-950 border-b border-slate-300 pb-1.5 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>ตอนที่ ๒: ข้อมูลสุขภาพ ภาวะความพิการ และการดูแลทางการแพทย์</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">ความดันโลหิต:</span>
                  <strong>{beneficiary.initialHealth?.bloodPressure || '120/80 mmHg'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">น้ำหนัก:</span>
                  <strong>{beneficiary.tp1Profile?.weightKg || beneficiary.initialHealth?.weightKg || '-'} กก.</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">ส่วนสูง:</span>
                  <strong>{beneficiary.tp1Profile?.heightCm || '-'} ซม.</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">ประวัติการแพ้ยา/อาหาร:</span>
                  <strong className={beneficiary.initialHealth?.drugAllergies && beneficiary.initialHealth.drugAllergies !== 'ไม่มี' ? 'text-rose-700' : ''}>
                    {beneficiary.initialHealth?.drugAllergies || 'ไม่มี'}
                  </strong>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div>
                  <span className="text-slate-500 font-semibold">โรคประจำตัว / การวินิจฉัยทางการแพทย์:</span>{' '}
                  <span className="font-bold text-slate-900">{beneficiary.chronicDiseases || 'ไม่มีโรคประจำตัวร้ายแรง'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">ยาที่ต้องรับประทานต่อเนื่อง:</span>{' '}
                  <span>{beneficiary.initialHealth?.medications || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">การจำแนกประเภทความพิการ (ตามประกาศ พม.):</span>{' '}
                  <span className="font-bold text-slate-900">
                    {beneficiary.category === 'disabled'
                      ? beneficiary.disabilityTypes && beneficiary.disabilityTypes.length > 0
                        ? beneficiary.disabilityTypes.map((t) => `ประเภท ${t} (${DISABILITY_TYPE_LABELS[t]})`).join(', ')
                        : 'ผู้พิการ'
                      : 'คนไร้ที่พึ่ง'}
                    {beneficiary.hasMultipleDisabilities && ' (พิการซ้ำซ้อน)'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Civil Registration & Welfare */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-2.5">
              <div className="font-bold text-sm text-slate-950 border-b border-slate-300 pb-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>ตอนที่ ๓: สถานะทางทะเบียนราษฎร์ สิทธิสวัสดิการ และการสืบหาญาติ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">๑. บัตรประจำตัวประชาชน:</span>
                  <strong>
                    {beneficiary.civilRegistration?.hasNationalIdCard ? 'มีบัตรประชาชน' : 'ไม่มีบัตร'}
                  </strong>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">๒. ตรวจสอบทะเบียนราษฎร์:</span>
                  <strong>
                    {beneficiary.civilRegistration?.civilRegistrationChecked ? 'ตรวจสอบแล้ว' : 'ยังไม่ได้ตรวจสอบ'}
                  </strong>
                  {beneficiary.civilRegistration?.civilRegistrationNote && (
                    <div className="text-[10px] text-slate-500 mt-0.5">{beneficiary.civilRegistration.civilRegistrationNote}</div>
                  )}
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">๓. ตรวจลายพิมพ์นิ้วมือ:</span>
                  <strong>
                    {beneficiary.civilRegistration?.fingerprintStatus === 'found' ? 'พบในฐานข้อมูล' :
                     beneficiary.civilRegistration?.fingerprintStatus === 'not_found' ? 'ไม่พบในฐานข้อมูล' : 'ยังไม่ได้ตรวจ'}
                  </strong>
                </div>
              </div>

              <div className="text-[11px] pt-1 space-y-1">
                <div>
                  <span className="text-slate-500 font-semibold">สิทธิการรักษาพยาบาล:</span>{' '}
                  <span className="font-bold text-slate-800">{beneficiary.civilRegistration?.medicalRights || 'สิทธิหลักประกันสุขภาพ (บัตรทอง ท.74)'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">สถานะเบี้ยสวัสดิการ:</span>{' '}
                  <span>
                    {beneficiary.civilRegistration?.allowanceStatus === 'receiving' ? 'ได้รับเบี้ยความพิการ/ผู้สูงอายุเรียบร้อยแล้ว' :
                     beneficiary.civilRegistration?.allowanceStatus === 'in_progress' ? 'อยู่ระหว่างดำเนินการขอรับสิทธิ์' : 'ยังไม่มีสิทธิสวัสดิการ'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: Activities & Employment */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-2.5">
              <div className="font-bold text-sm text-slate-950 border-b border-slate-300 pb-1.5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>ตอนที่ ๔: กิจกรรมฟื้นฟู อาชีวบำบัด และการสร้างรายได้</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">กิจกรรมอาชีวบำบัดที่เข้าร่วม:</span>
                  <div className="text-slate-700">
                    {beneficiary.activityDetails && beneficiary.activityDetails.length > 0
                      ? beneficiary.activityDetails
                          .filter((a) => a.enabled)
                          .map((a) => `${a.details || a.category} (${a.participationType === 'employment' ? 'การจ้างงาน' : 'อาชีวบำบัด'})`)
                          .join(', ') || 'เข้าร่วมกิจกรรมพื้นฐานตามความพร้อม'
                      : 'เข้าร่วมกิจกรรมพื้นฐานตามความพร้อม'}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">รูปแบบการจ้างงานและรายได้:</span>
                  <div className="text-slate-700">
                    <div>
                      <strong>รูปแบบงาน:</strong>{' '}
                      <span className="text-slate-800">{beneficiary.incomeSource || 'ฝึกอาชีพและฟื้นฟูสมรรถภาพในหน่วยงาน'}</span>
                    </div>
                    <div>
                      <strong>รายได้เฉลี่ยรวม:</strong>{' '}
                      <span className="font-black text-amber-900 tabular-nums">
                        {(beneficiary.monthlyIncome || 0).toLocaleString()} บาท/เดือน
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= PAGE 2 ================= */}
          <div className="dossier-page break-after-page space-y-6 pt-6 print:pt-4">
            {/* Header for Page 2 */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-600">
              <span>รหัสประจำตัว BNN: <strong>{beneficiary.uniquePersonId}</strong> · {beneficiary.fullName}</span>
              <span>โครงการบ้านน้อยในนิคม · แบบประเมิน IRP และแผนฟื้นฟู (แผ่นที่ ๒)</span>
            </div>

            {/* SECTION 5: IRP Evaluation History Table */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3">
              <div className="font-bold text-sm text-slate-950 border-b border-slate-300 pb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-700" />
                  <span>ตอนที่ ๕: ตารางผลการประเมินสมรรถภาพรายบุคคล (IRP Assessment Table)</span>
                </div>
                {latestIRP && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    latestIRP.isUnder50Percent ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    ผลรอบล่าสุด: {latestIRP.totalScore}/140 คะแนน ({latestIRP.scorePercentage.toFixed(1)}%)
                  </span>
                )}
              </div>

              {/* Table of IRP Rounds */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border border-slate-300 text-center">รอบที่</th>
                      <th className="p-2 border border-slate-300">วันที่ประเมิน</th>
                      <th className="p-2 border border-slate-300 text-center">ร่างกาย (40)</th>
                      <th className="p-2 border border-slate-300 text-center">จิตใจ (30)</th>
                      <th className="p-2 border border-slate-300 text-center">ปัญญา (30)</th>
                      <th className="p-2 border border-slate-300 text-center">ศักยภาพ (40)</th>
                      <th className="p-2 border border-slate-300 text-center">รวม (140)</th>
                      <th className="p-2 border border-slate-300 text-center">%</th>
                      <th className="p-2 border border-slate-300">ระดับศักยภาพ</th>
                      <th className="p-2 border border-slate-300">ผู้ประเมิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chronologicalIRPs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-3 text-center text-slate-500">
                          ยังไม่มีประวัติการประเมิน IRP ในระบบ
                        </td>
                      </tr>
                    ) : (
                      chronologicalIRPs.map((irp) => {
                        const s = irp.scores;
                        const body = (s.hygiene || 0) + (s.clothingCleanliness || 0) + (s.physicalHealth || 0) + (s.selfCareAbility || 0);
                        const mind = (s.communication || 0) + (s.emotionalExpression || 0) + (s.emotionalControl || 0);
                        const brain = (s.followInstructions || 0) + (s.expressNeeds || 0) + (s.basicMathAccounting || 0);
                        const pot = (s.dailyDutyAndRoutine || 0) + (s.fundamentalRightsAwareness || 0) + (s.careerAndIncome || 0) + (s.selfDevelopmentEagerness || 0);
                        
                        return (
                          <tr key={irp.id || irp.round} className="border-b border-slate-200">
                            <td className="p-2 border border-slate-300 text-center font-bold">ครั้งที่ {irp.round}</td>
                            <td className="p-2 border border-slate-300">{formatThaiDate(irp.evaluationDate)}</td>
                            <td className="p-2 border border-slate-300 text-center tabular-nums">{body}</td>
                            <td className="p-2 border border-slate-300 text-center tabular-nums">{mind}</td>
                            <td className="p-2 border border-slate-300 text-center tabular-nums">{brain}</td>
                            <td className="p-2 border border-slate-300 text-center tabular-nums">{pot}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold tabular-nums">{irp.totalScore}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold tabular-nums">{irp.scorePercentage.toFixed(1)}%</td>
                            <td className="p-2 border border-slate-300">
                              {irp.evaluationResult === 'needs_improvement' ? 'ควรปรับปรุง' :
                               irp.evaluationResult === 'moderate' ? 'ปานกลาง' : 'มีศักยภาพ'}
                            </td>
                            <td className="p-2 border border-slate-300 text-slate-700">{irp.evaluatorName}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {latestIRP?.notes && (
                <div className="bg-amber-50/60 p-2.5 rounded border border-amber-200 text-[11px]">
                  <span className="font-bold text-amber-950">ข้อสังเกตและข้อเสนอแนะของผู้ประเมิน:</span>{' '}
                  <span className="text-slate-800">{latestIRP.notes}</span>
                </div>
              )}
            </div>

            {/* SECTION 6: Rehabilitation Plan (Rehab Plan Details) */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3">
              <div className="font-bold text-sm text-slate-950 border-b border-slate-300 pb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ตอนที่ ๖: แผนฟื้นฟูสมรรถภาพรายบุคคล (Individual Rehabilitation Plan)</span>
                </div>
                {latestPlan && (
                  <span className="text-[11px] text-slate-600">
                    จัดทำเมื่อ: {formatThaiDate(latestPlan.planDate)} โดย {latestPlan.plannerName}
                  </span>
                )}
              </div>

              {/* 5 Dimensions Grid */}
              <div className="space-y-2.5 text-[11px]">
                {/* 1. Medical & Health */}
                <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>๑. ด้านการแพทย์และสุขภาพ</span>
                    <span className="text-slate-500 font-normal">กรอบเวลา: {latestPlan?.medicalAndHealth.timeline || '๑ - ๓ เดือน'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><strong>ปัญหา/เป้าหมาย:</strong> {latestPlan?.medicalAndHealth.issuesAndGoals || 'รักษาสุขภาพร่างกาย ตรวจโรคประจำตัวต่อเนื่อง'}</div>
                    <div><strong>แผนดำเนินงาน:</strong> {latestPlan?.medicalAndHealth.actionPlan || 'จัดเจ้าหน้าที่ประกบกำกับกิจวัตร และนัดตรวจสุขภาพต่อเนื่อง'}</div>
                  </div>
                  {latestPlan?.medicalAndHealth.items && latestPlan.medicalAndHealth.items.length > 0 && (
                    <div className="text-[10px] text-slate-600">
                      <strong>บริการ/กิจกรรม:</strong> {latestPlan.medicalAndHealth.items.join(', ')}
                    </div>
                  )}
                </div>

                {/* 2. Emotional & Psychological */}
                <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>๒. ด้านจิตใจและอารมณ์</span>
                    <span className="text-slate-500 font-normal">กรอบเวลา: {latestPlan?.emotionalAndPsychological.timeline || '๓ เดือน'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><strong>ปัญหา/เป้าหมาย:</strong> {latestPlan?.emotionalAndPsychological.issuesAndGoals || 'ลดความเครียด วิตกกังวล และสร้างสัมพันธภาพ'}</div>
                    <div><strong>แผนดำเนินงาน:</strong> {latestPlan?.emotionalAndPsychological.actionPlan || 'จัดกิจกรรมกลุ่มบำบัด สมาธิบำบัด และนันทนาการ'}</div>
                  </div>
                </div>

                {/* 3. Cognitive & Education */}
                <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>๓. ด้านสติปัญญาและการศึกษา</span>
                    <span className="text-slate-500 font-normal">กรอบเวลา: {latestPlan?.cognitiveAndEducation.timeline || '๖ เดือน'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><strong>ปัญหา/เป้าหมาย:</strong> {latestPlan?.cognitiveAndEducation.issuesAndGoals || 'ฟื้นฟูความจำ การทำความเข้าใจคำสั่ง และการสื่อสาร'}</div>
                    <div><strong>แผนดำเนินงาน:</strong> {latestPlan?.cognitiveAndEducation.actionPlan || 'ฝึกการตอบสนองผ่านศิลปะบำบัด และแบบฝึกหัดพื้นฐาน'}</div>
                  </div>
                </div>

                {/* 4. Career & Potential */}
                <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>๔. ด้านอาชีพและศักยภาพ</span>
                    <span className="text-slate-500 font-normal">กรอบเวลา: {latestPlan?.careerAndPotential.timeline || '๖ - ๑๒ เดือน'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><strong>ปัญหา/เป้าหมาย:</strong> {latestPlan?.careerAndPotential.issuesAndGoals || 'ฝึกวินัยในกิจวัตรประจำวัน และพัฒนาทักษะอาชีพตามความถนัด'}</div>
                    <div><strong>แผนดำเนินงาน:</strong> {latestPlan?.careerAndPotential.actionPlan || 'มอบหมายหน้าที่ทำแปลงเกษตร หรืองานหัตถกรรมจักสานเพื่อสร้างรายได้'}</div>
                  </div>
                </div>

                {/* 5. Social & Community */}
                <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>๕. ด้านสังคมและการมีส่วนร่วม</span>
                    <span className="text-slate-500 font-normal">กรอบเวลา: {latestPlan?.socialAndCommunity.timeline || '๑๒ เดือน'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><strong>ปัญหา/เป้าหมาย:</strong> {latestPlan?.socialAndCommunity.issuesAndGoals || 'การปรับตัวอยู่ร่วมกับผู้อื่นในบ้านพักและชุมชน'}</div>
                    <div><strong>แผนดำเนินงาน:</strong> {latestPlan?.socialAndCommunity.actionPlan || 'ชวนร่วมโต๊ะอาหาร ทำงานกลุ่ม และเข้าร่วมประเพณีชุมชน'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 7: Official Signatures Section for Archive */}
            <div className="border-2 border-slate-900 rounded-xl p-4 mt-6">
              <div className="font-bold text-xs text-center text-slate-900 mb-6 uppercase tracking-wider">
                การรับรองเอกสารและลงนามสำหรับจัดเก็บเข้าแฟ้มข้อมูลประจำหน่วยงาน
              </div>

              <div className="grid grid-cols-2 gap-8 text-center text-[11px]">
                {/* Officer Signature */}
                <div className="space-y-4">
                  <div className="h-10 border-b border-dashed border-slate-500 w-3/4 mx-auto"></div>
                  <div>
                    <div className="font-bold text-slate-900">
                      (.......................................................................)
                    </div>
                    <div className="text-slate-600 mt-1">เจ้าหน้าที่ผู้รับผิดชอบ / นักสังคมสงเคราะห์</div>
                    <div className="text-slate-500 text-[10px]">วันที่ .......... / .......... / ....................</div>
                  </div>
                </div>

                {/* Director Signature */}
                <div className="space-y-4">
                  <div className="h-10 border-b border-dashed border-slate-500 w-3/4 mx-auto"></div>
                  <div>
                    <div className="font-bold text-slate-900">
                      (.......................................................................)
                    </div>
                    <div className="text-slate-600 mt-1">ผู้ปกครองนิคมสร้างตนเอง / ผู้อำนวยการศูนย์ฯ</div>
                    <div className="text-slate-500 text-[10px]">วันที่ .......... / .......... / ....................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden during print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs print:hidden shrink-0">
          <div className="text-slate-500">
            * เอกสารชุดนี้จัดทำขึ้นตามแบบมาตรฐาน พม. สามารถกด &quot;พิมพ์เอกสาร&quot; เพื่อสั่งพิมพ์กระดาษ A4 หรือบันทึกเป็นไฟล์ PDF
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
