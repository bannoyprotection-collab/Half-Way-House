import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  Beneficiary,
  Nikhom,
  SystemNotification,
  MonthlyProgressReport,
  IRPEvaluation,
  RehabPlan,
  BehaviorLog,
  BeneficiaryTimelineEvent,
  UserAccount,
  HealthRecordEntry,
  CivilRegistrationRecord,
  ActivityWorkItem,
  MonthlyActivityUpdateLog,
  AdmissionRecordTP1,
  DischargeRecordTP1,
} from '../types';
import {
  INITIAL_BENEFICIARIES,
  INITIAL_NIKHOMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MONTHLY_REPORT,
  INITIAL_USER_ACCOUNTS,
} from '../data/mockData';
import {
  db,
  auth,
  initAuth,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { FullDatabaseSnapshot } from './googleDriveSyncService';

export interface DriveSyncConfigState {
  id: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  lastSyncedAt: string;
  syncedByEmail: string;
  autoSyncEnabled: boolean;
}

export interface CloudSyncStatus {
  isFirebaseReady: boolean;
  isAuthenticatedGoogle: boolean;
  googleUserEmail: string | null;
  googleUserUid: string | null;
  isSyncingFirestore: boolean;
  lastFirestoreSyncAt: string | null;
  firestoreError: string | null;
}

const STORAGE_KEYS = {
  BENEFICIARIES: 'bnn_beneficiaries_v2',
  NIKHOMS: 'bnn_nikhoms_v2',
  NOTIFICATIONS: 'bnn_notifications_v2',
  MONTHLY_REPORT: 'bnn_monthly_report_v2',
  USER_ACCOUNTS: 'bnn_user_accounts_v2',
  CURRENT_USER: 'bnn_current_user_v2',
  DRIVE_SYNC_CONFIG: 'bnn_drive_sync_config_v2',
};

function safeId(raw: string, maxLen = 64): string {
  const cleaned = (raw || 'item')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : 'item';
}

function safeStr(raw: unknown, maxLen: number, fallback = '-'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function safeOptionalEmptyStr(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.slice(0, maxLen);
}

function safeNum(raw: unknown, min: number, max: number, fallback = 0): number {
  const n = Number(raw);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function stripUndefinedDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

class StorageService {
  private listeners: Set<() => void> = new Set();
  private firestoreUnsubs: Unsubscribe[] = [];
  private cloudStatus: CloudSyncStatus = {
    isFirebaseReady: isFirebaseConfigured,
    isAuthenticatedGoogle: false,
    googleUserEmail: null,
    googleUserUid: null,
    isSyncingFirestore: false,
    lastFirestoreSyncAt: null,
    firestoreError: null,
  };

  constructor() {
    if (typeof window !== 'undefined' && isFirebaseConfigured) {
      initAuth(
        (user) => {
          this.handleGoogleAuthChange(user);
        },
        () => {
          this.handleGoogleAuthChange(null);
        }
      );
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getCloudSyncStatus(): CloudSyncStatus {
    return { ...this.cloudStatus };
  }

  private updateCloudStatus(partial: Partial<CloudSyncStatus>) {
    this.cloudStatus = { ...this.cloudStatus, ...partial };
    this.notify();
  }

  // ==================== FIRESTORE REAL-TIME SYNC & SANITIZATION ====================

  private getDocKey(uid: string, entityId: string): string {
    return safeId(`${uid.slice(0, 12)}_${entityId}`, 120);
  }

  private sanitizeNikhomForFirestore(nk: Nikhom, uid: string) {
    return {
      id: safeId(nk.id, 64),
      name: safeStr(nk.name, 200, 'นิคมสร้างตนเอง'),
      shortName: safeStr(nk.shortName, 100, 'นิคมฯ'),
      province: safeStr(nk.province, 100, '-'),
      region: ['north', 'northeast', 'central', 'south'].includes(nk.region)
        ? nk.region
        : 'central',
      capacity: safeNum(nk.capacity, 0, 10000, 10),
      currentResidents: safeNum(nk.currentResidents, 0, 10000, 0),
      vacancies: safeNum(nk.vacancies, 0, 10000, 0),
      isFull: Boolean(nk.isFull),
      mapX: safeNum(nk.mapX, 0, 100, 50),
      mapY: safeNum(nk.mapY, 0, 100, 50),
      ownerId: safeId(uid, 128),
      updatedAt: serverTimestamp(),
    };
  }

  private sanitizeBeneficiaryForFirestore(b: Beneficiary, uid: string) {
    const cleanB = stripUndefinedDeep(b);
    const payload: Record<string, unknown> = {
      id: safeId(cleanB.id, 128),
      uniquePersonId: safeStr(cleanB.uniquePersonId, 64, 'BNN-69-0000'),
      code: safeStr(cleanB.code, 64, '-'),
      nationalId: safeStr(cleanB.nationalId, 64, 'ไม่มีบัตรประจำตัวประชาชน'),
      fullName: safeStr(cleanB.fullName, 200, 'ไม่ระบุชื่อ'),
      gender: cleanB.gender === 'female' ? 'female' : 'male',
      age: safeNum(cleanB.age, 0, 150, 40),
      nikhomId: safeId(cleanB.nikhomId, 64),
      building: safeStr(cleanB.building, 120, 'เรือนพัก 1'),
      admissionDate: safeStr(cleanB.admissionDate, 40, '2026-01-01'),
      referringAgency: safeStr(cleanB.referringAgency, 200, '-'),
      status: ['resident', 'discharged', 'prep_work'].includes(cleanB.status)
        ? cleanB.status
        : 'resident',
      category: cleanB.category === 'destitute' ? 'destitute' : 'disabled',
      disabilityTypes: Array.isArray(cleanB.disabilityTypes)
        ? cleanB.disabilityTypes.slice(0, 6).map((n) => Number(n) || 1)
        : [],
      hasMultipleDisabilities: Boolean(cleanB.hasMultipleDisabilities),
      chronicDiseases: safeOptionalEmptyStr(cleanB.chronicDiseases, 500),
      personalityTraits: safeOptionalEmptyStr(cleanB.personalityTraits, 500),
      tp1Profile:
        cleanB.tp1Profile && typeof cleanB.tp1Profile === 'object'
          ? cleanB.tp1Profile
          : {},
      admissionHistory: Array.isArray(cleanB.admissionHistory)
        ? cleanB.admissionHistory.slice(0, 50)
        : [],
      dischargeHistory: Array.isArray(cleanB.dischargeHistory)
        ? cleanB.dischargeHistory.slice(0, 50)
        : [],
      initialHealth:
        cleanB.initialHealth && typeof cleanB.initialHealth === 'object'
          ? cleanB.initialHealth
          : {},
      healthHistory: Array.isArray(cleanB.healthHistory)
        ? cleanB.healthHistory.slice(0, 100)
        : [],
      civilRegistration:
        cleanB.civilRegistration && typeof cleanB.civilRegistration === 'object'
          ? cleanB.civilRegistration
          : {},
      activities:
        cleanB.activities && typeof cleanB.activities === 'object'
          ? cleanB.activities
          : {},
      activityDetails: Array.isArray(cleanB.activityDetails)
        ? cleanB.activityDetails.slice(0, 20)
        : [],
      monthlyActivityLogs: Array.isArray(cleanB.monthlyActivityLogs)
        ? cleanB.monthlyActivityLogs.slice(0, 60)
        : [],
      monthlyIncome: safeNum(cleanB.monthlyIncome, 0, 10000000, 0),
      incomeSource: safeOptionalEmptyStr(cleanB.incomeSource, 500),
      careerPreparation:
        cleanB.careerPreparation && typeof cleanB.careerPreparation === 'object'
          ? cleanB.careerPreparation
          : { type: 'none' },
      irpHistory: Array.isArray(cleanB.irpHistory)
        ? cleanB.irpHistory.slice(0, 50)
        : [],
      rehabPlans: Array.isArray(cleanB.rehabPlans)
        ? cleanB.rehabPlans.slice(0, 50)
        : [],
      behaviorLogs: Array.isArray(cleanB.behaviorLogs)
        ? cleanB.behaviorLogs.slice(0, 100)
        : [],
      timeline: Array.isArray(cleanB.timeline)
        ? cleanB.timeline.slice(0, 200)
        : [],
      ownerId: safeId(uid, 128),
      updatedAt: serverTimestamp(),
    };

    if (cleanB.dischargeInfo && typeof cleanB.dischargeInfo === 'object') {
      payload.dischargeInfo = cleanB.dischargeInfo;
    }
    if (cleanB.latestIRP && typeof cleanB.latestIRP === 'object') {
      payload.latestIRP = cleanB.latestIRP;
    }
    if (typeof cleanB.photoUrl === 'string' && cleanB.photoUrl) {
      payload.photoUrl = safeStr(cleanB.photoUrl, 500000, '');
    }
    if (typeof cleanB.physicalMarksPhotoUrl === 'string' && cleanB.physicalMarksPhotoUrl) {
      payload.physicalMarksPhotoUrl = safeStr(cleanB.physicalMarksPhotoUrl, 500000, '');
    }
    return payload;
  }

  private sanitizeReportForFirestore(report: MonthlyProgressReport, uid: string) {
    const cleanR = stripUndefinedDeep(report);
    const payload: Record<string, unknown> = {
      id: safeId(cleanR.id || 'current_report', 64),
      yearTh: safeNum(cleanR.yearTh, 2500, 2700, 2569),
      monthTh: safeStr(cleanR.monthTh, 64, 'มีนาคม'),
      reportDate: safeStr(cleanR.reportDate, 40, '2026-03-31'),
      totalCapacity: safeNum(cleanR.totalCapacity, 0, 100000, 260),
      totalResidents: safeNum(cleanR.totalResidents, 0, 100000, 211),
      maleCount: safeNum(cleanR.maleCount, 0, 100000, 129),
      femaleCount: safeNum(cleanR.femaleCount, 0, 100000, 82),
      vacanciesCount: safeNum(cleanR.vacanciesCount, 0, 100000, 49),
      disabledCount: safeNum(cleanR.disabledCount, 0, 100000, 152),
      destituteCount: safeNum(cleanR.destituteCount, 0, 100000, 59),
      multipleDisabledCount: safeNum(cleanR.multipleDisabledCount, 0, 100000, 24),
      activitiesCount: cleanR.activitiesCount || {},
      earningBeneficiariesCount: safeNum(cleanR.earningBeneficiariesCount, 0, 100000, 0),
      totalIncomeBaht: safeNum(cleanR.totalIncomeBaht, 0, 100000000, 0),
      averageIncomeBaht: safeNum(cleanR.averageIncomeBaht, 0, 10000000, 0),
      careerPrepCounts: cleanR.careerPrepCounts || {},
      dischargeCounts: cleanR.dischargeCounts || {},
      irpStats: cleanR.irpStats || {},
      executiveSummaryNarrative: safeOptionalEmptyStr(
        cleanR.executiveSummaryNarrative,
        5000
      ),
      status: ['draft', 'approved', 'published'].includes(cleanR.status)
        ? cleanR.status
        : 'published',
      ownerId: safeId(uid, 128),
      updatedAt: serverTimestamp(),
    };
    if (cleanR.approvedBy) {
      payload.approvedBy = safeStr(cleanR.approvedBy, 200, '-');
    }
    return payload;
  }

  private async handleGoogleAuthChange(user: User | null) {
    this.firestoreUnsubs.forEach((u) => u());
    this.firestoreUnsubs = [];

    if (!user || !db) {
      this.updateCloudStatus({
        isAuthenticatedGoogle: false,
        googleUserEmail: null,
        googleUserUid: null,
        isSyncingFirestore: false,
      });
      return;
    }

    this.updateCloudStatus({
      isAuthenticatedGoogle: true,
      googleUserEmail: user.email || null,
      googleUserUid: user.uid,
      isSyncingFirestore: true,
      firestoreError: null,
    });

    try {
      await this.initializeFirestoreSyncForUser(user);
    } catch (err) {
      this.updateCloudStatus({
        isSyncingFirestore: false,
        firestoreError: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async initializeFirestoreSyncForUser(user: User) {
    if (!db) return;
    const uid = user.uid;

    // 1. Check if user already has Nikhoms in Firestore; if empty, seed current local data
    const nikhomsQuery = query(
      collection(db, 'nikhoms'),
      where('ownerId', '==', uid)
    );
    try {
      const existingSnap = await getDocs(nikhomsQuery);
      if (existingSnap.empty) {
        await this.pushAllLocalToFirestore();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'nikhoms');
    }

    // 2. Attach real-time onSnapshot listeners
    const unsubNikhoms = onSnapshot(
      query(collection(db, 'nikhoms'), where('ownerId', '==', uid)),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => {
            const data = d.data();
            const { ownerId, updatedAt, ...rest } = data;
            return rest as Nikhom;
          });
          // Sort to preserve INITIAL_NIKHOMS order
          const orderMap = new Map(INITIAL_NIKHOMS.map((n, i) => [n.id, i]));
          loaded.sort(
            (a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99)
          );
          localStorage.setItem(STORAGE_KEYS.NIKHOMS, JSON.stringify(loaded));
          this.updateCloudStatus({
            isSyncingFirestore: false,
            lastFirestoreSyncAt: new Date().toLocaleString('th-TH'),
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'nikhoms');
      }
    );

    const unsubBeneficiaries = onSnapshot(
      query(collection(db, 'beneficiaries'), where('ownerId', '==', uid)),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((d) => {
            const data = d.data();
            const { ownerId, updatedAt, ...rest } = data;
            return rest as Beneficiary;
          });
          localStorage.setItem(
            STORAGE_KEYS.BENEFICIARIES,
            JSON.stringify(loaded)
          );
          this.updateCloudStatus({
            isSyncingFirestore: false,
            lastFirestoreSyncAt: new Date().toLocaleString('th-TH'),
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'beneficiaries');
      }
    );

    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), where('ownerId', '==', uid)),
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const { ownerId, updatedAt, ...rest } = data;
          localStorage.setItem(
            STORAGE_KEYS.MONTHLY_REPORT,
            JSON.stringify(rest)
          );
          this.notify();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'reports');
      }
    );

    const unsubDriveConfig = onSnapshot(
      query(collection(db, 'drive_sync_configs'), where('ownerId', '==', uid)),
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const { ownerId, updatedAt, ...rest } = data;
          localStorage.setItem(
            STORAGE_KEYS.DRIVE_SYNC_CONFIG,
            JSON.stringify(rest)
          );
          this.notify();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'drive_sync_configs');
      }
    );

    this.firestoreUnsubs.push(
      unsubNikhoms,
      unsubBeneficiaries,
      unsubReports,
      unsubDriveConfig
    );
  }

  public async pushAllLocalToFirestore(): Promise<void> {
    if (!db || !auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    this.updateCloudStatus({ isSyncingFirestore: true, firestoreError: null });

    const nikhoms = this.getNikhoms();
    const beneficiaries = this.getBeneficiaries();
    const report = this.getMonthlyReport();

    try {
      for (const nk of nikhoms) {
        const docId = this.getDocKey(uid, nk.id);
        await setDoc(
          doc(db, 'nikhoms', docId),
          this.sanitizeNikhomForFirestore(nk, uid)
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'nikhoms');
    }

    try {
      for (const b of beneficiaries) {
        const docId = this.getDocKey(uid, b.id);
        await setDoc(
          doc(db, 'beneficiaries', docId),
          this.sanitizeBeneficiaryForFirestore(b, uid)
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'beneficiaries');
    }

    try {
      const reportDocId = this.getDocKey(uid, report.id || 'current_report');
      await setDoc(
        doc(db, 'reports', reportDocId),
        this.sanitizeReportForFirestore(report, uid)
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }

    this.updateCloudStatus({
      isSyncingFirestore: false,
      lastFirestoreSyncAt: new Date().toLocaleString('th-TH'),
    });
  }

  private async syncSingleBeneficiaryToFirestore(b: Beneficiary) {
    if (!db || !auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    const docId = this.getDocKey(uid, b.id);
    try {
      await setDoc(
        doc(db, 'beneficiaries', docId),
        this.sanitizeBeneficiaryForFirestore(b, uid)
      );
      this.updateCloudStatus({
        lastFirestoreSyncAt: new Date().toLocaleString('th-TH'),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `beneficiaries/${docId}`);
    }
  }

  private async syncAllNikhomsToFirestore(nikhoms: Nikhom[]) {
    if (!db || !auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      for (const nk of nikhoms) {
        const docId = this.getDocKey(uid, nk.id);
        await setDoc(
          doc(db, 'nikhoms', docId),
          this.sanitizeNikhomForFirestore(nk, uid)
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'nikhoms');
    }
  }

  // ==================== DRIVE SYNC CONFIG & SNAPSHOT IMPORT/EXPORT ====================

  public getDriveSyncConfig(): DriveSyncConfigState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRIVE_SYNC_CONFIG);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public async saveDriveSyncConfig(config: DriveSyncConfigState): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.DRIVE_SYNC_CONFIG, JSON.stringify(config));
    this.notify();

    if (db && auth?.currentUser) {
      const uid = auth.currentUser.uid;
      const docId = this.getDocKey(uid, 'master_drive_config');
      try {
        await setDoc(doc(db, 'drive_sync_configs', docId), {
          id: docId,
          spreadsheetId: safeStr(config.spreadsheetId, 128, '-'),
          spreadsheetUrl: safeStr(config.spreadsheetUrl, 500, '-'),
          spreadsheetTitle: safeStr(config.spreadsheetTitle, 200, '-'),
          lastSyncedAt: safeStr(config.lastSyncedAt, 64, '-'),
          syncedByEmail: safeStr(
            config.syncedByEmail || auth.currentUser.email || '-',
            200,
            '-'
          ),
          autoSyncEnabled: Boolean(config.autoSyncEnabled),
          ownerId: safeId(uid, 128),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `drive_sync_configs/${docId}`
        );
      }
    }
  }

  public exportFullDatabaseSnapshot(): FullDatabaseSnapshot {
    return {
      version: '2.0.0',
      exportedAt: new Date().toLocaleString('th-TH'),
      exportedByEmail: auth?.currentUser?.email || this.getCurrentUser()?.username,
      nikhoms: this.getNikhoms(),
      beneficiaries: this.getBeneficiaries(),
      monthlyReport: this.getMonthlyReport(),
      userAccounts: this.getUserAccounts(),
    };
  }

  public async importFullDatabaseSnapshot(
    snapshot: FullDatabaseSnapshot
  ): Promise<void> {
    if (Array.isArray(snapshot.nikhoms) && snapshot.nikhoms.length > 0) {
      localStorage.setItem(
        STORAGE_KEYS.NIKHOMS,
        JSON.stringify(snapshot.nikhoms)
      );
    }
    if (Array.isArray(snapshot.beneficiaries)) {
      localStorage.setItem(
        STORAGE_KEYS.BENEFICIARIES,
        JSON.stringify(snapshot.beneficiaries)
      );
    }
    if (snapshot.monthlyReport) {
      localStorage.setItem(
        STORAGE_KEYS.MONTHLY_REPORT,
        JSON.stringify(snapshot.monthlyReport)
      );
    }
    if (Array.isArray(snapshot.userAccounts) && snapshot.userAccounts.length > 0) {
      localStorage.setItem(
        STORAGE_KEYS.USER_ACCOUNTS,
        JSON.stringify(snapshot.userAccounts)
      );
    }
    this.notify();

    if (db && auth?.currentUser) {
      await this.pushAllLocalToFirestore();
    }
  }

  // ==================== USER ACCOUNTS & AUTH ====================
  public getUserAccounts(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_ACCOUNTS);
      return data ? JSON.parse(data) : INITIAL_USER_ACCOUNTS;
    } catch {
      return INITIAL_USER_ACCOUNTS;
    }
  }

  public saveUserAccounts(accounts: UserAccount[]) {
    localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(accounts));
    this.notify();
  }

  public getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data === 'LOGGED_OUT') return null;
      if (!data) return INITIAL_USER_ACCOUNTS[0];
      const parsed: UserAccount = JSON.parse(data);
      const latest = this.getUserAccounts().find((u) => u.id === parsed.id);
      return latest || parsed;
    } catch {
      return INITIAL_USER_ACCOUNTS[0];
    }
  }

  public setCurrentUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'LOGGED_OUT');
    }
    this.notify();
  }

  public login(
    username: string,
    password: string
  ): { success: boolean; user?: UserAccount; error?: string } {
    const accounts = this.getUserAccounts();
    const matched = accounts.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password
    );

    if (!matched) {
      return {
        success: false,
        error: 'ชื่อผู้ใช้งาน (ID) หรือรหัสผ่าน (Password) ไม่ถูกต้อง',
      };
    }
    if (!matched.isActive) {
      return {
        success: false,
        error:
          'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อ Super Admin',
      };
    }

    const updatedUser: UserAccount = {
      ...matched,
      lastLogin: new Date().toLocaleString('th-TH'),
    };
    const updatedList = accounts.map((u) =>
      u.id === matched.id ? updatedUser : u
    );
    localStorage.setItem(
      STORAGE_KEYS.USER_ACCOUNTS,
      JSON.stringify(updatedList)
    );
    this.setCurrentUser(updatedUser);
    return { success: true, user: updatedUser };
  }

  public logout() {
    this.setCurrentUser(null);
  }

  public createUserAccount(newAccount: Omit<UserAccount, 'id'>): UserAccount {
    const accounts = this.getUserAccounts();
    const exists = accounts.some(
      (u) => u.username.toLowerCase() === newAccount.username.trim().toLowerCase()
    );
    if (exists) {
      throw new Error('ชื่อผู้ใช้งาน (ID) นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น');
    }
    const created: UserAccount = {
      ...newAccount,
      id: `usr-${Date.now()}`,
      username: newAccount.username.trim(),
    };
    this.saveUserAccounts([created, ...accounts]);
    return created;
  }

  public updateUserAccount(
    id: string,
    updates: Partial<UserAccount>
  ): UserAccount {
    const accounts = this.getUserAccounts();
    const index = accounts.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('ไม่พบบัญชีผู้ใช้งาน');

    if (updates.username) {
      const duplicate = accounts.some(
        (u) =>
          u.id !== id &&
          u.username.toLowerCase() === updates.username!.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error('ชื่อผู้ใช้งาน (ID) นี้ซ้ำกับบัญชีอื่นในระบบ');
      }
    }

    const updated: UserAccount = {
      ...accounts[index],
      ...updates,
    };
    accounts[index] = updated;
    this.saveUserAccounts(accounts);

    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.setCurrentUser(updated);
    }
    return updated;
  }

  public canAccessBeneficiary(
    user: UserAccount | null,
    targetNikhomId: string
  ): boolean {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'central_admin') return true;
    return user.nikhomId === targetNikhomId;
  }

  // ==================== UNIQUE PERSON ID GENERATOR ====================
  public generateNextUniquePersonId(): string {
    const beneficiaries = this.getBeneficiaries();
    let maxSeq = 0;
    beneficiaries.forEach((b) => {
      const match = b.uniquePersonId?.match(/BNN-\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    const nextNum = maxSeq + 1;
    return `BNN-69-${String(nextNum).padStart(4, '0')}`;
  }

  // ==================== BENEFICIARIES ====================
  public getBeneficiaries(): Beneficiary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BENEFICIARIES);
      return data ? JSON.parse(data) : INITIAL_BENEFICIARIES;
    } catch {
      return INITIAL_BENEFICIARIES;
    }
  }

  public saveBeneficiaries(beneficiaries: Beneficiary[]) {
    localStorage.setItem(
      STORAGE_KEYS.BENEFICIARIES,
      JSON.stringify(beneficiaries)
    );
    this.updateNikhomStats(beneficiaries);
    this.notify();
  }

  public getBeneficiaryById(id: string): Beneficiary | undefined {
    return this.getBeneficiaries().find((b) => b.id === id);
  }

  public addBeneficiary(
    beneficiary: Omit<Beneficiary, 'id' | 'uniquePersonId'> & {
      uniquePersonId?: string;
    }
  ): Beneficiary {
    const beneficiaries = this.getBeneficiaries();
    const newId = `b-${Date.now()}`;
    // Always generate the latest unique sequential BNN code atomically at save time
    const uniquePersonId = this.generateNextUniquePersonId();
    const actorName = this.getCurrentUser()?.name || 'เจ้าหน้าที่';

    const newBeneficiary: Beneficiary = {
      ...beneficiary,
      id: newId,
      uniquePersonId,
      hasMultipleDisabilities: (beneficiary.disabilityTypes?.length || 0) > 1,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date:
            beneficiary.admissionDate || new Date().toISOString().split('T')[0],
          title: `แรกรับเข้าโครงการบ้านน้อยในนิคม (รหัสประจำตัว ${uniquePersonId})`,
          description: `รับตัวจาก "${beneficiary.referringAgency}" เข้าสู่ระบบโดย ${actorName}`,
          type: 'admission',
          severity: 'normal',
          actor: actorName,
        },
        ...(beneficiary.timeline || []),
      ],
    };

    const updated = [newBeneficiary, ...beneficiaries];
    this.saveBeneficiaries(updated);
    void this.syncSingleBeneficiaryToFirestore(newBeneficiary);

    this.addNotification({
      type: 'admission',
      title: 'บันทึกรับผู้ใช้บริการใหม่',
      message: `บันทึกรับ ${newBeneficiary.fullName} (รหัสประจำตัว ${uniquePersonId}) จาก ${newBeneficiary.referringAgency} สำเร็จ`,
      beneficiaryId: newBeneficiary.id,
      beneficiaryName: newBeneficiary.fullName,
      nikhomId: newBeneficiary.nikhomId,
      priority: 'info',
    });

    return newBeneficiary;
  }

  public readmitBeneficiary(
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
  ): Beneficiary {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('ไม่พบประวัติผู้ใช้บริการเดิม');

    const b = beneficiaries[index];
    const nextRound = (b.admissionHistory?.length || 1) + 1;
    const actorName = this.getCurrentUser()?.name || 'เจ้าหน้าที่';

    const newAdmissionRecord: AdmissionRecordTP1 = {
      round: nextRound,
      sequenceNumber: `${String(nextRound).padStart(2, '0')}/2569`,
      registrationNumber: params.registrationCode || b.code,
      referringAgency: params.referringAgency,
      categoryType: b.category === 'disabled' ? 'ผู้พิการ' : 'คนไร้ที่พึ่ง',
      admissionDate: params.admissionDate,
      dateThText: `รับกลับเข้าครั้งที่ ${nextRound} เมื่อ ${params.admissionDate}`,
      nikhomId: params.nikhomId,
    };

    const newHealthEntry: HealthRecordEntry = {
      id: `hl-${Date.now()}`,
      recordDate: params.admissionDate,
      isInitialAdmission: true,
      bloodPressure: params.bloodPressure || '120/80 mmHg',
      weightKg: params.weightKg || b.tp1Profile.weightKg,
      physicalCondition:
        params.healthNote || 'ตรวจสุขภาพแรกรับกลับเข้าโครงการซ้ำ',
      mentalCondition: 'ประเมินสภาพจิตใจแรกรับซ้ำ ปกติ',
      medications: b.initialHealth?.medications || '-',
      drugAllergies: b.initialHealth?.drugAllergies || '-',
      healthStatusLevel: 'chronic_stable',
      recordedBy: actorName,
      notes: `ตรวจสุขภาพรับเข้าครั้งที่ ${nextRound}`,
    };

    const timelineEvent: BeneficiaryTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: params.admissionDate,
      title: `รับกลับเข้าโครงการซ้ำ ครั้งที่ ${nextRound} (คงรหัสประจำตัวเดิม ${b.uniquePersonId})`,
      description: `รับตัวจาก "${params.referringAgency}" เข้าพักที่อาคาร ${params.building} โดยใช้รหัสประจำตัวเดิมและเชื่อมต่อประวัติเดิมทั้งหมด`,
      type: 'readmission',
      severity: 'normal',
      actor: actorName,
    };

    const updatedBeneficiary: Beneficiary = {
      ...b,
      status: 'resident',
      nikhomId: params.nikhomId,
      building: params.building,
      admissionDate: params.admissionDate,
      referringAgency: params.referringAgency,
      code: params.registrationCode || b.code,
      dischargeInfo: {
        isDischarged: false,
      },
      admissionHistory: [...(b.admissionHistory || []), newAdmissionRecord],
      healthHistory: [newHealthEntry, ...(b.healthHistory || [])],
      timeline: [timelineEvent, ...(b.timeline || [])],
    };

    beneficiaries[index] = updatedBeneficiary;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updatedBeneficiary);

    this.addNotification({
      type: 'admission',
      title: `รับผู้ใช้บริการกลับเข้าโครงการซ้ำ (ครั้งที่ ${nextRound})`,
      message: `${b.fullName} (รหัสเดิม ${b.uniquePersonId}) กลับเข้าสู่โครงการพร้อมประวัติเดิมครบถ้วน`,
      beneficiaryId: b.id,
      beneficiaryName: b.fullName,
      nikhomId: params.nikhomId,
      priority: 'info',
    });

    return updatedBeneficiary;
  }

  public updateBeneficiary(
    id: string,
    updates: Partial<Beneficiary>
  ): Beneficiary | undefined {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === id);
    if (index === -1) return undefined;

    const merged = {
      ...beneficiaries[index],
      ...updates,
    };
    if (updates.disabilityTypes) {
      merged.hasMultipleDisabilities = updates.disabilityTypes.length > 1;
    }
    beneficiaries[index] = merged;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(merged);
    return merged;
  }

  public addHealthUpdate(
    beneficiaryId: string,
    entry: Omit<HealthRecordEntry, 'id'>
  ): Beneficiary {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('ไม่พบข้อมูลผู้ใช้บริการ');

    const b = beneficiaries[index];
    const fullEntry: HealthRecordEntry = {
      ...entry,
      id: `hl-${Date.now()}`,
    };

    const timelineEvent: BeneficiaryTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: entry.recordDate,
      title: entry.isInitialAdmission
        ? 'อัปเดตข้อมูลสุขภาพแรกเข้า'
        : 'อัปเดตข้อมูลการตรวจติดตามสุขภาพ',
      description: `สุขภาพกาย: ${entry.physicalCondition} | สุขภาพจิต: ${entry.mentalCondition} | ยา: ${entry.medications}`,
      type: 'health_update',
      severity:
        entry.healthStatusLevel === 'needs_close_care' ||
        entry.healthStatusLevel === 'hospitalized'
          ? 'warning'
          : 'normal',
      actor: entry.recordedBy,
    };

    const updated: Beneficiary = {
      ...b,
      chronicDiseases: entry.physicalCondition,
      initialHealth: entry.isInitialAdmission ? fullEntry : b.initialHealth,
      healthHistory: entry.isInitialAdmission
        ? b.healthHistory
        : [fullEntry, ...(b.healthHistory || [])],
      timeline: [timelineEvent, ...(b.timeline || [])],
    };

    beneficiaries[index] = updated;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updated);
    return updated;
  }

  public updateCivilRegistration(
    beneficiaryId: string,
    civilRegistration: CivilRegistrationRecord
  ): Beneficiary {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('ไม่พบข้อมูลผู้ใช้บริการ');

    const b = beneficiaries[index];
    const actorName = this.getCurrentUser()?.name || 'เจ้าหน้าที่';
    const today = new Date().toISOString().split('T')[0];

    const updatedReg: CivilRegistrationRecord = {
      ...civilRegistration,
      lastUpdatedDate: today,
      lastUpdatedBy: actorName,
    };

    const timelineEvent: BeneficiaryTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: today,
      title: 'อัปเดตสถานะทางทะเบียน สิทธิ์ และการสืบหาญาติ',
      description: `${
        updatedReg.hasNationalIdCard
          ? `มีบัตรประชาชน (${updatedReg.nationalIdNumber})`
          : 'ยังไม่มีบัตรประชาชน (อยู่ระหว่างดำเนินการ)'
      } · สิทธิรักษา: ${updatedReg.medicalRights || '-'}`,
      type: 'registration',
      severity: 'normal',
      actor: actorName,
    };

    const updated: Beneficiary = {
      ...b,
      nationalId:
        updatedReg.hasNationalIdCard && updatedReg.nationalIdNumber
          ? updatedReg.nationalIdNumber
          : 'ไม่มีบัตรประจำตัวประชาชน',
      civilRegistration: updatedReg,
      timeline: [timelineEvent, ...(b.timeline || [])],
    };

    beneficiaries[index] = updated;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updated);
    return updated;
  }

  public updateActivitiesAndMonthlyIncome(
    beneficiaryId: string,
    activityDetails: ActivityWorkItem[],
    monthYearTh: string,
    notes?: string
  ): Beneficiary {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('ไม่พบข้อมูลผู้ใช้บริการ');

    const b = beneficiaries[index];
    const actorName = this.getCurrentUser()?.name || 'เจ้าหน้าที่';
    const today = new Date().toISOString().split('T')[0];

    let totalOccupationalTherapyIncome = 0;
    const totalEmploymentIncome = {
      commuteIncome: 0,
      homeWorkIncome: 0,
      section25Income: 0,
      section33Income: 0,
      section35Income: 0,
    };

    const activitiesFlags = {
      agriculture: false,
      livestock: false,
      handicraft: false,
      service: false,
      wageLabor: false,
      other: false,
    };

    const sourceParts: string[] = [];

    activityDetails.forEach((item) => {
      activitiesFlags[item.category] = item.enabled;
      if (!item.enabled) return;

      if (item.participationType === 'occupational_therapy') {
        totalOccupationalTherapyIncome +=
          Number(item.occupationalTherapyIncome) || 0;
        if (item.occupationalTherapyIncome > 0) {
          sourceParts.push(
            `อาชีวบำบัด (${item.occupationalTherapyIncome.toLocaleString()} บ.)`
          );
        }
      } else {
        totalEmploymentIncome.commuteIncome +=
          Number(item.employmentIncome.commuteIncome) || 0;
        totalEmploymentIncome.homeWorkIncome +=
          Number(item.employmentIncome.homeWorkIncome) || 0;
        totalEmploymentIncome.section25Income +=
          Number(item.employmentIncome.section25Income) || 0;
        totalEmploymentIncome.section33Income +=
          Number(item.employmentIncome.section33Income) || 0;
        totalEmploymentIncome.section35Income +=
          Number(item.employmentIncome.section35Income) || 0;
      }
    });

    if (totalEmploymentIncome.commuteIncome > 0)
      sourceParts.push(
        `จ้างไป-กลับ (${totalEmploymentIncome.commuteIncome.toLocaleString()} บ.)`
      );
    if (totalEmploymentIncome.homeWorkIncome > 0)
      sourceParts.push(
        `รับงานมาทำ (${totalEmploymentIncome.homeWorkIncome.toLocaleString()} บ.)`
      );
    if (totalEmploymentIncome.section25Income > 0)
      sourceParts.push(
        `จ้าง ม.25 (${totalEmploymentIncome.section25Income.toLocaleString()} บ.)`
      );
    if (totalEmploymentIncome.section33Income > 0)
      sourceParts.push(
        `จ้าง ม.33 (${totalEmploymentIncome.section33Income.toLocaleString()} บ.)`
      );
    if (totalEmploymentIncome.section35Income > 0)
      sourceParts.push(
        `จ้าง ม.35 (${totalEmploymentIncome.section35Income.toLocaleString()} บ.)`
      );

    const grandTotalMonthlyIncome =
      totalOccupationalTherapyIncome +
      totalEmploymentIncome.commuteIncome +
      totalEmploymentIncome.homeWorkIncome +
      totalEmploymentIncome.section25Income +
      totalEmploymentIncome.section33Income +
      totalEmploymentIncome.section35Income;

    const newLog: MonthlyActivityUpdateLog = {
      id: `mal-${Date.now()}`,
      monthYearTh,
      recordedDate: today,
      recordedBy: actorName,
      items: activityDetails,
      totalOccupationalTherapyIncome,
      totalEmploymentIncome,
      grandTotalMonthlyIncome,
      notes,
    };

    const existingLogs = (b.monthlyActivityLogs || []).filter(
      (l) => l.monthYearTh !== monthYearTh
    );

    const timelineEvent: BeneficiaryTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: today,
      title: `อัปเดตกิจกรรมและรายรับประจำเดือน (${monthYearTh})`,
      description: `รายรับรวมทั้งสิ้น ${grandTotalMonthlyIncome.toLocaleString()} บาท/เดือน (${
        sourceParts.join(', ') || 'ไม่มีรายรับเป็นตัวเงิน'
      })`,
      type: 'income',
      severity: 'normal',
      actor: actorName,
    };

    const updated: Beneficiary = {
      ...b,
      activities: activitiesFlags,
      activityDetails,
      monthlyActivityLogs: [newLog, ...existingLogs],
      monthlyIncome: grandTotalMonthlyIncome,
      incomeSource:
        sourceParts.join(', ') || 'เข้าร่วมกิจกรรมฟื้นฟู (ยังไม่มีรายรับ)',
      timeline: [timelineEvent, ...(b.timeline || [])],
    };

    beneficiaries[index] = updated;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updated);
    return updated;
  }

  public dischargeBeneficiary(
    beneficiaryId: string,
    params: {
      reason: DischargeRecordTP1['reason'];
      reasonDetail: string;
      dischargeDate: string;
      followUpResult: string;
    }
  ): Beneficiary {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('ไม่พบข้อมูลผู้ใช้บริการ');

    const b = beneficiaries[index];
    const nextRound = (b.dischargeHistory?.length || 0) + 1;
    const actorName = this.getCurrentUser()?.name || 'เจ้าหน้าที่';

    const newDischarge: DischargeRecordTP1 = {
      round: nextRound,
      reason: params.reason,
      reasonDetail: params.reasonDetail,
      dischargeDate: params.dischargeDate,
      dateThText: `เมื่อวันที่ ${params.dischargeDate}`,
      followUpResult: params.followUpResult,
    };

    const timelineEvent: BeneficiaryTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: params.dischargeDate,
      title: `ให้พ้นการสงเคราะห์ / จำหน่ายออก (ครั้งที่ ${nextRound})`,
      description: `สาเหตุ: ${params.reasonDetail} | การติดตามผล: ${params.followUpResult} (รหัสประจำตัว ${b.uniquePersonId} คงอยู่ในระบบตลอดชีพ)`,
      type: 'discharge',
      severity: 'normal',
      actor: actorName,
    };

    const updated: Beneficiary = {
      ...b,
      status: 'discharged',
      dischargeInfo: {
        isDischarged: true,
        dischargeDate: params.dischargeDate,
        reason:
          params.reason === 'return_family' ||
          params.reason === 'return_institute' ||
          params.reason === 'return_protection_center' ||
          params.reason === 'deceased'
            ? params.reason
            : 'return_family',
        destinationNote: params.reasonDetail,
      },
      dischargeHistory: [...(b.dischargeHistory || []), newDischarge],
      timeline: [timelineEvent, ...(b.timeline || [])],
    };

    beneficiaries[index] = updated;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updated);
    return updated;
  }

  public recordIRPEvaluation(
    beneficiaryId: string,
    evaluation: Omit<IRPEvaluation, 'id'>
  ): IRPEvaluation {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('Beneficiary not found');

    const b = beneficiaries[index];
    const newId = `irp-${Date.now()}`;
    const isUnder50 =
      evaluation.scorePercentage < 50 || evaluation.totalScore < 70;
    const prevScore = b.latestIRP?.totalScore;
    const diffText =
      prevScore !== undefined
        ? ` (เปลี่ยนแปลง ${
            evaluation.totalScore - prevScore >= 0 ? '+' : ''
          }${evaluation.totalScore - prevScore} คะแนน จากครั้งก่อน ${prevScore}/140)`
        : '';

    const fullEvaluation: IRPEvaluation = {
      ...evaluation,
      id: newId,
      isUnder50Percent: isUnder50,
    };

    const newHistory = [fullEvaluation, ...(b.irpHistory || [])];

    const newTimelineEvent: BeneficiaryTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: evaluation.evaluationDate,
      title: `ประเมิน IRP ครั้งที่ ${evaluation.round} (${
        isUnder50 ? 'ต่ำกว่า 50%' : 'ผ่านเกณฑ์'
      })`,
      description: `ได้คะแนนรวม ${evaluation.totalScore}/140 (${evaluation.scorePercentage.toFixed(
        1
      )}%)${diffText} ผลการประเมิน: ${
        evaluation.evaluationResult === 'needs_improvement'
          ? 'ควรปรับปรุง'
          : evaluation.evaluationResult === 'moderate'
          ? 'ปานกลาง'
          : 'มีศักยภาพ'
      } โดย ${evaluation.evaluatorName}`,
      type: 'irp_evaluation',
      severity: isUnder50 ? 'urgent' : 'normal',
      actor: evaluation.evaluatorName,
    };

    const updatedBeneficiary: Beneficiary = {
      ...b,
      latestIRP: fullEvaluation,
      irpHistory: newHistory,
      timeline: [newTimelineEvent, ...(b.timeline || [])],
    };

    beneficiaries[index] = updatedBeneficiary;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updatedBeneficiary);

    if (isUnder50) {
      this.addNotification({
        type: 'irp_critical',
        title: 'แจ้งเตือนเร่งด่วน: คะแนน IRP ต่ำกว่า 50%',
        message: `${b.fullName} (รหัส ${b.uniquePersonId}) ได้รับการประเมิน IRP ได้เพียง ${fullEvaluation.totalScore}/140 คะแนน (${fullEvaluation.scorePercentage.toFixed(
          1
        )}%) กรุณาจัดทำหรือปรับปรุงแผนฟื้นฟูสมรรถภาพเข้มข้นทันที!`,
        beneficiaryId: b.id,
        beneficiaryName: b.fullName,
        nikhomId: b.nikhomId,
        scorePercentage: fullEvaluation.scorePercentage,
        priority: 'urgent',
      });
    } else {
      this.addNotification({
        type: 'rehab_due',
        title: 'อัปเดตการประเมิน IRP สำเร็จ',
        message: `${b.fullName} ประเมิน IRP ครั้งที่ ${evaluation.round} ได้คะแนน ${fullEvaluation.totalScore}/140 (${fullEvaluation.scorePercentage.toFixed(
          1
        )}%)`,
        beneficiaryId: b.id,
        beneficiaryName: b.fullName,
        nikhomId: b.nikhomId,
        scorePercentage: fullEvaluation.scorePercentage,
        priority: 'info',
      });
    }

    return fullEvaluation;
  }

  public saveRehabPlan(
    beneficiaryId: string,
    plan: Omit<RehabPlan, 'id'>
  ): RehabPlan {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('Beneficiary not found');

    const b = beneficiaries[index];
    const newId = `rp-${Date.now()}`;
    const fullPlan: RehabPlan = {
      ...plan,
      id: newId,
    };

    const newPlans = [fullPlan, ...(b.rehabPlans || [])];

    const timelineEvent: BeneficiaryTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: plan.planDate,
      title:
        plan.planType === 'initial'
          ? 'จัดทำแผนฟื้นฟูสมรรถภาพรายบุคคล (ฉบับแรก)'
          : `ปรับปรุงแผนฟื้นฟูสมรรถภาพ (ครั้งที่ ${plan.revisionNumber || 1})`,
      description: `จัดทำโดย ${plan.plannerName} ครอบคลุม 5 มิติการฟื้นฟูตามแบบฟอร์มกรมฯ`,
      type: 'rehab_plan',
      severity: 'normal',
      actor: plan.plannerName,
    };

    const updatedBeneficiary: Beneficiary = {
      ...b,
      rehabPlans: newPlans,
      timeline: [timelineEvent, ...(b.timeline || [])],
    };

    beneficiaries[index] = updatedBeneficiary;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updatedBeneficiary);

    this.addNotification({
      type: 'rehab_due',
      title: 'บันทึกแผนฟื้นฟูสมรรถภาพรายบุคคลสำเร็จ',
      message: `บันทึกแผนฟื้นฟูสำหรับ ${b.fullName} เรียบร้อยแล้ว`,
      beneficiaryId: b.id,
      beneficiaryName: b.fullName,
      nikhomId: b.nikhomId,
      priority: 'info',
    });

    return fullPlan;
  }

  public addBehaviorLog(
    beneficiaryId: string,
    log: Omit<BehaviorLog, 'id'>
  ): BehaviorLog {
    const beneficiaries = this.getBeneficiaries();
    const index = beneficiaries.findIndex((b) => b.id === beneficiaryId);
    if (index === -1) throw new Error('Beneficiary not found');

    const b = beneficiaries[index];
    const newId = `bl-${Date.now()}`;
    const fullLog: BehaviorLog = { ...log, id: newId };

    const updatedBeneficiary: Beneficiary = {
      ...b,
      behaviorLogs: [fullLog, ...(b.behaviorLogs || [])],
    };

    beneficiaries[index] = updatedBeneficiary;
    this.saveBeneficiaries(beneficiaries);
    void this.syncSingleBeneficiaryToFirestore(updatedBeneficiary);
    return fullLog;
  }

  // Nikhoms
  public getNikhoms(): Nikhom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NIKHOMS);
      return data ? JSON.parse(data) : INITIAL_NIKHOMS;
    } catch {
      return INITIAL_NIKHOMS;
    }
  }

  public saveNikhoms(nikhoms: Nikhom[]) {
    localStorage.setItem(STORAGE_KEYS.NIKHOMS, JSON.stringify(nikhoms));
    void this.syncAllNikhomsToFirestore(nikhoms);
    this.notify();
  }

  private updateNikhomStats(beneficiaries: Beneficiary[]) {
    const nikhoms = this.getNikhoms();
    const updated = nikhoms.map((nk) => {
      const residents = beneficiaries.filter(
        (b) => b.nikhomId === nk.id && b.status !== 'discharged'
      ).length;
      const current = Math.max(nk.currentResidents, residents);
      const vacancies = Math.max(0, nk.capacity - current);
      return {
        ...nk,
        currentResidents: current,
        vacancies,
        isFull: vacancies === 0,
      };
    });
    localStorage.setItem(STORAGE_KEYS.NIKHOMS, JSON.stringify(updated));
    void this.syncAllNikhomsToFirestore(updated);
  }

  // Notifications
  public getNotifications(): SystemNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  public saveNotifications(notifications: SystemNotification[]) {
    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications)
    );
    this.notify();
  }

  public addNotification(
    notification: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>
  ): SystemNotification {
    const notifications = this.getNotifications();
    const newNotif: SystemNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    const updated = [newNotif, ...notifications];
    this.saveNotifications(updated);
    return newNotif;
  }

  public markNotificationRead(id: string) {
    const notifications = this.getNotifications();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.saveNotifications(updated);
  }

  public markAllNotificationsRead() {
    const notifications = this.getNotifications();
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  }

  // Monthly Report
  public getMonthlyReport(): MonthlyProgressReport {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MONTHLY_REPORT);
      return data ? JSON.parse(data) : INITIAL_MONTHLY_REPORT;
    } catch {
      return INITIAL_MONTHLY_REPORT;
    }
  }

  public saveMonthlyReport(report: MonthlyProgressReport) {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_REPORT, JSON.stringify(report));
    this.notify();

    if (db && auth?.currentUser) {
      const uid = auth.currentUser.uid;
      const docId = this.getDocKey(uid, report.id || 'current_report');
      void setDoc(
        doc(db, 'reports', docId),
        this.sanitizeReportForFirestore(report, uid)
      ).catch((error) => {
        handleFirestoreError(error, OperationType.WRITE, `reports/${docId}`);
      });
    }
  }

  public resetData() {
    const currentUser = this.getCurrentUser();
    localStorage.removeItem(STORAGE_KEYS.BENEFICIARIES);
    localStorage.removeItem(STORAGE_KEYS.NIKHOMS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_REPORT);
    localStorage.removeItem(STORAGE_KEYS.USER_ACCOUNTS);
    if (currentUser) {
      this.setCurrentUser(
        INITIAL_USER_ACCOUNTS.find((u) => u.id === currentUser.id) ||
          INITIAL_USER_ACCOUNTS[0]
      );
    }
    this.notify();
    if (db && auth?.currentUser) {
      void this.pushAllLocalToFirestore();
    }
  }
}

export const storageService = new StorageService();
