import React, { useState } from 'react';
import { 
  X, CheckSquare, Square, Calendar, HeartHandshake, ShieldAlert, 
  Sparkles, Check, AlertTriangle, ArrowRight, User
} from 'lucide-react';
import { Beneficiary, RehabPlan } from '../../types';

interface RehabPlanModalProps {
  beneficiary: Beneficiary;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Omit<RehabPlan, 'id'>) => void;
  plannerDefaultName: string;
  targetFocusDomains?: string[]; // e.g. ['medicalAndHealth', 'emotionalAndPsychological', 'cognitiveAndEducation', 'careerAndPotential']
}

export const RehabPlanModal: React.FC<RehabPlanModalProps> = ({
  beneficiary,
  isOpen,
  onClose,
  onSave,
  plannerDefaultName,
  targetFocusDomains = [],
}) => {
  const isUrgent = beneficiary.latestIRP?.isUnder50Percent;
  const existingPlans = beneficiary.rehabPlans || [];
  const latestPlan = existingPlans[0];

  const [planType, setPlanType] = useState<'initial' | 'revised'>(
    existingPlans.length > 0 ? 'revised' : 'initial'
  );
  const [revisionNumber, setRevisionNumber] = useState(
    existingPlans.length > 0 ? existingPlans.length + 1 : 1
  );
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannerName, setPlannerName] = useState(plannerDefaultName);

  // 1. ด้านการแพทย์และสุขภาพ
  const isMedicalFocus = targetFocusDomains.includes('medicalAndHealth');
  const [medicalIssues, setMedicalIssues] = useState(
    latestPlan?.medicalAndHealth.issuesAndGoals ||
      (isMedicalFocus || isUrgent
        ? 'ฟื้นฟูสุขอนามัยส่วนบุคคล การดูแลความสะอาดร่างกาย และติดตามการรับประทานยาอย่างเคร่งครัด'
        : 'รักษาสุขภาพร่างกาย ตรวจโรคประจำตัวต่อเนื่อง')
  );
  const [medicalAction, setMedicalAction] = useState(
    latestPlan?.medicalAndHealth.actionPlan ||
      (isMedicalFocus || isUrgent
        ? 'จัดเจ้าหน้าที่ประกบกำกับกิจวัตรอาบน้ำแปรงฟันเช้า-เย็น และนัดตรวจสุขภาพทุกเดือน'
        : 'ตรวจสุขภาพประจำปี ออกกำลังกายสม่ำเสมอ')
  );
  const [medicalTimeline, setMedicalTimeline] = useState(
    latestPlan?.medicalAndHealth.timeline || '1 - 3 เดือน'
  );
  const [medicalItems, setMedicalItems] = useState<string[]>(
    latestPlan?.medicalAndHealth.items || ['ตรวจสุขภาพ', 'การออกกำลังกาย', 'โภชนาการบำบัด']
  );

  // 2. ด้านจิตใจ/อารมณ์
  const isEmotionalFocus = targetFocusDomains.includes('emotionalAndPsychological');
  const [emotionalIssues, setEmotionalIssues] = useState(
    latestPlan?.emotionalAndPsychological.issuesAndGoals ||
      (isEmotionalFocus || isUrgent
        ? 'ลดความเครียด วิตกกังวล และสร้างความรู้สึกปลอดภัย ไว้วางใจผู้ดูแล'
        : 'เสริมสร้างสุขภาพจิตและความสัมพันธ์ที่ดีกับเพื่อนร่วมบ้าน')
  );
  const [emotionalAction, setEmotionalAction] = useState(
    latestPlan?.emotionalAndPsychological.actionPlan ||
      (isEmotionalFocus || isUrgent
        ? 'จัดกิจกรรมดนตรีบำบัด สมาธิบำบัด และพูดคุยรายบุคคลสัปดาห์ละ 2 ครั้ง'
        : 'เข้าร่วมกลุ่มบำบัดและกิจกรรมนันทนาการประจำสัปดาห์')
  );
  const [emotionalTimeline, setEmotionalTimeline] = useState(
    latestPlan?.emotionalAndPsychological.timeline || '3 เดือน'
  );
  const [emotionalItems, setEmotionalItems] = useState<string[]>(
    latestPlan?.emotionalAndPsychological.items || ['กลุ่มบำบัด', 'สมาธิบำบัด', 'นันทนาการ']
  );

  // 3. ด้านการศึกษา/สติปัญญา
  const isCognitiveFocus = targetFocusDomains.includes('cognitiveAndEducation');
  const [cognitiveIssues, setCognitiveIssues] = useState(
    latestPlan?.cognitiveAndEducation.issuesAndGoals ||
      (isCognitiveFocus
        ? 'ฟื้นฟูการรับรู้ ความเข้าใจคำสั่ง การสื่อสารความต้องการ และฝึกการคิดคำนวณเบื้องต้น'
        : 'ฟื้นฟูความจำ การทำความเข้าใจคำสั่ง และการสื่อสารความต้องการ')
  );
  const [cognitiveAction, setCognitiveAction] = useState(
    latestPlan?.cognitiveAndEducation.actionPlan ||
      (isCognitiveFocus
        ? 'ฝึกการตอบสนองผ่านเกมฝึกสมอง ศิลปะบำบัด และแบบฝึกหัดคำนวณการใช้จ่ายประจำวัน'
        : 'ฝึกการตอบสนองผ่านเกมฝึกสมอง ศิลปะบำบัด และแบบฝึกหัดพื้นฐาน')
  );
  const [cognitiveTimeline, setCognitiveTimeline] = useState(
    latestPlan?.cognitiveAndEducation.timeline || '6 เดือน'
  );
  const [cognitiveItems, setCognitiveItems] = useState<string[]>(
    latestPlan?.cognitiveAndEducation.items || ['ศิลปะบำบัด', 'เรียนหนังสือ']
  );

  // 4. ด้านอาชีพและศักยภาพ
  const isCareerFocus = targetFocusDomains.includes('careerAndPotential');
  const [careerIssues, setCareerIssues] = useState(
    latestPlan?.careerAndPotential.issuesAndGoals ||
      (isCareerFocus || isUrgent
        ? 'ฝึกวินัยในกิจวัตรประจำวัน การจัดเก็บที่นอน และการรับผิดชอบงานส่วนตัว'
        : 'พัฒนาทักษะอาชีพตามความถนัด เช่น เกษตรกรรม หัตถกรรม')
  );
  const [careerAction, setCareerAction] = useState(
    latestPlan?.careerAndPotential.actionPlan ||
      (isCareerFocus || isUrgent
        ? 'มอบหมายหน้าที่ดูแลความสะอาดพื้นที่ตนเองทีละขั้นตอน และฝึกทำงานกลุ่ม'
        : 'ฝึกงานในแปลงเกษตร หรือกลุ่มหัตถกรรมจักสาน เพื่อสร้างรายได้')
  );
  const [careerTimeline, setCareerTimeline] = useState(
    latestPlan?.careerAndPotential.timeline || '6 - 12 เดือน'
  );
  const [careerItems, setCareerItems] = useState<string[]>(
    latestPlan?.careerAndPotential.items || ['ฝึกกิจวัตรประจำวัน', 'การช่วยงานผู้ดูแล', 'เกษตรกรรม']
  );

  // 5. ด้านสังคม
  const [socialIssues, setSocialIssues] = useState(
    latestPlan?.socialAndCommunity.issuesAndGoals ||
      'การปรับตัวอยู่ร่วมกับผู้อื่นในบ้านพักและชุมชน'
  );
  const [socialAction, setSocialAction] = useState(
    latestPlan?.socialAndCommunity.actionPlan ||
      'ชวนร่วมโต๊ะอาหาร ทำงานกลุ่ม และเข้าร่วมงานบุญประเพณี'
  );
  const [socialTimeline, setSocialTimeline] = useState(
    latestPlan?.socialAndCommunity.timeline || '12 เดือน'
  );

  // Monthly Schedule (Oct to Sep)
  const [monthlySchedule, setMonthlySchedule] = useState(
    latestPlan?.monthlySchedule || {
      oct: true, nov: true, dec: true, jan: true,
      feb: true, mar: true, apr: true, may: true,
      jun: true, jul: true, aug: true, sep: true,
    }
  );

  if (!isOpen) return null;

  const toggleMonth = (m: keyof typeof monthlySchedule) => {
    setMonthlySchedule((prev) => ({ ...prev, [m]: !prev[m] }));
  };

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      beneficiaryId: beneficiary.id,
      planType,
      revisionNumber: planType === 'revised' ? revisionNumber : undefined,
      planDate,
      plannerName,
      medicalAndHealth: {
        issuesAndGoals: medicalIssues,
        actionPlan: medicalAction,
        timeline: medicalTimeline,
        items: medicalItems,
      },
      emotionalAndPsychological: {
        issuesAndGoals: emotionalIssues,
        actionPlan: emotionalAction,
        timeline: emotionalTimeline,
        items: emotionalItems,
      },
      cognitiveAndEducation: {
        issuesAndGoals: cognitiveIssues,
        actionPlan: cognitiveAction,
        timeline: cognitiveTimeline,
        items: cognitiveItems,
      },
      careerAndPotential: {
        issuesAndGoals: careerIssues,
        actionPlan: careerAction,
        timeline: careerTimeline,
        items: careerItems,
      },
      socialAndCommunity: {
        issuesAndGoals: socialIssues,
        actionPlan: socialAction,
        timeline: socialTimeline,
        items: ['การมีส่วนร่วมในชุมชน', 'กิจกรรมกลุ่มนันทนาการ'],
      },
      monthlySchedule,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 max-h-[92vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-amber-100">
                แผนการฟื้นฟูสมรรถภาพรายบุคคล (Individual Rehabilitation Plan - Rehab Plan)
              </span>
              {(isUrgent || targetFocusDomains.length > 0) && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  แผนฟื้นฟูเร่งด่วนสำหรับ IRP &lt; 50%
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2 flex-wrap">
              <span>{beneficiary.fullName}</span>
              <span className="font-mono text-xs font-bold bg-white/25 px-2.5 py-0.5 rounded-md">
                รหัสประจำตัว BNN: {beneficiary.uniquePersonId}
              </span>
              <span className="text-xs text-amber-100">({beneficiary.building})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-2 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Target Domain Alert Banner (Shown when linked from IRP evaluation with < 50%) */}
          {targetFocusDomains.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">
                  ระบบเชื่อมโยงจากการประเมิน IRP: ตรวจพบด้านที่คะแนนต่ำกว่า 50% ({targetFocusDomains.length} ด้าน)
                </h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  กรุณาตรวจสอบและกำหนดเป้าหมาย แผนปฏิบัติงาน และกิจกรรมบำบัดสำหรับด้านที่มีกรอบสีแดงด้านล่าง เพื่อให้สอดคล้องกับผลการประเมินสมรรถภาพ
                </p>
              </div>
            </div>
          )}

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                ประเภทแผนฟื้นฟู
              </label>
              <div className="flex items-center gap-4 mt-2 text-sm font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="planType"
                    checked={planType === 'initial'}
                    onChange={() => setPlanType('initial')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span>แผนฉบับแรก</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="planType"
                    checked={planType === 'revised'}
                    onChange={() => setPlanType('revised')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span>แผนปรับปรุง</span>
                </label>
              </div>
            </div>

            {planType === 'revised' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ปรับปรุงครั้งที่
                </label>
                <input
                  type="number"
                  min={1}
                  value={revisionNumber}
                  onChange={(e) => setRevisionNumber(Number(e.target.value))}
                  className="w-full text-sm font-semibold border border-slate-300 rounded-xl p-2.5 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                วันที่จัดทำแผน
              </label>
              <input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-300 rounded-xl p-2.5 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                ผู้จัดทำแผน / นักสังคมสงเคราะห์
              </label>
              <input
                type="text"
                value={plannerName}
                onChange={(e) => setPlannerName(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-300 rounded-xl p-2.5 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* ================= DIMENSION 1: Medical & Health ================= */}
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isMedicalFocus 
              ? 'bg-rose-50/30 border-2 border-rose-400 shadow-sm' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  ๑. ด้านการแพทย์และสุขภาพ
                </h3>
                {isMedicalFocus && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    IRP &lt; 50%
                  </span>
                )}
              </div>

              {/* Large, Clear Option Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">เลือกบริการ/กิจกรรม:</span>
                {['กายภาพบำบัด', 'ตรวจสุขภาพ', 'การออกกำลังกาย', 'โภชนาการบำบัด'].map((item) => {
                  const selected = medicalItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(medicalItems, setMedicalItems, item)}
                      className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        selected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  ประเด็นปัญหา / เป้าหมายการฟื้นฟู
                </label>
                <textarea
                  rows={3}
                  value={medicalIssues}
                  onChange={(e) => setMedicalIssues(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  แผนการดำเนินงาน / บริการที่ควรได้รับ
                </label>
                <textarea
                  rows={3}
                  value={medicalAction}
                  onChange={(e) => setMedicalAction(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  กรอบระยะเวลาดำเนินงาน
                </label>
                <input
                  type="text"
                  value={medicalTimeline}
                  onChange={(e) => setMedicalTimeline(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ================= DIMENSION 2: Emotional & Psychological ================= */}
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isEmotionalFocus 
              ? 'bg-rose-50/30 border-2 border-rose-400 shadow-sm' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  ๒. ด้านจิตใจและอารมณ์
                </h3>
                {isEmotionalFocus && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    IRP &lt; 50%
                  </span>
                )}
              </div>

              {/* Large, Clear Option Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">เลือกบริการ/กิจกรรม:</span>
                {['กลุ่มบำบัด', 'สมาธิบำบัด', 'จิตบำบัด', 'นันทนาการ', 'กิจกรรมสานสัมพันธ์'].map((item) => {
                  const selected = emotionalItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(emotionalItems, setEmotionalItems, item)}
                      className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  ประเด็นปัญหา / เป้าหมายการฟื้นฟู
                </label>
                <textarea
                  rows={3}
                  value={emotionalIssues}
                  onChange={(e) => setEmotionalIssues(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  แผนการดำเนินงาน / บริการที่ควรได้รับ
                </label>
                <textarea
                  rows={3}
                  value={emotionalAction}
                  onChange={(e) => setEmotionalAction(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  กรอบระยะเวลาดำเนินงาน
                </label>
                <input
                  type="text"
                  value={emotionalTimeline}
                  onChange={(e) => setEmotionalTimeline(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ================= DIMENSION 3: Cognitive & Education ================= */}
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isCognitiveFocus 
              ? 'bg-rose-50/30 border-2 border-rose-400 shadow-sm' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  ๓. ด้านสติปัญญาและการศึกษา
                </h3>
                {isCognitiveFocus && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    IRP &lt; 50%
                  </span>
                )}
              </div>

              {/* Large, Clear Option Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">เลือกบริการ/กิจกรรม:</span>
                {['ศิลปะบำบัด', 'เรียนหนังสือ', 'กลุ่มบำบัด', 'ฝึกคิดคำนวณเบื้องต้น'].map((item) => {
                  const selected = cognitiveItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(cognitiveItems, setCognitiveItems, item)}
                      className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        selected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  ประเด็นปัญหา / เป้าหมายการฟื้นฟู
                </label>
                <textarea
                  rows={3}
                  value={cognitiveIssues}
                  onChange={(e) => setCognitiveIssues(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  แผนการดำเนินงาน / บริการที่ควรได้รับ
                </label>
                <textarea
                  rows={3}
                  value={cognitiveAction}
                  onChange={(e) => setCognitiveAction(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  กรอบระยะเวลาดำเนินงาน
                </label>
                <input
                  type="text"
                  value={cognitiveTimeline}
                  onChange={(e) => setCognitiveTimeline(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ================= DIMENSION 4: Career & Potential ================= */}
          <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
            isCareerFocus 
              ? 'bg-rose-50/30 border-2 border-rose-400 shadow-sm' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  ๔. ด้านอาชีพและศักยภาพ
                </h3>
                {isCareerFocus && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                    IRP &lt; 50%
                  </span>
                )}
              </div>

              {/* Large, Clear Option Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">เลือกบริการ/กิจกรรม:</span>
                {['ฝึกกิจวัตรประจำวัน', 'การช่วยงานผู้ดูแล', 'เกษตรกรรม', 'หัตถกรรมจักสาน', 'รับจ้างงาน ม.35'].map((item) => {
                  const selected = careerItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(careerItems, setCareerItems, item)}
                      className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  ประเด็นปัญหา / เป้าหมายการฟื้นฟู
                </label>
                <textarea
                  rows={3}
                  value={careerIssues}
                  onChange={(e) => setCareerIssues(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  แผนการดำเนินงาน / บริการที่ควรได้รับ
                </label>
                <textarea
                  rows={3}
                  value={careerAction}
                  onChange={(e) => setCareerAction(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  กรอบระยะเวลาดำเนินงาน
                </label>
                <input
                  type="text"
                  value={careerTimeline}
                  onChange={(e) => setCareerTimeline(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ================= DIMENSION 5: Social & Community ================= */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                ๕. ด้านสังคมและการมีส่วนร่วม
              </h3>
              <span className="text-xs font-semibold text-slate-500">กรอบระยะเวลา: 12 เดือน</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  ประเด็นปัญหา / เป้าหมายการฟื้นฟู
                </label>
                <textarea
                  rows={3}
                  value={socialIssues}
                  onChange={(e) => setSocialIssues(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  แผนการดำเนินงาน / บริการที่ควรได้รับ
                </label>
                <textarea
                  rows={3}
                  value={socialAction}
                  onChange={(e) => setSocialAction(e.target.value)}
                  className="w-full text-xs sm:text-sm leading-relaxed border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                  กรอบระยะเวลาดำเนินงาน
                </label>
                <input
                  type="text"
                  value={socialTimeline}
                  onChange={(e) => setSocialTimeline(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl p-3 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 12-Month Schedule */}
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              ตารางดำเนินกิจกรรมการฟื้นฟูสมรรถภาพ (๑๒ เดือน ปีงบประมาณ)
            </h3>
            <p className="text-xs text-slate-600">
              คลิกเพื่อเลือกเดือนที่ดำเนินการฟื้นฟูสมรรถภาพตามแผน
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 text-center">
              {[
                { k: 'oct', label: '๑. ต.ค.' },
                { k: 'nov', label: '๒. พ.ย.' },
                { k: 'dec', label: '๓. ธ.ค.' },
                { k: 'jan', label: '๔. ม.ค.' },
                { k: 'feb', label: '๕. ก.พ.' },
                { k: 'mar', label: '๖. มี.ค.' },
                { k: 'apr', label: '๗. เม.ย.' },
                { k: 'may', label: '๘. พ.ค.' },
                { k: 'jun', label: '๙. มิ.ย.' },
                { k: 'jul', label: '๑๐. ก.ค.' },
                { k: 'aug', label: '๑๑. ส.ค.' },
                { k: 'sep', label: '๑๒. ก.ย.' },
              ].map(({ k, label }) => {
                const checked = monthlySchedule[k as keyof typeof monthlySchedule];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleMonth(k as keyof typeof monthlySchedule)}
                    className={`py-2.5 px-1 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs ${
                      checked
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>บันทึกแผนฟื้นฟูสมรรถภาพรายบุคคล</span>
          </button>
        </div>
      </div>
    </div>
  );
};
