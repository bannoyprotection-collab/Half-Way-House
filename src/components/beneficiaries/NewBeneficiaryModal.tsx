import React, { useState, useEffect, useRef } from 'react';
import { 
  X, UserPlus, RotateCcw, CheckSquare, FileText, 
  HeartPulse, Briefcase, AlertCircle, Sparkles, Calculator,
  Camera, Upload, Trash2, CheckCircle2, ArrowRight, ArrowLeft,
  Image as ImageIcon, ZoomIn, Eye, Check
} from 'lucide-react';
import { 
  Beneficiary, Nikhom, DisabilityType, DISABILITY_TYPE_LABELS, 
  ActivityWorkItem, ACTIVITY_CATEGORY_LABELS, UserAccount 
} from '../../types';
import { createDefaultActivityDetails } from '../../data/mockData';
import { compressImageFileToBase64 } from '../../utils/imageUtils';

interface NewBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  nikhoms: Nikhom[];
  existingBeneficiaries: Beneficiary[];
  currentUser: UserAccount;
  nextUniquePersonId?: string;
  onSaveNew: (beneficiary: Omit<Beneficiary, 'id' | 'uniquePersonId'> & { uniquePersonId?: string }) => Beneficiary | void;
  onReadmitExisting: (
    beneficiaryId: string,
    params: {
      nikhomId: string;
      building: string;
      admissionDate: string;
      referringAgency: string;
      registrationCode: string;
      healthNote: string;
      bloodPressure?: string;
      weightKg?: number;
    }
  ) => void;
  onOpenBeneficiaryDetail?: (beneficiaryId: string) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const NewBeneficiaryModal: React.FC<NewBeneficiaryModalProps> = ({
  isOpen,
  onClose,
  nikhoms,
  existingBeneficiaries,
  currentUser,
  onSaveNew,
  onReadmitExisting,
  onOpenBeneficiaryDetail,
}) => {
  const [admissionMode, setAdmissionMode] = useState<'new' | 'readmit'>('new');
  const [activeStepTab, setActiveStepTab] = useState<'tp1_front' | 'tp1_back' | 'health' | 'activities'>('tp1_front');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Photos
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [physicalMarksPhotoUrl, setPhysicalMarksPhotoUrl] = useState<string>('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isCompressingMarksPhoto, setIsCompressingMarksPhoto] = useState(false);
  const [previewZoomImage, setPreviewZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Success dialog after saving (shows assigned BNN ID)
  const [savedBeneficiaryResult, setSavedBeneficiaryResult] = useState<Beneficiary | null>(null);

  // File input refs
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const marksPhotoInputRef = useRef<HTMLInputElement>(null);

  // Re-admission states
  const dischargedList = existingBeneficiaries.filter((b) => b.status === 'discharged');
  const [selectedReadmitId, setSelectedReadmitId] = useState<string>(dischargedList[0]?.id || '');

  // Basic & TP1 Front Fields
  const defaultNikhomId =
    currentUser.role === 'unit_officer' && currentUser.nikhomId
      ? currentUser.nikhomId
      : nikhoms[0]?.id || 'nk-01';

  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState(`นข.69/${String(Math.floor(Math.random() * 900) + 100)}`);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDateKnown, setBirthDateKnown] = useState<boolean>(true);
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonthTh, setBirthMonthTh] = useState<string>('พฤษภาคม');
  const [birthYearBuddhist, setBirthYearBuddhist] = useState<number>(2529); // พ.ศ. 2529 -> อายุ 40 ปี (ในปี พ.ศ. 2569)
  const [age, setAge] = useState<number>(40);

  const [nikhomId, setNikhomId] = useState(defaultNikhomId);
  const [building, setBuilding] = useState('เรือนร่มโพธิ์ 1');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [referringAgency, setReferringAgency] = useState('ศูนย์คุ้มครองคนไร้ที่พึ่ง / พมจ.');
  const [category, setCategory] = useState<'disabled' | 'destitute'>('disabled');
  const [disabilityTypes, setDisabilityTypes] = useState<DisabilityType[]>([4]);

  // TP1 Form specific fields
  const [hometownAddress, setHometownAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [heightCm, setHeightCm] = useState<number>(165);
  const [weightKg, setWeightKg] = useState<number>(60);
  const [distinguishingMarks, setDistinguishingMarks] = useState('ไม่มี');
  const [personalityTraits, setPersonalityTraits] = useState('สงบเสงี่ยม ให้ความร่วมมือในการพูดคุยดี');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'divorced' | 'widowed' | 'other'>('single');
  const [educationHistory, setEducationHistory] = useState('ประถมศึกษาปีที่ 6');
  const [previousOccupation, setPreviousOccupation] = useState('รับจ้างทั่วไป');
  const [familyHistory, setFamilyHistory] = useState('');
  const [rightThumbprintVerified, setRightThumbprintVerified] = useState(true);

  // TP1 Page 2 (Back)
  const [backgroundSummary, setBackgroundSummary] = useState('');
  const [socialWorkAnalysis, setSocialWorkAnalysis] = useState('');
  const [vocationalTrainingInCare, setVocationalTrainingInCare] = useState('');
  const [behaviorChangesNote, setBehaviorChangesNote] = useState('');
  const [groupTherapyParticipation, setGroupTherapyParticipation] = useState('');
  const [otherNotes, setOtherNotes] = useState('');

  // Civil Registration
  const [hasIdCard, setHasIdCard] = useState(true);
  const [nationalId, setNationalId] = useState('');
  const [medicalRights, setMedicalRights] = useState('สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง ท.74)');

  // Initial Health
  const [bloodPressure, setBloodPressure] = useState('120/80 mmHg');
  const [physicalCondition, setPhysicalCondition] = useState('สุขภาพร่างกายทั่วไปแข็งแรงดี');
  const [mentalCondition, setMentalCondition] = useState('อาการทางจิตเวชสงบ สื่อสารเข้าใจ');
  const [medications, setMedications] = useState('รับประทานยาตามแพทย์สั่งต่อเนื่อง');
  const [drugAllergies, setDrugAllergies] = useState('ปฏิเสธการแพ้ยา');
  const [healthStatusLevel, setHealthStatusLevel] = useState<'normal' | 'chronic_stable' | 'needs_close_care' | 'hospitalized'>('normal');

  // Activities (Occupational Therapy vs Employment)
  const [activityDetails, setActivityDetails] = useState<ActivityWorkItem[]>(() =>
    createDefaultActivityDetails({
      agriculture: {
        enabled: true,
        details: 'ปลูกพืชผักสวนครัวปลอดสารพิษ',
        participationType: 'occupational_therapy',
        occupationalTherapyIncome: 300,
      },
    })
  );

  // Auto-calculate age from Buddhist year (พ.ศ.) when birthDateKnown is true
  useEffect(() => {
    if (birthDateKnown && birthYearBuddhist >= 2450 && birthYearBuddhist <= 2569) {
      const currentBuddhistYear = 2569;
      setAge(Math.max(1, currentBuddhistYear - birthYearBuddhist));
    }
  }, [birthDateKnown, birthYearBuddhist]);

  useEffect(() => {
    if (currentUser.role === 'unit_officer' && currentUser.nikhomId) {
      setNikhomId(currentUser.nikhomId);
    }
  }, [currentUser]);

  // Handle Photo selection & compression
  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingPhoto(true);
      const base64 = await compressImageFileToBase64(file, 640, 0.75);
      setPhotoUrl(base64);
    } catch {
      alert('ไม่สามารถประมวลผลรูปภาพได้ กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง');
    } finally {
      setIsCompressingPhoto(false);
      if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
    }
  };

  const handleMarksPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingMarksPhoto(true);
      const base64 = await compressImageFileToBase64(file, 640, 0.75);
      setPhysicalMarksPhotoUrl(base64);
    } catch {
      alert('ไม่สามารถประมวลผลรูปภาพได้ กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง');
    } finally {
      setIsCompressingMarksPhoto(false);
      if (marksPhotoInputRef.current) marksPhotoInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // Multiple disabilities check
  const isMultipleDisabilities = category === 'disabled' && disabilityTypes.length > 1;

  const toggleDisabilityType = (t: DisabilityType) => {
    setDisabilityTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()
    );
  };

  const updateActivityItem = (categoryKey: ActivityWorkItem['category'], updates: Partial<ActivityWorkItem>) => {
    setActivityDetails((prev) =>
      prev.map((item) => (item.category === categoryKey ? { ...item, ...updates } : item))
    );
  };

  const updateEmploymentIncomeField = (
    categoryKey: ActivityWorkItem['category'],
    field: keyof ActivityWorkItem['employmentIncome'],
    val: number
  ) => {
    setActivityDetails((prev) =>
      prev.map((item) =>
        item.category === categoryKey
          ? {
              ...item,
              employmentIncome: {
                ...item.employmentIncome,
                [field]: val,
              },
            }
          : item
      )
    );
  };

  // Compute total monthly income from activityDetails
  const computedTotalIncome = activityDetails.reduce((acc, item) => {
    if (!item.enabled) return acc;
    if (item.participationType === 'occupational_therapy') {
      return acc + (Number(item.occupationalTherapyIncome) || 0);
    }
    const emp = item.employmentIncome;
    return (
      acc +
      (Number(emp.commuteIncome) || 0) +
      (Number(emp.homeWorkIncome) || 0) +
      (Number(emp.section25Income) || 0) +
      (Number(emp.section33Income) || 0) +
      (Number(emp.section35Income) || 0)
    );
  }, 0);

  // Wizard navigation steps
  const steps = [
    { id: 'tp1_front', stepNum: 1, label: '1. ข้อมูลประวัติแรกรับ & รูปถ่าย & ความพิการ', shortLabel: '1. ประวัติแรกรับ', icon: FileText },
    { id: 'tp1_back', stepNum: 2, label: '2. ประวัติความเป็นมา & การวิเคราะห์ (ท.ป.๑ หน้าหลัง)', shortLabel: '2. ความเป็นมา', icon: Sparkles },
    { id: 'health', stepNum: 3, label: '3. ข้อมูลสุขภาพแรกเข้า', shortLabel: '3. ข้อมูลสุขภาพ', icon: HeartPulse },
    { id: 'activities', stepNum: 4, label: '4. กิจกรรม อาชีวบำบัด & การจ้างงาน', shortLabel: '4. กิจกรรม & รายรับ', icon: Briefcase },
  ] as const;

  const currentStepIndex = steps.findIndex((s) => s.id === activeStepTab);

  const handleNextStep = () => {
    setValidationError(null);
    if (activeStepTab === 'tp1_front') {
      if (!fullName.trim()) {
        setValidationError('กรุณาระบุ "ชื่อ - นามสกุล ผู้ใช้บริการ" ก่อนกดถัดไป');
        return;
      }
      setActiveStepTab('tp1_back');
    } else if (activeStepTab === 'tp1_back') {
      setActiveStepTab('health');
    } else if (activeStepTab === 'health') {
      setActiveStepTab('activities');
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (activeStepTab === 'activities') {
      setActiveStepTab('health');
    } else if (activeStepTab === 'health') {
      setActiveStepTab('tp1_back');
    } else if (activeStepTab === 'tp1_back') {
      setActiveStepTab('tp1_front');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (admissionMode === 'readmit') {
      if (!selectedReadmitId) {
        setValidationError('กรุณาเลือกผู้ใช้บริการที่เคยจำหน่ายออกจากโครงการ');
        return;
      }
      onReadmitExisting(selectedReadmitId, {
        nikhomId,
        building,
        admissionDate,
        referringAgency,
        registrationCode: code,
        healthNote: physicalCondition,
        bloodPressure,
        weightKg,
      });
      onClose();
      return;
    }

    if (!fullName.trim()) {
      setActiveStepTab('tp1_front');
      setValidationError('กรุณาระบุ "ชื่อ - นามสกุล ผู้ใช้บริการ"');
      return;
    }

    const activitiesFlags = {
      agriculture: false,
      livestock: false,
      handicraft: false,
      service: false,
      wageLabor: false,
      other: false,
    };
    const incomeSummaryParts: string[] = [];

    activityDetails.forEach((it) => {
      activitiesFlags[it.category] = it.enabled;
      if (it.enabled) {
        if (it.participationType === 'occupational_therapy' && it.occupationalTherapyIncome > 0) {
          incomeSummaryParts.push(`อาชีวบำบัด ${ACTIVITY_CATEGORY_LABELS[it.category]} (${it.occupationalTherapyIncome} บ.)`);
        } else if (it.participationType === 'employment') {
          const emp = it.employmentIncome;
          if (emp.commuteIncome > 0) incomeSummaryParts.push(`จ้างไป-กลับ (${emp.commuteIncome} บ.)`);
          if (emp.homeWorkIncome > 0) incomeSummaryParts.push(`รับงานมาทำ (${emp.homeWorkIncome} บ.)`);
          if (emp.section25Income > 0) incomeSummaryParts.push(`ม.25 (${emp.section25Income} บ.)`);
          if (emp.section33Income > 0) incomeSummaryParts.push(`ม.33 (${emp.section33Income} บ.)`);
          if (emp.section35Income > 0) incomeSummaryParts.push(`ม.35 (${emp.section35Income} บ.)`);
        }
      }
    });

    const selectedNk = nikhoms.find((n) => n.id === nikhomId);

    const created = onSaveNew({
      code,
      fullName,
      photoUrl: photoUrl || undefined,
      physicalMarksPhotoUrl: physicalMarksPhotoUrl || undefined,
      gender,
      age: Number(age),
      nikhomId,
      building,
      admissionDate,
      referringAgency,
      status: 'resident',
      category,
      disabilityTypes: category === 'disabled' ? disabilityTypes : [],
      hasMultipleDisabilities: isMultipleDisabilities,
      chronicDiseases: physicalCondition,
      personalityTraits,
      nationalId: hasIdCard && nationalId ? nationalId : 'ไม่มีบัตรประจำตัวประชาชน',
      tp1Profile: {
        birthDateKnown,
        birthDay: birthDateKnown ? birthDay : undefined,
        birthMonthTh: birthDateKnown ? birthMonthTh : undefined,
        birthYearBuddhist: birthDateKnown ? birthYearBuddhist : undefined,
        hometownAddress: hometownAddress || 'ไม่ระบุ',
        fatherName: fatherName || 'ไม่ปรากฏข้อมูล',
        motherName: motherName || 'ไม่ปรากฏข้อมูล',
        currentAddress: currentAddress || `${selectedNk?.name || ''} จ.${selectedNk?.province || ''}`,
        heightCm,
        weightKg,
        distinguishingMarks,
        photoUrl: photoUrl || undefined,
        physicalMarksPhotoUrl: physicalMarksPhotoUrl || undefined,
        maritalStatus,
        educationHistory,
        previousOccupation,
        familyHistory: familyHistory || '-',
        rightThumbprintVerified,
        backgroundSummary: backgroundSummary || `รับตัวส่งต่อจาก ${referringAgency}`,
        socialWorkAnalysis: socialWorkAnalysis || 'อยู่ระหว่างการประเมินและวางแผนฟื้นฟูสมรรถภาพรายบุคคล',
        vocationalTrainingInCare: vocationalTrainingInCare || '-',
        behaviorChangesNote: behaviorChangesNote || '-',
        groupTherapyParticipation: groupTherapyParticipation || '-',
        otherNotes: otherNotes || '-',
      },
      admissionHistory: [
        {
          round: 1,
          sequenceNumber: '01/2569',
          registrationNumber: code,
          referringAgency,
          categoryType:
            category === 'disabled'
              ? isMultipleDisabilities
                ? 'ผู้พิการซ้ำซ้อน'
                : 'ผู้พิการ'
              : 'คนไร้ที่พึ่ง',
          admissionDate,
          dateThText: `เมื่อวันที่ ${admissionDate}`,
          nikhomId,
        },
      ],
      dischargeHistory: [],
      initialHealth: {
        id: `hl-init-${Date.now()}`,
        recordDate: admissionDate,
        isInitialAdmission: true,
        bloodPressure,
        weightKg,
        physicalCondition,
        mentalCondition,
        medications,
        drugAllergies,
        healthStatusLevel,
        recordedBy: currentUser.name,
        notes: 'ข้อมูลสุขภาพแรกรับเข้าโครงการ',
      },
      healthHistory: [],
      civilRegistration: {
        hasNationalIdCard: hasIdCard,
        nationalIdNumber: hasIdCard ? nationalId : undefined,
        medicalRights,
        disabilityCardStatus: category === 'disabled' ? 'has_card' : 'none',
        allowanceStatus: category === 'disabled' ? 'receiving' : 'none',
        civilRegistrationChecked: hasIdCard,
        homeVisitCoordinated: false,
        fingerprintStatus: hasIdCard ? 'found' : 'pending',
        criminalRecordStatus: 'not_found',
        dnaTestStatus: 'pending',
        idCardCoordinationStatus: hasIdCard ? 'completed' : 'in_progress',
        lastUpdatedDate: admissionDate,
        lastUpdatedBy: currentUser.name,
      },
      activities: activitiesFlags,
      activityDetails,
      monthlyActivityLogs: [
        {
          id: `mal-init-${Date.now()}`,
          monthYearTh: 'ตุลาคม 2569',
          recordedDate: admissionDate,
          recordedBy: currentUser.name,
          items: activityDetails,
          totalOccupationalTherapyIncome: activityDetails.reduce(
            (s, i) => s + (i.enabled && i.participationType === 'occupational_therapy' ? Number(i.occupationalTherapyIncome) || 0 : 0),
            0
          ),
          totalEmploymentIncome: {
            commuteIncome: activityDetails.reduce((s, i) => s + (i.enabled && i.participationType === 'employment' ? Number(i.employmentIncome.commuteIncome) || 0 : 0), 0),
            homeWorkIncome: activityDetails.reduce((s, i) => s + (i.enabled && i.participationType === 'employment' ? Number(i.employmentIncome.homeWorkIncome) || 0 : 0), 0),
            section25Income: activityDetails.reduce((s, i) => s + (i.enabled && i.participationType === 'employment' ? Number(i.employmentIncome.section25Income) || 0 : 0), 0),
            section33Income: activityDetails.reduce((s, i) => s + (i.enabled && i.participationType === 'employment' ? Number(i.employmentIncome.section33Income) || 0 : 0), 0),
            section35Income: activityDetails.reduce((s, i) => s + (i.enabled && i.participationType === 'employment' ? Number(i.employmentIncome.section35Income) || 0 : 0), 0),
          },
          grandTotalMonthlyIncome: computedTotalIncome,
          notes: 'บันทึกกิจกรรมและรายรับแรกเข้า',
        },
      ],
      monthlyIncome: computedTotalIncome,
      incomeSource: incomeSummaryParts.join(', ') || 'ยังไม่มีรายรับ',
      careerPreparation: {
        type: 'none',
      },
      irpHistory: [],
      rehabPlans: [],
      behaviorLogs: [],
      timeline: [],
    });

    if (created && typeof created === 'object' && created.uniquePersonId) {
      setSavedBeneficiaryResult(created);
    } else {
      onClose();
    }
  };

  // Reset form for new entry
  const handleResetForNextEntry = () => {
    setSavedBeneficiaryResult(null);
    setActiveStepTab('tp1_front');
    setFullName('');
    setCode(`นข.69/${String(Math.floor(Math.random() * 900) + 100)}`);
    setPhotoUrl('');
    setPhysicalMarksPhotoUrl('');
    setDistinguishingMarks('ไม่มี');
    setHometownAddress('');
    setFatherName('');
    setMotherName('');
    setFamilyHistory('');
    setBackgroundSummary('');
    setSocialWorkAnalysis('');
    setNationalId('');
  };

  // ==================== SUCCESS MODAL (POST-SAVE BNN DISPLAY) ====================
  if (savedBeneficiaryResult) {
    const matchedNk = nikhoms.find((n) => n.id === savedBeneficiaryResult.nikhomId);
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              บันทึกข้อมูลแบบ ท.ป.๑ สำเร็จ
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              ออกรหัสประจำตัวเฉพาะผู้ใช้บริการเรียบร้อย
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              ระบบได้ออกรหัส BNN แบบอัตโนมัติติดตัวผู้ใช้บริการตลอดชีพ ป้องกันการซ้ำซ้อนของการบันทึกข้อมูล
            </p>
          </div>

          {/* Large BNN ID Display */}
          <div className="bg-gradient-to-b from-amber-50 to-amber-100/60 border-2 border-amber-400 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-widest">
              เลขประจำตัวเฉพาะติดตัวตลอดชีพ (BNN ID)
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-black text-amber-950 tracking-wider">
              {savedBeneficiaryResult.uniquePersonId}
            </div>
            <div className="border-t border-amber-200/90 pt-3 text-xs text-slate-700 flex items-center justify-around gap-2 flex-wrap">
              <div className="text-left">
                <span className="text-slate-500 block text-[11px]">ผู้ใช้บริการ:</span>
                <strong className="text-slate-900">{savedBeneficiaryResult.fullName}</strong>
              </div>
              <div className="text-left">
                <span className="text-slate-500 block text-[11px]">รหัสประจำตัว BNN:</span>
                <strong className="font-mono text-slate-900">{savedBeneficiaryResult.uniquePersonId}</strong>
              </div>
              <div className="text-left">
                <span className="text-slate-500 block text-[11px]">สังกัดหน่วยงาน:</span>
                <strong className="text-slate-900">{matchedNk?.shortName || savedBeneficiaryResult.nikhomId}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            {onOpenBeneficiaryDetail && (
              <button
                type="button"
                onClick={() => {
                  const id = savedBeneficiaryResult.id;
                  setSavedBeneficiaryResult(null);
                  onClose();
                  onOpenBeneficiaryDetail(id);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>เปิดดูแฟ้มประวัติ (แบบ ท.ป.๑)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetForNextEntry}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>บันทึกรายใหม่ต่อไป</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSavedBeneficiaryResult(null);
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-xs cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              แบบ ท.ป. ๑ · กองคุ้มครองสวัสดิภาพและเสริมสร้างคุณภาพชีวิต กรมพัฒนาสังคมและสวัสดิการ
            </div>
            <h2 className="text-base font-bold text-slate-900">
              บัตรทะเบียนประวัติผู้ใช้บริการ และการรับเข้าโครงการบ้านน้อยในนิคม
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

        {/* Mode Switcher: New Admission vs Re-admission */}
        <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdmissionMode('new')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                admissionMode === 'new'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>รับเข้าผู้ใช้บริการรายใหม่</span>
            </button>

            <button
              type="button"
              onClick={() => setAdmissionMode('readmit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                admissionMode === 'readmit'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>รับกลับเข้าโครงการซ้ำ (ใช้รหัส BNN เดิม)</span>
            </button>
          </div>

          {admissionMode === 'new' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-amber-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-slate-500">รหัสประจำตัว BNN:</span>
              <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                จะออกรหัสอัตโนมัติเมื่อกดบันทึกสำเร็จ
              </span>
              <span className="text-[10px] text-slate-400 hidden lg:inline">(ป้องกันเลขซ้ำเมื่อคีย์พร้อมกัน)</span>
            </div>
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {admissionMode === 'readmit' ? (
            /* ==================== RE-ADMISSION FORM ==================== */
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                <div className="font-bold text-emerald-950 text-sm">
                  การรับผู้ใช้บริการที่เคยจำหน่ายออกไปแล้ว กลับเข้าโครงการอีกครั้ง
                </div>
                <p className="text-emerald-800 text-xs">
                  ตามระเบียบโครงการ ผู้ใช้บริการแต่ละรายจะมีเลขประจำตัวเฉพาะติดตัวไปตลอด เมื่อกลับเข้ามาใหม่ ระบบจะใช้เลขประจำตัวเดิมและเชื่อมต่อประวัติการประเมิน IRP แผนฟื้นฟู และประวัติสุขภาพเดิมให้อัตโนมัติ
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  เลือกผู้ใช้บริการที่เคยจำหน่ายออกจากโครงการ *
                </label>
                {dischargedList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500">
                    ไม่มีรายชื่อผู้ใช้บริการที่สถานะจำหน่ายออกในขณะนี้
                  </div>
                ) : (
                  <select
                    value={selectedReadmitId}
                    onChange={(e) => setSelectedReadmitId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    {dischargedList.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.uniquePersonId}] {d.fullName} (จำหน่ายเมื่อ {d.dischargeInfo?.dischargeDate || '-'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    วันที่รับกลับเข้าโครงการ *
                  </label>
                  <input
                    type="date"
                    required
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    นิคม/หน่วยงานที่รับเข้าพำนัก *
                  </label>
                  <select
                    value={nikhomId}
                    disabled={currentUser.role === 'unit_officer'}
                    onChange={(e) => setNikhomId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white disabled:bg-slate-100"
                  >
                    {nikhoms.map((nk) => (
                      <option key={nk.id} value={nk.id}>
                        {nk.name} (จ.{nk.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    อาคาร / เรือนพัก
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ข้อมูลสุขภาพแรกรับกลับเข้าโครงการซ้ำ
                </label>
                <textarea
                  rows={2}
                  value={physicalCondition}
                  onChange={(e) => setPhysicalCondition(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          ) : (
            /* ==================== NEW ADMISSION (STEP WIZARD แบบ ท.ป. ๑) ==================== */
            <div className="space-y-5">
              {/* Step Navigation Tabs with Progress Indicators */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
                {steps.map((t, idx) => {
                  const Icon = t.icon;
                  const active = activeStepTab === t.id;
                  const isDone = idx < currentStepIndex;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setValidationError(null);
                        setActiveStepTab(t.id);
                      }}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                        active
                          ? 'bg-slate-900 text-white shadow-xs'
                          : isDone
                          ? 'bg-amber-100/70 text-amber-900 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        active ? 'bg-amber-500 text-slate-950' : isDone ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {t.stepNum}
                      </span>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ==================== STEP 1: แบบ ท.ป. ๑ หน้าแรก & รูปถ่าย ==================== */}
              {activeStepTab === 'tp1_front' && (
                <div className="space-y-4">
                  {/* Photo Upload Section: รูปถ่ายหน้าตรงผู้ใช้บริการ */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="relative group shrink-0">
                      <div className="w-28 h-36 bg-white border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex flex-col items-center justify-center shadow-xs">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="รูปถ่ายผู้ใช้บริการ"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <span className="text-[10px] leading-tight block">รูปถ่ายหน้าตรง<br/>(ท.ป.๑)</span>
                          </div>
                        )}
                      </div>

                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewZoomImage({ url: photoUrl, title: 'รูปถ่ายหน้าตรงผู้ใช้บริการ' })}
                          className="absolute bottom-1 right-1 p-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-md cursor-pointer transition-colors"
                          title="ดูภาพขยาย"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                          <Camera className="w-4 h-4 text-amber-600" />
                          <span>รูปถ่ายหน้าตรงผู้ใช้บริการ (สำหรับติดบัตร ท.ป.๑)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          รองรับการถ่ายรูปด้วยกล้องมือถือ/แท็บเล็ต หรือเลือกไฟล์รูปภาพจากเครื่อง ระบบจะบีบอัดภาพให้อัตโนมัติเพื่อความรวดเร็ว
                        </p>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                        <input
                          ref={profilePhotoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoSelect}
                        />

                        <button
                          type="button"
                          disabled={isCompressingPhoto}
                          onClick={() => profilePhotoInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isCompressingPhoto ? 'กำลังประมวลผลรูป...' : photoUrl ? 'เปลี่ยนรูปถ่าย' : 'ถ่ายรูป / เลือกไฟล์รูป'}</span>
                        </button>

                        {photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPhotoUrl('')}
                            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบรูป</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 1: ชื่อ-สกุล, เลขทะเบียน, หน่วยงานนำส่ง */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชื่อ - นามสกุล ผู้ใช้บริการ *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="เช่น นายมานะ ตั้งใจดี"
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        รับจาก (หน่วยงานนำส่ง) *
                      </label>
                      <input
                        type="text"
                        required
                        value={referringAgency}
                        onChange={(e) => setReferringAgency(e.target.value)}
                        placeholder="ระบุหน่วยงานที่นำส่งตัวมา"
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Row 2: วันเดือนปีเกิด (พ.ศ.) & คำนวณอายุอัตโนมัติ */}
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4 text-amber-600" />
                        <span>วัน เดือน ปีเกิด (พ.ศ.) และการคำนวณอายุ</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                          <input
                            type="radio"
                            checked={birthDateKnown}
                            onChange={() => setBirthDateKnown(true)}
                          />
                          <span>ทราบวันเดือนปีเกิด (คำนวณอายุให้อัตโนมัติ)</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                          <input
                            type="radio"
                            checked={!birthDateKnown}
                            onChange={() => setBirthDateKnown(false)}
                          />
                          <span>ไม่ทราบวันเกิด (ระบุอายุโดยตรง)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                      {birthDateKnown && (
                        <>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">วันที่เกิด</label>
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={birthDay}
                              onChange={(e) => setBirthDay(Number(e.target.value))}
                              className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">เดือนเกิด</label>
                            <select
                              value={birthMonthTh}
                              onChange={(e) => setBirthMonthTh(e.target.value)}
                              className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                            >
                              {THAI_MONTHS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">พ.ศ. เกิด</label>
                            <input
                              type="number"
                              min={2450}
                              max={2569}
                              value={birthYearBuddhist}
                              onChange={(e) => setBirthYearBuddhist(Number(e.target.value))}
                              className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold text-amber-800"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">อายุ (ปี)</label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={age}
                          disabled={birthDateKnown}
                          onChange={(e) => setAge(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">เพศ</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="male">ชาย</option>
                          <option value="female">หญิง</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: กลุ่มเป้าหมาย & การติ๊กเลือกประเภทความพิการ */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-900">กลุ่มเป้าหมาย:</span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            checked={category === 'disabled'}
                            onChange={() => setCategory('disabled')}
                          />
                          <span>ผู้พิการ</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            checked={category === 'destitute'}
                            onChange={() => setCategory('destitute')}
                          />
                          <span>คนไร้ที่พึ่ง</span>
                        </label>
                      </div>

                      {isMultipleDisabilities && (
                        <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>จัดเป็นกลุ่ม: พิการซ้ำซ้อนอัตโนมัติ (เลือก {disabilityTypes.length} ประเภท)</span>
                        </span>
                      )}
                    </div>

                    {category === 'disabled' && (
                      <div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          ติ๊กเลือกประเภทความพิการ (หากติ๊กเลือกตั้งแต่ 2 ประเภทขึ้นไป ระบบจะจัดเป็น &ldquo;พิการซ้ำซ้อน&rdquo; อัตโนมัติ)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {([1, 2, 3, 4, 5, 6] as DisabilityType[]).map((t) => {
                            const checked = disabilityTypes.includes(t);
                            return (
                              <label
                                key={t}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                  checked
                                    ? 'bg-sky-50 border-sky-400 text-sky-950 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleDisabilityType(t)}
                                  className="rounded text-sky-600"
                                />
                                <span>{DISABILITY_TYPE_LABELS[t]}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 4: นิคมที่สังกัด, เรือนพัก, วันที่แรกรับ, บัตรประชาชน */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        นิคม / หน่วยงานที่รับเข้า *
                      </label>
                      <select
                        value={nikhomId}
                        disabled={currentUser.role === 'unit_officer'}
                        onChange={(e) => setNikhomId(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white disabled:bg-slate-100"
                      >
                        {nikhoms.map((nk) => (
                          <option key={nk.id} value={nk.id}>
                            {nk.name} (จ.{nk.province})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        อาคาร / เรือนพัก
                      </label>
                      <input
                        type="text"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        เมื่อวันที่ (วันที่รับการสงเคราะห์)
                      </label>
                      <input
                        type="date"
                        value={admissionDate}
                        onChange={(e) => setAdmissionDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Row 5: รายละเอียดตามแบบ ท.ป. 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อบิดา</label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="ระบุชื่อบิดา"
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อมารดา</label>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="ระบุชื่อมารดา"
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ภูมิลำเนาเดิม</label>
                      <input
                        type="text"
                        value={hometownAddress}
                        onChange={(e) => setHometownAddress(e.target.value)}
                        placeholder="บ้านเลขที่ หมู่ ตำบล อำเภอ จังหวัด"
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ที่อยู่ปัจจุบัน</label>
                      <input
                        type="text"
                        value={currentAddress}
                        onChange={(e) => setCurrentAddress(e.target.value)}
                        placeholder="ที่อยู่ในนิคมสร้างตนเอง"
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Row 6: ส่วนสูง, น้ำหนัก, สถานภาพสมรส */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ส่วนสูง (ซ.ม.)</label>
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">น้ำหนัก (ก.ก.)</label>
                      <input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สถานภาพการสมรส</label>
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value as any)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="single">โสด</option>
                        <option value="married">สมรส</option>
                        <option value="divorced">หย่าร้าง</option>
                        <option value="widowed">หม้าย</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                  </div>

                  {/* ตำหนิรูปพรรณ & รูปถ่ายตำหนิรูปพรรณ/แผลเป็น/รอยสัก */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>ตำหนิรูปพรรณสัณฐาน & รูปถ่ายแผลเป็น/รอยสัก</span>
                      </span>
                      {physicalMarksPhotoUrl && (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          แนบรูปถ่ายตำหนิรูปพรรณแล้ว
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block font-semibold text-slate-700 text-[11px]">
                          คำอธิบายตำหนิรูปพรรณสัณฐาน (แผลเป็น / ปาน / รอยสัก / ลักษณะเฉพาะ)
                        </label>
                        <textarea
                          rows={2}
                          value={distinguishingMarks}
                          onChange={(e) => setDistinguishingMarks(e.target.value)}
                          placeholder="เช่น มีแผลเป็นที่คิ้วซ้าย, รอยสักรูปมังกรที่แขนขวา..."
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-semibold text-slate-700 text-[11px]">
                          รูปถ่ายตำหนิรูปพรรณ
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            ref={marksPhotoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleMarksPhotoSelect}
                          />

                          {physicalMarksPhotoUrl ? (
                            <div className="flex items-center gap-2">
                              <div className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-white">
                                <img
                                  src={physicalMarksPhotoUrl}
                                  alt="รูปตำหนิรูปพรรณ"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewZoomImage({ url: physicalMarksPhotoUrl, title: 'รูปถ่ายตำหนิรูปพรรณ / รอยสัก' })}
                                  className="absolute inset-0 bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => marksPhotoInputRef.current?.click()}
                                  className="text-[10px] text-amber-700 hover:text-amber-800 font-bold underline"
                                >
                                  เปลี่ยนรูป
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPhysicalMarksPhotoUrl('')}
                                  className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold"
                                >
                                  ลบรูป
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isCompressingMarksPhoto}
                              onClick={() => marksPhotoInputRef.current?.click()}
                              className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/50 rounded-lg text-slate-600 hover:text-amber-900 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-600" />
                              <span>{isCompressingMarksPhoto ? 'กำลังประมวลผล...' : 'แนบรูปตำหนิรูปพรรณ'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 7: การศึกษา, อาชีพเดิม, บัตรประชาชน */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ประวัติการศึกษา</label>
                      <input
                        type="text"
                        value={educationHistory}
                        onChange={(e) => setEducationHistory(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">อาชีพเดิม</label>
                      <input
                        type="text"
                        value={previousOccupation}
                        onChange={(e) => setPreviousOccupation(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">เลขบัตรประชาชน 13 หลัก</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasIdCard}
                          onChange={(e) => setHasIdCard(e.target.checked)}
                          title="มีบัตรประชาชน"
                        />
                        <input
                          type="text"
                          disabled={!hasIdCard}
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          placeholder={hasIdCard ? 'X-XXXX-XXXXX-XX-X' : 'ไม่มีบัตรประชาชน'}
                          className="w-full p-2 border border-slate-200 rounded-lg disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ประวัติครอบครัว</label>
                    <textarea
                      rows={2}
                      value={familyHistory}
                      onChange={(e) => setFamilyHistory(e.target.value)}
                      placeholder="รายละเอียดบิดามารดา พี่น้อง และความสัมพันธ์ในครอบครัว..."
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: แบบ ท.ป. ๑ หน้าหลัง (- ๒ -) ==================== */}
              {activeStepTab === 'tp1_back' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        ประวัติความเป็นมาและการวิเคราะห์ทางสังคมสงเคราะห์ (แบบ ท.ป.๑ ด้านหลัง)
                      </div>
                      <p className="text-slate-500 text-xs">
                        ระบุประวัติความเป็นมาก่อนเข้าโครงการ การประเมินจุดแข็งและแนวทางการฟื้นฟูสมรรถภาพ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        สรุปประวัติความเป็นมา
                      </label>
                      <textarea
                        rows={3}
                        value={backgroundSummary}
                        onChange={(e) => setBackgroundSummary(e.target.value)}
                        placeholder="สรุปความเป็นมาก่อนเข้ารับการสงเคราะห์..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        การวิเคราะห์ (นักสังคมสงเคราะห์)
                      </label>
                      <textarea
                        rows={3}
                        value={socialWorkAnalysis}
                        onChange={(e) => setSocialWorkAnalysis(e.target.value)}
                        placeholder="การประเมินปัญหา จุดแข็ง และแนวทางช่วยเหลือฟื้นฟู..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        การฝึกอาชีพระหว่างรับการสงเคราะห์
                      </label>
                      <textarea
                        rows={2}
                        value={vocationalTrainingInCare}
                        onChange={(e) => setVocationalTrainingInCare(e.target.value)}
                        placeholder="ระบุทักษะอาชีพที่ฝึกในนิคม..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        การเปลี่ยนแปลงพฤติกรรม
                      </label>
                      <textarea
                        rows={2}
                        value={behaviorChangesNote}
                        onChange={(e) => setBehaviorChangesNote(e.target.value)}
                        placeholder="บันทึกพัฒนาการด้านพฤติกรรม..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        การเข้ากลุ่มกิจกรรมบำบัด
                      </label>
                      <textarea
                        rows={2}
                        value={groupTherapyParticipation}
                        onChange={(e) => setGroupTherapyParticipation(e.target.value)}
                        placeholder="เช่น ศิลปะบำบัด ดนตรีบำบัด อาชีวบำบัด..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        อื่น ๆ
                      </label>
                      <textarea
                        rows={2}
                        value={otherNotes}
                        onChange={(e) => setOtherNotes(e.target.value)}
                        placeholder="หมายเหตุอื่นๆ เพิ่มเติม..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 3: ข้อมูลสุขภาพแรกเข้า ==================== */}
              {activeStepTab === 'health' && (
                <div className="space-y-4">
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
                    <div className="font-bold text-rose-950 text-sm">
                      การบันทึกข้อมูลสุขภาพแรกเข้า (Initial Health Assessment)
                    </div>
                    <p className="text-rose-800 text-xs mt-0.5">
                      บันทึกผลการตรวจคัดกรองสุขภาพกาย สุขภาพจิต และยาที่ใช้ประจำเมื่อแรกรับ (สามารถกดอัปเดตประวัติสุขภาพเพิ่มเติมได้ตลอดเวลาในแฟ้มประวัติ)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ความดันโลหิตแรกรับ</label>
                      <input
                        type="text"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        placeholder="เช่น 120/80 mmHg"
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ระดับสถานะสุขภาพ</label>
                      <select
                        value={healthStatusLevel}
                        onChange={(e) => setHealthStatusLevel(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="normal">ปกติ / แข็งแรง</option>
                        <option value="chronic_stable">โรคเรื้อรัง / จิตเวชอาการสงบ (รับยาต่อเนื่อง)</option>
                        <option value="needs_close_care">ต้องดูแลใกล้ชิด / เฝ้าระวังพิเศษ</option>
                        <option value="hospitalized">ส่งต่อรักษาในโรงพยาบาล</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สิทธิการรักษาพยาบาล</label>
                      <input
                        type="text"
                        value={medicalRights}
                        onChange={(e) => setMedicalRights(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        สุขภาพทางกาย / โรคประจำตัว
                      </label>
                      <textarea
                        rows={2}
                        value={physicalCondition}
                        onChange={(e) => setPhysicalCondition(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        สุขภาพจิต / อาการทางจิตเวชแรกรับ
                      </label>
                      <textarea
                        rows={2}
                        value={mentalCondition}
                        onChange={(e) => setMentalCondition(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ยาที่รับประทานประจำ
                      </label>
                      <textarea
                        rows={2}
                        value={medications}
                        onChange={(e) => setMedications(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ประวัติการแพ้ยา / แพ้อาหาร
                      </label>
                      <textarea
                        rows={2}
                        value={drugAllergies}
                        onChange={(e) => setDrugAllergies(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 4: กิจกรรม อาชีวบำบัด & การจ้างงาน ==================== */}
              {activeStepTab === 'activities' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-emerald-950 text-sm">
                        กิจกรรมดำเนินการ อาชีวบำบัด และการจ้างงาน
                      </div>
                      <p className="text-emerald-800 text-xs">
                        เมื่อติ๊กเลือกกิจกรรม ให้ระบุรายละเอียดและเลือกประเภท (อาชีวบำบัด หรือ การจ้างงานแยกตามรูปแบบ)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-emerald-700">รายรับรวมต่อเดือน</div>
                      <div className="text-lg font-extrabold text-emerald-950 tabular-nums">
                        {computedTotalIncome.toLocaleString()} บาท
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activityDetails.map((item) => (
                      <div
                        key={item.category}
                        className={`p-4 rounded-xl border transition-all ${
                          item.enabled
                            ? 'bg-white border-amber-400 shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 font-bold text-sm text-slate-900 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) =>
                                updateActivityItem(item.category, { enabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded"
                            />
                            <span>{ACTIVITY_CATEGORY_LABELS[item.category]}</span>
                          </label>

                          {item.enabled && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateActivityItem(item.category, {
                                    participationType: 'occupational_therapy',
                                  })
                                }
                                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
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
                                  updateActivityItem(item.category, {
                                    participationType: 'employment',
                                  })
                                }
                                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
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
                          <div className="mt-3 space-y-3 pt-3 border-t border-slate-100">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                รายละเอียดกิจกรรม
                              </label>
                              <input
                                type="text"
                                value={item.details}
                                onChange={(e) =>
                                  updateActivityItem(item.category, { details: e.target.value })
                                }
                                placeholder="เช่น ปลูกผักไฮโดรโปนิกส์, เลี้ยงไก่ไข่, นวดแผนไทย..."
                                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                              />
                            </div>

                            {item.participationType === 'occupational_therapy' ? (
                              <div className="max-w-xs">
                                <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                                  รายได้ปันผล/อาชีวบำบัด (บาท/เดือน)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.occupationalTherapyIncome}
                                  onChange={(e) =>
                                    updateActivityItem(item.category, {
                                      occupationalTherapyIncome: Number(e.target.value),
                                    })
                                  }
                                  className="w-full p-2 border border-teal-300 rounded-lg bg-teal-50/50 font-bold tabular-nums"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2 bg-amber-50/40 p-3 rounded-xl border border-amber-200/60">
                                <div className="font-bold text-amber-950 text-xs">
                                  รายรับการจ้างงานแยกตาม 5 รูปแบบ (บาท/เดือน)
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-1">
                                      1. จ้างไป-กลับ
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.employmentIncome.commuteIncome}
                                      onChange={(e) =>
                                        updateEmploymentIncomeField(
                                          item.category,
                                          'commuteIncome',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-full p-1.5 border border-slate-200 rounded-lg bg-white font-bold tabular-nums"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-1">
                                      2. รับงานมาทำ
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.employmentIncome.homeWorkIncome}
                                      onChange={(e) =>
                                        updateEmploymentIncomeField(
                                          item.category,
                                          'homeWorkIncome',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-full p-1.5 border border-slate-200 rounded-lg bg-white font-bold tabular-nums"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-1">
                                      3. จ้างตาม ม.25
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.employmentIncome.section25Income}
                                      onChange={(e) =>
                                        updateEmploymentIncomeField(
                                          item.category,
                                          'section25Income',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-full p-1.5 border border-slate-200 rounded-lg bg-white font-bold tabular-nums"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 mb-1">
                                      4. จ้างตาม ม.33
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.employmentIncome.section33Income}
                                      onChange={(e) =>
                                        updateEmploymentIncomeField(
                                          item.category,
                                          'section33Income',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-full p-1.5 border border-slate-200 rounded-lg bg-white font-bold tabular-nums"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-amber-900 font-bold mb-1">
                                      5. จ้างตาม ม.35
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.employmentIncome.section35Income}
                                      onChange={(e) =>
                                        updateEmploymentIncomeField(
                                          item.category,
                                          'section35Income',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-full p-1.5 border border-amber-300 rounded-lg bg-white font-bold tabular-nums"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Wizard Navigation Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          {admissionMode === 'readmit' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ยืนยันการรับกลับเข้าโครงการซ้ำ (ใช้รหัสเดิม)</span>
              </button>
            </>
          ) : (
            <>
              {/* Wizard Back Button or Cancel */}
              {activeStepTab === 'tp1_front' ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ยกเลิก
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
              )}

              {/* Wizard Status Indicator */}
              <div className="text-xs text-slate-500 hidden sm:block font-medium">
                ขั้นตอนที่ {currentStepIndex + 1} จาก 4: <span className="font-bold text-slate-800">{steps[currentStepIndex]?.shortLabel}</span>
              </div>

              {/* Wizard Next Button or Final Save Button */}
              {activeStepTab !== 'activities' ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>ถัดไป: {steps[currentStepIndex + 1]?.shortLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูลแบบ ท.ป.๑ (ออกรหัส BNN อัตโนมัติ)</span>
                </button>
              )}
            </>
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
    </div>
  );
};
