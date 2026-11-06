import {
  Beneficiary,
  Nikhom,
  MonthlyProgressReport,
  UserAccount,
  DISABILITY_TYPE_LABELS,
} from '../types';
import { getAccessToken } from '../lib/firebase';

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

export interface FullDatabaseSnapshot {
  version: string;
  exportedAt: string;
  exportedByEmail?: string;
  nikhoms: Nikhom[];
  beneficiaries: Beneficiary[];
  monthlyReport: MonthlyProgressReport;
  userAccounts?: UserAccount[];
}

const SHEET_TABS = [
  '1_สรุปภาพรวม_18_หน่วยงาน',
  '2_ทะเบียนประวัติ_ทป1',
  '3_ผลประเมิน_IRP_และแผนฟื้นฟู',
  '4_ประวัติสุขภาพและการรักษา',
  '5_กิจกรรมอาชีวบำบัดและรายได้',
  '6_รายงานประจำเดือน',
  '7_SYSTEM_SNAPSHOT',
];

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error(
      'กรุณาเข้าสู่ระบบด้วยบัญชี Google (Sign in with Google) เพื่ออนุญาตสิทธิ์การเข้าถึง Google Drive และ Google Sheets ก่อนดำเนินการ'
    );
  }
  return token;
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

function chunkString(str: string, maxLen = 35000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += maxLen) {
    chunks.push(str.slice(i, i + maxLen));
  }
  return chunks;
}

function buildSheetsValues(snapshot: FullDatabaseSnapshot) {
  const { nikhoms, beneficiaries, monthlyReport } = snapshot;
  const nikhomMap = new Map(
    nikhoms.map((n) => [n.id, `${n.name} (${n.province})`])
  );

  // Tab 1: 18 Nikhom Units
  const tab1Rows: (string | number)[][] = [
    [
      'ลำดับ',
      'รหัสหน่วยงาน',
      'ชื่อหน่วยงาน (นิคมสร้างตนเอง / ศพพ.)',
      'ชื่อย่อ',
      'จังหวัด',
      'ภูมิภาค',
      'อัตราการรองรับ (คน)',
      'ผู้เข้าอยู่จริง (คน)',
      'อัตราว่าง (คน)',
      'สถานะความจุ',
      'พิกัดแผนที่ X (%)',
      'พิกัดแผนที่ Y (%)',
    ],
    ...nikhoms.map((nk, idx) => [
      idx + 1,
      nk.id,
      nk.name,
      nk.shortName,
      nk.province,
      nk.region === 'north'
        ? 'ภาคเหนือ'
        : nk.region === 'northeast'
        ? 'ภาคตะวันออกเฉียงเหนือ'
        : nk.region === 'central'
        ? 'ภาคกลาง/ตะวันตก'
        : 'ภาคใต้',
      nk.capacity,
      nk.currentResidents,
      nk.vacancies,
      nk.isFull || nk.vacancies === 0 ? 'เต็มความจุ' : `ว่าง ${nk.vacancies} ที่`,
      nk.mapX,
      nk.mapY,
    ]),
  ];

  // Tab 2: Beneficiaries TP1 Roster
  const tab2Rows: (string | number)[][] = [
    [
      'ลำดับ',
      'รหัสประจำตัวกลาง (Unique ID)',
      'เลขทะเบียน (ท.ป.1)',
      'ชื่อ-นามสกุล',
      'เพศ',
      'อายุ (ปี)',
      'เลขบัตรประชาชน 13 หลัก',
      'สิทธิการรักษาพยาบาล',
      'บัตรคนพิการ',
      'เบี้ยความพิการ/ผู้สูงอายุ',
      'หน่วยงาน/นิคมที่พำนัก',
      'อาคาร/เรือนพัก',
      'วันที่แรกรับ',
      'หน่วยงานนำส่ง',
      'สถานะปัจจุบัน',
      'กลุ่มเป้าหมาย',
      'ประเภทความพิการ',
      'พิการซ้ำซ้อน',
      'โรคประจำตัว',
      'คะแนน IRP ล่าสุด (เต็ม 140)',
      'เปอร์เซ็นต์ IRP (%)',
      'ระดับผลประเมิน IRP',
      'รายได้ต่อเดือนรวม (บาท)',
      'ที่มาของรายได้',
    ],
    ...beneficiaries.map((b, idx) => {
      const disabilityNames = (b.disabilityTypes || [])
        .map((dt) => DISABILITY_TYPE_LABELS[dt] || `ประเภท ${dt}`)
        .join(', ');
      return [
        idx + 1,
        b.uniquePersonId,
        b.code,
        b.fullName,
        b.gender === 'male' ? 'ชาย' : 'หญิง',
        b.age,
        b.nationalId || '-',
        b.civilRegistration?.medicalRights || '-',
        b.civilRegistration?.disabilityCardStatus === 'has_card'
          ? 'มีบัตรแล้ว'
          : b.civilRegistration?.disabilityCardStatus === 'in_progress'
          ? 'กำลังดำเนินการ'
          : 'ไม่มี',
        b.civilRegistration?.allowanceStatus === 'receiving'
          ? 'ได้รับเบี้ยแล้ว'
          : b.civilRegistration?.allowanceStatus === 'in_progress'
          ? 'กำลังดำเนินการ'
          : 'ไม่ได้รับ',
        nikhomMap.get(b.nikhomId) || b.nikhomId,
        b.building,
        b.admissionDate,
        b.referringAgency,
        b.status === 'resident'
          ? 'พักอาศัยอยู่จริง'
          : b.status === 'discharged'
          ? 'จำหน่ายแล้ว'
          : 'เตรียมความพร้อม',
        b.category === 'disabled' ? 'ผู้พิการ' : 'คนไร้ที่พึ่ง',
        disabilityNames || '-',
        b.hasMultipleDisabilities ? 'พิการซ้ำซ้อน' : 'ไม่ซ้ำซ้อน',
        b.chronicDiseases || '-',
        b.latestIRP ? b.latestIRP.totalScore : '-',
        b.latestIRP ? Number(b.latestIRP.scorePercentage.toFixed(1)) : '-',
        b.latestIRP
          ? b.latestIRP.isUnder50Percent
            ? 'ต่ำกว่า 50% (ต้องฟื้นฟูเร่งด่วน)'
            : b.latestIRP.evaluationResult === 'high_potential'
            ? 'มีศักยภาพสูง'
            : 'ปานกลาง'
          : 'ยังไม่ประเมิน',
        b.monthlyIncome || 0,
        b.incomeSource || '-',
      ];
    }),
  ];

  // Tab 3: IRP Evaluations & Rehab Plans
  const tab3Rows: (string | number)[][] = [
    [
      'รหัสประจำตัวกลาง',
      'ชื่อ-นามสกุล',
      'หน่วยงาน',
      'ครั้งที่ประเมิน IRP',
      'วันที่ประเมิน',
      'ผู้ประเมิน',
      'คะแนนรวม (เต็ม 140)',
      'คิดเป็นร้อยละ (%)',
      'ผลการประเมิน',
      'สถานะแจ้งเตือน (<50%)',
      'จำนวนแผนฟื้นฟู 5 มิติ (ฉบับ)',
      'หมายเหตุการประเมิน',
    ],
  ];
  beneficiaries.forEach((b) => {
    const irps = b.irpHistory?.length
      ? b.irpHistory
      : b.latestIRP
      ? [b.latestIRP]
      : [];
    if (irps.length === 0) {
      tab3Rows.push([
        b.uniquePersonId,
        b.fullName,
        nikhomMap.get(b.nikhomId) || b.nikhomId,
        '-',
        '-',
        '-',
        '-',
        '-',
        'ยังไม่มีประวัติการประเมิน',
        '-',
        b.rehabPlans?.length || 0,
        '-',
      ]);
    } else {
      irps.forEach((irp) => {
        tab3Rows.push([
          b.uniquePersonId,
          b.fullName,
          nikhomMap.get(b.nikhomId) || b.nikhomId,
          irp.round,
          irp.evaluationDate,
          irp.evaluatorName,
          irp.totalScore,
          Number(irp.scorePercentage.toFixed(1)),
          irp.evaluationResult === 'high_potential'
            ? 'มีศักยภาพ'
            : irp.evaluationResult === 'moderate'
            ? 'ปานกลาง'
            : 'ควรปรับปรุง',
          irp.isUnder50Percent ? 'แจ้งเตือนวิกฤต (<50%)' : 'ปกติ',
          b.rehabPlans?.length || 0,
          irp.notes || '-',
        ]);
      });
    }
  });

  // Tab 4: Health History
  const tab4Rows: (string | number)[][] = [
    [
      'รหัสประจำตัวกลาง',
      'ชื่อ-นามสกุล',
      'หน่วยงาน',
      'วันที่ตรวจบันทึก',
      'ประเภทการตรวจ',
      'ความดันโลหิต',
      'น้ำหนัก (กก.)',
      'อาการทางกาย/โรคประจำตัว',
      'สุขภาพจิต/พฤติกรรม',
      'ยาที่ได้รับประจำ',
      'ประวัติแพ้ยา',
      'ระดับเฝ้าระวังสุขภาพ',
      'ผู้บันทึก',
    ],
  ];
  beneficiaries.forEach((b) => {
    const entries = [
      ...(b.initialHealth ? [b.initialHealth] : []),
      ...(b.healthHistory || []),
    ];
    entries.forEach((h) => {
      tab4Rows.push([
        b.uniquePersonId,
        b.fullName,
        nikhomMap.get(b.nikhomId) || b.nikhomId,
        h.recordDate,
        h.isInitialAdmission ? 'ตรวจแรกรับ' : 'ตรวจติดตามผล',
        h.bloodPressure || '-',
        h.weightKg || '-',
        h.physicalCondition || '-',
        h.mentalCondition || '-',
        h.medications || '-',
        h.drugAllergies || '-',
        h.healthStatusLevel === 'normal'
          ? 'ปกติ'
          : h.healthStatusLevel === 'chronic_stable'
          ? 'โรคเรื้อรัง (คงที่)'
          : h.healthStatusLevel === 'needs_close_care'
          ? 'ต้องดูแลใกล้ชิด'
          : 'รักษาตัวในโรงพยาบาล',
        h.recordedBy || '-',
      ]);
    });
  });

  // Tab 5: Activities & Monthly Income
  const tab5Rows: (string | number)[][] = [
    [
      'รหัสประจำตัวกลาง',
      'ชื่อ-นามสกุล',
      'หน่วยงาน',
      'เกษตรกรรม',
      'ปศุสัตว์',
      'หัตถกรรม',
      'งานบริการ',
      'รับจ้างทั่วไป',
      'กิจกรรมอื่นๆ',
      'รูปแบบการเตรียมอาชีพ/จ้างงาน',
      'สถานประกอบการ',
      'รายได้รวมต่อเดือน (บาท)',
      'รายละเอียดแหล่งรายได้',
    ],
    ...beneficiaries.map((b) => [
      b.uniquePersonId,
      b.fullName,
      nikhomMap.get(b.nikhomId) || b.nikhomId,
      b.activities?.agriculture ? 'เข้าร่วม' : '-',
      b.activities?.livestock ? 'เข้าร่วม' : '-',
      b.activities?.handicraft ? 'เข้าร่วม' : '-',
      b.activities?.service ? 'เข้าร่วม' : '-',
      b.activities?.wageLabor ? 'เข้าร่วม' : '-',
      b.activities?.other ? 'เข้าร่วม' : '-',
      b.careerPreparation?.type || 'none',
      b.careerPreparation?.workplaceName || '-',
      b.monthlyIncome || 0,
      b.incomeSource || '-',
    ]),
  ];

  // Tab 6: Monthly Report Summary
  const tab6Rows: (string | number)[][] = [
    ['ตัวชี้วัดรายงานประจำเดือน', 'ค่าข้อมูล / รายละเอียด'],
    ['ประจำเดือน', `${monthlyReport.monthTh} ${monthlyReport.yearTh}`],
    ['วันที่จัดทำรายงาน', monthlyReport.reportDate],
    ['อัตราการรองรับทั้งหมด (คน)', monthlyReport.totalCapacity],
    ['ผู้เข้าอยู่จริงรวม 18 แห่ง (คน)', monthlyReport.totalResidents],
    ['เพศชาย (คน)', monthlyReport.maleCount],
    ['เพศหญิง (คน)', monthlyReport.femaleCount],
    ['อัตราว่างคงเหลือ (คน)', monthlyReport.vacanciesCount],
    ['ผู้พิการ (คน)', monthlyReport.disabledCount],
    ['คนไร้ที่พึ่ง (คน)', monthlyReport.destituteCount],
    ['ผู้พิการซ้ำซ้อน (คน)', monthlyReport.multipleDisabledCount],
    ['ผู้มีรายได้จากการฟื้นฟู/จ้างงาน (คน)', monthlyReport.earningBeneficiariesCount],
    ['รายได้รวมต่อเดือนทั้งโครงการ (บาท)', monthlyReport.totalIncomeBaht],
    ['รายได้เฉลี่ยต่อคน (บาท)', monthlyReport.averageIncomeBaht],
    ['บทสรุปผู้บริหาร', monthlyReport.executiveSummaryNarrative],
    ['เวลาซิงค์ข้อมูลล่าสุด', snapshot.exportedAt],
  ];

  // Tab 7: Lossless System Snapshot JSON (Chunked across rows so cell size <= 35,000 chars)
  const serialized = JSON.stringify(snapshot);
  const chunks = chunkString(serialized, 35000);
  const tab7Rows: (string | number)[][] = [
    [
      'SNAPSHOT_META',
      snapshot.version,
      snapshot.exportedAt,
      String(chunks.length),
      'ห้ามแก้ไขชีตนี้ด้วยมือ (ใช้สำหรับกู้คืนฐานข้อมูลกลับเข้าสู่ Web App แบบ 100%)',
    ],
    ...chunks.map((chunk, idx) => [`CHUNK_${idx}`, chunk]),
  ];

  return [
    { range: `'${SHEET_TABS[0]}'!A1`, values: tab1Rows },
    { range: `'${SHEET_TABS[1]}'!A1`, values: tab2Rows },
    { range: `'${SHEET_TABS[2]}'!A1`, values: tab3Rows },
    { range: `'${SHEET_TABS[3]}'!A1`, values: tab4Rows },
    { range: `'${SHEET_TABS[4]}'!A1`, values: tab5Rows },
    { range: `'${SHEET_TABS[5]}'!A1`, values: tab6Rows },
    { range: `'${SHEET_TABS[6]}'!A1`, values: tab7Rows },
  ];
}

export async function createMasterGoogleSheet(
  snapshot: FullDatabaseSnapshot,
  customTitle?: string
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
}> {
  const token = await requireToken();
  const title =
    customTitle?.trim() ||
    `ฐานข้อมูลโครงการบ้านน้อยในนิคม_พม_18_แห่ง (${new Date().toLocaleDateString('th-TH')})`;

  // Step 1: Create spreadsheet with the 7 tabs
  const createRes = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
          locale: 'th_TH',
        },
        sheets: SHEET_TABS.map((tabName, index) => ({
          properties: {
            title: tabName,
            index,
            gridProperties: {
              rowCount: 1000,
              columnCount: 28,
              frozenRowCount: 1,
            },
          },
        })),
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(
      `ไม่สามารถสร้างไฟล์ Google Sheets ได้ (${createRes.status}): ${errText}`
    );
  }

  const createdData = await createRes.json();
  const spreadsheetId: string = createdData.spreadsheetId;
  const spreadsheetUrl: string =
    createdData.spreadsheetUrl ||
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Populate all 7 tabs with batchUpdate values
  await syncToExistingGoogleSheet(spreadsheetId, snapshot);

  return {
    spreadsheetId,
    spreadsheetUrl,
    spreadsheetTitle: title,
  };
}

export async function syncToExistingGoogleSheet(
  rawSpreadsheetId: string,
  snapshot: FullDatabaseSnapshot
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
}> {
  const token = await requireToken();
  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);

  // 1. Fetch existing spreadsheet metadata to verify tabs exist
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(
      `ไม่พบไฟล์ Google Sheets หรือคุณไม่มีสิทธิ์เข้าถึงไฟล์นี้ (${metaRes.status}): ${errText}`
    );
  }

  const meta = await metaRes.json();
  const existingSheetTitles = new Set<string>(
    (meta.sheets || []).map(
      (s: { properties?: { title?: string } }) => s.properties?.title || ''
    )
  );

  // Add any missing tabs
  const missingTabs = SHEET_TABS.filter((t) => !existingSheetTitles.has(t));
  if (missingTabs.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: missingTabs.map((tabTitle) => ({
            addSheet: {
              properties: {
                title: tabTitle,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 28,
                  frozenRowCount: 1,
                },
              },
            },
          })),
        }),
      }
    );
  }

  // Clear existing ranges in the 7 tabs before writing fresh data
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: SHEET_TABS.map((t) => `'${t}'!A1:Z1000`),
      }),
    }
  );

  // Batch write all 7 tabs
  const dataPayload = buildSheetsValues(snapshot);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload,
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(
      `อัปเดตข้อมูลลง Google Sheets ไม่สำเร็จ (${updateRes.status}): ${errText}`
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl:
      meta.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    spreadsheetTitle:
      meta.properties?.title || 'ฐานข้อมูลโครงการบ้านน้อยในนิคม_พม_18_แห่ง',
  };
}

export async function restoreFromGoogleSheet(
  rawSpreadsheetId: string
): Promise<FullDatabaseSnapshot> {
  const token = await requireToken();
  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      SHEET_TABS[6]
    )}'!A1:E200`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `ไม่สามารถอ่านข้อมูลจาก Google Sheets ได้ (${res.status}): ${errText}`
    );
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];
  if (rows.length < 2) {
    throw new Error(
      'ไม่พบข้อมูลสำรองระบบในแท็บ 7_SYSTEM_SNAPSHOT ของไฟล์ Google Sheets นี้'
    );
  }

  const chunkRows = rows
    .slice(1)
    .filter((r) => r[0] && r[0].startsWith('CHUNK_'))
    .map((r) => r[1] || '');

  const fullJson = chunkRows.join('');
  if (!fullJson) {
    throw new Error('ข้อมูลในแท็บ 7_SYSTEM_SNAPSHOT ว่างเปล่าหรือไม่สมบูรณ์');
  }

  const parsed = JSON.parse(fullJson) as FullDatabaseSnapshot;
  if (!Array.isArray(parsed.nikhoms) || !Array.isArray(parsed.beneficiaries)) {
    throw new Error('โครงสร้างข้อมูลที่ดึงมาจาก Google Sheets ไม่ถูกต้อง');
  }

  return parsed;
}

// ==================== GOOGLE DRIVE JSON BACKUP FILES ====================

export async function uploadJsonBackupToDrive(
  snapshot: FullDatabaseSnapshot
): Promise<DriveBackupFile> {
  const token = await requireToken();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `BannoiNikhom_DB_Backup_${dateStr}.json`;

  const metadata = {
    name: filename,
    mimeType: 'application/json',
    description:
      'ไฟล์สำรองฐานข้อมูลระบบสารสนเทศโครงการบ้านน้อยในนิคม (18 แห่ง) กรมพัฒนาสังคมและสวัสดิการ',
  };

  const boundary = '-------bannoi_nikhom_drive_backup_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(snapshot, null, 2) +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `อัปโหลดไฟล์สำรองขึ้น Google Drive ไม่สำเร็จ (${res.status}): ${errText}`
    );
  }

  return (await res.json()) as DriveBackupFile;
}

export async function listDriveBackupFiles(): Promise<DriveBackupFile[]> {
  const token = await requireToken();
  const q = encodeURIComponent(
    "mimeType='application/json' and trashed=false and name contains 'BannoiNikhom_DB_Backup'"
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=20&fields=files(id,name,createdTime,modifiedTime,size,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `ไม่สามารถดึงรายการไฟล์จาก Google Drive ได้ (${res.status}): ${errText}`
    );
  }

  const data = await res.json();
  return (data.files || []) as DriveBackupFile[];
}

export async function downloadDriveBackupFile(
  fileId: string
): Promise<FullDatabaseSnapshot> {
  const token = await requireToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `ดาวน์โหลดไฟล์สำรองจาก Google Drive ไม่สำเร็จ (${res.status}): ${errText}`
    );
  }

  const parsed = (await res.json()) as FullDatabaseSnapshot;
  if (!Array.isArray(parsed.nikhoms) || !Array.isArray(parsed.beneficiaries)) {
    throw new Error('ไฟล์สำรองฐานข้อมูลไม่ถูกต้องหรือไม่สมบูรณ์');
  }
  return parsed;
}

export async function deleteDriveBackupFile(fileId: string): Promise<void> {
  const token = await requireToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok && res.status !== 204) {
    const errText = await res.text();
    throw new Error(`ลบไฟล์ใน Google Drive ไม่สำเร็จ (${res.status}): ${errText}`);
  }
}
