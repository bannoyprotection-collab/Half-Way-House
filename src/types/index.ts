export type UserRole = 'super_admin' | 'central_admin' | 'unit_officer';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  nikhomId?: string; // Required if role === 'unit_officer'
  isActive: boolean;
  lastLogin?: string;
}

export interface Nikhom {
  id: string;
  name: string;
  shortName: string;
  province: string;
  region: 'north' | 'northeast' | 'central' | 'south';
  capacity: number; // รองรับได้
  currentResidents: number; // อยู่จริง
  vacancies: number; // ว่าง
  isFull: boolean;
  // Map coordinates (percentage X, Y on Thailand SVG canvas 0-100)
  mapX: number;
  mapY: number;
}

export type DisabilityType = 1 | 2 | 3 | 4 | 5 | 6;
// 1: ทางการเห็น, 2: การได้ยิน/สื่อความหมาย, 3: การเคลื่อนไหว/ทางกาย, 4: จิตใจ/พฤติกรรม, 5: สติปัญญา, 6: ออทิสติก/การเรียนรู้

export const DISABILITY_TYPE_LABELS: Record<DisabilityType, string> = {
  1: 'ประเภท 1: พิการทางการเห็น',
  2: 'ประเภท 2: พิการทางการได้ยินหรือสื่อความหมาย',
  3: 'ประเภท 3: พิการทางการเคลื่อนไหวหรือทางกาย',
  4: 'ประเภท 4: พิการทางจิตใจหรือพฤติกรรม',
  5: 'ประเภท 5: พิการทางสติปัญญา',
  6: 'ประเภท 6: พิการทางออทิสติก/การเรียนรู้',
};

export interface CivilRegistrationRecord {
  hasNationalIdCard: boolean; // มีบัตรประชาชนหรือไม่
  nationalIdNumber?: string; // 13 หลัก
  medicalRights?: string; // สิทธิการรักษาพยาบาล เช่น บัตรทอง ท.74, ประกันสังคม, เบิกจ่ายตรง
  disabilityCardStatus?: 'has_card' | 'expired' | 'in_progress' | 'none'; // บัตรประจำตัวคนพิการ
  allowanceStatus?: 'receiving' | 'in_progress' | 'none'; // เบี้ยความพิการ/ผู้สูงอายุ
  civilRegistrationChecked: boolean; // ตรวจสอบทะเบียนราษฎร
  civilRegistrationNote?: string;
  homeVisitCoordinated: boolean; // ประสานเยี่ยมบ้าน
  homeVisitNote?: string;
  fingerprintStatus: 'found' | 'not_found' | 'pending'; // ตรวจลายพิมพ์นิ้วมือ พบ/ไม่พบ
  fingerprintNote?: string;
  criminalRecordStatus: 'found' | 'not_found' | 'pending'; // ตรวจสอบประวัติอาชญากร คนหายพลัดหลง
  criminalRecordNote?: string;
  dnaTestStatus: 'found' | 'not_found' | 'pending'; // ประสานตรวจ DNA
  dnaNote?: string;
  idCardCoordinationStatus: 'completed' | 'in_progress' | 'none'; // ประสานทำบัตรประชาชน
  idCardNote?: string;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
}

// ข้อมูลตามแบบ ท.ป. 1 (บัตรทะเบียนประวัติผู้ใช้บริการ)
export interface AdmissionRecordTP1 {
  round: number; // ครั้งที่ 1, 2, 3, 4
  sequenceNumber: string; // ลำดับที่
  registrationNumber: string; // เลขทะเบียน
  referringAgency: string; // รับจาก (หน่วยงานนำส่ง)
  categoryType: string; // ประเภท (ผู้พิการ / คนไร้ที่พึ่ง)
  admissionDate: string; // YYYY-MM-DD
  dateThText: string; // เมื่อวันที่ ... เดือน ... พ.ศ. ...
  nikhomId: string;
}

export type DischargeReason = 
  | 'return_family' 
  | 'return_institute' 
  | 'return_protection_center' 
  | 'independent_living' 
  | 'escaped' 
  | 'legal_prosecution' 
  | 'deceased';

export const DISCHARGE_REASON_LABELS: Record<DischargeReason, string> = {
  return_family: 'กลับสู่ครอบครัว',
  return_institute: 'กลับสถาน/หน่วยงานต้นทาง',
  return_protection_center: 'ศูนย์คุ้มครองฯ',
  independent_living: 'ดำรงชีวิตอิสระ',
  escaped: 'หลบหนี',
  legal_prosecution: 'ถูกจำคุกดำเนินคดี',
  deceased: 'เสียชีวิต',
};

export interface DischargeRecordTP1 {
  round: number; // ครั้งที่ 1, 2, 3, 4
  reason: DischargeReason;
  reasonDetail: string; // เนื่องจาก...
  dischargeDate: string; // YYYY-MM-DD
  dateThText: string; // เมื่อวันที่ ... เดือน ... พ.ศ. ...
  followUpResult: string; // ติดตามผล...
}

export interface TP1DossierProfile {
  birthDateKnown: boolean;
  birthDay?: number;
  birthMonthTh?: string;
  birthYearBuddhist?: number; // พ.ศ. เกิด เช่น 2527
  hometownAddress: string; // ภูมิลำเนาเดิม
  fatherName: string; // ชื่อบิดา
  motherName: string; // ชื่อมารดา
  currentAddress: string; // ที่อยู่ปัจจุบัน
  heightCm?: number; // ส่วนสูง ซ.ม.
  weightKg?: number; // น้ำหนัก ก.ก.
  distinguishingMarks: string; // ตำหนิ/รูปพรรณสัณฐาน
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'other'; // สถานภาพการสมรส
  maritalStatusOther?: string;
  educationHistory: string; // ประวัติการศึกษา
  previousOccupation: string; // อาชีพเดิม
  familyHistory: string; // ประวัติครอบครัว
  rightThumbprintVerified: boolean; // ขอรับรองว่าเป็นลายนิ้วหัวแม่มือขวา
  photoUrl?: string; // รูปถ่ายหน้าตรงผู้ใช้บริการ
  physicalMarksPhotoUrl?: string; // รูปถ่ายตำหนิรูปพรรณ / แผลเป็น / รอยสัก
  // ด้านหลัง แบบ ท.ป. 1 (- ๒ -)
  backgroundSummary: string; // สรุปประวัติความเป็นมา
  socialWorkAnalysis: string; // การวิเคราะห์
  vocationalTrainingInCare: string; // การฝึกอาชีพระหว่างรับการสงเคราะห์
  behaviorChangesNote: string; // การเปลี่ยนแปลงพฤติกรรม
  groupTherapyParticipation: string; // การเข้ากลุ่มกิจกรรมบำบัด
  otherNotes: string; // อื่น ๆ
}

export interface HealthRecordEntry {
  id: string;
  recordDate: string;
  isInitialAdmission: boolean; // ข้อมูลสุขภาพแรกเข้า vs อัปเดต
  bloodPressure?: string;
  weightKg?: number;
  physicalCondition: string; // สุขภาพทางกาย / โรคประจำตัว
  mentalCondition: string; // สุขภาพจิต / พฤติกรรม
  medications: string; // ยาที่ได้รับประจำ
  drugAllergies: string; // ประวัติการแพ้ยา
  healthStatusLevel: 'normal' | 'chronic_stable' | 'needs_close_care' | 'hospitalized';
  recordedBy: string;
  notes?: string;
}

export type ActivityCategoryKey = 'agriculture' | 'livestock' | 'handicraft' | 'service' | 'wageLabor' | 'other';

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategoryKey, string> = {
  agriculture: 'การเกษตร',
  livestock: 'ปศุสัตว์',
  handicraft: 'หัตถกรรม',
  service: 'งานบริการ',
  wageLabor: 'รับจ้างทั่วไป',
  other: 'อื่นๆ (ทำความสะอาด/ซ่อมบำรุง)',
};

export interface EmploymentIncomeBreakdown {
  commuteIncome: number; // จ้างแบบไป-กลับ
  homeWorkIncome: number; // จ้างแบบรับงานมาทำ
  section25Income: number; // จ้างตาม ม.25
  section33Income: number; // จ้างตาม ม.33
  section35Income: number; // จ้างตาม ม.35
}

export interface ActivityWorkItem {
  category: ActivityCategoryKey;
  enabled: boolean;
  details: string; // รายละเอียดกิจกรรม เช่น ปลูกผักไฮโดรโปนิกส์, เลี้ยงไก่ไข่
  participationType: 'occupational_therapy' | 'employment'; // อาชีวบำบัด หรือ การจ้างงาน
  occupationalTherapyIncome: number; // รายรับกรณีเลือกอาชีวบำบัด (บาท/เดือน)
  employmentIncome: EmploymentIncomeBreakdown; // รายรับกรณีเลือกการจ้างงานแยก 5 รูปแบบ
  workplaceName?: string; // ชื่อสถานประกอบการ/ผู้ว่าจ้าง
}

export interface MonthlyActivityUpdateLog {
  id: string;
  monthYearTh: string; // เช่น "ตุลาคม 2569"
  recordedDate: string;
  recordedBy: string;
  items: ActivityWorkItem[];
  totalOccupationalTherapyIncome: number;
  totalEmploymentIncome: EmploymentIncomeBreakdown;
  grandTotalMonthlyIncome: number;
  notes?: string;
}

export interface IRPQuestionScores {
  // ด้านร่างกาย (1-10 x 4 = 40 max)
  hygiene: number;
  clothingCleanliness: number;
  physicalHealth: number;
  selfCareAbility: number;

  // ด้านจิตใจ อารมณ์ (1-10 x 3 = 30 max)
  communication: number;
  emotionalExpression: number;
  emotionalControl: number;

  // ด้านสติปัญญา (1-10 x 3 = 30 max)
  followInstructions: number;
  expressNeeds: number;
  basicMathAccounting: number;

  // ด้านศักยภาพ (1-10 x 4 = 40 max)
  dailyDutyAndRoutine: number;
  fundamentalRightsAwareness: number;
  careerAndIncome: number;
  selfDevelopmentEagerness: number;
}

export interface IRPEvaluation {
  id: string;
  beneficiaryId: string;
  round: number; // ครั้งที่ 1, 2, 3, 4
  evaluationDate: string; // YYYY-MM-DD
  evaluatorName: string;
  notes?: string;
  scores: IRPQuestionScores;
  totalScore: number; // 0 - 140
  scorePercentage: number; // (total / 140) * 100
  evaluationResult: 'needs_improvement' | 'moderate' | 'high_potential'; // ควรปรับปรุง (0-47), ปานกลาง (47-94), มีศักยภาพ (94-140)
  isUnder50Percent: boolean; // ถ้า < 50% ต้องแจ้งเตือนเจ้าหน้าที่
}

export interface RehabPlan {
  id: string;
  beneficiaryId: string;
  planType: 'initial' | 'revised';
  revisionNumber?: number;
  planDate: string;
  plannerName: string;
  
  medicalAndHealth: {
    issuesAndGoals: string;
    actionPlan: string;
    timeline: string;
    items: string[];
  };
  emotionalAndPsychological: {
    issuesAndGoals: string;
    actionPlan: string;
    timeline: string;
    items: string[];
  };
  cognitiveAndEducation: {
    issuesAndGoals: string;
    actionPlan: string;
    timeline: string;
    items: string[];
  };
  careerAndPotential: {
    issuesAndGoals: string;
    actionPlan: string;
    timeline: string;
    items: string[];
  };
  socialAndCommunity: {
    issuesAndGoals: string;
    actionPlan: string;
    timeline: string;
    items: string[];
  };

  monthlySchedule: {
    oct: boolean; nov: boolean; dec: boolean; jan: boolean;
    feb: boolean; mar: boolean; apr: boolean; may: boolean;
    jun: boolean; jul: boolean; aug: boolean; sep: boolean;
  };
}

export interface BehaviorLog {
  id: string;
  beneficiaryId: string;
  date: string;
  behaviorDescription: string;
  actionPlan: string;
  evaluationResult: string;
  evaluatorName: string;
}

export interface BeneficiaryTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'admission' | 'readmission' | 'irp_evaluation' | 'rehab_plan' | 'health_update' | 'career' | 'income' | 'registration' | 'discharge';
  severity?: 'normal' | 'warning' | 'urgent';
  actor: string;
}

export interface Beneficiary {
  id: string;
  uniquePersonId: string; // เลขเฉพาะติดตัวตลอดชีพ รันอัตโนมัติ เช่น "BNN-69-0001"
  code: string; // เลขทะเบียนประวัติ เช่น "นข.67/001"
  nationalId: string; // 13 หลัก หรือ ระบุไม่มี
  fullName: string;
  gender: 'male' | 'female';
  age: number;
  nikhomId: string;
  building: string; // อาคาร/เรือนพัก
  admissionDate: string;
  referringAgency: string; // หน่วยงานนำส่ง
  status: 'resident' | 'discharged' | 'prep_work';
  category: 'disabled' | 'destitute'; // ผู้พิการ หรือ คนไร้ที่พึ่ง
  disabilityTypes: DisabilityType[];
  hasMultipleDisabilities: boolean; // พิการซ้ำซ้อน (คำนวณอัตโนมัติเมื่อเลือกหลายประเภท)
  chronicDiseases: string;
  personalityTraits: string;
  photoUrl?: string; // รูปถ่ายหน้าตรงผู้ใช้บริการ (Base64 data URL หรือ image link)
  physicalMarksPhotoUrl?: string; // รูปถ่ายตำหนิรูปพรรณ / แผลเป็น / รอยสัก (Base64 data URL)
  
  // ข้อมูลตามแบบ ท.ป. 1
  tp1Profile: TP1DossierProfile;
  admissionHistory: AdmissionRecordTP1[];
  dischargeHistory: DischargeRecordTP1[];

  // ข้อมูลสุขภาพแรกเข้า และประวัติการอัปเดตสุขภาพ
  initialHealth: HealthRecordEntry;
  healthHistory: HealthRecordEntry[];

  // สถานะทางทะเบียน สิทธิ์ และการสืบหาญาติ
  civilRegistration: CivilRegistrationRecord;

  // กิจกรรมที่ดำเนินการ (ผลผลิต) อาชีวบำบัด และการจ้างงาน
  activities: {
    agriculture: boolean;
    livestock: boolean;
    handicraft: boolean;
    service: boolean;
    wageLabor: boolean;
    other: boolean;
  };
  activityDetails: ActivityWorkItem[];
  monthlyActivityLogs: MonthlyActivityUpdateLog[];

  // รายได้รวมปัจจุบัน
  monthlyIncome: number;
  incomeSource: string;

  // การเตรียมความพร้อมด้านอาชีพ
  careerPreparation: {
    type: 'section35' | 'section33' | 'section25' | 'roundtrip_workplace' | 'homework' | 'trial_workplace' | 'none';
    workplaceName?: string;
    notes?: string;
  };

  // การจำหน่ายล่าสุด
  dischargeInfo?: {
    isDischarged: boolean;
    dischargeDate?: string;
    reason?: DischargeReason;
    destinationNote?: string;
  };

  latestIRP?: IRPEvaluation;
  irpHistory: IRPEvaluation[];
  rehabPlans: RehabPlan[];
  behaviorLogs: BehaviorLog[];
  timeline: BeneficiaryTimelineEvent[];
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  type: 'irp_critical' | 'monthly_reminder' | 'admission' | 'discharge' | 'rehab_due';
  title: string;
  message: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  nikhomId?: string;
  scorePercentage?: number;
  isRead: boolean;
  priority: 'urgent' | 'warning' | 'info';
}

export interface MonthlySnapshotData {
  monthKey: string; // e.g. '2026-10', '2026-09', '2026-08'
  monthLabelTh: string; // e.g. 'ตุลาคม 2569'
  dataAsOfDateTh: string; // e.g. '3 พ.ย. 2569'
  newAdmissionsCount: number; // รับเข้าในเดือนนี้
  dischargesCount: number; // จำหน่ายในเดือนนี้
  totalCapacity: number;
  totalResidents: number;
  maleCount: number;
  femaleCount: number;
  vacanciesCount: number;
  disabledCount: number;
  destituteCount: number;
  multipleDisabledCount: number;
  disabilityBreakdown: Record<DisabilityType, number>;
  healthSummary: {
    normal: number;
    chronicStable: number;
    needsCloseCare: number;
    hospitalized: number;
  };
  activitiesCount: {
    agriculture: number;
    livestock: number;
    handicraft: number;
    service: number;
    wageLabor: number;
    other: number;
    occupationalTherapyParticipants: number;
    employmentParticipants: number;
  };
  // ข้อมูลเฉพาะเดือนนั้นๆ vs ยอดสะสม
  monthOnlyBreakdown?: {
    admissionsDisabled: number;
    admissionsDestitute: number;
    admissionsMultipleDisabled: number;
    admissionsDisabilityBreakdown: Record<DisabilityType, number>;
    dischargesBreakdown: {
      returnFamily: number;
      returnInstitute: number;
      returnProtectionCenter: number;
      deceased: number;
    };
  };
  cumulativeDischargesTotal?: number;
  cumulativeAdmissionsTotal?: number;
  employmentAndIncomeSummary: {
    earningBeneficiariesCount: number;
    occupationalTherapyTotalBaht: number;
    commuteCount: number;
    commuteTotalBaht: number;
    homeWorkCount: number;
    homeWorkTotalBaht: number;
    section25Count: number;
    section25TotalBaht: number;
    section33Count: number;
    section33TotalBaht: number;
    section35Count: number;
    section35TotalBaht: number;
    trialWorkplaceCount: number;
    grandTotalIncomeBaht: number;
  };
  dischargeBreakdown: {
    returnFamily: number;
    returnInstitute: number;
    returnProtectionCenter: number;
    deceased: number;
  };
}

export interface MonthlyProgressReport {
  id: string;
  yearTh: number;
  monthTh: string;
  reportDate: string;
  totalCapacity: number;
  totalResidents: number;
  maleCount: number;
  femaleCount: number;
  vacanciesCount: number;
  disabledCount: number;
  destituteCount: number;
  multipleDisabledCount: number;
  
  activitiesCount: {
    agriculture: number;
    livestock: number;
    handicraft: number;
    service: number;
    wageLabor: number;
    other: number;
  };

  earningBeneficiariesCount: number;
  totalIncomeBaht: number;
  averageIncomeBaht: number;

  careerPrepCounts: {
    section35: number;
    roundtrip: number;
    trial: number;
    total: number;
  };

  dischargeCounts: {
    returnFamily: number;
    returnInstitute: number;
    returnProtectionCenter: number;
    deceased: number;
    total: number;
  };

  irpStats: {
    evaluatedCount: number;
    under50Count: number;
    moderateCount: number;
    highPotentialCount: number;
  };

  executiveSummaryNarrative: string;
  status: 'draft' | 'approved' | 'published';
  approvedBy?: string;
}
