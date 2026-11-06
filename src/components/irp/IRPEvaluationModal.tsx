import React, { useState } from 'react';
import { 
  X, AlertTriangle, CheckCircle, Calculator, UserCheck, ShieldAlert, 
  ArrowRight, Sparkles, Check, HeartPulse 
} from 'lucide-react';
import { Beneficiary, IRPEvaluation, IRPQuestionScores } from '../../types';

interface WeakIRPDomain {
  key: 'medicalAndHealth' | 'emotionalAndPsychological' | 'cognitiveAndEducation' | 'careerAndPotential';
  name: string;
  score: number;
  maxScore: number;
  pct: number;
}

interface IRPEvaluationModalProps {
  beneficiary: Beneficiary;
  isOpen: boolean;
  onClose: () => void;
  onSave: (evaluation: Omit<IRPEvaluation, 'id'>) => void;
  evaluatorDefaultName: string;
  onOpenRehabPlan?: (beneficiary: Beneficiary, targetFocusDomains?: string[]) => void;
}

export const IRPEvaluationModal: React.FC<IRPEvaluationModalProps> = ({
  beneficiary,
  isOpen,
  onClose,
  onSave,
  evaluatorDefaultName,
  onOpenRehabPlan,
}) => {
  const nextRound = (beneficiary.irpHistory?.length || 0) + 1;

  const [round, setRound] = useState(nextRound);
  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [evaluatorName, setEvaluatorName] = useState(evaluatorDefaultName);
  const [notes, setNotes] = useState('');

  // Post-submit state when domains < 50% are detected
  const [weakDomainsDetected, setWeakDomainsDetected] = useState<WeakIRPDomain[] | null>(null);

  // Default initial scores
  const [scores, setScores] = useState<IRPQuestionScores>(() => {
    if (beneficiary.latestIRP) {
      return { ...beneficiary.latestIRP.scores };
    }
    return {
      hygiene: 5,
      clothingCleanliness: 5,
      physicalHealth: 5,
      selfCareAbility: 5,
      communication: 5,
      emotionalExpression: 5,
      emotionalControl: 5,
      followInstructions: 5,
      expressNeeds: 5,
      basicMathAccounting: 5,
      dailyDutyAndRoutine: 5,
      fundamentalRightsAwareness: 5,
      careerAndIncome: 5,
      selfDevelopmentEagerness: 5,
    };
  });

  if (!isOpen) return null;

  // Domain score calculations
  const domain1Score = scores.hygiene + scores.clothingCleanliness + scores.physicalHealth + scores.selfCareAbility; // max 40
  const domain2Score = scores.communication + scores.emotionalExpression + scores.emotionalControl; // max 30
  const domain3Score = scores.followInstructions + scores.expressNeeds + scores.basicMathAccounting; // max 30
  const domain4Score = scores.dailyDutyAndRoutine + scores.fundamentalRightsAwareness + scores.careerAndIncome + scores.selfDevelopmentEagerness; // max 40

  const totalScore = domain1Score + domain2Score + domain3Score + domain4Score;
  const scorePercentage = (totalScore / 140) * 100;
  const isUnder50 = scorePercentage < 50 || totalScore < 70;

  let evaluationResult: 'needs_improvement' | 'moderate' | 'high_potential' = 'moderate';
  if (totalScore < 47) {
    evaluationResult = 'needs_improvement';
  } else if (totalScore >= 94) {
    evaluationResult = 'high_potential';
  }

  const handleScoreChange = (key: keyof IRPQuestionScores, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Find any domain with score < 50%
    const detected: WeakIRPDomain[] = [];
    if (domain1Score < 20) {
      detected.push({
        key: 'medicalAndHealth',
        name: '๑. ด้านการแพทย์และสุขภาพ (ร่างกาย)',
        score: domain1Score,
        maxScore: 40,
        pct: (domain1Score / 40) * 100,
      });
    }
    if (domain2Score < 15) {
      detected.push({
        key: 'emotionalAndPsychological',
        name: '๒. ด้านจิตใจและอารมณ์',
        score: domain2Score,
        maxScore: 30,
        pct: (domain2Score / 30) * 100,
      });
    }
    if (domain3Score < 15) {
      detected.push({
        key: 'cognitiveAndEducation',
        name: '๓. ด้านสติปัญญาและการศึกษา',
        score: domain3Score,
        maxScore: 30,
        pct: (domain3Score / 30) * 100,
      });
    }
    if (domain4Score < 20) {
      detected.push({
        key: 'careerAndPotential',
        name: '๔. ด้านอาชีพและศักยภาพ',
        score: domain4Score,
        maxScore: 40,
        pct: (domain4Score / 40) * 100,
      });
    }

    // Save evaluation to database
    onSave({
      beneficiaryId: beneficiary.id,
      round,
      evaluationDate,
      evaluatorName,
      notes,
      scores,
      totalScore,
      scorePercentage,
      evaluationResult,
      isUnder50Percent: isUnder50,
    });

    // If weak domains found and rehab plan callback exists, show direct action prompt
    if (detected.length > 0 && onOpenRehabPlan) {
      setWeakDomainsDetected(detected);
    } else {
      onClose();
    }
  };

  const handleProceedToRehab = () => {
    if (onOpenRehabPlan && weakDomainsDetected) {
      const keys = weakDomainsDetected.map((d) => d.key);
      onOpenRehabPlan(beneficiary, keys);
    }
    onClose();
  };

  const renderSlider = (
    key: keyof IRPQuestionScores,
    title: string,
    description: string,
    numberLabel: string
  ) => {
    const value = scores[key];
    return (
      <div className="bg-slate-50/80 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">
              <span className="text-amber-800 font-bold mr-1.5">{numberLabel}</span>
              {title}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{description}</div>
          </div>
          <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-lg border border-slate-200 shrink-0 shadow-2xs">
            <span
              className={`text-base font-black tabular-nums ${
                value <= 3 ? 'text-rose-600' : value >= 8 ? 'text-emerald-600' : 'text-amber-700'
              }`}
            >
              {value}
            </span>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
        </div>

        {/* 1 to 10 Quick Select Buttons */}
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleScoreChange(key, v)}
              className={`h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                value === v
                  ? v < 5
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                    : v >= 8
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                    : 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col my-auto overflow-hidden">
        
        {/* POST-SUBMISSION WEAK DOMAIN ALERT VIEW */}
        {weakDomainsDetected ? (
          <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  บันทึกผลการประเมิน IRP ครั้งที่ {round} สำเร็จ!
                </h2>
                <p className="text-xs text-slate-500">
                  ผู้ใช้บริการ: <strong>{beneficiary.fullName}</strong> (รหัสประจำตัว BNN: {beneficiary.uniquePersonId})
                </p>
              </div>
            </div>

            {/* Warning Callout Box */}
            <div className="bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    ระบบตรวจพบผลการประเมินต่ำกว่า 50% ใน {weakDomainsDetected.length} ด้าน
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    ตามเกณฑ์มาตรฐาน เจ้าหน้าที่ควรตั้งหรือปรับปรุงแผนฟื้นฟูสมรรถภาพรายบุคคล (Rehab Plan) สำหรับด้านเหล่านี้โดยทันที
                  </p>
                </div>
              </div>

              {/* List of weak domains */}
              <div className="space-y-2 pt-2">
                {weakDomainsDetected.map((d) => (
                  <div 
                    key={d.key} 
                    className="bg-white/90 p-3 rounded-xl border border-rose-200 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900">{d.name}</span>
                      <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                        คะแนน: {d.score} / {d.maxScore} คะแนน ({d.pct.toFixed(1)}%)
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                      ต่ำกว่า 50%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง (ไว้ปรับปรุงแผนภายหลัง)
              </button>

              <button
                type="button"
                onClick={handleProceedToRehab}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>ไปตั้ง/ปรับปรุงแผนฟื้นฟูสมรรถภาพรายบุคคล (Rehab Plan) ทันที</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Standard Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <div className="text-xs font-semibold text-amber-700">
                  แบบประเมินสมรรถภาพรายบุคคล (Individual Rehabilitation Plan - IRP)
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{beneficiary.fullName}</span>
                  <span className="font-mono text-xs font-bold text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                    รหัสประจำตัว BNN: {beneficiary.uniquePersonId}
                  </span>
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="ปิดหน้าต่าง"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Metadata Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    การประเมินครั้งที่
                  </label>
                  <select
                    value={round}
                    onChange={(e) => setRound(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value={1}>ครั้งที่ 1 (แรกรับ/ประเมินต้นปี)</option>
                    <option value={2}>ครั้งที่ 2 (กลางรอบ 6 เดือน)</option>
                    <option value={3}>ครั้งที่ 3 (ติดตามผล)</option>
                    <option value={4}>ครั้งที่ 4 (สรุปผลประจำปี)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    วันที่ทำการประเมิน
                  </label>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    ผู้ประเมิน / นักสังคมสงเคราะห์
                  </label>
                  <input
                    type="text"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Real-time Calculation Floating Banner */}
              <div
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isUnder50
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : totalScore >= 94
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                      isUnder50 ? 'bg-rose-600 text-white' : totalScore >= 94 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      คะแนนประเมินรวม (เต็ม 140 คะแนน)
                    </div>
                    <div className="text-xl font-extrabold tabular-nums">
                      {totalScore} / 140 คะแนน ({scorePercentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold">
                    {totalScore < 47
                      ? 'ระดับ: ควรปรับปรุง (0 - 47)'
                      : totalScore < 94
                      ? 'ระดับ: ปานกลาง (47 - 94)'
                      : 'ระดับ: มีศักยภาพ (94 - 140)'}
                  </div>
                  {isUnder50 && (
                    <div className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 justify-end mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>ต่ำกว่า 50% — ระบบจะเชื่อมต่อการตั้งแผนฟื้นฟูอัตโนมัติ</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. ด้านร่างกาย */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      1. ด้านร่างกาย (คะแนนเต็ม 40)
                    </h3>
                    {domain1Score < 20 && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        ต่ำกว่า 50%
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${domain1Score < 20 ? 'text-rose-600' : 'text-amber-800'}`}>
                    รวม: {domain1Score} / 40
                  </span>
                </div>
                {renderSlider(
                  'hygiene',
                  'ดูแลสุขอนามัยส่วนตัว',
                  'อาทิ อาบน้ำ แปรงฟัน สระผม ตัดเล็บ โกนหนวด เป็นประจำ',
                  '1.1'
                )}
                {renderSlider(
                  'clothingCleanliness',
                  'รักษาความสะอาดของเสื้อผ้าและของใช้',
                  'รักษาความสะอาดของเสื้อผ้าสิ่งของเครื่องใช้อย่างสม่ำเสมอ',
                  '1.2'
                )}
                {renderSlider(
                  'physicalHealth',
                  'สุขภาพร่างกายและการเคลื่อนไหว',
                  'มีสุขภาพแข็งแรง สามารถเดิน วิ่ง ลุก นั่ง และใช้ชีวิตได้อย่างปกติ',
                  '1.3'
                )}
                {renderSlider(
                  'selfCareAbility',
                  'ช่วยเหลือตนเองในกิจวัตรประจำวัน',
                  'ช่วยเหลือตนเองในกิจวัตรประจำวันตามที่สภาพร่างกายอำนวย',
                  '1.4'
                )}
              </div>

              {/* 2. ด้านจิตใจ อารมณ์ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      2. ด้านจิตใจ อารมณ์ (คะแนนเต็ม 30)
                    </h3>
                    {domain2Score < 15 && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        ต่ำกว่า 50%
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${domain2Score < 15 ? 'text-rose-600' : 'text-amber-800'}`}>
                    รวม: {domain2Score} / 30
                  </span>
                </div>
                {renderSlider(
                  'communication',
                  'การสื่อสารและสัมพันธภาพ',
                  'สามารถพูดคุย สื่อสาร และมีปฏิสัมพันธ์กับผู้อื่นได้เช่นเดียวกับบุคคลทั่วไป',
                  '2.1'
                )}
                {renderSlider(
                  'emotionalExpression',
                  'การแสดงออกทางอารมณ์',
                  'มีการแสดงออกทางอารมณ์อย่างเหมาะสม ไม่ก้าวร้าวหรือหวาดกลัวเกินเหตุ',
                  '2.2'
                )}
                {renderSlider(
                  'emotionalControl',
                  'การควบคุมอารมณ์เมื่อเผชิญปัญหา',
                  'เมื่อเกิดปัญหาหรือความคับข้องใจ สามารถควบคุมอารมณ์ได้',
                  '2.3'
                )}
              </div>

              {/* 3. ด้านสติปัญญา */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      3. ด้านสติปัญญา (คะแนนเต็ม 30)
                    </h3>
                    {domain3Score < 15 && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        ต่ำกว่า 50%
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${domain3Score < 15 ? 'text-rose-600' : 'text-amber-800'}`}>
                    รวม: {domain3Score} / 30
                  </span>
                </div>
                {renderSlider(
                  'followInstructions',
                  'การปฏิบัติตามคำสั่งและการตอบสนอง',
                  'ปฏิบัติตามคำสั่งและตอบสนองการสนทนาได้อย่างถูกต้อง',
                  '3.1'
                )}
                {renderSlider(
                  'expressNeeds',
                  'การบอกความต้องการและความรู้สึก',
                  'สามารถบอกความต้องการและความรู้สึกได้อย่างเหมาะสม',
                  '3.2'
                )}
                {renderSlider(
                  'basicMathAccounting',
                  'การคิดคำนวณและบัญชีเบื้องต้น',
                  'มีความสามารถในการคำนวณและเข้าใจหลักการทำบัญชีรับจ่าย',
                  '3.3'
                )}
              </div>

              {/* 4. ด้านศักยภาพ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      4. ด้านศักยภาพและอาชีพ (คะแนนเต็ม 40)
                    </h3>
                    {domain4Score < 20 && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        ต่ำกว่า 50%
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${domain4Score < 20 ? 'text-rose-600' : 'text-amber-800'}`}>
                    รวม: {domain4Score} / 40
                  </span>
                </div>
                {renderSlider(
                  'dailyDutyAndRoutine',
                  'การปฏิบัติกิจวัตรและหน้าที่งาน',
                  'สามารถปฏิบัติกิจวัตรประจำวันทั้งเรื่องส่วนตัวและงานตามหน้าที่',
                  '4.1'
                )}
                {renderSlider(
                  'fundamentalRightsAwareness',
                  'ความเข้าใจในสิทธิขั้นพื้นฐาน',
                  'เข้าใจและสามารถบอกถึงสิทธิขั้นพื้นฐานที่จำเป็นของตนได้',
                  '4.2'
                )}
                {renderSlider(
                  'careerAndIncome',
                  'ความสามารถด้านอาชีพและรายได้',
                  'สามารถประกอบอาชีพ มีรายได้เพื่อเลี้ยงตนเองได้',
                  '4.3'
                )}
                {renderSlider(
                  'selfDevelopmentEagerness',
                  'ความกระตือรือร้นในการเรียนรู้',
                  'ขวนขวายที่จะเรียนรู้เพื่อพัฒนาตนเองอย่างสม่ำเสมอ',
                  '4.4'
                )}
              </div>

              {/* Qualitative Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ข้อสังเกตและข้อเสนอแนะเพิ่มเติมของผู้ประเมิน
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุพฤติกรรมเด่น การพัฒนาการ หรือประเด็นที่ต้องจัดทำแผนฟื้นฟูเร่งด่วน..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                  isUnder50 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                บันทึกผลการประเมิน IRP {isUnder50 && '(ตรวจพบด้าน < 50%)'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
